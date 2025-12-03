// middleware/auth.js - ACTUALIZADO
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; // 👈 AGREGAR

export async function auth(req, res, next) { // 👈 HACER async
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Token requerido'});
    
    try{
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'changeme');
        req.userId = payload.id;
        
        // 👈 AGREGAR ESTAS 2 LÍNEAS
        const user = await User.findById(payload.id);
        req.userRole = user?.role; // Poner el role en el request
        
        next();
    }catch(e){
        return res.status(401).json({ message: 'Token inválido'});
    }
}