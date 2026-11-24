
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, ChefHat } from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const CreateRecipe = () => {
    const navigate = useNavigate();
    const { token } = useAuth();

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        cuisine: 'Other Indian',
        preparationTime: '',
        cookingTime: '',
        difficulty: 'Easy',
        recommendedMealType: 'Dinner',
        servings: '',
        tags: '',
    });

    const [ingredients, setIngredients] = useState([
        { name: '', quantity: '', unit: '' },
    ]);

    const [instructions, setInstructions] = useState(['']);

    const [image, setImage] = useState(null);

    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (!image) {
            setImagePreview('');
            return;
        }

        const previewUrl = URL.createObjectURL(image);
        setImagePreview(previewUrl);

        return () => URL.revokeObjectURL(previewUrl);
    }, [image]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        accept: {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'image/webp': ['.webp'],
        },
        maxSize: 5 * 1024 * 1024,
        multiple: false,
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                setImage(acceptedFiles[0]);
                setError('');
            }
        },
        onDropRejected: () => {
            setError('Please select a JPG, PNG, or WEBP image under 5 MB.');
        },
    });

    const [nutrition, setNutrition] = useState({
        calories: '',
        protein: '',
        carbohydrates: '',
        fat: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    // Ingredient management
    const addIngredient = () => {
        setIngredients([
            ...ingredients,
            { name: '', quantity: '', unit: '' },
        ]);
    };

    const removeIngredient = (index) => {
        setIngredients(
            ingredients.filter((_, i) => i !== index)
        );
    };

    const updateIngredient = (index, field, value) => {
        const updated = [...ingredients];
        updated[index][field] = value;
        setIngredients(updated);
    };

    // Instruction management
    const addInstruction = () => {
        setInstructions([...instructions, '']);
    };

    const removeInstruction = (index) => {
        setInstructions(
            instructions.filter((_, i) => i !== index)
        );
    };

    const updateInstruction = (index, value) => {
        const updated = [...instructions];
        updated[index] = value;
        setInstructions(updated);
    };

    // Nutrition management
    const handleNutritionChange = (e) => {
        setNutrition({
            ...nutrition,
            [e.target.name]: e.target.value,
        });
    };

    // Submit recipe
    const handleSubmit = async (e) => {
        e.preventDefault();

        setError('');
        setLoading(true);

        try {
            const recipeData = {
                ...formData,
                preparationTime: Number(formData.preparationTime),
                cookingTime: Number(formData.cookingTime),
                servings: Number(formData.servings),

                ingredients: ingredients.map((item) => ({
                    name: item.name.trim(),
                    quantity: Number(item.quantity),
                    unit: item.unit.trim(),
                })),

                instructions: instructions.map((step) => step.trim()),

                tags: formData.tags
                    .split(',')
                    .map((tag) => tag.trim().toLowerCase())
                    .filter(Boolean),

                nutritionalInfo: Object.values(nutrition).some(
                    (value) => value !== ''
                )
                    ? {
                        calories: Number(nutrition.calories) || 0,
                        protein: Number(nutrition.protein) || 0,
                        carbohydrates: Number(nutrition.carbohydrates) || 0,
                        fat: Number(nutrition.fat) || 0,
                    }
                    : undefined,
            };

            const response = await API.post('/recipes', recipeData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const recipeId = response.data.recipe._id;

            // Upload image after creating the recipe
            if (image) {
                const imageData = new FormData();
                imageData.append('image', image);

                await API.post(`/uploads/${recipeId}`, imageData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            navigate(`/recipes/${recipeId}`);
        } catch (error) {
            console.error('Recipe creation error:', error);

            setError(
                error.response?.data?.message ||
                'Unable to create recipe. Please try again.'
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="create-recipe-page">
            <h1>
                <ChefHat size={28} />
                Share Your Recipe
            </h1>

            <p>Share your favorite dishes with the RecipeBox community.</p>

            {error && <p className="auth-error">{error}</p>}

            <form onSubmit={handleSubmit}>

                <h2>Basic Information</h2>

                <label>Recipe Title</label>
                <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter recipe name"
                    maxLength={100}
                    required
                />

                <label>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe your recipe..."
                    maxLength={1000}
                    required
                />

                <label>Recipe Cuisine</label>

                <select
                    name="cuisine"
                    value={formData.cuisine}
                    onChange={handleChange}
                    required
                >
                    <option value="Bengali">Bengali</option>
                    <option value="South Indian">South Indian</option>
                    <option value="Punjabi">Punjabi</option>
                    <option value="Gujarati">Gujarati</option>
                    <option value="Other Indian">Other Indian</option>
                </select>

                <h2>Recipe Image</h2>

                <div
                    {...getRootProps()}
                    className={`image-dropzone ${isDragActive ? 'drag-active' : ''}`}
                >
                    <input {...getInputProps()} />

                    <Upload size={35} />

                    {isDragActive ? (
                        <p>Drop your recipe image here...</p>
                    ) : (
                        <>
                            <p>Drag and drop your recipe image here</p>
                            <span>or click to browse files</span>
                            <small>JPG, PNG or WEBP · Maximum 5 MB</small>
                        </>
                    )}
                </div>

                {imagePreview && (
                    <div className="image-preview">
                        <img src={imagePreview} alt="Recipe preview" />

                        <p>Selected: {image.name}</p>

                        <button
                            type="button"
                            onClick={() => setImage(null)}
                        >
                            Remove Image
                        </button>
                    </div>
                )}

                <h2>Ingredients</h2>

                {ingredients.map((ingredient, index) => (
                    <div key={index} className="ingredient-row">

                        <input
                            placeholder="Ingredient name"
                            value={ingredient.name}
                            onChange={(e) =>
                                updateIngredient(index, 'name', e.target.value)
                            }
                            required
                        />

                        <input
                            type="number"
                            placeholder="Quantity"
                            min="0"
                            step="any"
                            value={ingredient.quantity}
                            onChange={(e) =>
                                updateIngredient(index, 'quantity', e.target.value)
                            }
                            required
                        />

                        <input
                            placeholder="Unit"
                            value={ingredient.unit}
                            onChange={(e) =>
                                updateIngredient(index, 'unit', e.target.value)
                            }
                            required
                        />

                        <button
                            type="button"
                            onClick={() => removeIngredient(index)}
                            disabled={ingredients.length === 1}
                            aria-label="Remove ingredient"
                        >
                            <Trash2 size={18} />
                        </button>

                    </div>
                ))}

                <button type="button" onClick={addIngredient}>
                    <Plus size={18} /> Add Ingredient
                </button>

                <h2>Cooking Instructions</h2>

                {instructions.map((instruction, index) => (
                    <div key={index} className="instruction-row">

                        <textarea
                            placeholder={`Step ${index + 1}`}
                            value={instruction}
                            onChange={(e) =>
                                updateInstruction(index, e.target.value)
                            }
                            required
                        />

                        <button
                            type="button"
                            onClick={() => removeInstruction(index)}
                            disabled={instructions.length === 1}
                            aria-label="Remove instruction"
                        >
                            <Trash2 size={18} />
                        </button>

                    </div>
                ))}

                <button type="button" onClick={addInstruction}>
                    <Plus size={18} /> Add Instruction
                </button>

                <h2>Cooking Details</h2>

                <label>Preparation Time (minutes)</label>
                <input
                    type="number"
                    name="preparationTime"
                    min="0"
                    value={formData.preparationTime}
                    onChange={handleChange}
                    required
                />

                <label>Cooking Time (minutes)</label>
                <input
                    type="number"
                    name="cookingTime"
                    min="0"
                    value={formData.cookingTime}
                    onChange={handleChange}
                    required
                />

                <label>Difficulty</label>
                <select
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleChange}
                >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                </select>
                <label>Recommended Meal Category</label>

                <select
                    name="recommendedMealType"
                    value={formData.recommendedMealType}
                    onChange={handleChange}
                    required
                >
                    <option value="Breakfast">Breakfast</option>
                    <option value="Lunch">Lunch</option>
                    <option value="Dinner">Dinner</option>
                    <option value="Snack">Snack</option>
                    <option value="Beverage">Beverage</option>
                </select>

                <label>Servings</label>
                <input
                    type="number"
                    name="servings"
                    min="1"
                    value={formData.servings}
                    onChange={handleChange}
                    required
                />

                <h2>Recipe Tags</h2>

                <input
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="Indian, vegetarian, breakfast"
                />

                <h2>Nutrition Information (Optional)</h2>

                {[
                    ['calories', 'Calories'],
                    ['protein', 'Protein (g)'],
                    ['carbohydrates', 'Carbohydrates (g)'],
                    ['fat', 'Fat (g)'],
                ].map(([name, label]) => (
                    <div key={name}>
                        <label>{label}</label>
                        <input
                            type="number"
                            name={name}
                            min="0"
                            step="any"
                            value={nutrition[name]}
                            onChange={handleNutritionChange}
                        />
                    </div>
                ))}

                <button type="submit" disabled={loading}>
                    {loading ? 'Publishing Recipe...' : 'Publish Recipe'}
                </button>

            </form>
        </main>
    );
};

export default CreateRecipe;
