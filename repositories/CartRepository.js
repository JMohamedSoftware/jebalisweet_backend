const mongoose = require('mongoose');
const Cart = require('../models/Cart');

class CartRepository {
    async getCart(userId) {
        try {
            const userObjectId = mongoose.Types.ObjectId.isValid(userId)
                ? new mongoose.Types.ObjectId(userId)
                : userId;

            let cart = await Cart.findOne({ user: userObjectId }).populate('items.product');
            if (!cart) return [];

            return cart.items.map(item => {
                if (!item.product) return null;
                const p = item.product;
                return {
                    id: item._id.toString(),
                    productId: p._id.toString(),
                    name: p.name,
                    price: item.customImage ? 0 : p.price,
                    image: p.image,
                    quantity: item.quantity,
                    inStock: p.inStock,
                    stockQuantity: p.stockQuantity || 0,
                    comment: item.comment,
                    customImage: item.customImage,
                    customOptions: item.customOptions,
                    priceUnit: p.priceUnit
                };
            }).filter(i => i !== null);
        } catch (error) {
            console.error('CartRepository getCart error:', error);
            throw error;
        }
    }

    async updateItem(userId, productId, quantity, customOptions = null, comment = '', customImage = null, isSet = false) {
        try {
            const userObjectId = mongoose.Types.ObjectId.isValid(userId)
                ? new mongoose.Types.ObjectId(userId)
                : userId;
            const productObjectId = mongoose.Types.ObjectId.isValid(productId)
                ? new mongoose.Types.ObjectId(productId)
                : productId;

            let cart = await Cart.findOne({ user: userObjectId });
            if (!cart) {
                cart = await Cart.create({ user: userObjectId, items: [] });
            }

            const itemIndex = cart.items.findIndex(item =>
                item.product &&
                item.product.toString() === productObjectId.toString() &&
                JSON.stringify(item.customOptions) === JSON.stringify(customOptions) &&
                item.customImage === customImage
            );

            if (Number(quantity) <= 0) {
                throw new Error('La quantité doit être supérieure à zéro.');
            }

            if (itemIndex > -1) {
                if (isSet) {
                    cart.items[itemIndex].quantity = Number(quantity);
                } else {
                    cart.items[itemIndex].quantity += Number(quantity);
                    // Security check: ensure the resulting quantity isn't negative or zero
                    if (cart.items[itemIndex].quantity <= 0) {
                        cart.items.splice(itemIndex, 1); // Remove item if it reached 0 or less
                    }
                }
                if (comment) cart.items[itemIndex].comment = comment;
            } else {
                cart.items.push({
                    product: productObjectId,
                    quantity: Number(quantity),
                    comment: comment,
                    customImage: customImage,
                    customOptions: customOptions
                });
            }

            await cart.save();
            return { message: 'Cart updated' };
        } catch (error) {
            console.error('CartRepository updateItem error:', error);
            throw error;
        }
    }

    async removeItem(userId, productId, customOptions = null, customImage = null, comment = undefined) {
        const query = { product: productId };
        if (customOptions) {
            query.customOptions = customOptions;
        }
        if (customImage !== undefined) {
            query.customImage = customImage;
        }
        if (comment !== undefined) {
            query.comment = comment;
        }

        await Cart.updateOne(
            { user: userId },
            { $pull: { items: query } }
        );
        return { message: 'Item removed' };
    }

    async clearCart(userId) {
        try {
            const userObjectId = mongoose.Types.ObjectId.isValid(userId)
                ? new mongoose.Types.ObjectId(userId)
                : userId;
            await Cart.deleteOne({ user: userObjectId });
        } catch (error) {
            console.error('CartRepository clearCart error:', error);
        }
    }
}

module.exports = new CartRepository();
