
import express from 'express';

import {
  registerUser,
  loginUser,
  getMyProfile,
  updateMyProfile,
} from '../controllers/authController.js';

import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);

// Protected route
router.get('/me', protect, getMyProfile);
router.put('/me', protect, updateMyProfile);

export default router;
