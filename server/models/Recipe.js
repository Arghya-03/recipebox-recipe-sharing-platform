
import mongoose from 'mongoose';

// Ingredient sub-schema
const ingredientSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

// Nutritional information sub-schema
const nutritionalInfoSchema = new mongoose.Schema(
  {
    calories: Number,
    protein: Number,
    carbohydrates: Number,
    fat: Number,
  },
  { _id: false }
);

// Recipe schema
const recipeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Recipe title is required'],
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      required: true,
      maxlength: 1000,
    },

    cuisine: {
  type: String,
  enum: [
    'Bengali',
    'South Indian',
    'Punjabi',
    'Gujarati',
    'Other Indian',
    'International',
  ],
  default: 'Other Indian',
  required: true,
},

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    ingredients: {
      type: [ingredientSchema],
      validate: {
        validator: (items) => items.length > 0,
        message: 'At least one ingredient is required',
      },
    },

    instructions: {
      type: [String],
      required: true,
      validate: {
        validator: (steps) =>
          steps.length > 0 &&
          steps.every((step) => step.trim().length > 0),
        message: 'At least one valid instruction is required',
      },
    },

    preparationTime: {
      type: Number,
      required: true,
      min: 0,
    },

    cookingTime: {
      type: Number,
      required: true,
      min: 0,
    },

    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Easy',
    },

    servings: {
      type: Number,
      required: true,
      min: 1,
    },

    image: {
      url: {
        type: String,
        default: '',
      },
      publicId: {
        type: String,
        default: '',
      },
    },

    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],

    recommendedMealType: {
      type: String,
      enum: ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Beverage'],
      default: 'Dinner',
    },

    nutritionalInfo: {
      type: nutritionalInfoSchema,
      default: undefined,
    },

    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        value: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
        },
      },
    ],

    averageRating: {
      type: Number,
      default: 0,
    },

    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Automatically calculate average rating
recipeSchema.pre('save', function () {
  this.ratingCount = this.ratings.length;

  this.averageRating =
    this.ratingCount > 0
      ? this.ratings.reduce((total, rating) => total + rating.value, 0) /
      this.ratingCount
      : 0;
});

// Indexes for recipe discovery
recipeSchema.index({ title: 'text', description: 'text' });
recipeSchema.index({ tags: 1 });
recipeSchema.index({ cuisine: 1 });
recipeSchema.index({ 'ingredients.name': 1 });
recipeSchema.index({ author: 1, createdAt: -1 });

const Recipe = mongoose.model('Recipe', recipeSchema);

export default Recipe;
