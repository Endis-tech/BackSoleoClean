import express from 'express';
import { 
  getBulkingRoutine, 
  updateRoutineStatus, 
  addMuscleGroups, 
  removeMuscleGroup,
  getAllRoutines  // ⭐ NUEVO
} from '../controllers/routine.controller.js';
import verifyToken from '../middleware/verifyToken.js';

const router = express.Router();

// ⭐ NUEVA RUTA - Para el admin memberships
router.get('/', verifyToken, getAllRoutines);

// Tus rutas existentes
router.get('/bulking', verifyToken, getBulkingRoutine);
router.put('/:id/status', verifyToken, updateRoutineStatus);
router.post('/:id/muscle-groups', verifyToken, addMuscleGroups);
router.delete('/:id/muscle-groups/:muscleGroupId', verifyToken, removeMuscleGroup);

export default router;