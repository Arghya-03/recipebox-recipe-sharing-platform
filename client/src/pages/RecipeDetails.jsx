
import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
    Clock,
    ChefHat,
    Users,
    Star,
    BookOpen,
    MessageCircle,
    Send,
    Trash2,
    Bookmark,
    Pencil,
} from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';

const RecipeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token, isAuthenticated } = useAuth();

    const [recipe, setRecipe] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [selectedRating, setSelectedRating] = useState(0);
    const [userRating, setUserRating] = useState(0);
    const [ratingSubmitting, setRatingSubmitting] = useState(false);
    const [ratingMessage, setRatingMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [commentsLoading, setCommentsLoading] = useState(true);
    const [commentSubmitting, setCommentSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [commentError, setCommentError] = useState('');
    const [cookbooks, setCookbooks] = useState([]);
    const [selectedCookbook, setSelectedCookbook] = useState('');
    const [cookbookLoading, setCookbookLoading] = useState(false);
    const [cookbookSaving, setCookbookSaving] = useState(false);
    const [cookbookMessage, setCookbookMessage] = useState('');
    const [cookbookError, setCookbookError] = useState('');

    const fetchComments = async () => {
        try {
            setCommentsLoading(true);

            const response = await API.get(`/comments/${id}`);

            setComments(response.data.comments || []);
        } catch (error) {
            console.error('Comments fetching error:', error);
            setCommentError('Unable to load comments.');
        } finally {
            setCommentsLoading(false);
        }
    };


    const fetchCookbooks = async () => {
        try {
            setCookbookLoading(true);
            setCookbookError('');

            const response = await API.get('/cookbooks', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            setCookbooks(response.data.cookbooks || []);
        } catch (error) {
            console.error('Cookbook fetching error:', error);
            setCookbookError('Unable to load your cookbooks.');
        } finally {
            setCookbookLoading(false);
        }
    };


    useEffect(() => {
        const fetchRecipe = async () => {
            try {
                const response = await API.get(`/recipes/${id}`);
                setRecipe(response.data.recipe);
                const existingRating = response.data.recipe.ratings?.find(
                    (rating) => {
                        const ratingUserId =
                            typeof rating.user === 'object'
                                ? rating.user?._id
                                : rating.user;

                        return ratingUserId?.toString() === user?._id?.toString();
                    }
                );

                if (existingRating) {
                    setUserRating(existingRating.value);
                    setSelectedRating(existingRating.value);
                }
            } catch (error) {
                console.error('Recipe details error:', error);

                setError(
                    error.response?.data?.message ||
                    'Unable to load recipe details.'
                );
            } finally {
                setLoading(false);
            }
        };

        fetchRecipe();
    }, [id, user?._id]);

    useEffect(() => {
        fetchComments();
    }, [id]);

    useEffect(() => {
        if (isAuthenticated && token) {
            fetchCookbooks();
        } else {
            setCookbooks([]);
        }
    }, [isAuthenticated, token]);

    const handleRatingSubmit = async () => {
        if (!isAuthenticated) {
            setRatingMessage('Please log in to rate this recipe.');
            return;
        }

        if (selectedRating < 1 || selectedRating > 5) {
            setRatingMessage('Please select a rating between 1 and 5 stars.');
            return;
        }

        try {
            setRatingSubmitting(true);
            setRatingMessage('');

            const response = await API.post(
                `/ratings/${id}`,
                { value: selectedRating },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setUserRating(response.data.userRating);

            setRecipe((previous) => ({
                ...previous,
                averageRating: response.data.averageRating,
                ratingCount: response.data.ratingCount,
                ratings: [
                    ...(previous.ratings || []).filter((rating) => {
                        const ratingUserId =
                            typeof rating.user === 'object'
                                ? rating.user?._id
                                : rating.user;

                        return ratingUserId?.toString() !== user?._id?.toString();
                    }),
                    {
                        user: user._id,
                        value: response.data.userRating,
                    },
                ],
            }));

            setRatingMessage(response.data.message);
        } catch (error) {
            console.error('Rating submission error:', error);

            setRatingMessage(
                error.response?.data?.message ||
                'Unable to submit rating.'
            );
        } finally {
            setRatingSubmitting(false);
        }
    };


    const handleSaveToCookbook = async () => {
        if (!selectedCookbook) {
            setCookbookError('Please select a cookbook.');
            return;
        }

        try {
            setCookbookSaving(true);
            setCookbookError('');
            setCookbookMessage('');

            const response = await API.post(
                `/cookbooks/${selectedCookbook}/recipes/${id}`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setCookbookMessage(response.data.message);
            setSelectedCookbook('');
        } catch (error) {
            console.error('Save to cookbook error:', error);

            setCookbookError(
                error.response?.data?.message ||
                'Unable to save recipe to cookbook.'
            );
        } finally {
            setCookbookSaving(false);
        }
    };


    const handleAddComment = async (event) => {
        event.preventDefault();

        if (!newComment.trim()) {
            setCommentError('Please enter a comment.');
            return;
        }

        try {
            setCommentSubmitting(true);
            setCommentError('');

            await API.post(
                `/comments/${id}`,
                { text: newComment },
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            setNewComment('');
            await fetchComments();
        } catch (error) {
            console.error('Add comment error:', error);

            setCommentError(
                error.response?.data?.message ||
                'Unable to add comment.'
            );
        } finally {
            setCommentSubmitting(false);
        }
    };

    const handleDeleteComment = async (commentId) => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this comment?'
        );

        if (!confirmed) return;

        try {
            setCommentError('');

            await API.delete(`/comments/${commentId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            await fetchComments();
        } catch (error) {
            console.error('Delete comment error:', error);

            setCommentError(
                error.response?.data?.message ||
                'Unable to delete comment.'
            );
        }
    };

    const handleDeleteRecipe = async () => {
        const confirmed = window.confirm(
            'Are you sure you want to delete this recipe? This action cannot be undone.'
        );

        if (!confirmed) return;

        try {
            await API.delete(`/recipes/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            alert('Recipe deleted successfully.');
            navigate('/recipes');
        } catch (error) {
            console.error('Recipe deletion error:', error);

            alert(
                error.response?.data?.message ||
                'Unable to delete recipe. Please try again.'
            );
        }
    };

    if (loading) {
        return <p className="recipes-status">Loading recipe details...</p>;
    }

    if (error || !recipe) {
        return (
            <p className="recipes-status recipes-error">
                {error || 'Recipe not found.'}
            </p>
        );
    }

    return (
        <main className="recipe-details-page">

            <section className="recipe-details-header">
                <div>
                    <span className="recipes-subtitle">
                        <ChefHat size={18} />
                        RECIPE DETAILS
                    </span>

                    <h1>{recipe.title}</h1>

                    <p>{recipe.description}</p>


                    <span>
                        By{' '}
                        {recipe.author?._id ? (
                            <Link
                                to={`/profile/${recipe.author._id}`}
                                className="recipe-author-link"
                            >
                                {recipe.author.name}
                            </Link>
                        ) : (
                            recipe.author?.name || 'Unknown Chef'
                        )}
                    </span>
                    {isAuthenticated &&
                        user?._id?.toString() === recipe.author?._id?.toString() && (
                            <div className="recipe-owner-actions">
                                <button
                                    type="button"
                                    className="edit-recipe-button"
                                    onClick={() => navigate(`/recipes/${id}/edit`)}
                                >
                                    <Pencil size={17} />
                                    Edit Recipe
                                </button>

                                <button
                                    type="button"
                                    className="delete-recipe-button"
                                    onClick={handleDeleteRecipe}
                                >
                                    <Trash2 size={17} />
                                    Delete Recipe
                                </button>
                            </div>
                        )}

                </div>

                {recipe.image?.url && (
                    <img
                        src={recipe.image.url}
                        alt={recipe.title}
                        className="recipe-details-image"
                    />
                )}
            </section>

            <section className="recipe-details-info">
                <div>
                    <Clock size={20} />
                    <span>
                        <strong>
                            {recipe.preparationTime + recipe.cookingTime} min
                        </strong>
                        Total Time
                    </span>
                </div>

                <div>
                    <ChefHat size={20} />
                    <span>
                        <strong>{recipe.difficulty}</strong>
                        Difficulty
                    </span>
                </div>

                <div>
                    <Users size={20} />
                    <span>
                        <strong>{recipe.servings}</strong>
                        Servings
                    </span>
                </div>

                <div>
                    <Star size={20} />
                    <span>
                        <strong>{recipe.averageRating?.toFixed(1) || '0.0'}</strong>
                        Rating
                    </span>
                </div>
            </section>


            {/* Recipe Rating Section */}
            <section className="recipe-details-section recipe-rating-section">
                <h2>
                    <Star size={22} />
                    Rate This Recipe
                </h2>

                <p>
                    Average Rating: {recipe.averageRating?.toFixed(1) || '0.0'}
                    {' '}({recipe.ratingCount || 0} ratings)
                </p>

                {isAuthenticated ? (
                    <>
                        <p>
                            {userRating > 0
                                ? `Your current rating: ${userRating}/5`
                                : 'How would you rate this recipe?'}
                        </p>

                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    className={`rating-star ${star <= selectedRating ? 'active' : ''
                                        }`}
                                    onClick={() => setSelectedRating(star)}
                                    aria-label={`Rate ${star} out of 5 stars`}
                                >
                                    <Star
                                        size={30}
                                        fill={star <= selectedRating ? 'currentColor' : 'none'}
                                    />
                                </button>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={handleRatingSubmit}
                            disabled={ratingSubmitting || selectedRating === 0}
                        >
                            {ratingSubmitting
                                ? 'Submitting...'
                                : userRating > 0
                                    ? 'Update Rating'
                                    : 'Submit Rating'}
                        </button>

                        {ratingMessage && (
                            <p>{ratingMessage}</p>
                        )}
                    </>
                ) : (
                    <p>Please log in to rate this recipe.</p>
                )}
            </section>


            <section className="recipe-details-section">
                <h2>
                    <BookOpen size={22} />
                    Ingredients
                </h2>

                <ul>
                    {recipe.ingredients.map((ingredient, index) => (
                        <li key={index}>
                            {ingredient.name} — {ingredient.quantity} {ingredient.unit}
                        </li>
                    ))}
                </ul>
            </section>

            <section className="recipe-details-section">
                <h2>
                    <ChefHat size={22} />
                    Cooking Instructions
                </h2>

                <ol>
                    {recipe.instructions.map((instruction, index) => (
                        <li key={index}>
                            {instruction}
                        </li>
                    ))}
                </ol>
            </section>

            {recipe.tags?.length > 0 && (
                <section className="recipe-details-section">
                    <h2>Recipe Tags</h2>

                    <div className="recipe-card-tags">
                        {recipe.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                        ))}
                    </div>
                </section>
            )}


            {/* Save Recipe to Cookbook Section */}
            {isAuthenticated && (
                <section className="recipe-details-section cookbook-save-section">
                    <h2>
                        <Bookmark size={22} />
                        Save to My Cookbook
                    </h2>

                    {cookbookLoading ? (
                        <p>Loading your cookbooks...</p>
                    ) : cookbooks.length === 0 ? (
                        <div>
                            <p>You haven't created any cookbooks yet.</p>
                            <Link to="/my-cookbooks">
                                Create Your First Cookbook
                            </Link>
                        </div>
                    ) : (
                        <div className="cookbook-save-form">
                            <select
                                value={selectedCookbook}
                                onChange={(event) => {
                                    setSelectedCookbook(event.target.value);
                                    setCookbookError('');
                                    setCookbookMessage('');
                                }}
                            >
                                <option value="">Select a cookbook</option>

                                {cookbooks.map((cookbook) => (
                                    <option key={cookbook._id} value={cookbook._id}>
                                        {cookbook.name}
                                    </option>
                                ))}
                            </select>

                            <button
                                type="button"
                                onClick={handleSaveToCookbook}
                                disabled={cookbookSaving || !selectedCookbook}
                            >
                                <Bookmark size={17} />
                                {cookbookSaving ? 'Saving...' : 'Save Recipe'}
                            </button>
                        </div>
                    )}

                    {cookbookMessage && (
                        <p>{cookbookMessage}</p>
                    )}

                    {cookbookError && (
                        <p className="recipes-error">{cookbookError}</p>
                    )}
                </section>
            )}


            {/* Comments Section */}
            <section className="recipe-details-section recipe-comments-section">
                <h2>
                    <MessageCircle size={22} />
                    Comments ({comments.length})
                </h2>

                {isAuthenticated ? (
                    <form
                        className="comment-form"
                        onSubmit={handleAddComment}
                    >
                        <textarea
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            placeholder="Share your thoughts about this recipe..."
                            maxLength={1000}
                            rows={4}
                        />

                        <div className="comment-form-footer">
                            <small>{newComment.length}/1000 characters</small>

                            <button
                                type="submit"
                                disabled={commentSubmitting || !newComment.trim()}
                            >
                                <Send size={17} />
                                {commentSubmitting ? 'Posting...' : 'Post Comment'}
                            </button>
                        </div>
                    </form>
                ) : (
                    <p>Please log in to share your comments.</p>
                )}

                {commentError && (
                    <p className="recipes-error">{commentError}</p>
                )}

                <div className="comments-list">
                    {commentsLoading ? (
                        <p>Loading comments...</p>
                    ) : comments.length === 0 ? (
                        <p>No comments yet. Be the first to share your thoughts!</p>
                    ) : (
                        comments.map((comment) => (
                            <article className="comment-card" key={comment._id}>
                                <div className="comment-header">
                                    <div>
                                        <strong>
                                            {comment.author?.name || 'Unknown User'}
                                        </strong>

                                        <small>
                                            {new Date(comment.createdAt).toLocaleString()}
                                        </small>
                                    </div>

                                    {isAuthenticated &&
                                        user?._id === comment.author?._id && (
                                            <button
                                                type="button"
                                                className="comment-delete-button"
                                                onClick={() => handleDeleteComment(comment._id)}
                                                aria-label="Delete comment"
                                            >
                                                <Trash2 size={17} />
                                            </button>
                                        )}
                                </div>

                                <p>{comment.text}</p>
                            </article>
                        ))
                    )}
                </div>
            </section>

        </main>
    );
};

export default RecipeDetails;
