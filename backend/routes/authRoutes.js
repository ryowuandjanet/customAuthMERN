const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyEmail,
  getProfile,
  forgotPassword,
  resetPassword,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.post('/verify-email', verifyEmail);
router.get('/profile', protect, getProfile);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.post('/change-password', protect, changePassword);

module.exports = router;
