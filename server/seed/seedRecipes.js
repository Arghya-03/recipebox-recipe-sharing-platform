
import dotenv from 'dotenv';
import mongoose from 'mongoose';

import User from '../models/User.js';
import Recipe from '../models/Recipe.js';
import recipes from './recipeData.js';

dotenv.config();

const seedRecipes = async () => {
  try {
    console.log('\nConnecting to MongoDB Atlas...');

    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from your .env file.');
    }

    if (!process.env.SEED_USER_EMAIL) {
      throw new Error('SEED_USER_EMAIL is missing from your .env file.');
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log('MongoDB connected successfully.');

    // Find the account that will own the seeded recipes.
    const user = await User.findOne({
      email: process.env.SEED_USER_EMAIL.toLowerCase().trim(),
    });

    if (!user) {
      throw new Error(
        `No user found with email ${process.env.SEED_USER_EMAIL}.`
      );
    }

    console.log(`Seed owner: ${user.name} (${user.email})`);

    let insertedCount = 0;
    let skippedCount = 0;

    for (const recipeData of recipes) {
      // Avoid duplicate recipes for the same author.
      const existingRecipe = await Recipe.findOne({
        author: user._id,
        title: recipeData.title,
      });

      if (existingRecipe) {
        console.log(`Skipped existing recipe: ${recipeData.title}`);
        skippedCount++;
        continue;
      }

      // Convert compact ingredient arrays into Mongoose objects.
      const formattedIngredients = recipeData.ingredients.map(
        ([name, quantity, unit]) => ({
          name,
          quantity,
          unit,
        })
      );

      const newRecipe = await Recipe.create({
        title: recipeData.title,
        description: recipeData.description,
        author: user._id,
        ingredients: formattedIngredients,
        instructions: recipeData.instructions,
        preparationTime: recipeData.preparationTime,
        cookingTime: recipeData.cookingTime,
        difficulty: recipeData.difficulty,
        servings: recipeData.servings,
        tags: recipeData.tags,
        recommendedMealType: recipeData.recommendedMealType,
        cuisine: recipeData.cuisine || 'Other Indian',
      });

      console.log(`Added: ${newRecipe.title}`);
      insertedCount++;
    }

    // Count all recipes belonging to the selected account.
    const totalRecipes = await Recipe.countDocuments({
      author: user._id,
    });

    console.log('\n========== SEED SUMMARY ==========');
    console.log(`New recipes inserted: ${insertedCount}`);
    console.log(`Existing recipes skipped: ${skippedCount}`);
    console.log(`Total recipes owned by seed account: ${totalRecipes}`);
    console.log('==================================\n');

  } catch (error) {
    console.error('\nRecipe seeding failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB connection closed.');
  }
};

seedRecipes();
