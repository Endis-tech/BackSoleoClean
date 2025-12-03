import Membership from "../models/Membership.js";
import Routine from "../models/Routine.js";
import User from "../models/User.js";
import MembershipService from "../services/membershipService.js";

// ==========================================
// GET ALL MEMBERSHIPS
// ==========================================
export async function getMemberships(req, res) {
    try {
        const memberships = await Membership.find().populate('routine', 'name status');
        res.json({
            success: true,
            data: memberships
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: "Error al obtener membresías",
            error: err.message 
        });
    }
}   

// ==========================================
// GET MEMBERSHIP BY ID
// ==========================================
export async function getMembershipById(req, res) {
    try {
        const membership = await Membership.findById(req.params.id)
            .populate({
                path: 'routine',
                populate: [
                    {
                        path: 'muscleGroups.muscleGroup',
                        model: 'MuscleGroup'
                    },
                    {
                        path: 'muscleGroups.exercises',
                        model: 'Exercise'
                    }
                ]
            });
            
        if (!membership) {
            return res.status(404).json({ 
                success: false,
                message: "Membresía no encontrada" 
            });
        }
        
        res.json({
            success: true,
            data: { membership }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: "Error al obtener membresía",
            error: err.message 
        });
    }
}

// ==========================================
// CREATE MEMBERSHIP — ✅ IDEMPOTENTE (offline-safe)
// ==========================================
export async function createMembership(req, res) {
    try {
        const { name, price, durationDays, description, status, routine } = req.body;

        // 🔍 Buscar membresía idéntica para evitar duplicados
        const existing = await Membership.findOne({
            name,
            price,
            durationDays,
            description: description || null,
            status: status || 'ACTIVO'
        });
        
        if (existing) {
            const populated = await existing.populate('routine', 'name status');
            return res.status(200).json({
                success: true,
                message: "Membresía ya existe (operación idempotente)",
                data: { membership: populated }
            });
        }

        // ✅ Validar o asignar rutina
        let routineId = routine;
        if (routine) {
            const routineExists = await Routine.findById(routine);
            if (!routineExists) {
                return res.status(400).json({
                    success: false,
                    message: "La rutina especificada no existe"
                });
            }
        } else {
            const bulkingRoutine = await Routine.findOne({ name: "bulking", status: true });
            if (bulkingRoutine) {
                routineId = bulkingRoutine._id;
            } else {
                return res.status(400).json({
                    success: false,
                    message: "No se encontró la rutina bulking por defecto"
                });
            }
        }

        const membership = new Membership({
            name,
            price,
            durationDays,
            description,
            routine: routineId,
            status: status || 'ACTIVO'
        });

        await membership.save();
        const populated = await membership.populate('routine', 'name status');

        res.status(201).json({
            success: true,
            message: "Membresía creada exitosamente",
            data: { membership: populated }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: "Error al crear membresía", 
            error: err.message 
        });
    }
}

// ==========================================
// UPDATE MEMBERSHIP
// ==========================================
export async function updateMembership(req, res) {
    try {
        const { name, price, durationDays, description, status, routine } = req.body;

        if (routine) {
            const routineExists = await Routine.findById(routine);
            if (!routineExists) {
                return res.status(400).json({
                    success: false,
                    message: "La rutina especificada no existe"
                });
            }
        }

        const updateData = { 
            name, 
            price, 
            durationDays, 
            description, 
            status 
        };

        if (routine) {
            updateData.routine = routine;
        }

        const membership = await Membership.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).populate('routine', 'name status');

        if (!membership) {
            return res.status(404).json({ 
                success: false,
                message: "Membresía no encontrada" 
            });
        }

        res.json({
            success: true,
            message: "Membresía actualizada exitosamente",
            data: { membership }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: "Error al actualizar membresía", 
            error: err.message 
        });
    }
}

// ==========================================
// DELETE MEMBERSHIP — ✅ OFFLINE-SAFE (idempotente)
// ==========================================
export async function deleteMembership(req, res) {
    try {
        const membershipId = req.params.id;
        const membership = await Membership.findById(membershipId);
        
        if (!membership) {
            // ✅ Ya eliminada: éxito para offline
            return res.status(200).json({ 
                success: true,
                message: "Membresía ya eliminada (operación idempotente)",
                data: {}
            });
        }

        const usersWithMembership = await User.countDocuments({ 
            membership: membershipId 
        });
        
        if (usersWithMembership > 0) {
            return res.status(400).json({
                success: false,
                message: `No se puede eliminar la membresía "${membership.name}" porque ${usersWithMembership} usuario(s) la tienen asignada.`
            });
        }

        await Membership.findByIdAndDelete(membershipId);

        res.json({ 
            success: true,
            message: `Membresía "${membership.name}" eliminada correctamente`,
            data: {}
        });

    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: "Error interno del servidor al eliminar membresía", 
            error: err.message 
        });
    }
}

// ==========================================
// GET MEMBERSHIP WITH FULL ROUTINE DETAILS
// ==========================================
export async function getMembershipWithFullRoutine(req, res) {
    try {
        const membership = await Membership.findById(req.params.id)
            .populate({
                path: 'routine',
                populate: [
                    {
                        path: 'muscleGroups.muscleGroup',
                        model: 'MuscleGroup'
                    },
                    {
                        path: 'muscleGroups.exercises',
                        model: 'Exercise'
                    }
                ]
            });
            
        if (!membership) {
            return res.status(404).json({ 
                success: false,
                message: "Membresía no encontrada" 
            });
        }
        
        res.json({
            success: true,
            data: { membership }
        });
    } catch (err) {
        res.status(500).json({ 
            success: false,
            message: "Error al obtener membresía con rutina completa",
            error: err.message 
        });
    }
}

// ==========================================
// GET CLIENT CURRENT MEMBERSHIP
// ==========================================
export async function getClientCurrentMembership(req, res) {
    try {
        const userId = req.userId;
        const membershipInfo = await MembershipService.getCurrentClientMembership(userId);

        res.json({
            success: true,
            data: membershipInfo
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// ==========================================
// ASSIGN MEMBERSHIP TO CLIENT (ADMIN)
// ==========================================
export async function assignMembershipToClient(req, res) {
    try {
        const { userId, membershipId } = req.body;
        const result = await MembershipService.assignMembershipToClient(userId, membershipId);

        res.json({
            success: true,
            message: result.wasReplaced ? 
                "Membresía asignada y anterior reemplazada" : 
                "Membresía asignada exitosamente",
            data: result
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// ==========================================
// GET CLIENT MEMBERSHIP HISTORY (cliente autenticado)
// ==========================================
export async function getClientMembershipHistory(req, res) {
    try {
        const userId = req.userId;
        const history = await MembershipService.getMembershipHistory(userId);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// ==========================================
// CHECK MEMBERSHIP STATUS
// ==========================================
export async function checkMembershipStatus(req, res) {
    try {
        const userId = req.userId;
        const hasActiveMembership = await MembershipService.hasActiveMembership(userId);
        const currentMembership = await MembershipService.getCurrentClientMembership(userId);

        res.json({
            success: true,
            data: {
                hasActiveMembership,
                currentMembership
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}

// ==========================================
// GET CLIENT MEMBERSHIP HISTORY (AS ADMIN)
// ==========================================
export async function getClientMembershipHistoryAsAdmin(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "ID de usuario requerido"
            });
        }

        const history = await MembershipService.getMembershipHistory(userId);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: error.message
        });
    }
}