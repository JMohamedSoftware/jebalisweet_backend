const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    originalPrice: { type: Number }, // Optional striker-through price
    image: String,
    images: { type: [String], default: [] }, // Multi-image gallery support
    alt: String,
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Updated to ObjectId
    categoryName: String, // Hybrid pattern to avoid join
    brand: String,
    stockQuantity: { type: Number, default: 0, min: [0, 'Stock cannot be negative'] },
    inStock: { type: Boolean, default: true },
    priceUnit: { type: String, default: 'pièce', enum: ['pièce', 'kg'] },
    sku: String,
    approxPieces: String,
    onOrderOnly: { type: Boolean, default: false },
    leadTime: String,
    conservation: String,
    ingredients: String,
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
