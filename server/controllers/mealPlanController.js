
import mongoose from 'mongoose';
import MealPlan from '../models/MealPlan.js';
import Recipe from '../models/Recipe.js';

const validMealTypes = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

// Create a meal plan
export const createMealPlan = async (req, res) => {
    try {
        const { recipe, date, mealType } = req.body;

        if (!mongoose.Types.ObjectId.isValid(recipe)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid recipe ID.',
            });
        }

        if (!date || Number.isNaN(new Date(date).getTime())) {
            return res.status(400).json({
                success: false,
                message: 'A valid meal date is required.',
            });
        }

        if (!validMealTypes.includes(mealType)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid meal type.',
            });
        }

        const existingRecipe = await Recipe.findById(recipe);

        if (!existingRecipe) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found.',
            });
        }

        // Check whether this recipe is already scheduled
        // for the same user, date and meal type
        const normalizedDate = new Date(date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const existingMealPlan = await MealPlan.findOne({
            user: req.user._id,
            recipe,
            date: normalizedDate,
            mealType,
        });

        if (existingMealPlan) {
            return res.status(409).json({
                success: false,
                message: 'This recipe is already scheduled for this meal.',
            });
        }

        const mealPlan = await MealPlan.create({
            user: req.user._id,
            recipe,
            date: normalizedDate,
            mealType,
        });

        await mealPlan.populate('recipe', 'title image cookingTime preparationTime');

        res.status(201).json({
            success: true,
            message: 'Meal added to planner successfully.',
            mealPlan,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Get the logged-in user's meal plans
export const getMyMealPlans = async (req, res) => {
    try {
        const mealPlans = await MealPlan.find({
            user: req.user._id,
        })
            .populate('recipe', 'title image cookingTime preparationTime')
            .sort({ date: 1 });

        res.status(200).json({
            success: true,
            count: mealPlans.length,
            mealPlans,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Update a meal plan
export const updateMealPlan = async (req, res) => {
    try {
        const { date, mealType } = req.body;

        const mealPlan = await MealPlan.findOne({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                message: 'Meal plan not found.',
            });
        }

        if (date !== undefined) {
            if (Number.isNaN(new Date(date).getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid meal date.',
                });
            }

            mealPlan.date = new Date(date);
        }

        if (mealType !== undefined) {
            if (!validMealTypes.includes(mealType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid meal type.',
                });
            }

            mealPlan.mealType = mealType;
        }

        // Prevent duplicate recipe scheduling during updates
        const normalizedDate = new Date(mealPlan.date);
        normalizedDate.setUTCHours(0, 0, 0, 0);

        const duplicateMealPlan = await MealPlan.findOne({
            _id: { $ne: mealPlan._id },
            user: req.user._id,
            recipe: mealPlan.recipe,
            date: normalizedDate,
            mealType: mealPlan.mealType,
        });

        if (duplicateMealPlan) {
            return res.status(409).json({
                success: false,
                message: 'This recipe is already scheduled for this meal.',
            });
        }

        mealPlan.date = normalizedDate;

        await mealPlan.save();
        await mealPlan.populate('recipe', 'title image cookingTime preparationTime');

        res.status(200).json({
            success: true,
            message: 'Meal plan updated successfully.',
            mealPlan,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

// Delete a meal plan
export const deleteMealPlan = async (req, res) => {
    try {
        const mealPlan = await MealPlan.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id,
        });

        if (!mealPlan) {
            return res.status(404).json({
                success: false,
                message: 'Meal plan not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Meal removed from planner successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};
