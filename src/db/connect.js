// src/db/connect.js
import mongoose from 'mongoose';

// Cache de conexión para serverless
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectToDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const MONGODB_URI = process.env.MONGODB_URI;
    
    if (!MONGODB_URI) {
      throw new Error('Por favor define MONGODB_URI en variables de entorno');
    }

    const opts = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then(mongoose => {
        console.log('✅ MongoDB conectado exitosamente');
        return mongoose;
      })
      .catch(error => {
        console.error('❌ Error MongoDB:', error);
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};