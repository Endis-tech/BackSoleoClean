import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    membership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Membership", 
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ["PENDIENTE", "COMPLETADO", "CANCELADO", "FALLADO"],
        default: "PENDIENTE"
    },
    paypalOrderId: {
        type: String
    },
    paypalCaptureId: {
        type: String
    },
    purchaseDate: {
        type: Date,
        default: Date.now
    },
    expirationDate: {
        type: Date
    },
    // ✅ NUEVO: Para tracking de reemplazo automático
    replacedPreviousMembership: {
        type: Boolean,
        default: false
    },
    previousMembership: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Membership",
        default: null
    },
    // ✅ NUEVO: Para saber qué membresía reemplazó
    previousMembershipExpiredAt: {
        type: Date,
        default: null
    }
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);