// middleware/isAdmin.js
export default function isAdmin(req, res, next) {
    try {
        console.log('🔐 Verificando rol de admin...');
        console.log('🔐 User role:', req.userRole);
        console.log('🔐 User ID:', req.userId);
        
        // Verificar si el usuario tiene rol de ADMIN
        if (req.userRole !== 'ADMIN') {
            return res.status(403).json({ 
                success: false,
                message: 'Acceso denegado. Se requiere rol de administrador' 
            });
        }
        
        console.log('✅ Usuario es administrador');
        next();
    } catch (error) {
        console.error('❌ Error en middleware isAdmin:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Error interno del servidor' 
        });
    }
}