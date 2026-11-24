
import { Search, SlidersHorizontal, RotateCcw } from 'lucide-react';

const SearchBar = ({
  filters,
  onChange,
  onSearch,
  onReset,
}) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    onSearch();
  };

  return (
    <section className="recipe-search-section">
      <form onSubmit={handleSubmit}>
        {/* Search by recipe name or description */}
        <div className="search-main">
          <Search size={20} />

          <input
            type="text"
            placeholder="Search recipes..."
            value={filters.search}
            onChange={(event) =>
              onChange('search', event.target.value)
            }
          />

          <button type="submit">
            Search
          </button>
        </div>

        {/* Advanced filters */}
        <div className="search-filters-heading">
          <SlidersHorizontal size={18} />
          <h3>Advanced Filters</h3>
        </div>

        <div className="search-filters-grid">
          <div className="search-field">
            <label htmlFor="includeIngredients">
              Include Ingredients
            </label>
            <input
              id="includeIngredients"
              type="text"
              placeholder="e.g. pasta, milk"
              value={filters.includeIngredients}
              onChange={(event) =>
                onChange('includeIngredients', event.target.value)
              }
            />
            <small>Recipes must contain all these ingredients.</small>
          </div>

          <div className="search-field">
            <label htmlFor="excludeIngredients">
              Exclude Ingredients
            </label>
            <input
              id="excludeIngredients"
              type="text"
              placeholder="e.g. chicken, fish"
              value={filters.excludeIngredients}
              onChange={(event) =>
                onChange('excludeIngredients', event.target.value)
              }
            />
            <small>Hide recipes containing these ingredients.</small>
          </div>

          <div className="search-field">
            <label htmlFor="maxCookingTime">
              Maximum Total Time (minutes)
            </label>
            <input
              id="maxCookingTime"
              type="number"
              min="0"
              placeholder="e.g. 40"
              value={filters.maxCookingTime}
              onChange={(event) =>
                onChange('maxCookingTime', event.target.value)
              }
            />
          </div>

          <div className="search-field">
            <label htmlFor="tags">
              Tags
            </label>
            <input
              id="tags"
              type="text"
              placeholder="e.g. vegetarian, italian"
              value={filters.tags}
              onChange={(event) =>
                onChange('tags', event.target.value)
              }
            />
          </div>

          <div className="search-field">
            <label htmlFor="difficulty">
              Difficulty
            </label>
            <select
              id="difficulty"
              value={filters.difficulty}
              onChange={(event) =>
                onChange('difficulty', event.target.value)
              }
            >
              <option value="">All Difficulties</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          <div className="search-field">
            <label htmlFor="cuisine">
              Cuisine
            </label>

            <select
              id="cuisine"
              value={filters.cuisine}
              onChange={(event) =>
                onChange('cuisine', event.target.value)
              }
            >
              <option value="">All Cuisines</option>
              <option value="Bengali">Bengali</option>
              <option value="South Indian">South Indian</option>
              <option value="Punjabi">Punjabi</option>
              <option value="Gujarati">Gujarati</option>
              <option value="Other Indian">Other Indian</option>
              <option value="International">International</option>
            </select>
          </div>
        </div>

        <div className="search-filter-actions">
          <button type="button" onClick={onReset}>
            <RotateCcw size={16} />
            Reset Filters
          </button>
        </div>
      </form>
    </section>
  );
};

export default SearchBar;
