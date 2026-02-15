const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All user routes require authentication
router.use(authMiddleware);

// Specific routes first - restricted to Admin
router.get('/role/drivers', roleMiddleware(['admin']), userController.getDrivers);
router.get('/pending-drivers', roleMiddleware(['admin']), userController.getPendingDrivers);
router.put('/:id/status', roleMiddleware(['admin']), userController.updateDriverStatus);

// Dynamic routes after
router.get('/:id', userController.getProfile);
router.put('/:id', userController.updateProfile);
router.get('/:id/preferences', userController.getPreferences);
router.put('/:id/preferences', userController.updatePreferences);

// Admin only management routes
router.get('/', roleMiddleware(['admin']), userController.getAllUsers);
router.delete('/:id', roleMiddleware(['admin']), userController.deleteUser);

module.exports = router;
