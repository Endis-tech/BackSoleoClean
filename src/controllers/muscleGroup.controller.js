import MuscleGroup from "../models/MuscleGroup.js";

export const getMuscleGroups = async (req, res) => {
  try {
    const muscleGroups = await MuscleGroup.find().sort({ name: 1 });
    res.json(muscleGroups);
  } catch (error) {
    console.error('Error al obtener grupos musculares:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export const getMuscleGroupById = async (req, res) => {
  try {
    const muscleGroup = await MuscleGroup.findById(req.params.id);
    if (!muscleGroup) {
      return res.status(404).json({ message: 'Grupo muscular no encontrado' });
    }
    res.json(muscleGroup);
  } catch (error) {
    console.error('Error al obtener grupo muscular:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export const createMuscleGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const existingMuscleGroup = await MuscleGroup.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });

    if (existingMuscleGroup) {
      return res.status(400).json({ message: 'Ya existe un grupo muscular con este nombre' });
    }

    const muscleGroup = new MuscleGroup({ name: name.trim() });
    const savedMuscleGroup = await muscleGroup.save();
    
    res.status(201).json(savedMuscleGroup);
  } catch (error) {
    console.error('Error al crear grupo muscular:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

export const updateMuscleGroup = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'El nombre es requerido' });
    }

    const existingMuscleGroup = await MuscleGroup.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
      _id: { $ne: req.params.id }
    });

    if (existingMuscleGroup) {
      return res.status(400).json({ message: 'Ya existe un grupo muscular con este nombre' });
    }

    const updatedMuscleGroup = await MuscleGroup.findByIdAndUpdate(
      req.params.id,
      { name: name.trim() },
      { new: true, runValidators: true }
    );

    if (!updatedMuscleGroup) {
      return res.status(404).json({ message: 'Grupo muscular no encontrado' });
    }

    res.json(updatedMuscleGroup);
  } catch (error) {
    console.error('Error al actualizar grupo muscular:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};

// ✅ MODIFICADO PARA SER IDEMPOTENTE EN OFFLINE
export const deleteMuscleGroup = async (req, res) => {
  try {
    const deletedMuscleGroup = await MuscleGroup.findByIdAndDelete(req.params.id);
    
    // ✅ Si ya estaba eliminado, igual responde con éxito (para offline)
    if (!deletedMuscleGroup) {
      return res.status(200).json({ 
        message: 'Grupo muscular ya eliminado (operación idempotente)',
        success: true 
      });
    }

    res.json({ 
      message: 'Grupo muscular eliminado correctamente',
      success: true 
    });
  } catch (error) {
    console.error('Error al eliminar grupo muscular:', error);
    res.status(500).json({ 
      message: 'Error interno del servidor',
      error: error.message 
    });
  }
};