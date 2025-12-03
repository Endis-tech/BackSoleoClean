import { Router } from "express";
import { 
    register, 
    login, 
    profile, 
    getAllUsers,
    registerAdmin // 👈 AÑADE ESTE IMPORT
} from "../controllers/auth.controller.js";
import { auth } from "../middleware/auth.js";
import isAdmin from "../middleware/isAdmin.js"; // 👈 AÑADE ESTE IMPORT

const router = Router();

// Rutas públicas
router.post('/register', register);
router.post('/login', login);

// Rutas protegidas
router.post('/me', auth, profile);
router.get('/users', auth, getAllUsers);

// 👇 NUEVA RUTA PARA REGISTRAR ADMINS
router.post('/register-admin', auth, isAdmin, registerAdmin); // 👈 AÑADE isAdmin

export default router;