
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe.js';

dotenv.config();

const checkCuisineCounts = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.\n');

    const results = await Recipe.aggregate([
      {
        $group: {
          _id: '$cuisine',
          count: { $sum: 1 },
          recipes: { $push: '$title' },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    console.log('========== CUISINE DISTRIBUTION ==========');

    results.forEach((item) => {
      console.log(`\nCuisine: ${item._id}`);
      console.log(`Count: ${item.count}`);
      item.recipes.forEach((title) => console.log(`- ${title}`));
    });

    console.log('\n==========================================');
    console.log(
      'Total recipes:',
      await Recipe.countDocuments()
    );
  } catch (error) {
    console.error('Check failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('\nMongoDB connection closed.');
  }
};

checkCuisineCounts();
