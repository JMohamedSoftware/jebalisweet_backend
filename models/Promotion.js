const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    subtitle: {
        type: String,
        default: ''
    },
    ctaText: {
        type: String,
        default: 'Voir l\'offre'
    },
    ctaLink: {
        type: String,
        default: '/product-catalog'
    },
    backgroundImage: {
        type: String,
        required: true
    },
    discount: {
        type: String,
        default: ''
    },
    active: {
        type: Boolean,
        default: false
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Promotion', promotionSchema);
