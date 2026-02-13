const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '.env') });

const checkData = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) {
        console.error('MONGO_URI not found');
        return;
    }

    try {
        await mongoose.connect(uri);
        console.log('Connected to DB');

        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`Found ${collections.length} collections:`);

        for (const col of collections) {
            const count = await mongoose.connection.db.collection(col.name).countDocuments();
            console.log(` - ${col.name}: ${count} documents`);
        }

        await mongoose.disconnect();
    } catch (err) {
        console.error('Error:', err);
    }
};

checkData();
