const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// Toutes les routes de commande nécessitent d'être connecté
router.use(authMiddleware);

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.put('/:id/status', roleMiddleware(['admin', 'livreur']), orderController.updateOrderStatus);
router.put('/:id/items', roleMiddleware(['admin']), orderController.updateOrderItems);
router.put('/:id/assign-driver', roleMiddleware(['admin']), orderController.assignDriver);

module.exports = router;
