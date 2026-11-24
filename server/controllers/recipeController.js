
import Recipe from '../models/Recipe.js';
import Cookbook from '../models/Cookbook.js';
import MealPlan from '../models/MealPlan.js';
import Comment from '../models/Comment.js';
import cloudinary from '../config/cloudinary.js';

// Escape special characters in search input
const escapeRegex = (value) => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Convert comma-separated query values into arrays
const parseList = (value) => {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};
// Create a new recipe
export const createRecipe = async (req, res) => {
  try {
    const {
      title,
      description,
      cuisine,
      ingredients,
      instructions,
      preparationTime,
      cookingTime,
      difficulty,
      servings,
      tags,
      recommendedMealType,
      nutritionalInfo,
    } = req.body;

    const recipe = await Recipe.create({
      title,
      description,
      cuisine,
      ingredients,
      instructions,
      preparationTime,
      cookingTime,
      difficulty,
      servings,
      tags,
      recommendedMealType,
      nutritionalInfo,
      author: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: 'Recipe created successfully',
      recipe,
    });
  } catch (error) {
    console.error('Create recipe error:', error);

    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};


// Get all recipes with advanced search and filters
export const getAllRecipes = async (req, res) => {
  try {
    const {
      search,
      includeIngredients,
      excludeIngredients,
      maxCookingTime,
      tags,
      difficulty,
      cuisine,
    } = req.query;

    const filter = {};

    // Filter by regional cuisine
    if (cuisine) {
      const validCuisines = [
        'Bengali',
        'South Indian',
        'Punjabi',
        'Gujarati',
        'Other Indian',
        'International',
      ];

      if (!validCuisines.includes(cuisine)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid cuisine selected',
        });
      }

      filter.cuisine = cuisine;
    }

    // Search by recipe title or description
    if (search && search.trim()) {
      const searchRegex = new RegExp(
        escapeRegex(search.trim()),
        'i'
      );

      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
      ];
    }

    // Include recipes containing ALL specified ingredients
    const included = parseList(includeIngredients);

    if (included.length > 0) {
      filter['ingredients.name'] = {
        $all: included.map(
          (ingredient) => new RegExp(
            `^${escapeRegex(ingredient)}$`,
            'i'
          )
        ),
      };
    }

    // Exclude recipes containing ANY specified ingredient
    const excluded = parseList(excludeIngredients);

    if (excluded.length > 0) {
      filter['ingredients.name'] = {
        ...(filter['ingredients.name'] || {}),
        $not: {
          $in: excluded.map(
            (ingredient) => new RegExp(
              `^${escapeRegex(ingredient)}$`,
              'i'
            )
          ),
        },
      };
    }

    // Filter by maximum total preparation + cooking time
    if (
      maxCookingTime !== undefined &&
      maxCookingTime !== ''
    ) {
      const maximumTime = Number(maxCookingTime);

      if (!Number.isFinite(maximumTime) || maximumTime < 0) {
        return res.status(400).json({
          success: false,
          message: 'Maximum cooking time must be a valid non-negative number',
        });
      }

      filter.$expr = {
        $lte: [
          {
            $add: [
              { $ifNull: ['$preparationTime', 0] },
              { $ifNull: ['$cookingTime', 0] },
            ],
          },
          maximumTime,
        ],
      };
    }

    // Filter by tags
    const selectedTags = parseList(tags);

    if (selectedTags.length > 0) {
      filter.tags = {
        $in: selectedTags.map(
          (tag) => new RegExp(`^${escapeRegex(tag)}$`, 'i')
        ),
      };
    }

    // Filter by difficulty
    if (difficulty) {
      const validDifficulties = ['Easy', 'Medium', 'Hard'];

      if (!validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          message: 'Difficulty must be Easy, Medium, or Hard',
        });
      }

      filter.difficulty = difficulty;
    }

    const recipes = await Recipe.find(filter)
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: recipes.length,
      recipes,
    });
  } catch (error) {
    console.error('Get recipes error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch recipes',
    });
  }
};


// Get a single recipe
export const getRecipeById = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id)
      .populate('author', 'name profileImage');

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    res.status(200).json({
      success: true,
      recipe,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Invalid recipe ID',
    });
  }
};

// Update a recipe
export const updateRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to update this recipe',
      });
    }

    const allowedFields = [
      'title',
      'description',
      'cuisine',
      'ingredients',
      'instructions',
      'preparationTime',
      'cookingTime',
      'difficulty',
      'servings',
      'tags',
      'recommendedMealType',
      'nutritionalInfo',
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        recipe.set(field, req.body[field]);
      }
    });

    await recipe.save();

    res.status(200).json({
      success: true,
      message: 'Recipe updated successfully',
      recipe,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

// Delete a recipe and clean up related data
export const deleteRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found',
      });
    }

    // Check recipe ownership
    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not allowed to delete this recipe',
      });
    }

    // Remove recipe references from cookbooks, meal plans and comments
    await Promise.all([
      Cookbook.updateMany(
        { recipes: recipe._id },
        { $pull: { recipes: recipe._id } }
      ),

      MealPlan.deleteMany({
        recipe: recipe._id,
      }),

      Comment.deleteMany({
        recipe: recipe._id,
      }),
    ]);

    // Delete the associated Cloudinary image, if one exists
    if (recipe.image?.publicId) {
      await cloudinary.uploader.destroy(recipe.image.publicId);
    }

    // Delete the recipe document
    await recipe.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Recipe and related data deleted successfully',
    });

  } catch (error) {
    console.error('Delete recipe error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to delete recipe and related data',
    });
  }
};
