
import express from 'express';

import {
  followUser,
  unfollowUser,
  getUserProfile,
  getFollowingFeed,
} from '../controllers/socialController.js';

import protect from '../middleware/authMiddleware.js';

const router = express.Router();

// Protected social routes
router.post('/follow/:userId', protect, followUser);
router.delete('/unfollow/:userId', protect, unfollowUser);
router.get('/profile/:userId', protect, getUserProfile);
router.get('/feed', protect, getFollowingFeed);

export default router;
