const User = require('../models/User');

class UserRepository {
    async findByEmail(email) {
        // Case-insensitive search
        const user = await User.findOne({
            email: new RegExp(`^${email}$`, 'i')
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

    async findById(id) {
        const user = await User.findById(id);
        if (!user) return null;
        return {
            id: user._id.toString(),
            ...user.toObject()
        };
    }
    async update(id, data) {
        const user = await User.findByIdAndUpdate(id, data, { new: true });
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
        return User.find({ phone: new RegExp(phone.trim().replace(/\s+/g, '\\s*'), 'i') });
    }
}

module.exports = new UserRepository();
