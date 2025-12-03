// src/app.js - MODIFICADO PARA VERCEL
import express from "express";
import morgan from "morgan";
import cors from "cors";

import authRoutes from "./routes/auth.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import userRoutes from "./routes/user.routes.js";
import routineRoutes from './routes/routine.routes.js';
import muscleGroupRoutes from "./routes/muscleGroup.routes.js";
import workoutLogRoutes from './routes/workoutLog.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import paymentRoutes from './routes/payment.routes.js';

import path from "path";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// CORS para Vercel
app.use(cors({
  origin: '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Solo mostrar morgan en desarrollo
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan("dev"));
}

// Archivos estáticos
app.use(express.static(path.join(__dirname, '../public')));

// Ruta de salud (health check)
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    service: "soleo-pwa-api",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Ruta principal
app.get("/", (req, res) => {
  res.json({ 
    ok: true, 
    name: "soleo-pwa-api",
    message: "API funcionando correctamente",
    version: "1.0.0",
    endpoints: [

      "/api/auth",
      "/api/memberships",
      "/api/users",
      "/api/routines",
      "/api/muscle-groups",
      "/api/exercises",
      "/api/workout-logs",
      "/api/payments"
    ]
  });
});

// Rutas API

app.use("/api/auth", authRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/users", userRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/muscle-groups", muscleGroupRoutes);
app.use("/api/exercises", exerciseRoutes);
app.use('/api/workout-logs', workoutLogRoutes);
app.use("/api/payments", paymentRoutes);

// Manejo de rutas no encontradas
app.use("*", (req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.originalUrl,
    method: req.method
  });
});

// Manejador de errores global
app.use((err, req, res, next) => {
  console.error('🔥 Error:', err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

export default app;