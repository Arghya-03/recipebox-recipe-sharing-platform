
import express from 'express';

import protect from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';
import {
  uploadRecipeImage,
  uploadProfileImage,
} from '../controllers/uploadController.js';

const router = express.Router();

// Upload or replace a profile picture
router.post(
  '/profile',
  protect,
  upload.single('image'),
  uploadProfileImage
);

// Upload or replace a recipe image
router.post(
  '/:id',
  protect,
  upload.single('image'),
  uploadRecipeImage
);

export default router;
