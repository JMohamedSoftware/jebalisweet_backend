const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, apiLimiter } = require('../middleware/rateLimiters');

router.post('/login', loginLimiter, authController.login);
router.post('/register', apiLimiter, authController.register);
router.post('/check-email', apiLimiter, authController.checkEmail);
router.post('/forgot-password/send', apiLimiter, authController.sendOTP);
router.post('/forgot-password/verify', apiLimiter, authController.verifyOTP);
router.post('/forgot-password/reset', apiLimiter, authController.resetPassword);
router.post('/verify-email', apiLimiter, authController.verifyEmail);
router.post('/resend-verification', apiLimiter, authController.resendVerificationOTP);

module.exports = router;
