const express = require('express');
const router = express.Router();
const promoCodeController = require('../controllers/promoCodeController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public route to validate a code
router.get('/validate/:code', promoCodeController.validatePromoCode);

// Admin routes
router.get('/', authMiddleware, roleMiddleware(['admin']), promoCodeController.getAllPromoCodes);
router.post('/', authMiddleware, roleMiddleware(['admin']), promoCodeController.createPromoCode);
router.put('/:id', authMiddleware, roleMiddleware(['admin']), promoCodeController.updatePromoCode);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), promoCodeController.deletePromoCode);

module.exports = router;
