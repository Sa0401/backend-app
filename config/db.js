const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/tailoring_db';
    
    // Mask password in log output for security
    const maskedUri = uri.replace(/:([^@]+)@/, ':***@');
    console.log(`\n🔌 Attempting MongoDB connection...`);
    console.log(`   URI: ${maskedUri}`);

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,  // Wait 8s before giving up
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    process.env.USE_JSON_DB = 'false';
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`\n⚠️  [WARNING] MongoDB connection failed!`);
    console.warn(`   Reason: ${error.message}`);
    console.warn(`   → Switching to local JSON file database (offline mode)\n`);
    process.env.USE_JSON_DB = 'true';
  }
};

module.exports = connectDB;
