
import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Recipe from '../models/Recipe.js';

// Add a comment to a recipe
export const addComment = async (req, res) => {
  try {
    const { recipeId } = req.params;
    const { text } = req.body;

    if (!mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID.',
      });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot be empty.',
      });
    }

    if (text.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Comment cannot exceed 1000 characters.',
      });
    }

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.',
      });
    }

    const comment = await Comment.create({
      recipe: recipeId,
      author: req.user._id,
      text: text.trim(),
    });

    await comment.populate('author', 'name profileImage');

    res.status(201).json({
      success: true,
      message: 'Comment added successfully.',
      comment,
    });
  } catch (error) {
    console.error('Add comment error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to add comment.',
    });
  }
};

// Get all comments for a recipe
export const getRecipeComments = async (req, res) => {
  try {
    const { recipeId } = req.params;

    if (!mongoose.isValidObjectId(recipeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid recipe ID.',
      });
    }

    const recipe = await Recipe.findById(recipeId);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.',
      });
    }

    const comments = await Comment.find({ recipe: recipeId })
      .populate('author', 'name profileImage')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: comments.length,
      comments,
    });
  } catch (error) {
    console.error('Get comments error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to fetch comments.',
    });
  }
};

// Delete your own comment
export const deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    if (!mongoose.isValidObjectId(commentId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid comment ID.',
      });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: 'Comment not found.',
      });
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own comments.',
      });
    }

    await comment.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully.',
    });
  } catch (error) {
    console.error('Delete comment error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to delete comment.',
    });
  }
};
