const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['client', 'admin', 'livreur'],
        default: 'client'
    },
    phone: {
        type: String,
        default: null
    },
    address: String,
    city: String,
    postalCode: String,
    preferences: {
        type: Object, // Stores JSON preferences
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['active', 'pending', 'rejected', 'pending_verification'],
        default: 'active' // Default for now, we'll override in register
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationOTP: String,
    emailVerificationExpires: Date,
    registrationIP: String,
    resetPasswordOTP: String,
    resetPasswordExpires: Date,
    loginHistory: [{
        ip: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

module.exports = mongoose.model('User', userSchema);
