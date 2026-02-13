const mongoose = require('mongoose');
const User = require('./models/User');

async function listDrivers() {
    try {
        await mongoose.connect('mongodb://localhost:27017/jebalisweet');
        const users = await User.find({ role: 'livreur' });
        console.log(JSON.stringify(users.map(u => ({ email: u.email, role: u.role, name: u.username })), null, 2));
    } catch (err) {
        console.error('ERROR:', err);
    } finally {
        await mongoose.connection.close();
    }
}

listDrivers();
