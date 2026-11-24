
import mongoose from 'mongoose';

const cookbookSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cookbook name is required'],
      trim: true,
      maxlength: [60, 'Cookbook name cannot exceed 60 characters'],
    },

    description: {
      type: String,
      trim: true,
      maxlength: [300, 'Description cannot exceed 300 characters'],
      default: '',
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    recipes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Recipe',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate cookbook names for the same user.
cookbookSchema.index(
  { owner: 1, name: 1 },
  { unique: true }
);

const Cookbook = mongoose.model('Cookbook', cookbookSchema);

export default Cookbook;
