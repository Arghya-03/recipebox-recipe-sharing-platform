
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe.js';

dotenv.config();

// Recipes with clear regional classifications.
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

// Bengali dishes whose titles do not explicitly start with Bengali.
const bengaliSpecific = new Set([
  'Bengali Luchi with Aloo Dum',
  'Radhaballabhi with Cholar Dal',
  'Kolkata-Style Mutton Biryani',
  'Mustard Fish Curry (Shorshe Maach)',
  'Kolkata Chicken Egg Roll',
  'Kolkata Jhal Muri',
  'Koraishutir Kochuri',
]);

// Clearly identifiable international dishes.
const international = new Set([
  'Creamy White Sauce Pasta',
  'Italian Spaghetti Bolognese',
  'Italian Vegetable Lasagna',
  'Creamy Mushroom Pasta',
  'Italian Garlic Bread',
  'Tomato Bruschetta',
  'Grilled Chicken Steak',
  'Fish and Chips',
  'Baked Macaroni and Cheese',
  'French Toast',
  'Chicken Fried Rice',
  'Vegetable Hakka Noodles',
  'Chilli Chicken',
  'Vegetable Manchurian',
  'Chicken Momos',
  'Classic Cold Coffee',
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

const previewCuisineMigration = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing from .env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected successfully.\n');

    const recipes = await Recipe.find({})
      .select('_id title cuisine')
      .sort({ title: 1 })
      .lean();

    const counts = {};
    const preview = [];

    for (const recipe of recipes) {
      const proposedCuisine = classifyCuisine(recipe.title);

      counts[proposedCuisine] =
        (counts[proposedCuisine] || 0) + 1;

      preview.push({
        title: recipe.title,
        currentCuisine: recipe.cuisine ?? 'Missing',
        proposedCuisine,
      });
    }

    console.log('========== CUISINE MIGRATION PREVIEW ==========\n');

    preview.forEach((recipe) => {
      console.log(`${recipe.title}`);
      console.log(`  Current: ${recipe.currentCuisine}`);
      console.log(`  Proposed: ${recipe.proposedCuisine}\n`);
    });

    console.log('========== PROPOSED CUISINE COUNTS ==========');

    Object.entries(counts)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([cuisine, count]) => {
        console.log(`${cuisine}: ${count}`);
      });

    console.log(`\nTotal recipes checked: ${recipes.length}`);
    console.log('\nPREVIEW ONLY — No database records were modified.');
  } catch (error) {
    console.error('Preview failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed.');
  }
};

previewCuisineMigration();
