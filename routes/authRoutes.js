const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter, apiLimiter, registrationLimiter } = require('../middleware/rateLimiters');
const fingerprintMiddleware = require('../middleware/fingerprintMiddleware');

router.post('/login', loginLimiter, authController.login);
router.post('/register', fingerprintMiddleware, registrationLimiter, authController.register);
router.post('/check-email', apiLimiter, authController.checkEmail);
router.post('/forgot-password/send', apiLimiter, authController.sendOTP);
router.post('/forgot-password/verify', apiLimiter, authController.verifyOTP);
router.post('/forgot-password/reset', apiLimiter, authController.resetPassword);
router.post('/verify-email', apiLimiter, authController.verifyEmail);
router.post('/resend-verification', apiLimiter, authController.resendVerificationOTP);

module.exports = router;
