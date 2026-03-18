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
            const promo = await require('./PromoCodeRepository').validateCode(data.promoCode);
            if (promo.valid) {
                validatedPromoCode = promo.promo.code;
                finalDiscount = promo.promo.type === 'percentage'
                    ? (calculatedTotal * promo.promo.discount / 100)
                    : promo.promo.discount;
                
                // Optional: Increment usage count on successful order
                await require('./PromoCodeRepository').incrementUsage(promo.promo._id);
            }
        }

        const newOrder = await Order.create({
            user: userId || null, // Allow null for admin-created orders
            items: enrichedItems,
            totalAmount: calculatedTotal - finalDiscount, // Security: Use server-calculated total
            discountAmount: finalDiscount,
            promoCode: validatedPromoCode,
            deliveryAddress,
            paymentMethod,
            phone,
            deliveryOption,
            status: hasCustomImage ? 'pending_quote' : 'pending',
            createdBy: createdBy || 'client'
        });

        // Clear cart after order creation
        if (userId) {
            const userObjectId = (typeof userId === 'string' && userId.length === 24)
                ? new (require('mongoose')).Types.ObjectId(userId)
                : userId;
            await Cart.deleteOne({ user: userObjectId });
            console.log(`[ORDER] Cart cleared for user: ${userId}`);
        }

        // Update stock for each item using optimistic locking
        for (const item of enrichedItems) {
            if (item.product) {
                // Determine if we should check stock (only if stock management is enabled/relevant)
                // For simplified logic: always try to decrement safely.
                const updatedProduct = await Product.findOneAndUpdate(
                    { _id: item.product, stockQuantity: { $gte: item.quantity } },
                    { $inc: { stockQuantity: -item.quantity } },
                    { new: true }
                );

                if (!updatedProduct) {
                    console.warn(`[ORDER] Stock update failed for product ${item.product}: Insufficient stock or concurrency issue.`);
                    // Ideally, we should rollback the order here or flag it.
                    // For now, we log the inconsistency and proceed (or could throw error to abort).
                    // Given the current architecture, throwing might leave the order created but stock not updated if done after creation.
                    // However, preventing negative stock is key.
                }
            }
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
            .sort({ createdAt: -1 });

        return orders.map(order => {
            const obj = order.toObject();
            return {
                id: obj._id.toString(),
                userId: obj.user?._id?.toString() || null,
                customerName: obj.user?.username || (obj.createdBy === 'admin' ? 'Admin Order' : 'Unknown'),
                customerEmail: obj.user?.email || 'N/A',
                total: obj.totalAmount,
                status: obj.status,
                deliveryAddress: obj.deliveryAddress,
                phone: obj.phone,
                paymentMethod: obj.paymentMethod,
                deliveryOption: obj.deliveryOption,
                promoCode: obj.promoCode || null,
                discountAmount: obj.discountAmount || 0,
                deliveryDriverId: obj.deliveryDriver?._id?.toString() || null,
                deliveryDriverName: obj.deliveryDriver?.username || null,
                estimatedDeliveryTime: obj.estimatedDeliveryTime,
                createdBy: obj.createdBy,
                createdAt: obj.createdAt,
                items: obj.items.map(i => ({
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
}

module.exports = new OrderRepository();
