const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function analyzeUsers() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(MONGO_URI);
        console.log('Connected successfully.\n');

        const totalUsers = await User.countDocuments();
        console.log(`Total registered users: ${totalUsers}`);

        const roles = await User.aggregate([
            { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        console.log('\nUsers by Role:');
        roles.forEach(r => console.log(`- ${r._id}: ${r.count}`));

        const statuses = await User.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        console.log('\nUsers by Status:');
        statuses.forEach(s => console.log(`- ${s._id}: ${s.count}`));

        const topIPs = await User.aggregate([
            { $group: { _id: '$registrationIP', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
        ]);
        console.log('\nTop Registration IPs (potential bot attack indicator):');
        topIPs.forEach(ip => console.log(`- ${ip._id || 'Unknown'}: ${ip.count} account(s)`));

        const recentUsers = await User.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select('email role status registrationIP createdAt');
        
        console.log('\nMost Recent 5 Users:');
        recentUsers.forEach(u => {
            console.log(`- ${u.email} (${u.status}, ${u.role}) from ${u.registrationIP || 'N/A'} at ${u.createdAt}`);
        });

        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('Error analyzing users:', error);
        process.exit(1);
    }
}

analyzeUsers();
