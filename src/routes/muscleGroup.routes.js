// routes/muscleGroups.js - USA verifyToken
import express from 'express';
import {
  getMuscleGroups,
  getMuscleGroupById,
  createMuscleGroup,
  updateMuscleGroup,
  deleteMuscleGroup
} from '../controllers/muscleGroup.controller.js';
import verifyToken from '../middleware/verifyToken.js'; // ✅ CAMBIAR AQUÍ
import isAdmin from '../middleware/isAdmin.js';

const router = express.Router();

router.get('/', verifyToken, getMuscleGroups); // ✅ verifyToken aquí también
router.post('/', verifyToken, isAdmin, createMuscleGroup);
router.get('/:id', verifyToken, getMuscleGroupById);
router.put('/:id', verifyToken, isAdmin, updateMuscleGroup);
router.delete('/:id', verifyToken, isAdmin, deleteMuscleGroup);

export default router;