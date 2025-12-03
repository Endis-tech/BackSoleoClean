import mongoose from "mongoose";

const routineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    muscleGroups: [{
        muscleGroup: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MuscleGroup',
            required: true
        },
        exercises: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Exercise',
            required: true
        }]
    }],
    status: {
        type: String,
        enum: ['ACTIVO', 'INACTIVO'],
        default: 'ACTIVO'
    }
}, {
    timestamps: true
});

export default mongoose.model('Routine', routineSchema);