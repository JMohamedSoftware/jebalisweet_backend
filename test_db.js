const mongoose = require('mongoose');
require('dotenv').config();

const testConnection = async (uri, name) => {
    try {
        console.log(`Testing ${name}...`);
        const conn = await mongoose.connect(uri);
        console.log(`SUCCESS: Connected to ${name}`);
        console.log(`Host: ${conn.connection.host}`);
        console.log(`Database Name: ${conn.connection.name}`);
        await mongoose.disconnect();
    } catch (error) {
        console.log(`FAILED: Could not connect to ${name}`);
        console.error(error.message);
    }
};

const runTests = async () => {
    const uri1 = process.env.MONGO_URI;
    const uri2 = process.env.MONGO_URI1;

    if (uri1) await testConnection(uri1, 'MONGO_URI');
    if (uri2) await testConnection(uri2, 'MONGO_URI1');
};

runTests();
