
import express from 'express';

import {
  createCookbook,
  getMyCookbooks,
  getCookbookById,
  updateCookbook,
  deleteCookbook,
  addRecipeToCookbook,
  removeRecipeFromCookbook,
} from '../controllers/cookbookController.js';

import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All cookbook routes require authentication
router.use(protect);

// Create and view cookbooks
router.post('/', createCookbook);
router.get('/', getMyCookbooks);

// View, update and delete a specific cookbook
router.get('/:id', getCookbookById);
router.put('/:id', updateCookbook);
router.delete('/:id', deleteCookbook);

// Add or remove recipes
router.post('/:id/recipes/:recipeId', addRecipeToCookbook);
router.delete('/:id/recipes/:recipeId', removeRecipeFromCookbook);

export default router;
