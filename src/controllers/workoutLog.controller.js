import mongoose from 'mongoose';
import WorkoutLog from '../models/WorkoutLog.js';
import User from '../models/User.js';
import Routine from '../models/Routine.js';

// ==========================================
// FUNCIONES AUXILIARES PARA STREAK Y PROGRESO
// ==========================================


// En workoutLog.controller.js - modifica la función calcularTotalEjercicios
const calcularTotalEjercicios = async (routineId) => {
    try {
        console.log('🔍 [DEBUG] Calculando total de ejercicios para routine:', routineId);
        
        const routine = await Routine.findById(routineId)
            .populate('muscleGroups')
            .populate('muscleGroups.exercises');
        
        if (!routine) {
            console.log('❌ [DEBUG] Rutina no encontrada');
            return 0;
        }
        
        console.log('📋 [DEBUG] Estructura completa de la rutina:', JSON.stringify({
            _id: routine._id,
            name: routine.name,
            muscleGroupsCount: routine.muscleGroups?.length,
            muscleGroups: routine.muscleGroups?.map(group => ({
                name: group.name,
                _id: group._id,
                exercisesCount: group.exercises?.length,
                exercises: group.exercises?.map(ex => ({ _id: ex._id, name: ex.name }))
            }))
        }, null, 2));

        if (!routine.muscleGroups || routine.muscleGroups.length === 0) {
            console.log('❌ [DEBUG] No hay muscleGroups en la rutina');
            return 0;
        }
        
        const total = routine.muscleGroups.reduce((total, group) => {
            const groupExercises = group.exercises ? group.exercises.length : 0;
            console.log(`📊 [DEBUG] Grupo "${group.name}": ${groupExercises} ejercicios`);
            return total + groupExercises;
        }, 0);
        
        console.log('✅ [DEBUG] Total de ejercicios calculado:', total);
        return total;
    } catch (error) {
        console.error('❌ Error calculando total de ejercicios:', error);
        return 0;
    }
};



