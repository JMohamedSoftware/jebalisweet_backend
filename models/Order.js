const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    items: [{
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
        name: String, // Snapshot
        quantity: Number,
        priceAtPurchase: Number,
        comment: { type: String, default: '' },
        customImage: { type: String, default: null },
        customOptions: { type: Object, default: null } // Storing complex cake configs here
    }],
    totalAmount: Number,
    status: {
        type: String,
        enum: ['pending', 'pending_quote', 'confirmed', 'assigned', 'in_delivery', 'delivered', 'cancelled'],
        default: 'pending'
    },
    deliveryAddress: String,
    phone: String,
    paymentMethod: String,
    deliveryOption: {
        type: String,
        enum: ['standard', 'express', 'pickup'],
        default: 'standard'
    },
    deliveryDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    estimatedDeliveryTime: { type: Date, default: null },
    createdBy: {
        type: String,
        enum: ['client', 'admin'],
        default: 'client'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Order', orderSchema);
