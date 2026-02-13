const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    role: {
        type: String,
        trim: true,
        default: 'Client'
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    rating: {
        type: Number,
        default: 5,
        min: 1,
        max: 5
    },
    avatar: {
        type: String,
        default: '/assets/images/default-avatar.png'
    },
    approved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
