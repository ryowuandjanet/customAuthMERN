const jwt = require('jsonwebtoken');
const User = require('../models/userModel');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // 獲取 token
      token = req.headers.authorization.split(' ')[1];

      // 驗證 token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 獲取用戶資訊（不包含密碼）
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(404).json({ message: '找不到用戶' });
      }

      next();
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ message: '未授權訪問' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: '未提供認證令牌' });
  }
};

module.exports = { protect };
