
import mongoose from 'mongoose';
import User from '../models/User.js';
import Recipe from '../models/Recipe.js';

// Follow another user
export const followUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID.',
            });
        }

        if (req.user._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot follow yourself.',
            });
        }

        const targetUser = await User.findById(userId);

        if (!targetUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { following: userId },
        });

        await User.findByIdAndUpdate(userId, {
            $addToSet: { followers: req.user._id },
        });

        res.status(200).json({
            success: true,
            message: 'User followed successfully.',
        });
    } catch (error) {
        console.error('Follow user error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to follow user.',
        });
    }
};

// Unfollow a user
export const unfollowUser = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID.',
            });
        }

        if (req.user._id.toString() === userId) {
            return res.status(400).json({
                success: false,
                message: 'You cannot unfollow yourself.',
            });
        }

        await User.findByIdAndUpdate(req.user._id, {
            $pull: { following: userId },
        });

        await User.findByIdAndUpdate(userId, {
            $pull: { followers: req.user._id },
        });

        res.status(200).json({
            success: true,
            message: 'User unfollowed successfully.',
        });
    } catch (error) {
        console.error('Unfollow user error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to unfollow user.',
        });
    }
};


// Get another user's public profile
export const getUserProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID.',
            });
        }

        const user = await User.findById(userId)
            .select('name profileImage bio followers following createdAt')
            .populate('followers', 'name profileImage')
            .populate('following', 'name profileImage');

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found.',
            });
        }

        const recipes = await Recipe.find({ author: userId })
            .populate('author', 'name profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            user,
            recipes,
            recipeCount: recipes.length,
        });
    } catch (error) {
        console.error('Get user profile error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch user profile.',
        });
    }
};


// Get recipes from followed users
export const getFollowingFeed = async (req, res) => {
    try {
        const followingIds = req.user.following;

        const recipes = await Recipe.find({
            author: { $in: followingIds },
        })
            .populate('author', 'name profileImage')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: recipes.length,
            recipes,
        });
    } catch (error) {
        console.error('Following feed error:', error);

        res.status(500).json({
            success: false,
            message: 'Unable to fetch your feed.',
        });
    }
};