const updateUserStreak = async (userId, completedExercisesCount, totalExercisesCount) => {
    try {
        const user = await User.findById(userId);
        if (!user) {
            console.log('❌ Usuario no encontrado:', userId);
            return 0;
        }

        // ✅ INICIALIZAR STREAK SI NO EXISTE
        if (!user.streak) {
            user.streak = {
                current: 0,
                longest: 0,
                lastWorkoutDate: null
            };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastWorkoutDate = user.streak.lastWorkoutDate 
            ? new Date(user.streak.lastWorkoutDate).setHours(0, 0, 0, 0)
            : null;
        
        const todayTimestamp = today.getTime();

        console.log('📅 Fechas para cálculo de racha:', {
            lastWorkoutDate,
            todayTimestamp,
            diferencia: lastWorkoutDate ? todayTimestamp - lastWorkoutDate : 'N/A'
        });

        // ✅ VERIFICAR SI YA SE REGISTRÓ WORKOUT HOY
        if (lastWorkoutDate === todayTimestamp) {
            console.log('ℹ️ Ya se registró workout hoy, manteniendo streak');
            return user.streak.current;
        }

        // ✅ CALCULAR SI COMPLETÓ AL MENOS UN GRUPO MUSCULAR (3+ EJERCICIOS)
        const completedGroup = completedExercisesCount >= 3;
        
        let newStreak = user.streak.current;

        if (completedGroup) {
            if (!lastWorkoutDate) {
                // ✅ PRIMER WORKOUT - empezar racha
                newStreak = 1;
                console.log('🎯 Primer workout, iniciando racha: 1');
            } else if (lastWorkoutDate === todayTimestamp - 86400000) {
                // ✅ STREAK CONTINUO - ayer fue el último workout
                newStreak = user.streak.current + 1;
                console.log(`🔥 Streak continuo: ${user.streak.current} → ${newStreak}`);
            } else if (lastWorkoutDate < todayTimestamp - 86400000) {
                // ✅ STREAK ROTO - empezar de nuevo
                newStreak = 1;
                console.log('🔄 Streak roto, empezando nuevo: 1');
            } else {
                // ✅ Mismo día o fecha futura (no debería pasar)
                newStreak = user.streak.current;
                console.log('ℹ️ Mismo día, streak sin cambios');
            }
            
            // ✅ ACTUALIZAR RACHA MÁS LARGA
            if (newStreak > user.streak.longest) {
                user.streak.longest = newStreak;
                console.log(`🏆 Nueva racha más larga: ${newStreak} días`);
            }

            user.streak.current = newStreak;
            user.streak.lastWorkoutDate = new Date();
            
            console.log(`✅ Streak actualizado: ${newStreak} días (completó ${completedExercisesCount}/${totalExercisesCount} ejercicios)`);
            
            await user.save();
        } else {
            console.log(`ℹ️ No se completó grupo muscular (${completedExercisesCount}/${totalExercisesCount} ejercicios), streak sin cambios`);
        }

        return user.streak.current;

    } catch (error) {
        console.error('❌ Error actualizando streak:', error);
        return 0;
    }
};

const updateUserProgress = async (userId, workoutData) => {
    try {
        const user = await User.findById(userId);
        if (!user) return null;

        // ✅ INICIALIZAR PROGRESO SI NO EXISTE
        if (!user.progress) {
            user.progress = {
                totalWorkouts: 0,
                totalDuration: 0,
                totalExerciseTime: 0,
                workoutsThisWeek: 0,
                workoutsThisMonth: 0
            };
        }

        const today = new Date();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        // Contar workouts esta semana
        const weeklyWorkouts = await WorkoutLog.countDocuments({
            user: userId,
            startTime: { $gte: startOfWeek },
            endTime: { $ne: null }
        });

        // Contar workouts este mes
        const monthlyWorkouts = await WorkoutLog.countDocuments({
            user: userId,
            startTime: { $gte: startOfMonth },
            endTime: { $ne: null }
        });

        // ✅ ACTUALIZAR PROGRESO
        user.progress.totalWorkouts += 1;
        user.progress.totalDuration += workoutData.duration || 0;
        user.progress.totalExerciseTime += workoutData.totalExerciseTime || 0;
        user.progress.workoutsThisWeek = weeklyWorkouts;
        user.progress.workoutsThisMonth = monthlyWorkouts;

        await user.save();
        
        console.log('✅ Progreso actualizado:', {
            totalWorkouts: user.progress.totalWorkouts,
            weekly: user.progress.workoutsThisWeek,
            monthly: user.progress.workoutsThisMonth
        });

        return user.progress;
    } catch (error) {
        console.error('❌ Error actualizando progreso:', error);
        return null;
    }
};

// ==========================================
// CONTROLADORES PRINCIPALES - STREAK CORREGIDO
// ==========================================
// En controllers/workoutLog.controller.js - REEMPLAZA COMPLETAMENTE getCurrentWorkout
export const getCurrentWorkout = async (req, res) => {
    try {
        const userId = req.userId;
        
        console.log('🔍 Buscando workout actual para usuario:', userId);

        const currentWorkout = await WorkoutLog.findOne({
            user: userId,
            $or: [
                { endTime: null },
                { endTime: { $exists: false } }
            ]
        })
        .populate('routine')
        .populate('muscleGroup')
        .populate('exercisesCompleted');

        // ✅✅✅ CAMBIO CRÍTICO: NUNCA devolver 404, siempre 200
        console.log('✅ Estado del workout:', currentWorkout ? 'ACTIVO' : 'NO ACTIVO');
        
        res.status(200).json({
            success: true,
            exists: !!currentWorkout,
            message: currentWorkout ? 'Workout activo encontrado' : 'No hay workout activo',
            workout: currentWorkout || null
        });
        
    } catch (error) {
        console.error('❌ Error en getCurrentWorkout:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al obtener workout actual',
            details: error.message 
        });
    }
};



