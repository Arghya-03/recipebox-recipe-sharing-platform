
import { useEffect, useState } from 'react';
import { Users } from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import RecipeCard from '../components/RecipeCard';

const FollowingFeed = () => {
  const { token } = useAuth();

  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchFeed = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await API.get('/social/feed', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setRecipes(response.data.recipes || []);
      } catch (error) {
        console.error('Following feed error:', error);

        setError(
          error.response?.data?.message ||
          'Unable to load your following feed.'
        );
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchFeed();
    }
  }, [token]);

  return (
    <main className="recipes-page following-feed-page">
      <section className="recipes-heading">
        <span className="recipes-subtitle">
          <Users size={18} />
          YOUR COMMUNITY
        </span>

        <h1>Following Feed</h1>

        <p>
          Discover the latest recipes shared by people
          you follow.
        </p>
      </section>

      <section className="recipes-container">
        {loading ? (
          <p className="recipes-status">
            Loading your feed...
          </p>
        ) : error ? (
          <p className="recipes-status recipes-error">
            {error}
          </p>
        ) : recipes.length === 0 ? (
          <p className="recipes-status">
            No recipes in your feed yet. Follow more cooks
            to discover their recipes!
          </p>
        ) : (
          <>
            <div className="recipes-results-heading">
              <h2>Latest from People You Follow</h2>
              <span>{recipes.length} recipes found</span>
            </div>

            <div className="recipes-grid">
              {recipes.map((recipe) => (
                <RecipeCard
                  key={recipe._id}
                  recipe={recipe}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
};

export default FollowingFeed;
