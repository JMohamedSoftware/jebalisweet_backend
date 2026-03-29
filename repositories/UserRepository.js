const User = require('../models/User');

class UserRepository {
    // Helper to escape regex special characters to prevent ReDoS
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').substring(0, 100);
    }

    async findByEmail(email) {
        const sanitizedEmail = this.escapeRegex(email);
        // Case-insensitive search
        const user = await User.findOne({
            email: new RegExp(`^${sanitizedEmail}$`, 'i')
        });
        if (!user) return null;

        // Normalize for consistent application usage
        return {
            id: user._id.toString(),
            ...user.toObject(),
            _id: user._id
        };
    }

    async create(userData) {
        const user = await User.create(userData);
        return {
            id: user._id.toString(),
            ...user.toObject()
        };
    }

    async findByRegistrationIP(ip) {
        return User.findOne({ registrationIP: ip });
    }

    async findById(id) {
        const user = await User.findById(id);
        if (!user) return null;
        return {
            id: user._id.toString(),
            ...user.toObject()
        };
    }
    async update(id, data) {
        // Security: Whitelist allowed fields to prevent prototype pollution and unauthorized role changes
        const allowedFields = ['firstName', 'lastName', 'username', 'phone', 'address', 'city', 'postalCode', 'preferences', 'loginHistory', 'role', 'status', 'isEmailVerified', 'emailVerificationOTP', 'emailVerificationExpires', 'registrationIP'];
        const filteredData = {};

        allowedFields.forEach(field => {
            if (data[field] !== undefined) {
                filteredData[field] = data[field];
            }
        });

        const user = await User.findByIdAndUpdate(id, filteredData, { new: true });
        if (!user) return null;
        return {
            id: user._id.toString(),
            ...user.toObject()
        };
    }

    async findByRole(role) {
        const users = await User.find({ role });
        return users;
    }

    async findPendingDrivers() {
        return User.find({ role: 'livreur', status: 'pending' });
    }

    async updateStatus(id, status) {
        return this.update(id, { status });
    }

    async findByPhone(phone) {
        // Remove spaces and format if necessary, for now exact match
        const sanitizedPhone = this.escapeRegex(phone.trim().replace(/\s+/g, '\\s*'));
        return User.find({ phone: new RegExp(sanitizedPhone, 'i') });
    }

    async findAll() {
        return User.find({}, '-password');
    }

    async delete(id) {
        return User.findByIdAndDelete(id);
    }

    async saveOTP(id, otp, expires) {
        await User.findByIdAndUpdate(id, {
            resetPasswordOTP: otp,
            resetPasswordExpires: expires
        });
    }

    async updatePassword(id, hashedPassword) {
        await User.findByIdAndUpdate(id, {
            password: hashedPassword,
            resetPasswordOTP: null,
            resetPasswordExpires: null
        });
    }
    async saveVerificationOTP(id, otp, expires) {
        await User.findByIdAndUpdate(id, {
            emailVerificationOTP: otp,
            emailVerificationExpires: expires
        });
    }

    async verifyEmail(id) {
        await User.findByIdAndUpdate(id, {
            isEmailVerified: true,
            status: 'active',
            emailVerificationOTP: null,
            emailVerificationExpires: null
        });
    }
}

module.exports = new UserRepository();
