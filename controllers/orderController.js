const orderRepository = require('../repositories/OrderRepository');

exports.createOrder = async (req, res) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { items, total, deliveryAddress, paymentMethod, phone, deliveryOption } = req.body;

    // Prevent delivery drivers from creating orders
    if (userRole === 'livreur') {
        return res.status(403).json({ message: 'Les livreurs ne peuvent pas créer de commandes' });
    }

    try {
        const orderData = {
            userId: userRole === 'admin' ? null : userId, // Admin orders have no userId
            items,
            total,
            deliveryAddress,
            paymentMethod,
            phone,
            deliveryOption,
            createdBy: userRole === 'admin' ? 'admin' : 'client'
        };

        const result = await orderRepository.create(orderData);

        res.status(201).json({ message: 'Commande créée avec succès', orderId: result.orderId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur lors de la commande' });
    }
};

exports.getOrders = async (req, res) => {
    const { id: userId, role } = req.user;

    try {
        const orders = await orderRepository.findAll({ userId, role });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur récupération commandes' });
    }
};

exports.updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const { id: userId, role } = req.user;

    try {
        // If user is a driver, verify the order is assigned to them
        if (role === 'livreur') {
            const orders = await orderRepository.findAll({ userId, role: 'livreur' });
            const isAssigned = orders.some(o => o.id === id);
            if (!isAssigned) {
                return res.status(403).json({ message: 'Accès refusé. Cette commande ne vous est pas assignée.' });
            }
        }

        await orderRepository.updateStatus(id, status);
        res.json({ message: 'Statut mis à jour' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur maj statut' });
    }
};

exports.assignDriver = async (req, res) => {
    const { id } = req.params;
    const { driverId, estimatedDeliveryTime } = req.body;

    try {
        await orderRepository.assignDriver(id, driverId, estimatedDeliveryTime);
        res.json({ message: 'Livreur assigné avec succès' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur assignation livreur' });
    }
};
exports.updateOrderItems = async (req, res) => {
    const { id } = req.params;
    const { items } = req.body;

    try {
        const result = await orderRepository.updateOrderItems(id, items);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erreur maj articles' });
    }
};
