const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const User = require('../models/userModel');
const {
  sendVerificationEmail,
  sendResetEmail,
} = require('../utils/emailService');

// 生成6位數驗證碼
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 生成重置密碼的 token
const generateResetToken = () => {
  return crypto.randomBytes(20).toString('hex');
};

// 註冊
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: '請填寫所有欄位' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: '該信箱已被註冊' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 生成驗證碼
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date(Date.now() + 30 * 60000); // 30分鐘後過期

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      verificationCode: {
        code: verificationCode,
        expiresAt: verificationExpires,
      },
    });

    // 發送驗證郵件
    const emailSent = await sendVerificationEmail(email, verificationCode);
    if (!emailSent) {
      return res.status(500).json({ message: '驗證郵件發送失敗' });
    }

    res.status(201).json({
      _id: user._id,
      email: user.email,
      message: '註冊成功，請查收驗證郵件',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 驗證郵箱
const verifyEmail = async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: '用戶不存在' });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({ message: '郵箱已驗證' });
    }

    if (
      !user.verificationCode ||
      user.verificationCode.code !== code ||
      user.verificationCode.expiresAt < Date.now()
    ) {
      return res.status(400).json({ message: '驗證碼無效或已過期' });
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    await user.save();

    res.json({ message: '郵箱驗證成功' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 登入
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ message: '信箱或密碼錯誤' });
    }

    if (!user.isEmailVerified) {
      return res.status(401).json({ message: '請先驗證您的郵箱' });
    }

    if (await bcrypt.compare(password, user.password)) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ message: '信箱或密碼錯誤' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 生成 JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// 獲取用戶資料
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: '找不到用戶' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: '獲取用戶資料失敗' });
  }
};

// 處理忘記密碼請求
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: '找不到該電子郵件地址' });
    }

    // 生成重置 token 和過期時間
    const resetToken = generateResetToken();
    const resetTokenExpires = Date.now() + 3600000; // 1小時後過期

    // 儲存重置 token
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpires;
    await user.save();

    // 發送重置密碼郵件
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    await sendResetEmail(email, resetUrl);

    res.json({ message: '重置密碼郵件已發送' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: '發送重置密碼郵件失敗' });
  }
};

// 重置密碼
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: '重置密碼連結無效或已過期' });
    }

    // 更新密碼
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: '密碼重置成功' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: '重置密碼失敗' });
  }
};

// 修改密碼
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);

    // 驗證當前密碼
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: '當前密碼不正確' });
    }

    // 更新密碼
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.json({ message: '密碼修改成功' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: '密碼修改失敗' });
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
};