export const startBulkingWorkout = async (req, res) => {
    try {
        const { routineId, muscleGroupId } = req.body;
        const userId = req.userId;
        
        console.log('🏁 Iniciando workout bulking:', {
            userId,
            routineId,
            muscleGroupId
        });

        // ✅ VALIDACIONES COMPLETAS
        if (!routineId) {
            return res.status(400).json({ 
                error: 'routineId es requerido' 
            });
        }

        if (!muscleGroupId) {
            return res.status(400).json({ 
                error: 'muscleGroupId es requerido' 
            });
        }

        // Validar ObjectIds
        if (!mongoose.Types.ObjectId.isValid(routineId)) {
            return res.status(400).json({ 
                error: 'routineId no es un ObjectId válido' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(muscleGroupId)) {
            return res.status(400).json({ 
                error: 'muscleGroupId no es un ObjectId válido' 
            });
        }

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ 
                error: 'userId no es válido' 
            });
        }

        // ✅ VERIFICAR WORKOUT EN PROGRESO
        const existingWorkout = await WorkoutLog.findOne({
            user: userId,
            $or: [
                { endTime: null },
                { endTime: { $exists: false } }
            ]
        });

        if (existingWorkout) {
            console.log('❌ Ya existe workout en progreso:', existingWorkout._id);
            return res.status(400).json({ 
                error: 'Ya tienes un workout en progreso',
                currentWorkoutId: existingWorkout._id 
            });
        }

        // ✅ CREAR NUEVO WORKOUT
        const newWorkout = new WorkoutLog({
            user: new mongoose.Types.ObjectId(userId),
            routine: new mongoose.Types.ObjectId(routineId),
            muscleGroup: new mongoose.Types.ObjectId(muscleGroupId),
            startTime: new Date(),
            endTime: null,
            duration: 0,
            totalExerciseTime: 0,
            exercisesCompleted: [],
            exerciseTimes: new Map(),
            streak: 0, // Se inicializa en 0, se actualiza al finalizar
            notes: ''
        });

        console.log('📝 Creando nuevo workout con datos:', {
            user: userId,
            routine: routineId,
            muscleGroup: muscleGroupId,
            startTime: new Date(),
            endTime: null
        });

        await newWorkout.save();
        console.log('✅ Workout guardado en BD:', newWorkout._id);

        await newWorkout.populate('routine muscleGroup');
        console.log('✅ Workout poblado correctamente');

        res.status(201).json({
            message: 'Workout iniciado correctamente',
            workout: newWorkout
        });

    } catch (error) {
        console.error('❌ Error en startBulkingWorkout:', error);
        res.status(500).json({ 
            error: 'Error al iniciar workout',
            details: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
        });
    }
};

// En controllers/workoutLog.controller.js - ACTUALIZA finishCurrentWorkout
export const finishCurrentWorkout = async (req, res) => {
    try {
        const userId = req.userId;

        console.log('🏁 Finalizando workout actual para usuario:', userId);

        const workout = await WorkoutLog.findOne({
            user: userId,
            $or: [
                { endTime: null },
                { endTime: { $exists: false } }
            ]
        });

        // ✅ CAMBIO: En lugar de 404, devolver error específico con 400
        if (!workout) {
            return res.status(400).json({ 
                success: false,
                error: 'No hay workout en progreso para finalizar',
                code: 'NO_ACTIVE_WORKOUT'
            });
        }

        // ... el resto de tu código existente
        workout.endTime = new Date();
        workout.duration = Math.round((workout.endTime - workout.startTime) / (1000 * 60));

        console.log('✅ Finalizando workout:', {
            workoutId: workout._id,
            duration: workout.duration,
            exercisesCompleted: workout.exercisesCompleted.length
        });

        // Calcular total de ejercicios para la rutina
        const totalExercisesCount = await calcularTotalEjercicios(workout.routine);
        const completedExercisesCount = workout.exercisesCompleted.length;

        console.log('📊 Estadísticas del workout:', {
            completed: completedExercisesCount,
            total: totalExercisesCount
        });

        // Actualizar streak del usuario
        const currentStreak = await updateUserStreak(userId, completedExercisesCount, totalExercisesCount);
        workout.streak = currentStreak;

        await workout.save();

        // Actualizar progreso del usuario
        const userProgress = await updateUserProgress(userId, {
            duration: workout.duration,
            totalExerciseTime: workout.totalExerciseTime || 0
        });

        await workout.populate('routine muscleGroup exercisesCompleted');

        console.log('✅ Workout finalizado correctamente', {
            streak: currentStreak,
            exercises: `${completedExercisesCount}/${totalExercisesCount}`
        });

        res.json({
            success: true,
            message: 'Workout finalizado correctamente',
            workout,
            streak: currentStreak,
            progress: userProgress,
            stats: {
                completedExercises: completedExercisesCount,
                totalExercises: totalExercisesCount
            }
        });

    } catch (error) {
        console.error('❌ Error en finishCurrentWorkout:', error);
        res.status(500).json({ 
            success: false,
            error: 'Error al finalizar workout',
            details: error.message 
        });
    }
};

