// routes/exercises.js - CORREGIDO
import express from 'express';
import {
  getExercises,
  getExerciseById,
  getExercisesByMuscleGroup,
  createExercise,
  updateExercise,
  deleteExercise
} from '../controllers/exercise.controller.js';
// ✅ CAMBIA auth por verifyToken
import verifyToken from '../middleware/verifyToken.js';
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

router.get('/', verifyToken, getExercises);
router.post('/', verifyToken, isAdmin, createExercise);
router.get('/muscle-group/:muscleGroupId', verifyToken, getExercisesByMuscleGroup);
router.get('/:id', verifyToken, getExerciseById);
router.put('/:id', verifyToken, isAdmin, updateExercise);
router.delete('/:id', verifyToken, isAdmin, deleteExercise);

export default router;