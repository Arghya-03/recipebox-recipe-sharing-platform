
import express from 'express';

import {
  createMealPlan,
  getMyMealPlans,
  updateMealPlan,
  deleteMealPlan,
} from '../controllers/mealPlanController.js';

import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// All meal planner routes require authentication
router.use(protect);

// Create a meal plan
router.post('/', createMealPlan);

// Get all meal plans for logged-in user
router.get('/', getMyMealPlans);

// Update a meal plan
router.put('/:id', updateMealPlan);

// Delete a meal plan
router.delete('/:id', deleteMealPlan);

export default router;
