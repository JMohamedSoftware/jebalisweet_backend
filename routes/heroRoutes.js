const express = require('express');
const router = express.Router();
const heroController = require('../controllers/heroController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

router.get('/', heroController.getHero);
router.post('/', authMiddleware, roleMiddleware(['admin']), heroController.updateHero);

module.exports = router;
