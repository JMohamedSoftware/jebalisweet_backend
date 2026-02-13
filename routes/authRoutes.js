const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/login', authController.login);
router.post('/register', authController.register);
router.post('/check-email', authController.checkEmail);
router.post('/forgot-password/send', authController.sendOTP);
router.post('/forgot-password/verify', authController.verifyOTP);
router.post('/forgot-password/reset', authController.resetPassword);

module.exports = router;
