
import { Clock, Star, ChefHat } from 'lucide-react';
import { Link } from 'react-router-dom';

const RecipeCard = ({ recipe }) => {
  return (
    <article className="recipe-card">
      <Link to={`/recipes/${recipe._id}`}>
        <div className="recipe-card-image">
          {recipe.image?.url ? (
            <img src={recipe.image.url} alt={recipe.title} />
          ) : (
            <div className="recipe-image-placeholder">
              <ChefHat size={40} />
            </div>
          )}
        </div>
      </Link>

      <div className="recipe-card-content">
        <div className="recipe-card-tags">
          {recipe.tags?.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>

        <h3>{recipe.title}</h3>

        <p>{recipe.description}</p>

        <div className="recipe-card-meta">
          <span>
            <Clock size={16} />
            {recipe.preparationTime + recipe.cookingTime} min
          </span>

          <span>
            <Star size={16} />
            {recipe.averageRating?.toFixed(1) || '0.0'}
          </span>

          <span>{recipe.difficulty}</span>
        </div>

        <div className="recipe-card-author">
          By {recipe.author?.name || 'Unknown Chef'}
        </div>
      </div>
    </article>
  );
};

export default RecipeCard;
