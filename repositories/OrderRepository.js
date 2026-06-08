const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

class OrderRepository {
    async create(data) {
        const { userId, items, deliveryAddress, paymentMethod, phone, createdBy, deliveryOption } = data;

        let calculatedTotal = 0;
        const enrichedItems = await Promise.all(items.map(async item => {
            const p = await Product.findById(item.productId);
            // Security: Use server-side price, NOT frontend price
            const currentPrice = p ? p.price : 0;
            const pName = p ? p.name : 'Unknown Product - ' + item.productId;

            // Security: Enforce positive quantity
            if (Number(item.quantity) <= 0) {
                throw new Error(`Quantité invalide pour le produit ${pName} (${item.quantity})`);
            }

            calculatedTotal += (currentPrice * item.quantity);

            return {
                product: item.productId,
                name: pName,
                quantity: item.quantity,
                priceAtPurchase: currentPrice,
                comment: item.comment || '',
                customImage: item.customImage || null,
                customOptions: item.customOptions || null
            };
        }));

        const hasCustomImage = enrichedItems.some(item => item.customImage);

        // Security: Re-validate promo code and recalculate discount on server
        let finalDiscount = 0;
        let validatedPromoCode = null;
        if (data.promoCode) {
            const validationResult = await require('./PromoCodeRepository').validateCode(data.promoCode);
            if (validationResult.valid) {
                const promoDoc = validationResult.promo;
                validatedPromoCode = promoDoc.code;
                finalDiscount = promoDoc.type === 'percentage'
                    ? (calculatedTotal * promoDoc.discount / 100)
                    : promoDoc.discount;
                
                // Optional: Increment usage count on successful order
                await require('./PromoCodeRepository').incrementUsage(promoDoc._id);
            }
        }

        // 3. Stock updates have been removed based on request.
        for (const item of enrichedItems) {
            if (item.product) {
                // Stock deduction logic removed
            }
        }

        // 4. Create the final order
        const newOrder = await Order.create({
            user: userId || null,
            items: enrichedItems,
            totalAmount: calculatedTotal - finalDiscount,
            discountAmount: finalDiscount,
            promoCode: validatedPromoCode,
            deliveryAddress,
            paymentMethod,
            phone,
            deliveryOption,
            status: hasCustomImage ? 'pending_quote' : 'pending',
            createdBy: createdBy || 'client'
        });

        // 5. Clear cart after successful order creation
        if (userId) {
            const userObjectId = (typeof userId === 'string' && userId.length === 24)
                ? new (require('mongoose')).Types.ObjectId(userId)
                : userId;
            await Cart.deleteOne({ user: userObjectId });
            console.log(`[ORDER] Cart cleared for user: ${userId}`);
        }

        return { orderId: newOrder._id.toString() };
    }

    async findAll({ userId, role }) {
        let query = {};
        if (role === 'client') {
            query = { user: userId };
        } else if (role === 'livreur') {
            // Delivery driver sees all orders assigned to them (active and history)
            query = {
                deliveryDriver: userId
            };
        }
        // Admin sees all orders

        const orders = await Order.find(query)
            .populate('user', 'username email')
            .populate('deliveryDriver', 'username email')
            .sort({ createdAt: -1 })
            .lean();

        return orders.map(order => {
            return {
                id: order._id.toString(),
                userId: order.user?._id?.toString() || null,
                customerName: order.user?.username || (order.createdBy === 'admin' ? 'Admin Order' : 'Unknown'),
                customerEmail: order.user?.email || 'N/A',
                total: order.totalAmount,
                status: order.status,
                deliveryAddress: order.deliveryAddress,
                phone: order.phone,
                paymentMethod: order.paymentMethod,
                deliveryOption: order.deliveryOption,
                promoCode: order.promoCode || null,
                discountAmount: order.discountAmount || 0,
                deliveryDriverId: order.deliveryDriver?._id?.toString() || null,
                deliveryDriverName: order.deliveryDriver?.username || null,
                estimatedDeliveryTime: order.estimatedDeliveryTime,
                createdBy: order.createdBy,
                createdAt: order.createdAt,
                items: order.items.map(i => ({
                    productId: i.product?.toString(),
                    name: i.name,
                    quantity: i.quantity,
                    price: i.priceAtPurchase,
                    comment: i.comment,
                    customImage: i.customImage,
                    customOptions: i.customOptions
                }))
            };
        });
    }

    async updateStatus(id, status) {
        await Order.findByIdAndUpdate(id, { status });
        return { message: 'Status updated' };
    }

    async assignDriver(orderId, driverId, estimatedDeliveryTime) {
        await Order.findByIdAndUpdate(orderId, {
            deliveryDriver: driverId,
            estimatedDeliveryTime: estimatedDeliveryTime || null,
            status: 'assigned' // Set to 'assigned' when driver is assigned
        });
        return { message: 'Driver assigned successfully' };
    }

    async updateOrderItems(orderId, items) {
        const order = await Order.findById(orderId);
        if (!order) throw new Error('Order not found');

        let newTotal = 0;
        const updatedItems = order.items.map(existingItem => {
            const update = items.find(i => i.productId === (existingItem.product ? existingItem.product.toString() : null) || i.name === existingItem.name);
            if (update) {
                existingItem.priceAtPurchase = update.price;
            }
            newTotal += existingItem.priceAtPurchase * existingItem.quantity;
            return existingItem;
        });

        order.items = updatedItems;
        order.totalAmount = newTotal;
        if (order.status === 'pending_quote') {
            order.status = 'pending';
        }
        await order.save();
        return { message: 'Order updated successfully', total: newTotal };
    }

    async delete(id) {
        await Order.findByIdAndDelete(id);
        return { message: 'Order deleted successfully' };
    }
}

module.exports = new OrderRepository();
