import mongoose from 'mongoose';

const workoutLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    routine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Routine',
        required: true
    },
    muscleGroup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MuscleGroup',
        required: true // 👈 NUEVO: Grupo muscular específico
    },
    startTime: {
        type: Date,
        required: true,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    duration: {
        type: Number, // en minutos
        default: 0
    },
    totalExerciseTime: {
        type: Number, // en segundos - 👈 NUEVO: Tiempo total de ejercicios
        default: 0
    },
    exercisesCompleted: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Exercise'
    }],
    exerciseTimes: {
        type: Map, // 👈 NUEVO: Tiempos por ejercicio { exerciseId: segundos }
        of: Number,
        default: {}
    },
    streak: {
        type: Number,
        default: 0
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

// Índices para mejor performance
workoutLogSchema.index({ user: 1, startTime: -1 });
workoutLogSchema.index({ user: 1, endTime: 1 });
workoutLogSchema.index({ user: 1, startTime: 1, endTime: 1 }); // Para búsquedas por día

const WorkoutLog = mongoose.model('WorkoutLog', workoutLogSchema);

export default WorkoutLog;