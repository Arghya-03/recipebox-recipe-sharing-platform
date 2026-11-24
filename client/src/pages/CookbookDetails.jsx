
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { BookOpen, Trash2, ArrowLeft } from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';

const CookbookDetails = () => {
  const { id } = useParams();
  const { token } = useAuth();

  const [cookbook, setCookbook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCookbook = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await API.get(`/cookbooks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setCookbook(response.data.cookbook);
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Unable to load cookbook.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchCookbook();
  }, [id, token]);

  const handleRemoveRecipe = async (recipeId) => {
    const confirmed = window.confirm(
      'Remove this recipe from your cookbook?'
    );

    if (!confirmed) return;

    try {
      await API.delete(
        `/cookbooks/${id}/recipes/${recipeId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCookbook((previous) => ({
        ...previous,
        recipes: previous.recipes.filter(
          (recipe) => recipe._id !== recipeId
        ),
      }));
    } catch (error) {
      setError(
        error.response?.data?.message ||
        'Unable to remove recipe.'
      );
    }
  };

  if (loading) {
    return <p className="recipes-status">Loading cookbook...</p>;
  }

  if (error || !cookbook) {
    return (
      <main className="my-cookbooks-page">
        <p className="recipes-error">
          {error || 'Cookbook not found.'}
        </p>
        <Link to="/my-cookbooks">Back to My Cookbooks</Link>
      </main>
    );
  }

  return (
    <main className="my-cookbooks-page">
      <Link to="/my-cookbooks" className="cookbook-back-link">
        <ArrowLeft size={18} />
        Back to My Cookbooks
      </Link>

      <header className="cookbooks-header">
        <BookOpen size={30} />
        <h1>{cookbook.name}</h1>
        <p>{cookbook.description || 'Your personal recipe collection.'}</p>
        <p>{cookbook.recipes.length} saved recipes</p>
      </header>

      <section className="recipe-details-section">
        <h2>Saved Recipes</h2>

        {cookbook.recipes.length === 0 ? (
          <div className="cookbook-empty-state">
            <BookOpen size={42} />
            <h3>Your collection is waiting!</h3>
            <p>
              This cookbook is empty. Discover delicious recipes
              and save your favourites here.
            </p>
            <Link to="/recipes" className="cookbook-explore-button">
              Explore Recipes
            </Link>
          </div>
        ) : (
          <div className="recipes-grid">
            {cookbook.recipes.map((recipe) => (
              <div className="cookbook-saved-recipe" key={recipe._id}>
                <RecipeCard recipe={recipe} />

                <button
                  type="button"
                  className="cookbook-remove-button"
                  onClick={() => handleRemoveRecipe(recipe._id)}
                >
                  <Trash2 size={17} />
                  Remove from Cookbook
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
};

export default CookbookDetails;
