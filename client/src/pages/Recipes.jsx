
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ChefHat } from 'lucide-react';

import API from '../services/api';
import RecipeCard from '../components/RecipeCard';
import SearchBar from '../components/SearchBar';

const initialFilters = {
  search: '',
  includeIngredients: '',
  excludeIngredients: '',
  maxCookingTime: '',
  tags: '',
  difficulty: '',
  cuisine: '',
};

const Recipes = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  const [recipes, setRecipes] = useState([]);

  const [filters, setFilters] = useState(() => ({
    ...initialFilters,
    tags: searchParams.get('tags') || '',
  }));

  const [appliedFilters, setAppliedFilters] = useState(() => {
    const tags = searchParams.get('tags') || '';
    return tags ? { tags } : {};
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleFilterChange = (name, value) => {
    setFilters((previousFilters) => ({
      ...previousFilters,
      [name]: value,
    }));
  };

  const handleSearch = () => {
    const cleanedFilters = Object.fromEntries(
      Object.entries(filters).filter(
        ([, value]) => value.trim() !== ''
      )
    );

    setAppliedFilters(cleanedFilters);
    setSearchParams(cleanedFilters);
  };

  const handleReset = () => {
    setFilters(initialFilters);
    setAppliedFilters({});
    setSearchParams({});
  };

  useEffect(() => {
    const fetchRecipes = async () => {
      try {
        setLoading(true);
        setError('');

        const params = Object.fromEntries(
          Object.entries(appliedFilters).filter(
            ([, value]) => value.trim() !== ''
          )
        );

        const response = await API.get('/recipes', { params });

        setRecipes(response.data.recipes || []);
      } catch (error) {
        console.error('Recipe fetching error:', error);

        setError(
          error.response?.data?.message ||
          'Unable to load recipes. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRecipes();
  }, [appliedFilters]);

  return (
    <main className="recipes-page">
      <section className="recipes-heading">
        <span className="recipes-subtitle">
          <ChefHat size={18} />
          DISCOVER SOMETHING DELICIOUS
        </span>

        <h1>Explore Recipes</h1>

        <p>
          Find your next favorite meal and discover delicious
          recipes shared by our community.
        </p>
      </section>

      <SearchBar
        filters={filters}
        onChange={handleFilterChange}
        onSearch={handleSearch}
        onReset={handleReset}
      />

      <section className="recipes-container">
        {loading ? (
          <p className="recipes-status">Loading recipes...</p>
        ) : error ? (
          <p className="recipes-status recipes-error">{error}</p>
        ) : recipes.length === 0 ? (
          <p className="recipes-status">
            No recipes found. Try changing your search filters!
          </p>
        ) : (
          <>
            <div className="recipes-results-heading">
              <h2>Search Results</h2>
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

export default Recipes;
