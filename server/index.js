
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import recipeRoutes from './routes/recipeRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';
import socialRoutes from './routes/socialRoutes.js';
import commentRoutes from './routes/commentRoutes.js';
import ratingRoutes from './routes/ratingRoutes.js';
import cookbookRoutes from './routes/cookbookRoutes.js';
import mealPlanRoutes from './routes/mealPlanRoutes.js';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Authentication routes
app.use('/api/auth', authRoutes);

// Recipe routes
app.use('/api/recipes', recipeRoutes);
    
// Upload routes
app.use('/api/uploads', uploadRoutes);

// Social routes
app.use('/api/social', socialRoutes);

// Comment routes
app.use('/api/comments', commentRoutes);

// Rating routes
app.use('/api/ratings', ratingRoutes);

// Cookbook routes
app.use('/api/cookbooks', cookbookRoutes);

app.use('/api/meal-plans', mealPlanRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to RecipeBox API!',
  });
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'RecipeBox server is running successfully!',
  });
});

// Server configuration
const PORT = process.env.PORT || 5000;

// Connect database and start server
const startServer = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`RecipeBox server running on port ${PORT}`);
  });
};

startServer();
