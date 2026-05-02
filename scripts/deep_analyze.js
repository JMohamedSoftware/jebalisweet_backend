const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI;

async function deepAnalyze() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('--- USER DATA ANALYSIS ---');
        
        const total = await User.countDocuments();
        console.log(`Total Users: ${total}`);

        const last20 = await User.find().sort({ createdAt: -1 }).limit(20);
        console.log('\n--- LAST 20 REGISTRATIONS ---');
        last20.forEach(u => {
            const date = u.createdAt ? u.createdAt.toISOString() : 'N/A';
            console.log(`[${date}] ${u.email.padEnd(30)} | Role: ${u.role.padEnd(8)} | Status: ${u.status.padEnd(10)} | IP: ${u.registrationIP || 'N/A'}`);
        });

        const ipGroups = await User.aggregate([
            { $group: { _id: '$registrationIP', count: { $sum: 1 }, emails: { $push: '$email' } } },
            { $match: { count: { $gt: 1 } } },
            { $sort: { count: -1 } }
        ]);

        if (ipGroups.length > 0) {
            console.log('\n--- SUSPICIOUS IP GROUPS (Multiple accounts from same IP) ---');
            ipGroups.forEach(g => {
                console.log(`IP: ${g._id || 'Unknown'} - Count: ${g.count}`);
                console.log(`   Emails: ${g.emails.slice(0, 5).join(', ')}${g.emails.length > 5 ? '...' : ''}`);
            });
        } else {
            console.log('\nNo multiple registrations from the same IP found.');
        }

        const domainGroups = await User.aggregate([
            { $project: { domain: { $arrayElemAt: [{ $split: ['$email', '@'] }, 1] } } },
            { $group: { _id: '$domain', count: { $sum: 1 } } },
            { $sort: { count: -1 } }
        ]);

        console.log('\n--- EMAIL DOMAINS ---');
        domainGroups.forEach(d => console.log(`${d._id}: ${d.count}`));

        await mongoose.connection.close();
    } catch (err) {
        console.error(err);
    }
}

deepAnalyze();
