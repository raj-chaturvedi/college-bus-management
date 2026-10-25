const mongoose = require('mongoose');

let isConnected = false;
let isMockFallback = false;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_bus_ai';
  
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout check
    });
    isConnected = true;
    isMockFallback = false;
    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.host}`);

    // Seamless index migration: ensure email and username indexes are sparse & unique
    try {
      const usersCollection = conn.connection.db.collection('users');
      const existingIndexes = await usersCollection.indexes();
      const emailIdx = existingIndexes.find(idx => idx.name === 'email_1');
      if (emailIdx && !emailIdx.sparse) {
        console.log('[Database] Migrating email_1 index to sparse unique...');
        await usersCollection.dropIndex('email_1');
      }
      await usersCollection.createIndex({ email: 1 }, { unique: true, sparse: true });
      await usersCollection.createIndex({ username: 1 }, { unique: true, sparse: true });
      await usersCollection.createIndex({ googleId: 1 }, { sparse: true });
    } catch (idxErr) {
      console.warn('[Database] Index migration note:', idxErr.message);
    }

    return { connected: true, fallback: false };
  } catch (err) {
    console.warn(`[Database] Warning: Could not connect to MongoDB at ${uri} (${err.message}).`);
    console.log('[Database] Enabling high-performance Memory/JSON Data Engine fallback so the app continues running perfectly without MongoDB daemon.');
    isConnected = false;
    isMockFallback = true;
    return { connected: false, fallback: true };
  }
};

const getDbStatus = () => ({
  isConnected,
  isMockFallback,
  dbName: mongoose.connection.name || 'college_bus_ai'
});

module.exports = { connectDB, getDbStatus };
