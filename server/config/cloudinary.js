
import dotenv from 'dotenv';
import { v2 as cloudinary } from 'cloudinary';

// Load environment variables before configuring Cloudinary
dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

console.log('Cloudinary Configuration Check:', {
    cloudNamePresent: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
    apiKeyPresent: Boolean(process.env.CLOUDINARY_API_KEY),
    apiSecretPresent: Boolean(process.env.CLOUDINARY_API_SECRET),
});

cloudinary.api.ping()
    .then((result) => {
        console.log('Cloudinary Connected:', result.status);
    })
    .catch((error) => {
        console.error('Cloudinary Connection Failed:', error);
    });

export default cloudinary;
