import mongoose from "mongoose";
import dotenv from "dotenv";
import Membership from "../src/models/Membership.js";

dotenv.config();

async function seedMembership() {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("🔄 Creando membresía Semilla...");

    const exists = await Membership.findOne({ isDefault: true });

    if (exists) {
        console.log("✔️ La membresía default ya existe");
        
        // ⭐ ACTUALIZAR la existente con isTrial
        await Membership.updateOne(
            { isDefault: true },
            { $set: { isTrial: true } }
        );
        console.log("✅ Campo isTrial agregado a membresía Semilla");
        
        process.exit();
    }

    // ⭐ CREAR nueva con ambos campos
    await Membership.create({
        name: "SEMILLA",
        description: `✓ Rutinas básicas\n✓ Seguimiento de racha diaria`,
        price: 0,
        durationDays: 365,
        status: "ACTIVO",
        isDefault: true,
        isTrial: true  // ⭐ NUEVO CAMPO
    });

    console.log("🌱 Membresía Semilla creada con éxito (con isTrial: true)");
    process.exit();
}

seedMembership();