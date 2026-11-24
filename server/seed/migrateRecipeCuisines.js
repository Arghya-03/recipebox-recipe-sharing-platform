
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe.js';

dotenv.config();

const southIndian = new Set([
  'Soft Idli with Sambar',
  'Crispy Masala Dosa',
  'Vegetable Upma',
  'South Indian Lemon Rice',
  'South Indian Filter Coffee',
]);

const punjabi = new Set([
  'Punjabi Chole Rice',
]);

const gujarati = new Set([
  'Gujarati Khaman Dhokla',
]);

const bengaliSpecific = new Set([
  'Bengali Luchi with Aloo Dum',
  'Radhaballabhi with Cholar Dal',
  'Kolkata-Style Mutton Biryani',
  'Mustard Fish Curry (Shorshe Maach)',
  'Kolkata Chicken Egg Roll',
  'Kolkata Jhal Muri',
  'Koraishutir Kochuri',
  'Chicken Kathi Roll',
]);

const international = new Set([
  'Baked Macaroni and Cheese',
  'Chicken Fried Rice',
  'Chicken Momos',
  'Chilli Chicken',
  'Creamy Mushroom Pasta',
  'Creamy White Sauce Pasta',
  'Fish and Chips',
  'French Toast',
  'Grilled Chicken Steak',
  'Italian Garlic Bread',
  'Italian Spaghetti Bolognese',
  'Italian Vegetable Lasagna',
  'Tomato Bruschetta',
  'Vegetable Hakka Noodles',
  'Vegetable Manchurian',
]);

const classifyCuisine = (title) => {
  if (/^Bengali\b/i.test(title) || bengaliSpecific.has(title)) {
    return 'Bengali';
  }

  if (southIndian.has(title)) return 'South Indian';
  if (punjabi.has(title)) return 'Punjabi';
  if (gujarati.has(title)) return 'Gujarati';
  if (international.has(title)) return 'International';

  return 'Other Indian';
};

const migrateRecipeCuisines = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.\n');

    // Only recipes without a cuisine value will be updated.
    const recipes = await Recipe.find({
      cuisine: null,
    }).select('_id title cuisine');

    console.log(`Recipes requiring classification: ${recipes.length}\n`);

    if (recipes.length === 0) {
      console.log('No recipes need migration.');
      return;
    }

    const operations = recipes.map((recipe) => {
      const cuisine = classifyCuisine(recipe.title);

      console.log(`${recipe.title} → ${cuisine}`);

      return {
        updateOne: {
          filter: {
            _id: recipe._id,
            cuisine: null,
          },
          update: {
            $set: { cuisine },
          },
        },
      };
    });

    const result = await Recipe.bulkWrite(operations);

    console.log('\n========== MIGRATION SUMMARY ==========');
    console.log(`Recipes checked: ${recipes.length}`);
    console.log(`Recipes updated: ${result.modifiedCount}`);
    console.log('=======================================\n');

    // Verify the final cuisine distribution.
    const distribution = await Recipe.aggregate([
      {
        $group: {
          _id: '$cuisine',
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log('========== FINAL CUISINE COUNTS ==========');

    distribution.forEach((item) => {
      console.log(`${item._id}: ${item.count}`);
    });

    console.log(
      '\nTotal recipes:',
      await Recipe.countDocuments()
    );
  } catch (error) {
    console.error('\nCuisine migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed.');
  }
};

migrateRecipeCuisines();
