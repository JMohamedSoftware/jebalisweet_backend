const mongoose = require('mongoose');

const uri = "mongodb+srv://jbelimohamedsoftware_db_user:med28+-A46F999=)=K2855@cluster0.7uy1smh.mongodb.net/jebalisweet?appName=Cluster0";

async function checkDb() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));

    for (let collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`- ${collection.name}: ${count} documents`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Error:", err.message);
    process.exit(1);
  }
}

checkDb();
