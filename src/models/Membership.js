import mongoose from "mongoose";

const membershipSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true
        },
        
        description: {
            type: String,
            default: ""
        },
        
        price: {
            type: Number,
            required: true
        },
        
        durationDays: {
            type: Number,
            required: true  // ⭐ CLAVE para calcular expiración
        },
        
        // ⭐ Identificar membresía gratuita "SEMILLA"
        isTrial: {
            type: Boolean,
            default: false
        },
        
        status: {
            type: String,
            enum: ["ACTIVO", "INACTIVO"],
            default: "ACTIVO"
        },
        
        routine: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Routine",
            required: true
        },
        
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    { timestamps: true }
);

export default mongoose.model("Membership", membershipSchema);