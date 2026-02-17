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
        // Security: Whitelist allowed fields to prevent prototype pollution and unauthorized role changes
        const allowedFields = ['firstName', 'lastName', 'username', 'phone', 'address', 'city', 'postalCode', 'preferences', 'loginHistory', 'role', 'status'];
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
        return User.find({ phone: new RegExp(phone.trim().replace(/\s+/g, '\\s*'), 'i') });
    }

    async findAll() {
        return User.find({}, '-password');
    }

    async delete(id) {
        return User.findByIdAndDelete(id);
    }
}

module.exports = new UserRepository();
