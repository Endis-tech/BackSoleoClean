import mongoose from 'mongoose';

const muscleGroupSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true,
    unique: true 
  },
  description: { type: String }
}, {
  timestamps: true
});

export default mongoose.model('MuscleGroup', muscleGroupSchema);