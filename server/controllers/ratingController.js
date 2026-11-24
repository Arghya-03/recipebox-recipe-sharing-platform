
import mongoose from 'mongoose';
import Recipe from '../models/Recipe.js';

// Add or update a recipe rating
export const rateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { value } = req.body;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID.',
      });
    }

    if (
      !Number.isInteger(value) ||
      value < 1 ||
      value > 5
    ) {
      return res.status(400).json({
        success: false,
        message: 'Rating must be an integer between 1 and 5.',
      });
    }

    const recipe = await Recipe.findById(id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.',
      });
    }

    // Check whether this user has already rated the recipe
    const existingRating = recipe.ratings.find(
      (rating) => rating.user.toString() === req.user._id.toString()
    );

    if (existingRating) {
      // Update the existing rating
      existingRating.value = value;
    } else {
      // Add a new rating
      recipe.ratings.push({
        user: req.user._id,
        value,
      });
    }

    // Save triggers the existing average-rating calculation hook
    await recipe.save();

    res.status(200).json({
      success: true,
      message: existingRating
        ? 'Rating updated successfully.'
        : 'Rating submitted successfully.',
      averageRating: recipe.averageRating,
      ratingCount: recipe.ratingCount,
      userRating: value,
    });
  } catch (error) {
    console.error('Rate recipe error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to submit rating.',
    });
  }
};
