const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public route to get active promotion
router.get('/active', promotionController.getActivePromotion);

// Admin routes
router.get('/latest', authMiddleware, roleMiddleware(['admin']), promotionController.getLatestPromotion);
router.post('/update', authMiddleware, roleMiddleware(['admin']), promotionController.updatePromotion);

module.exports = router;
