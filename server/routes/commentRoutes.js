
import express from 'express';

import {
  addComment,
  getRecipeComments,
  deleteComment,
} from '../controllers/commentController.js';

import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Get comments for a recipe (public)
router.get('/:recipeId', getRecipeComments);

// Add a comment (authentication required)
router.post('/:recipeId', protect, addComment);

// Delete your own comment (authentication required)
router.delete('/:commentId', protect, deleteComment);

export default router;
