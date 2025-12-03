// middleware/verifyToken.js - VERSIÓN MEJORADA
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(" ")[1];

    console.log('🔐 verifyToken - Iniciando...');
    console.log('🔐 Token recibido:', token ? 'SÍ' : 'NO');

    if (!token) {
        console.log('❌ verifyToken - No token provided');
        return res.status(401).json({ message: "No token provided" });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('✅ verifyToken - Token válido, decoded:', decoded);
        
        // OBTENER EL USUARIO COMPLETO
        const user = await User.findById(decoded.id);
        if (!user) {
            console.log('❌ verifyToken - Usuario no encontrado en BD');
            return res.status(404).json({ message: "Usuario no encontrado" });
        }
        
        // ✅ ESTABLECER MÚLTIPLES FORMAS DE ACCEDER AL USER ID
        req.user = user;
        req.userId = user._id.toString(); // ✅ Asegurar que sea string
        req.user._id = user._id.toString(); // ✅ También en el objeto user
        req.userRole = user.role;
        req.role = user.role;
        
        console.log('✅ verifyToken - Usuario autenticado:', {
            userId: req.userId,
            userObjectId: user._id,
            role: req.role,
            name: user.name
        });
        
        next();
    } catch (err) {
        console.log('❌ verifyToken - Error:', err.message);
        res.status(401).json({ message: "Token inválido" });
    }
}