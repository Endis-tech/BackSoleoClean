import Routine from '../models/Routine.js';
import Exercise from '../models/Exercise.js';
import MuscleGroup from '../models/MuscleGroup.js';

// Obtener rutina bulking
export const getBulkingRoutine = async (req, res) => {
  try {
    const routine = await Routine.findOne({ name: 'bulking' })
      .populate({
        path: 'muscleGroups.muscleGroup',
        model: 'MuscleGroup'
      })
      .populate({
        path: 'muscleGroups.exercises',
        model: 'Exercise',
        populate: {
          path: 'muscleGroup',
          model: 'MuscleGroup'
        }
      });

    if (!routine) {
      return res.status(404).json({ 
        message: 'Rutina bulking no encontrada' 
      });
    }

    res.json(routine);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al obtener la rutina bulking',
      error: error.message 
    });
  }
};

// Cambiar estado de la rutina (ACTIVO/INACTIVO)
export const updateRoutineStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['ACTIVO', 'INACTIVO'].includes(status)) {
      return res.status(400).json({ 
        message: 'Status debe ser ACTIVO o INACTIVO' 
      });
    }

    const routine = await Routine.findByIdAndUpdate(
      id,
      { status: status },
      { new: true }
    )
    .populate({
      path: 'muscleGroups.muscleGroup',
      model: 'MuscleGroup'
    })
    .populate({
      path: 'muscleGroups.exercises',
      model: 'Exercise',
      populate: {
        path: 'muscleGroup',
        model: 'MuscleGroup'
      }
    });

    if (!routine) {
      return res.status(404).json({ 
        message: 'Rutina no encontrada' 
      });
    }

    res.json(routine);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al actualizar el estado',
      error: error.message 
    });
  }
};

// Agregar grupos musculares a la rutina
export const addMuscleGroups = async (req, res) => {
  try {
    const { muscleGroups } = req.body;
    const { id } = req.params;

    const muscleGroupsWithExercises = await Promise.all(
      muscleGroups.map(async (mg) => {
        const exercises = await Exercise.find({ 
          muscleGroup: mg.muscleGroup 
        }).limit(3);

        return {
          muscleGroup: mg.muscleGroup,
          exercises: exercises.map(ex => ex._id)
        };
      })
    );

    const routine = await Routine.findByIdAndUpdate(
      id,
      { 
        $push: { 
          muscleGroups: { $each: muscleGroupsWithExercises } 
        } 
      },
      { new: true }
    )
    .populate({
      path: 'muscleGroups.muscleGroup',
      model: 'MuscleGroup'
    })
    .populate({
      path: 'muscleGroups.exercises',
      model: 'Exercise',
      populate: {
        path: 'muscleGroup',
        model: 'MuscleGroup'
      }
    });

    if (!routine) {
      return res.status(404).json({ 
        message: 'Rutina no encontrada' 
      });
    }

    res.json(routine);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al agregar grupos musculares',
      error: error.message 
    });
  }
};

// ✅ ELIMINAR GRUPO MUSCULAR — IDEMPOTENTE PARA OFFLINE
export const removeMuscleGroup = async (req, res) => {
  try {
    const { id, muscleGroupId } = req.params;

    const routine = await Routine.findById(id);
    if (!routine) {
      return res.status(404).json({ 
        message: 'Rutina no encontrada' 
      });
    }

    // ✅ Verificar si ya fue eliminado
    const alreadyRemoved = !routine.muscleGroups.some(mg => 
      mg.muscleGroup && mg.muscleGroup.toString() === muscleGroupId
    );

    if (alreadyRemoved) {
      // ✅ Devolver rutina actual (éxito para offline)
      const populatedRoutine = await routine
        .populate({
          path: 'muscleGroups.muscleGroup',
          model: 'MuscleGroup'
        })
        .populate({
          path: 'muscleGroups.exercises',
          model: 'Exercise',
          populate: {
            path: 'muscleGroup',
            model: 'MuscleGroup'
          }
        });
      
      return res.json(populatedRoutine);
    }

    // Si no está eliminado, eliminarlo
    const updatedRoutine = await Routine.findByIdAndUpdate(
      id,
      { 
        $pull: { 
          muscleGroups: { muscleGroup: muscleGroupId } 
        } 
      },
      { new: true }
    )
    .populate({
      path: 'muscleGroups.muscleGroup',
      model: 'MuscleGroup'
    })
    .populate({
      path: 'muscleGroups.exercises',
      model: 'Exercise',
      populate: {
        path: 'muscleGroup',
        model: 'MuscleGroup'
      }
    });

    res.json(updatedRoutine);
  } catch (error) {
    res.status(500).json({ 
      message: 'Error al eliminar el grupo muscular',
      error: error.message 
    });
  }
};

// GET ALL ROUTINES
export const getAllRoutines = async (req, res) => {
  try {
    const routines = await Routine.find()
      .select('name status createdAt')
      .sort({ name: 1 });

    res.json({
      success: true,
      routines
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener rutinas',
      error: error.message 
    });
  }
};