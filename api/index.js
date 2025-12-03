// api/index.js
import app from './src/app.js';
import { connectToDB } from './src/db/connect.js';

let dbConnected = false;

export default async (req, res) => {
  // Conexión a DB optimizada para serverless
  if (!dbConnected) {
    try {
      await connectToDB();
      dbConnected = true;
      console.log('✅ MongoDB conectado en Vercel');
    } catch (error) {
      console.error('❌ Error de conexión MongoDB:', error.message);
      return res.status(500).json({
        error: 'Database connection failed',
        message: process.env.NODE_ENV === 'production' ? 'Internal error' : error.message
      });
    }
  }
  
  // Pasar request a Express
  return app(req, res);
};