import express from 'express';
import { 
    createWorkoutLog,
    finishWorkoutLog,
    getTodayProgress,
    getWorkoutHistory,
    startBulkingWorkout,
    finishCurrentWorkout,  
    getCurrentWorkout,
    updateExercisesCompleted,
    getWorkoutStatistics,
    getWorkoutById,
    deleteWorkoutLog,
    getTodayWorkout
} from '../controllers/workoutLog.controller.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyToken);

// ==========================================
// RUTAS ESPECÍFICAS (deben ir PRIMERO)
// ==========================================

// RUTAS PARA WORKOUTS EN CURSO
router.get('/current', getCurrentWorkout);
router.patch('/current/finish', finishCurrentWorkout); // ✅ PATCH para actualización parcial
router.get('/today/workout', getTodayWorkout);

// RUTAS DE PROGRESO Y ESTADÍSTICAS
router.get('/today-progress', getTodayProgress);
router.get('/history', getWorkoutHistory);
router.get('/statistics', getWorkoutStatistics);

// INICIAR WORKOUT BULKING
router.post('/start-bulking', startBulkingWorkout);

// ==========================================
// RUTAS CON PARÁMETROS (deben ir DESPUÉS)
// ==========================================

// Crear un nuevo workout log (genérico)
router.post('/', createWorkoutLog);

// Obtener workout por ID específico
router.get('/:id', getWorkoutById);

// Eliminar workout log específico
router.delete('/:id', deleteWorkoutLog);

// Finalizar workout log específico por ID
router.patch('/:id/finish', finishWorkoutLog); // ✅ PATCH para actualización parcial

// Actualizar ejercicios completados de un workout específico
router.patch('/:id/exercises', updateExercisesCompleted); // ✅ PATCH para actualización parcial

export default router;