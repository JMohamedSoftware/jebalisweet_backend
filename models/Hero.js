const mongoose = require('mongoose');

const heroSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        default: 'Excellence Pâtisserie'
    },
    subtitle: {
        type: String,
        default: 'Découvrez nos créations artisanales.'
    },
    image: {
        type: String,
        required: true,
        default: '/images/17189029461596829888opals_3200x1200.jpg'
    },
    ctaText: {
        type: String,
        default: 'Déguster'
    },
    targetCategory: {
        type: String,
        default: 'Pâtisserie Orientale'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Hero', heroSchema);
