const express = require('express');
const router = express.Router();
const testimonialController = require('../controllers/testimonialController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Public route
router.get('/', testimonialController.getAllTestimonials);

// Admin routes
router.post('/', testimonialController.createTestimonial);
router.delete('/:id', authMiddleware, roleMiddleware(['admin']), testimonialController.deleteTestimonial);
router.put('/:id/approve', authMiddleware, roleMiddleware(['admin']), testimonialController.approveTestimonial);

module.exports = router;
