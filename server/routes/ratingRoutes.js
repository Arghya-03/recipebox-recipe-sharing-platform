
import express from 'express';

import { rateRecipe } from '../controllers/ratingController.js';
import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Submit or update a recipe rating
router.post('/:id', protect, rateRecipe);

export default router;
