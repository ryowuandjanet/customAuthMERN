const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

const sendVerificationEmail = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '電子郵件驗證',
    html: `
            <div style="font-family: 'Noto Sans TC', sans-serif;">
                <h2>電子郵件驗證</h2>
                <p>您的驗證碼是：</p>
                <h1 style="color: #4F46E5; letter-spacing: 5px; font-size: 32px;">${code}</h1>
                <p>驗證碼將在30分鐘後過期。</p>
            </div>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

const sendResetEmail = async (email, resetUrl) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: '重置密碼',
    html: `
            <div style="font-family: 'Noto Sans TC', sans-serif;">
                <h2>重置密碼請求</h2>
                <p>您收到此郵件是因為您（或其他人）請求重置密碼。</p>
                <p>請點擊下面的連結重置密碼：</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0;">
                    重置密碼
                </a>
                <p>如果您沒有請求重置密碼，請忽略此郵件。</p>
                <p>此連結將在1小時後失效。</p>
            </div>
        `,
  };

  try {
    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Reset email sending error:', error);
    return false;
  }
};

module.exports = {
  sendVerificationEmail,
  sendResetEmail,
};
