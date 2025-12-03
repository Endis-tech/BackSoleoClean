import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["CLIENTE", "ADMIN"],
            default: "CLIENTE"
        },

        status: {
            type: String,
            enum: ["ACTIVO", "INACTIVO"],
            default: "ACTIVO"
        },

        profilePhoto: {
            type: String,
            default: null
        },

        weight: {
            type: Number,
            default: null
        },

        exerciseTime: {
            type: String,
            default: null
        },

        // 👇 NUEVO: Campos para racha y progreso
        streak: {
            current: {
                type: Number,
                default: 0
            },
            longest: {
                type: Number,
                default: 0
            },
            lastWorkoutDate: {
                type: Date,
                default: null
            }
        },

        progress: {
            totalWorkouts: {
                type: Number,
                default: 0
            },
            totalExerciseTime: {
                type: Number, // en segundos
                default: 0
            },
            totalDuration: {
                type: Number, // en minutos
                default: 0
            },
            workoutsThisWeek: {
                type: Number,
                default: 0
            },
            workoutsThisMonth: {
                type: Number,
                default: 0
            }
        },

        // ✅ MEMBRESÍA ACTIVA ACTUAL (SOLO UNA)
        currentMembership: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membership",
            default: null
        },

        // ✅ FECHA DE EXPIRACIÓN (se calcula con durationDays de Membership)
        membershipExpiresAt: {
            type: Date,
            default: null
        },

        // ✅ FECHA DE ASIGNACIÓN (para tracking)
        membershipAssignedAt: {
            type: Date,
            default: null
        },

        // ✅ HISTORIAL CLARO (REEMPLAZA el array confuso 'memberships')
        membershipHistory: [
            {
                membership: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Membership"
                },
                assignedAt: {
                    type: Date,
                    default: Date.now
                },
                expiredAt: {
                    type: Date,
                    default: null
                },
                status: {
                    type: String,
                    enum: ["ACTIVA", "EXPIRADA", "CANCELADA"],
                    default: "EXPIRADA"
                },
                // ⭐ NUEVO: Para saber si era la membresía "SEMILLA"
                wasTrial: {
                    type: Boolean,
                    default: false
                }
            }
        ],
fcmTokens: [{ type: String }],
        pushTokens: [
            {
                endpoint: { type: String },
                expirationTime: { type: Date, default: null },
                keys: {
                    p256dh: { type: String },
                    auth: { type: String }
                }
            }
        ],

        routines: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Routine"
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model("User", userSchema);