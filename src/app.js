// src/app.js - VERSIÓN ACTUALIZADA
import express from "express";
import morgan from "morgan";
import cors from "cors";
import taskRoutes from "./routes/task.routes.js";
import authRoutes from "./routes/auth.routes.js";
import membershipRoutes from "./routes/membership.routes.js";
import userRoutes from "./routes/user.routes.js";
import routineRoutes from './routes/routine.routes.js';
import muscleGroupRoutes from "./routes/muscleGroup.routes.js"; // NUEVO
import workoutLogRoutes from './routes/workoutLog.routes.js';
import exerciseRoutes from './routes/exercise.routes.js';
import paymentRoutes from './routes/payment.routes.js';

import { connectToDB } from "./db/connect.js";
import path from "path";
import { fileURLToPath } from 'url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();

// CORS PERMISIVO para desarrollo/producción
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json());
app.use(morgan("dev"));

app.use(express.static('public')); //archivos estaticos desde el public


// Conexión a Mongo
app.use(async (_req, _res, next) => {
  try { 
    await connectToDB(); 
    next(); 
  } catch (e) { 
    next(e); 
  }
});

app.get("/", (_req, res) => res.json({ ok: true, name: "soleo-pwa-api" }));
app.use("/api/tasks", taskRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/users", userRoutes);
app.use("/api/routines", routineRoutes);
app.use("/api/muscle-groups", muscleGroupRoutes); // NUEVO
app.use("/api/exercises", exerciseRoutes); // NUEVO
app.use('/api/workout-logs', workoutLogRoutes);
app.use("/api/payments", paymentRoutes); // NUEVO



export default app;