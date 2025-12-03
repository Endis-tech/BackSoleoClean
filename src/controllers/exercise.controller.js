import Exercise from "../models/Exercise.js";
import MuscleGroup from "../models/MuscleGroup.js";

export const getExercises = async (req, res) => {
  try {
    const exercises = await Exercise.find()
      .populate('muscleGroup', 'name')
      .sort({ name: 1 });
    
    res.json(exercises);
  } catch (error) {
    console.error('Error al obtener ejercicios:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export const getExercisesByMuscleGroup = async (req, res) => {
  try {
    const exercises = await Exercise.find({ 
      muscleGroup: req.params.muscleGroupId 
    })
    .populate('muscleGroup', 'name')
    .sort({ name: 1 });
    
    res.json(exercises);
  } catch (error) {
    console.error('Error al obtener ejercicios por grupo muscular:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export const getExerciseById = async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id)
      .populate('muscleGroup', 'name');
    
    if (!exercise) {
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }
    
    res.json(exercise);
  } catch (error) {
    console.error('Error al obtener ejercicio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export const createExercise = async (req, res) => {
  try {
    const { 
      name, 
      muscleGroup, 
      description, 
      series, 
      repetitions, 
      videoUrl, 
      imageUrl 
    } = req.body;

    // ✅ VALIDACIÓN ROBUSTA
    if (!name || !muscleGroup || !series || !repetitions) {
      return res.status(400).json({ 
        message: 'Nombre, grupo muscular, series y repeticiones son requeridos' 
      });
    }

    // ✅ Validar que muscleGroup sea un ObjectId válido (24 caracteres hexadecimales)
    if (typeof muscleGroup !== 'string' || !/^[0-9a-fA-F]{24}$/.test(muscleGroup)) {
      return res.status(400).json({ 
        message: 'ID de grupo muscular inválido. Debe ser un ObjectId de 24 caracteres.' 
      });
    }

    const muscleGroupExists = await MuscleGroup.findById(muscleGroup);
    if (!muscleGroupExists) {
      return res.status(400).json({ message: 'El grupo muscular no existe' });
    }

    const exercise = new Exercise({
      name: name.trim(),
      muscleGroup,
      description: description?.trim(),
      series: parseInt(series),
      repetitions: parseInt(repetitions),
      videoUrl,
      imageUrl
    });

    const savedExercise = await exercise.save();
    await savedExercise.populate('muscleGroup', 'name');
    
    res.status(201).json(savedExercise);
  } catch (error) {
    console.error('Error al crear ejercicio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export const updateExercise = async (req, res) => {
  try {
    const { 
      name, 
      muscleGroup, 
      description, 
      series, 
      repetitions, 
      videoUrl, 
      imageUrl 
    } = req.body;

    if (!name || !muscleGroup || !series || !repetitions) {
      return res.status(400).json({ 
        message: 'Nombre, grupo muscular, series y repeticiones son requeridos' 
      });
    }

    // ✅ Validar que muscleGroup sea un ObjectId válido
    if (typeof muscleGroup !== 'string' || !/^[0-9a-fA-F]{24}$/.test(muscleGroup)) {
      return res.status(400).json({ 
        message: 'ID de grupo muscular inválido. Debe ser un ObjectId de 24 caracteres.' 
      });
    }

    const muscleGroupExists = await MuscleGroup.findById(muscleGroup);
    if (!muscleGroupExists) {
      return res.status(400).json({ message: 'El grupo muscular no existe' });
    }

    const updatedExercise = await Exercise.findByIdAndUpdate(
      req.params.id,
      {
        name: name.trim(),
        muscleGroup,
        description: description?.trim(),
        series: parseInt(series),
        repetitions: parseInt(repetitions),
        videoUrl,
        imageUrl
      },
      { new: true, runValidators: true }
    ).populate('muscleGroup', 'name');

    if (!updatedExercise) {
      return res.status(404).json({ message: 'Ejercicio no encontrado' });
    }

    res.json(updatedExercise);
  } catch (error) {
    console.error('Error al actualizar ejercicio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// ✅ ÚNICO CAMBIO: hacer DELETE idempotente para offline
export const deleteExercise = async (req, res) => {
  try {
    const deletedExercise = await Exercise.findByIdAndDelete(req.params.id);
    
    // ✅ Si ya estaba eliminado, igual responde con éxito
    if (!deletedExercise) {
      return res.status(200).json({ 
        message: 'Ejercicio ya eliminado (operación idempotente)',
        success: true 
      });
    }

    res.json({ 
      message: 'Ejercicio eliminado correctamente',
      success: true 
    });
  } catch (error) {
    console.error('Error al eliminar ejercicio:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};