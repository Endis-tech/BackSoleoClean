import mongoose from 'mongoose';

const exerciseSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  series: { 
    type: Number, 
    required: true 
  },
  repetitions: { 
    type: Number, 
    required: true 
  },
  videoUrl: { type: String },
  imageUrl: { type: String },
  muscleGroup: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'MuscleGroup',
    required: true 
  }
}, {
  timestamps: true
});

export default mongoose.model('Exercise', exerciseSchema);