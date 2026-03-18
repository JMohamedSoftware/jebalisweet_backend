const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || 'mongodb+srv://jbelimohamedsoftware_db_user:0000@cluster0.7uy1smh.mongodb.net/jebalisweet?appName=Cluster0';

async function fixDB() {
    try {
        console.log('Connecting to MongoDB...', uri);
        await mongoose.connect(uri);
        console.log('Connected.');

        const db = mongoose.connection.db;
        const collections = await db.collections();

        for (let collection of collections) {
            console.log(`Checking collection: ${collection.collectionName}`);

            const regexDocs = await collection.find({
                $or: [
                    { image: { $regex: 'lens.usercontent' } },
                    { imageUrl: { $regex: 'lens.usercontent' } },
                    { images: { $regex: 'lens.usercontent' } }
                ]
            }).toArray();

            if (regexDocs.length > 0) {
                console.log(`Found ${regexDocs.length} matching documents in ${collection.collectionName}`);

                for (let doc of regexDocs) {
                    let updates = {};

                    if (doc.image && typeof doc.image === 'string' && doc.image.includes('lens.usercontent')) {
                        updates.image = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1089&auto=format&fit=crop';
                    }
                    if (doc.imageUrl && typeof doc.imageUrl === 'string' && doc.imageUrl.includes('lens.usercontent')) {
                        updates.imageUrl = 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1089&auto=format&fit=crop';
                    }
                    if (doc.images && Array.isArray(doc.images)) {
                        updates.images = doc.images.map(img =>
                            (typeof img === 'string' && img.includes('lens.usercontent'))
                                ? 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=1089&auto=format&fit=crop'
                                : img
                        );
                    }

                    if (Object.keys(updates).length > 0) {
                        await collection.updateOne({ _id: doc._id }, { $set: updates });
                        console.log(`Fixed document ${doc._id} in ${collection.collectionName}`);
                    }
                }
            }
        }

        console.log('Fix complete.');
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

fixDB();
