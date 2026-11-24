
import mongoose from 'mongoose';
import Cookbook from '../models/Cookbook.js';
import Recipe from '../models/Recipe.js';

// Create a new cookbook
export const createCookbook = async (req, res) => {
    try {
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'Cookbook name is required.',
            });
        }

        const cookbook = await Cookbook.create({
            name: name.trim(),
            description: description || '',
            owner: req.user._id,
        });

        res.status(201).json({
            success: true,
            message: 'Cookbook created successfully.',
            cookbook,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A cookbook with this name already exists.',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Unable to create cookbook.',
        });
    }
};

// Get all cookbooks belonging to the logged-in user
export const getMyCookbooks = async (req, res) => {
    try {
        const cookbooks = await Cookbook.find({
            owner: req.user._id,
        })
            .populate('recipes', 'title image averageRating')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: cookbooks.length,
            cookbooks,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to fetch cookbooks.',
        });
    }
};

// Get one cookbook
export const getCookbookById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cookbook ID.',
            });
        }

        const cookbook = await Cookbook.findOne({
            _id: id,
            owner: req.user._id,
        }).populate({
            path: 'recipes',
            select: 'title description image averageRating author tags preparationTime cookingTime difficulty',
            populate: {
                path: 'author',
                select: 'name profileImage',
            },
        });

        if (!cookbook) {
            return res.status(404).json({
                success: false,
                message: 'Cookbook not found.',
            });
        }

        res.status(200).json({
            success: true,
            cookbook,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to fetch cookbook.',
        });
    }
};

// Update cookbook details
export const updateCookbook = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cookbook ID.',
            });
        }

        const cookbook = await Cookbook.findOne({
            _id: id,
            owner: req.user._id,
        });

        if (!cookbook) {
            return res.status(404).json({
                success: false,
                message: 'Cookbook not found.',
            });
        }

        if (name !== undefined) {
            if (!name.trim()) {
                return res.status(400).json({
                    success: false,
                    message: 'Cookbook name cannot be empty.',
                });
            }
            cookbook.name = name.trim();
        }

        if (description !== undefined) {
            cookbook.description = description;
        }

        await cookbook.save();

        res.status(200).json({
            success: true,
            message: 'Cookbook updated successfully.',
            cookbook,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'A cookbook with this name already exists.',
            });
        }

        res.status(500).json({
            success: false,
            message: 'Unable to update cookbook.',
        });
    }
};

// Delete a cookbook
export const deleteCookbook = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cookbook ID.',
            });
        }

        const cookbook = await Cookbook.findOneAndDelete({
            _id: id,
            owner: req.user._id,
        });

        if (!cookbook) {
            return res.status(404).json({
                success: false,
                message: 'Cookbook not found.',
            });
        }

        res.status(200).json({
            success: true,
            message: 'Cookbook deleted successfully.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to delete cookbook.',
        });
    }
};

// Add a recipe to a cookbook
export const addRecipeToCookbook = async (req, res) => {
    try {
        const { id, recipeId } = req.params;

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(recipeId)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cookbook or recipe ID.',
            });
        }

        const cookbook = await Cookbook.findOne({
            _id: id,
            owner: req.user._id,
        });

        if (!cookbook) {
            return res.status(404).json({
                success: false,
                message: 'Cookbook not found.',
            });
        }

        const recipeExists = await Recipe.exists({ _id: recipeId });

        if (!recipeExists) {
            return res.status(404).json({
                success: false,
                message: 'Recipe not found.',
            });
        }

        if (cookbook.recipes.some(
            (recipe) => recipe.toString() === recipeId
        )) {
            return res.status(400).json({
                success: false,
                message: 'Recipe is already in this cookbook.',
            });
        }

        cookbook.recipes.push(recipeId);
        await cookbook.save();

        res.status(200).json({
            success: true,
            message: 'Recipe added to cookbook successfully.',
            cookbook,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to add recipe to cookbook.',
        });
    }
};

// Remove a recipe from a cookbook
export const removeRecipeFromCookbook = async (req, res) => {
    try {
        const { id, recipeId } = req.params;

        if (
            !mongoose.isValidObjectId(id) ||
            !mongoose.isValidObjectId(recipeId)
        ) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cookbook or recipe ID.',
            });
        }

        const cookbook = await Cookbook.findOne({
            _id: id,
            owner: req.user._id,
        });

        if (!cookbook) {
            return res.status(404).json({
                success: false,
                message: 'Cookbook not found.',
            });
        }

        cookbook.recipes = cookbook.recipes.filter(
            (recipe) => recipe.toString() !== recipeId
        );

        await cookbook.save();

        res.status(200).json({
            success: true,
            message: 'Recipe removed from cookbook successfully.',
            cookbook,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Unable to remove recipe from cookbook.',
        });
    }
};
