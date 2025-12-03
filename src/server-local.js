// src/server-local.js - SOLO PARA DESARROLLO LOCAL
import 'dotenv/config';
import app from './app.js';
import { connectToDB } from './db/connect.js';

const PORT = process.env.PORT || 4000;

// Solo para desarrollo local
const startServer = async () => {
  try {
    // Conectar a DB
    await connectToDB();
    console.log('✅ MongoDB conectado localmente');
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🚀 Servidor local: http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar servidor:', error);
    process.exit(1);
  }
};

startServer();