// services/membershipService.js
import User from "../models/User.js";
import Membership from "../models/Membership.js";
import Payment from "../models/Payment.js";

class MembershipService {
    
    /**
     * Asigna una nueva membresía reemplazando la anterior
     */
    static async assignMembershipToClient(userId, membershipId, paymentId = null) {
        try {
            console.log('🔄 AssignMembershipToClient:', { userId, membershipId, paymentId });

            // Verificar usuario y membresía
            const user = await User.findById(userId);
            if (!user) throw new Error("Usuario no encontrado");
            if (user.role !== "CLIENTE") throw new Error("Solo clientes pueden tener membresías");

            const membership = await Membership.findById(membershipId);
            if (!membership) throw new Error("Membresía no encontrada");
            if (membership.status !== "ACTIVO") throw new Error("Membresía no disponible");

            // Calcular fechas
            const now = new Date();
            const expirationDate = new Date(now);
            expirationDate.setDate(expirationDate.getDate() + membership.durationDays);

            // ✅ GUARDAR MEMBRESÍA ANTERIOR EN HISTORIAL
            const previousMembership = user.currentMembership;
            if (previousMembership) {
                // Si no existe el campo membershipHistory, crearlo
                if (!user.membershipHistory) {
                    user.membershipHistory = [];
                }
                
                user.membershipHistory.push({
                    membership: previousMembership,
                    assignedAt: user.membershipAssignedAt || now,
                    expiredAt: now,
                    status: "EXPIRADA",
                    wasTrial: await this.isTrialMembership(previousMembership)
                });
            }

            // ✅ ASIGNAR NUEVA MEMBRESÍA (SISTEMA ACTUAL)
            user.currentMembership = membershipId;
            user.membershipExpiresAt = expirationDate;
            user.membershipAssignedAt = now;

            // ✅ MANTENER COMPATIBILIDAD: También guardar en el array memberships
            user.memberships = [membershipId];

            await user.save();
            await user.populate('currentMembership');

            console.log('✅ Membresía asignada exitosamente:', {
                userId,
                nuevaMembresia: membership.name,
                reemplazóAnterior: !!previousMembership,
                expirationDate
            });

            return {
                user,
                previousMembership,
                newMembership: membership,
                expirationDate,
                wasReplaced: !!previousMembership
            };

        } catch (error) {
            console.error("❌ Error en assignMembershipToClient:", error);
            throw error;
        }
    }

    /**
     * Verifica si una membresía es trial
     */
    static async isTrialMembership(membershipId) {
        try {
            const membership = await Membership.findById(membershipId);
            return membership ? membership.isTrial : false;
        } catch (error) {
            console.error("❌ Error en isTrialMembership:", error);
            return false;
        }
    }

    /**
     * Obtiene la membresía actual del cliente
     */
    static async getCurrentClientMembership(userId) {
        try {
            const user = await User.findById(userId)
                .populate('currentMembership')
                .select('currentMembership membershipExpiresAt membershipAssignedAt role name email memberships');

            if (!user) {
                throw new Error("Usuario no encontrado");
            }

            if (user.role !== "CLIENTE") {
                throw new Error("Usuario no es cliente");
            }

            const isActive = user.membershipExpiresAt && new Date() < user.membershipExpiresAt;
            const daysRemaining = isActive ? 
                Math.ceil((user.membershipExpiresAt - new Date()) / (1000 * 60 * 60 * 24)) : 0;

            return {
                membership: user.currentMembership,
                expiresAt: user.membershipExpiresAt,
                assignedAt: user.membershipAssignedAt,
                isActive,
                daysRemaining,
                isExpired: !isActive && user.currentMembership !== null
            };
        } catch (error) {
            console.error("❌ Error en getCurrentClientMembership:", error);
            throw error;
        }
    }

    /**
     * Asigna membresía por defecto al registrar usuario
     */
    static async assignDefaultMembership(userId) {
        try {
            const defaultMembership = await Membership.findOne({ 
                isTrial: true, 
                status: "ACTIVO" 
            });

            if (!defaultMembership) {
                throw new Error("No se encontró la membresía gratuita por defecto");
            }

            return await this.assignMembershipToClient(userId, defaultMembership._id);
        } catch (error) {
            console.error("❌ Error en assignDefaultMembership:", error);
            throw error;
        }
    }

    /**
     * Migración: Actualizar usuarios existentes al nuevo sistema
     */
    static async migrateExistingUsers() {
        try {
            console.log('🔄 Migrando usuarios existentes al nuevo sistema de membresías...');
            
            const users = await User.find({ 
                role: "CLIENTE",
                memberships: { $exists: true, $ne: [] }
            }).populate('memberships');

            let migrated = 0;
            
            for (const user of users) {
                if (user.memberships && user.memberships.length > 0 && !user.currentMembership) {
                    // Usar la primera membresía del array como currentMembership
                    user.currentMembership = user.memberships[0]._id;
                    user.membershipAssignedAt = user.createdAt;
                    
                    // Calcular expiración basada en la membresía
                    const membership = user.memberships[0];
                    if (membership.durationDays) {
                        const expirationDate = new Date(user.createdAt);
                        expirationDate.setDate(expirationDate.getDate() + membership.durationDays);
                        user.membershipExpiresAt = expirationDate;
                    }
                    
                    await user.save();
                    migrated++;
                    console.log(`✅ Usuario migrado: ${user.email}`);
                }
            }
            
            console.log(`🎉 Migración completada: ${migrated} usuarios actualizados`);
            return migrated;
            
        } catch (error) {
            console.error('❌ Error en migración:', error);
            throw error;
        }
    }

    /**
     * Verifica si un usuario tiene membresía activa
     */
    static async hasActiveMembership(userId) {
        try {
            const user = await User.findById(userId);
            if (!user || !user.currentMembership || !user.membershipExpiresAt) {
                return false;
            }
            
            return new Date() < user.membershipExpiresAt;
        } catch (error) {
            console.error("❌ Error en hasActiveMembership:", error);
            return false;
        }
    }

    /**
     * Obtiene el historial de membresías de un usuario
     */
    static async getMembershipHistory(userId) {
        try {
            const user = await User.findById(userId)
                .populate('membershipHistory.membership')
                .select('membershipHistory name email');

            if (!user) {
                throw new Error("Usuario no encontrado");
            }

            return user.membershipHistory || [];
        } catch (error) {
            console.error("❌ Error en getMembershipHistory:", error);
            throw error;
        }
    }
}

export default MembershipService;