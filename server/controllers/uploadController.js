
import { Readable } from 'stream';
import cloudinary from '../config/cloudinary.js';
import Recipe from '../models/Recipe.js';
import User from '../models/User.js';

export const uploadRecipeImage = async (req, res) => {
  try {
    // Check whether an image was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select an image to upload.',
      });
    }

    // Find the recipe
    const recipe = await Recipe.findById(req.params.id);

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found.',
      });
    }

    // Only the recipe author can upload its image
    if (recipe.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to update this recipe image.',
      });
    }

    // Upload image buffer to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'recipebox/recipes',
          resource_type: 'image',
        },
        (error, uploadedImage) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadedImage);
          }
        }
      );

      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    // Delete the previous image if one exists
    if (recipe.image?.publicId) {
      await cloudinary.uploader.destroy(recipe.image.publicId);
    }

    // Save the new image details
    recipe.image = {
      url: result.secure_url,
      publicId: result.public_id,
    };

    await recipe.save();

    res.status(200).json({
      success: true,
      message: 'Recipe image uploaded successfully.',
      image: recipe.image,
    });
  } catch (error) {
    console.error('Recipe image upload error:', error);

    res.status(500).json({
      success: false,
      message: 'Unable to upload recipe image.',
    });
  }
};


// Upload or replace a user's profile picture
export const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please select a profile image to upload.',
      });
    }

    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found.',
      });
    }

    // Upload image to Cloudinary
    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'recipebox/profiles',
          resource_type: 'image',
        },
        (error, uploadedImage) => {
          if (error) {
            reject(error);
          } else {
            resolve(uploadedImage);
          }
        }
      );

      Readable.from(req.file.buffer).pipe(uploadStream);
    });

    // Save the new profile image URL
    user.profileImage = result.secure_url;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully.',
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
      },
    });
  } catch (error) {
    console.error('Profile image upload error:', error);

    return res.status(500).json({
      success: false,
      message: 'Unable to upload profile picture.',
    });
  }
};