export const finishWorkoutLog = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        console.log('🏁 Finalizando workout específico:', { id, userId });

        const workout = await WorkoutLog.findOne({
            _id: id,
            user: userId
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout no encontrado' });
        }

        if (workout.endTime) {
            return res.status(400).json({ error: 'Workout ya finalizado' });
        }

        // Calcular duración y finalizar workout
        workout.endTime = new Date();
        workout.duration = Math.round(
            (workout.endTime - workout.startTime) / (1000 * 60)
        );

        // ✅ CALCULAR TOTAL DE EJERCICIOS PARA LA RUTINA
        const totalExercisesCount = await calcularTotalEjercicios(workout.routine);
        const completedExercisesCount = workout.exercisesCompleted.length;

        // ✅ ACTUALIZAR STREAK Y PROGRESO DEL USUARIO
        const currentStreak = await updateUserStreak(userId, completedExercisesCount, totalExercisesCount);
        
        // ⭐⭐ CORRECCIÓN CRÍTICA: ASIGNAR STREAK AL WORKOUT ⭐⭐
        workout.streak = currentStreak;

        await workout.save();

        const userProgress = await updateUserProgress(userId, {
            duration: workout.duration,
            totalExerciseTime: workout.totalExerciseTime || 0
        });

        await workout.populate('routine muscleGroup exercisesCompleted');

        res.json({
            message: 'Workout finalizado correctamente',
            workout,
            streak: currentStreak,
            progress: userProgress
        });
    } catch (error) {
        console.error('Error en finishWorkoutLog:', error);
        res.status(500).json({ error: error.message });
    }
};

