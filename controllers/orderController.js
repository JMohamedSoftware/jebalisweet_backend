const orderRepository = require('../repositories/OrderRepository');
const cartRepository = require('../repositories/CartRepository');

exports.createOrder = async (req, res, next) => {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { items, deliveryAddress, paymentMethod, phone, deliveryOption } = req.body;

    if (userRole === 'livreur') {
        return res.status(403).json({ message: 'Les livreurs ne peuvent pas créer de commandes' });
    }

    try {
        const orderData = {
            userId: userRole === 'admin' ? null : userId,
            items,
            deliveryAddress,
            paymentMethod,
            phone,
            deliveryOption,
            promoCode: req.body.promoCode,
            discountAmount: req.body.discountAmount,
            createdBy: userRole === 'admin' ? 'admin' : 'client'
        };

        const result = await orderRepository.create(orderData);

        if (userId) {
            await cartRepository.clearCart(userId);
        }

        res.status(201).json({ message: 'Commande créée avec succès', orderId: result.orderId });
    } catch (error) {
        next(error);
    }
};

exports.getOrders = async (req, res, next) => {
    const { id: userId, role } = req.user;
    try {
        const orders = await orderRepository.findAll({ userId, role });
        res.json(orders);
    } catch (error) {
        next(error);
    }
};

exports.updateOrderStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const { id: userId, role } = req.user;

    try {
        // Security: Clients cannot update order status
        if (role === 'client') {
            return res.status(403).json({ message: 'Accès refusé. Les clients ne peuvent pas modifier le statut des commandes.' });
        }

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
        next(error);
    }
};

exports.assignDriver = async (req, res, next) => {
    const { id } = req.params;
    const { driverId, estimatedDeliveryTime } = req.body;
    try {
        await orderRepository.assignDriver(id, driverId, estimatedDeliveryTime);
        res.json({ message: 'Livreur assigné avec succès' });
    } catch (error) {
        next(error);
    }
};

exports.updateOrderItems = async (req, res, next) => {
    const { id } = req.params;
    const { items } = req.body;
    try {
        const result = await orderRepository.updateOrderItems(id, items);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

exports.deleteOrder = async (req, res, next) => {
    const { id } = req.params;
    try {
        await orderRepository.delete(id);
        res.json({ message: 'Commande supprimée avec succès' });
    } catch (error) {
        next(error);
    }
};
