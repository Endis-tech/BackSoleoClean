// auth.controller.js - VERSIÓN ACTUALIZADA
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Membership from "../models/Membership.js";
import MembershipService from "../services/membershipService.js"; // ✅ NUEVO

// Registro de usuario - ACTUALIZADO
export async function register(req, res) {
    try {
        const { name, email, password } = req.body;

        // Validaciones...
        if (!name || !email || !password)
            return res.status(400).json({ message: 'Todos los campos son requeridos' });

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "El email no es válido" });
        }

        const exists = await User.findOne({ email });
        if (exists) return res.status(409).json({ message: 'El usuario ya existe' });

        const hash = await bcrypt.hash(password, 10);

        // ✅ NUEVO: Buscar membresía Semilla (usando isTrial)
        const defaultMembership = await Membership.findOne({ isTrial: true });
        if (!defaultMembership) {
            return res.status(500).json({
                message: "No existe la membresía Semilla. Ejecuta el seed."
            });
        }

        // ✅ NUEVO: Crear usuario SIN membresía en el array (usaremos currentMembership)
        const user = new User({ 
            name, 
            email, 
            password: hash,
            role: 'CLIENTE'
            // ❌ NO usar memberships: [defaultMembership._id] - lo haremos con el servicio
        });
        await user.save();

        // ✅ NUEVO: Asignar membresía usando el servicio (para reemplazo futuro)
        try {
            await MembershipService.assignDefaultMembership(user._id);
            console.log(`✅ Membresía Semilla asignada a: ${user.email}`);
        } catch (membershipError) {
            console.warn(`⚠️ Error asignando membresía: ${membershipError.message}`);
            // No fallar el registro si hay error en membresía
        }

        // ✅ ACTUALIZAR: Obtener usuario con membresía actual
        const userWithMembership = await User.findById(user._id)
            .populate('currentMembership')
            .select('-password');

        // Crear JWT
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'changeme',
            { expiresIn: '7d' }
        );

        // ✅ RESPONDER CON EL NUEVO FORMATO
        const userResponse = {
            _id: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            membership: userWithMembership.currentMembership?.name || "Semilla", // ← Del currentMembership
            membershipId: userWithMembership.currentMembership?._id || null,
            profilePhoto: user.profilePhoto,
            weight: user.weight,
            exerciseTime: user.exerciseTime,
            createdAt: user.createdAt
        };

        res.status(201).json({
            token,
            role: user.role,
            user: userResponse
        });

    } catch (e) {
        console.error("Error en registro:", e);
        res.status(500).json({ message: 'Error del servidor' });
    }
}

// Login de usuario - ACTUALIZADO
export async function login(req, res) {
    try {
        const { email, password } = req.body;

        // ✅ ACTUALIZADO: Buscar usuario con currentMembership
        const user = await User.findOne({ email })
            .populate('currentMembership', 'name price durationDays status') // ← POPULAR currentMembership
            .select('-password');

        if (!user) return res.status(401).json({ message: 'Email o contraseña inválidos' });

        // Comparar contraseñas (necesitamos el password para comparar)
        const userWithPassword = await User.findOne({ email }).select('password');
        const ok = await bcrypt.compare(password, userWithPassword.password);
        if (!ok) return res.status(401).json({ message: 'Email o contraseña inválidos' });

        // ✅ ACTUALIZADO: Obtener la membresía activa desde currentMembership
        const activeMembership = user.currentMembership?.name || "Semilla";

        // Crear token con role
        const token = jwt.sign(
            { 
                id: user._id,
                role: user.role
            },
            process.env.JWT_SECRET || 'changeme',
            { expiresIn: '7d' }
        );

        // ✅ RESPONDER CON NUEVO FORMATO
        const userResponse = {
            _id: user._id,
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            membership: activeMembership, // ← Desde currentMembership
            membershipId: user.currentMembership?._id || null,
            membershipExpiresAt: user.membershipExpiresAt,
            profilePhoto: user.profilePhoto,
            weight: user.weight,
            exerciseTime: user.exerciseTime,
            createdAt: user.createdAt
        };

        console.log('🔐 Login exitoso. User response:', userResponse);

        res.json({
            token,
            role: user.role,
            user: userResponse
        });

    } catch (e) {
        console.error("Error en login:", e);
        res.status(500).json({ message: 'Error del servidor' });
    }
}

// Obtener perfil de usuario - ACTUALIZADO
export async function profile(req, res) {
    try {
        // ✅ ACTUALIZADO: Incluir currentMembership y campos de membresía
        const user = await User.findById(req.userId)
            .populate('currentMembership', 'name price durationDays status')
            .select('_id name email role currentMembership membershipExpiresAt profilePhoto weight exerciseTime');
        
        if (!user) return res.status(404).json({ message: 'Usuario no encontrado' });

        res.json({ 
            user: {
                _id: user._id,
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                membership: user.currentMembership?.name || "Semilla",
                membershipId: user.currentMembership?._id || null,
                membershipExpiresAt: user.membershipExpiresAt,
                profilePhoto: user.profilePhoto,
                weight: user.weight,
                exerciseTime: user.exerciseTime,
                createdAt: user.createdAt
            }
        });
    } catch (e) {
        console.error("Error en profile:", e);
        res.status(500).json({ message: 'Error del servidor' });
    }
}

export const getAllUsers = async (req, res) => {
    try {
        // ✅ ACTUALIZADO: Incluir información de membresía actual
        const users = await User.find()
            .populate('currentMembership', 'name price durationDays status')
            .select('-password');
        
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// En auth.controller.js - AÑADE ESTA FUNCIÓN
export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, role = 'CLIENTE' } = req.body;

        console.log('📝 Registrando nuevo usuario por admin:', { name, email, role });
        console.log('👤 Admin que realiza el registro:', req.userId);

        // Validar campos requeridos
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, email y contraseña son requeridos'
            });
        }

        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'El usuario ya está registrado'
            });
        }

        // Validar que el rol sea válido
        const validRoles = ['ADMIN', 'CLIENTE'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({
                success: false,
                message: 'Rol no válido. Use: ADMIN o CLIENTE'
            });
        }

        // Crear nuevo usuario
        const newUser = new User({
            name,
            email,
            password,
            role
        });

        await newUser.save();

        console.log('✅ Usuario registrado exitosamente:', newUser.email);

        // Responder sin la contraseña
        res.status(201).json({
            success: true,
            message: `Usuario ${role.toLowerCase()} registrado exitosamente`,
            user: {
                id: newUser._id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        console.error('❌ Error registrando usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor',
            error: error.message
        });
    }
};