export const createWorkoutLog = async (req, res) => {
    try {
        const { routineId, muscleGroupId } = req.body;
        const userId = req.userId;

        console.log('📝 Creando nuevo workout log:', { userId, routineId, muscleGroupId });

        if (!routineId || !muscleGroupId) {
            return res.status(400).json({ 
                error: 'routineId y muscleGroupId son requeridos' 
            });
        }

        const newWorkout = new WorkoutLog({
            user: userId,
            routine: routineId,
            muscleGroup: muscleGroupId,
            startTime: new Date(),
            endTime: null,
            exercisesCompleted: [],
            streak: 0
        });

        await newWorkout.save();
        await newWorkout.populate('routine muscleGroup');

        console.log('✅ Workout log creado:', newWorkout._id);

        res.status(201).json({
            message: 'Workout creado correctamente',
            workout: newWorkout
        });
    } catch (error) {
        console.error('Error en createWorkoutLog:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getWorkoutById = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        console.log('🔍 Obteniendo workout por ID:', { id, userId });

        const workout = await WorkoutLog.findOne({
            _id: id,
            user: userId
        })
        .populate('routine muscleGroup exercisesCompleted');

        if (!workout) {
            return res.status(404).json({ error: 'Workout no encontrado' });
        }

        const user = await User.findById(userId).select('name streak');

        res.json({
            workout,
            userContext: {
                userName: user.name,
                currentStreak: user.streak?.current || 0
            }
        });
    } catch (error) {
        console.error('Error en getWorkoutById:', error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteWorkoutLog = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.userId;

        console.log('🗑️ Eliminando workout:', { id, userId });

        const workout = await WorkoutLog.findOne({
            _id: id,
            user: userId
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout no encontrado' });
        }

        let user = null;

        if (workout.endTime) {
            user = await User.findById(userId);
            if (user && user.progress) {
                user.progress.totalWorkouts = Math.max(0, user.progress.totalWorkouts - 1);
                user.progress.totalDuration = Math.max(0, user.progress.totalDuration - (workout.duration || 0));
                user.progress.totalExerciseTime = Math.max(0, user.progress.totalExerciseTime - (workout.totalExerciseTime || 0));
                
                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay());
                startOfWeek.setHours(0, 0, 0, 0);
                
                const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

                const weeklyWorkouts = await WorkoutLog.countDocuments({
                    user: userId,
                    startTime: { $gte: startOfWeek },
                    endTime: { $ne: null }
                });

                const monthlyWorkouts = await WorkoutLog.countDocuments({
                    user: userId,
                    startTime: { $gte: startOfMonth },
                    endTime: { $ne: null }
                });

                user.progress.workoutsThisWeek = weeklyWorkouts;
                user.progress.workoutsThisMonth = monthlyWorkouts;
                
                await user.save();
            }
        }

        await WorkoutLog.findOneAndDelete({
            _id: id,
            user: userId
        });

        console.log('✅ Workout eliminado:', id);

        res.json({ 
            message: 'Workout eliminado correctamente',
            updatedProgress: user ? user.progress : null
        });
    } catch (error) {
        console.error('Error en deleteWorkoutLog:', error);
        res.status(500).json({ error: error.message });
    }
};

export const updateExercisesCompleted = async (req, res) => {
    try {
        const { id } = req.params;
        const { exerciseId, completed } = req.body;
        const userId = req.userId;

        console.log('🔄 Actualizando ejercicio completado:', {
            workoutId: id,
            exerciseId,
            completed
        });

        const workout = await WorkoutLog.findOne({
            _id: id,
            user: userId
        });

        if (!workout) {
            return res.status(404).json({ error: 'Workout no encontrado' });
        }

        if (completed) {
            if (!workout.exercisesCompleted.includes(exerciseId)) {
                workout.exercisesCompleted.push(exerciseId);
                console.log('✅ Ejercicio agregado a completados:', exerciseId);
            }
        } else {
            workout.exercisesCompleted = workout.exercisesCompleted.filter(
                id => id.toString() !== exerciseId
            );
            console.log('✅ Ejercicio removido de completados:', exerciseId);
        }

        await workout.save();
        console.log('✅ Workout actualizado correctamente');

        res.json({
            message: 'Ejercicio actualizado correctamente',
            exercisesCompleted: workout.exercisesCompleted
        });
    } catch (error) {
        console.error('Error en updateExercisesCompleted:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getTodayProgress = async (req, res) => {
    try {
        const userId = req.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('📊 Obteniendo progreso de hoy para usuario:', userId);

        const todayWorkouts = await WorkoutLog.find({
            user: userId,
            startTime: {
                $gte: today,
                $lt: tomorrow
            }
        })
        .populate('routine muscleGroup');

        const user = await User.findById(userId).select('progress streak');

        const totalDuration = todayWorkouts.reduce((total, workout) => 
            total + (workout.duration || 0), 0
        );

        const totalExercises = todayWorkouts.reduce((total, workout) => 
            total + (workout.exercisesCompleted?.length || 0), 0
        );

        res.json({
            todayStats: {
                workoutsCount: todayWorkouts.length,
                totalDuration,
                totalExercises,
                workouts: todayWorkouts
            },
            userProgress: user.progress,
            currentStreak: user.streak?.current || 0
        });
    } catch (error) {
        console.error('Error en getTodayProgress:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getWorkoutHistory = async (req, res) => {
    try {
        const userId = req.userId;
        const { limit = 10, page = 1 } = req.query;

        console.log('📚 Obteniendo historial de workouts:', { userId, limit, page });

        const workouts = await WorkoutLog.find({ user: userId })
            .populate('routine muscleGroup')
            .sort({ startTime: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await WorkoutLog.countDocuments({ user: userId });

        const user = await User.findById(userId).select('progress streak');

        res.json({
            workouts,
            pagination: {
                totalPages: Math.ceil(total / limit),
                currentPage: parseInt(page),
                totalWorkouts: total
            },
            userStats: {
                totalWorkouts: user.progress?.totalWorkouts || 0,
                currentStreak: user.streak?.current || 0,
                longestStreak: user.streak?.longest || 0
            }
        });
    } catch (error) {
        console.error('Error en getWorkoutHistory:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getTodayWorkout = async (req, res) => {
    try {
        const userId = req.userId;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        console.log('🔍 Buscando workout de hoy para usuario:', userId);

        const workout = await WorkoutLog.findOne({
            user: userId,
            startTime: {
                $gte: today,
                $lt: tomorrow
            }
        })
        .populate('routine muscleGroup exercisesCompleted')
        .sort({ startTime: -1 });

        if (!workout) {
            console.log('ℹ️ No hay workout hoy para usuario:', userId);
            return res.status(404).json({ message: 'No hay workout hoy' });
        }

        const user = await User.findById(userId).select('streak progress');

        console.log('✅ Workout de hoy encontrado:', workout._id);

        res.json({
            workout,
            userContext: {
                currentStreak: user.streak?.current || 0,
                todayProgress: {
                    workoutsCompleted: user.progress?.workoutsThisWeek || 0,
                    monthlyWorkouts: user.progress?.workoutsThisMonth || 0
                }
            }
        });
    } catch (error) {
        console.error('Error en getTodayWorkout:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getWorkoutStatistics = async (req, res) => {
    try {
        const userId = req.userId;

        console.log('📈 Obteniendo estadísticas para usuario:', userId);

        const user = await User.findById(userId).select('streak progress name');
        
        const workoutStats = await WorkoutLog.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: null,
                    totalWorkouts: { $sum: 1 },
                    totalDuration: { $sum: '$duration' },
                    totalExerciseTime: { $sum: '$totalExerciseTime' },
                    avgDuration: { $avg: '$duration' },
                    lastWorkout: { $max: '$startTime' },
                    completedWorkouts: { 
                        $sum: { 
                            $cond: [{ $ne: ['$endTime', null] }, 1, 0] 
                        } 
                    }
                }
            }
        ]);

        const muscleGroupStats = await WorkoutLog.aggregate([
            { $match: { user: new mongoose.Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$muscleGroup',
                    count: { $sum: 1 },
                    totalTime: { $sum: '$duration' },
                    avgTime: { $avg: '$duration' }
                }
            },
            { $sort: { count: -1 } },
            { $limit: 6 }
        ]);

        const fourWeeksAgo = new Date();
        fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

        const weeklyStats = await WorkoutLog.aggregate([
            { 
                $match: { 
                    user: new mongoose.Types.ObjectId(userId),
                    startTime: { $gte: fourWeeksAgo }
                } 
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$startTime' },
                        week: { $week: '$startTime' }
                    },
                    workouts: { $sum: 1 },
                    totalDuration: { $sum: '$duration' }
                }
            },
            { $sort: { '_id.year': -1, '_id.week': -1 } },
            { $limit: 4 }
        ]);

        res.json({
            userStats: {
                streak: user.streak || { current: 0, longest: 0 },
                progress: user.progress || {
                    totalWorkouts: 0,
                    totalDuration: 0,
                    totalExerciseTime: 0,
                    workoutsThisWeek: 0,
                    workoutsThisMonth: 0
                },
                name: user.name
            },
            workoutStats: workoutStats[0] || {
                totalWorkouts: 0,
                totalDuration: 0,
                totalExerciseTime: 0,
                avgDuration: 0,
                lastWorkout: null,
                completedWorkouts: 0
            },
            muscleGroups: muscleGroupStats,
            weeklyProgress: weeklyStats,
            summary: {
                workoutFrequency: user.progress?.workoutsThisWeek > 3 ? 'ALTA' : 
                                user.progress?.workoutsThisWeek > 1 ? 'MEDIA' : 'BAJA',
                consistency: user.streak?.current > 7 ? 'EXCELENTE' :
                           user.streak?.current > 3 ? 'BUENA' :
                           user.streak?.current > 0 ? 'REGULAR' : 'INICIA_TU_STREAK'
            }
        });
    } catch (error) {
        console.error('Error en getWorkoutStatistics:', error);
        res.status(500).json({ error: error.message });
    }
};

