const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/summary', authMiddleware, roleMiddleware(['admin']), statsController.getSummaryStats);

module.exports = router;
