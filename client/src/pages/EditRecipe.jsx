
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Plus, Trash2, Upload, ChefHat } from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const EditRecipe = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token, user } = useAuth();

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
    const [nutrition, setNutrition] = useState({
        calories: '',
        protein: '',
        carbohydrates: '',
        fat: '',
    });

    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [existingImage, setExistingImage] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const response = await API.get(`/recipes/${id}`);
                const recipe = response.data.recipe;

                const authorId =
                    typeof recipe.author === 'object'
                        ? recipe.author?._id
                        : recipe.author;

                if (authorId?.toString() !== user?._id?.toString()) {
                    setError('You are not allowed to edit this recipe.');
                    return;
                }

                setFormData({
                    title: recipe.title || '',
                    description: recipe.description || '',
                    cuisine: recipe.cuisine || 'Other Indian',
                    preparationTime: recipe.preparationTime ?? '',
                    cookingTime: recipe.cookingTime ?? '',
                    difficulty: recipe.difficulty || 'Easy',
                    recommendedMealType: recipe.recommendedMealType || 'Dinner',
                    servings: recipe.servings ?? '',
                    tags: (recipe.tags || []).join(', '),
                });

                setIngredients(
                    recipe.ingredients?.length
                        ? recipe.ingredients.map((item) => ({
                            name: item.name || '',
                            quantity: item.quantity ?? '',
                            unit: item.unit || '',
                        }))
                        : [{ name: '', quantity: '', unit: '' }]
                );

                setInstructions(
                    recipe.instructions?.length
                        ? [...recipe.instructions]
                        : ['']
                );

                const info = recipe.nutritionalInfo || {};
                setNutrition({
                    calories: info.calories ?? '',
                    protein: info.protein ?? '',
                    carbohydrates: info.carbohydrates ?? '',
                    fat: info.fat ?? '',
                });

                setExistingImage(recipe.image?.url || '');
            } catch (err) {
                setError(
                    err.response?.data?.message ||
                    'Unable to load recipe details.'
                );
            } finally {
                setLoading(false);
            }
        };

        if (user?._id) fetchRecipe();
    }, [id, user?._id]);

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
        onDrop: (files) => {
            if (files.length > 0) {
                setImage(files[0]);
                setError('');
            }
        },
        onDropRejected: () => {
            setError('Please select a JPG, PNG, or WEBP image under 5 MB.');
        },
    });

    const handleChange = (event) => {
        setFormData((previous) => ({
            ...previous,
            [event.target.name]: event.target.value,
        }));
    };

    const updateIngredient = (index, field, value) => {
        setIngredients((previous) =>
            previous.map((item, i) =>
                i === index ? { ...item, [field]: value } : item
            )
        );
    };

    const addIngredient = () => {
        setIngredients((previous) => [
            ...previous,
            { name: '', quantity: '', unit: '' },
        ]);
    };

    const removeIngredient = (index) => {
        setIngredients((previous) =>
            previous.filter((_, i) => i !== index)
        );
    };

    const updateInstruction = (index, value) => {
        setInstructions((previous) =>
            previous.map((step, i) => i === index ? value : step)
        );
    };

    const addInstruction = () => {
        setInstructions((previous) => [...previous, '']);
    };

    const removeInstruction = (index) => {
        setInstructions((previous) =>
            previous.filter((_, i) => i !== index)
        );
    };

    const handleNutritionChange = (event) => {
        setNutrition((previous) => ({
            ...previous,
            [event.target.name]: event.target.value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        setError('');

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

            await API.put(`/recipes/${id}`, recipeData, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (image) {
                const imageData = new FormData();
                imageData.append('image', image);

                await API.post(`/uploads/${id}`, imageData, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
            }

            navigate(`/recipes/${id}`);
        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to update recipe. Please try again.'
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <p className="recipes-status">Loading recipe...</p>;
    }

    if (error && !formData.title) {
        return <p className="recipes-status recipes-error">{error}</p>;
    }

    return (
        <main className="create-recipe-page">
            <h1>
                <ChefHat size={28} />
                Edit Your Recipe
            </h1>

            <p>Update your recipe details and save your changes.</p>

            {error && <p className="auth-error">{error}</p>}

            <form onSubmit={handleSubmit}>
                <h2>Basic Information</h2>

                <label>Recipe Title</label>
                <input
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    maxLength={100}
                    required
                />

                <label>Description</label>
                <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
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

                {imagePreview || existingImage ? (
                    <div className="image-preview">
                        <img
                            src={imagePreview || existingImage}
                            alt="Recipe preview"
                        />
                        <p>{image ? image.name : 'Current recipe image'}</p>
                    </div>
                ) : null}

                <div
                    {...getRootProps()}
                    className={`image-dropzone ${isDragActive ? 'drag-active' : ''}`}
                >
                    <input {...getInputProps()} />
                    <Upload size={35} />
                    <p>
                        {isDragActive
                            ? 'Drop your new image here...'
                            : 'Drag and drop a replacement image here'}
                    </p>
                    <small>JPG, PNG or WEBP · Maximum 5 MB</small>
                </div>

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

                <button type="submit" disabled={saving}>
                    {saving ? 'Saving Changes...' : 'Update Recipe'}
                </button>

                <button
                    type="button"
                    onClick={() => navigate(`/recipes/${id}`)}
                >
                    Cancel
                </button>
            </form>
        </main>
    );
};

export default EditRecipe;
