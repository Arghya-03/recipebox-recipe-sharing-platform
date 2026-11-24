
import { useEffect, useState } from 'react';
import {
    ArrowRight,
    ChefHat,
    Flame,
    Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import API from '../services/api';
import RecipeCard from '../components/RecipeCard';

const Home = () => {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                const response = await API.get('/recipes');
                setRecipes(response.data.recipes || []);
            } catch (err) {
                console.error('Homepage recipe loading error:', err);
                setError('Unable to load recipes. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, []);

    // Bengali recipes
    const bengaliRecipes = recipes.filter((recipe) =>
        recipe.tags?.includes('bengali')
    );

    // Homepage hero: Chingri Malai Curry
    const heroRecipe =
        recipes.find((recipe) =>
            recipe.title?.toLowerCase().includes('chingri malai curry')
        ) || bengaliRecipes[0];

    // Featured recipes ordered by average rating
    const featuredRecipes = [...recipes]
        .sort(
            (a, b) =>
                (b.averageRating || 0) - (a.averageRating || 0)
        )
        .slice(0, 4);

    return (
        <main className="home-page">

            {/* HERO SECTION */}
            <section className="home-hero">

                <div className="home-hero-content">

                    <span className="home-eyebrow">
                        <Sparkles size={16} />
                        A WORLD OF FLAVOURS
                    </span>

                    <h1>
                        Every recipe has
                        <br />
                        a story to <span>savour.</span>
                    </h1>

                    <p>
                        Discover delicious homemade recipes, explore traditional
                        Bengali flavours and share your favourite dishes with
                        food lovers everywhere.
                    </p>

                    <div className="home-hero-actions">

                        <Link
                            to="/recipes"
                            className="home-primary-button"
                        >
                            Explore Recipes
                            <ArrowRight size={18} />
                        </Link>

                        <Link
                            to="/create-recipe"
                            className="home-secondary-button"
                        >
                            Share a Recipe
                        </Link>

                    </div>

                    <div className="home-hero-note">
                        <ChefHat size={18} />
                        Made with love, shared with everyone.
                    </div>

                </div>

                <div className="home-hero-visual">

                    <div className="home-hero-image">

                        {heroRecipe?.image?.url ? (
                            <img
                                src={heroRecipe.image.url}
                                alt={heroRecipe.title}
                            />
                        ) : (
                            <div className="home-hero-placeholder">
                                <ChefHat size={64} />
                            </div>
                        )}

                    </div>

                    <div className="home-hero-floating-card">

                        <Flame size={19} />

                        <div>
                            <strong>
                                {heroRecipe?.title || 'Discover something special'}
                            </strong>

                            <span>
                                A delicious idea for your next meal
                            </span>
                        </div>

                    </div>

                </div>

            </section>

            {/* CUISINE SECTION */}
            <section className="home-section home-cuisine-section">

                <div className="home-section-heading">

                    <div>
                        <span className="home-section-label">
                            EXPLORE BY CUISINE
                        </span>

                        <h2>Flavours worth discovering</h2>

                        <p>
                            From traditional Bengali kitchens to Indian favourites.
                        </p>
                    </div>

                    <Link to="/recipes" className="home-text-link">
                        Explore all
                        <ArrowRight size={17} />
                    </Link>

                </div>

                <div className="home-cuisine-grid">

                    <Link
                        to="/recipes?tags=bengali"
                        className="home-cuisine-card bengali"
                    >
                        <span>01 / TRADITIONAL</span>
                        <h3>Bengali Specialities</h3>
                        <p>Authentic flavours from Bengal</p>
                        <ArrowRight size={20} />
                    </Link>

                    <Link
                        to="/recipes?tags=south-indian"
                        className="home-cuisine-card south-indian"
                    >
                        <span>02 / SOUTHERN</span>
                        <h3>South Indian</h3>
                        <p>Comforting classics and spices</p>
                        <ArrowRight size={20} />
                    </Link>

                    <Link
                        to="/recipes?tags=punjabi"
                        className="home-cuisine-card punjabi"
                    >
                        <span>03 / NORTH INDIAN</span>
                        <h3>Punjabi Favourites</h3>
                        <p>Rich, hearty and full of flavour</p>
                        <ArrowRight size={20} />
                    </Link>

                    <Link
                        to="/recipes?tags=gujarati"
                        className="home-cuisine-card gujarati"
                    >
                        <span>04 / WESTERN</span>
                        <h3>Gujarati Delights</h3>
                        <p>Colourful regional favourites</p>
                        <ArrowRight size={20} />
                    </Link>

                </div>

            </section>

            {/* RECIPE SECTIONS */}
            {loading ? (

                <section className="home-section">
                    <p className="home-status">
                        Discovering delicious recipes...
                    </p>
                </section>

            ) : error ? (

                <section className="home-section">
                    <p className="home-status home-error">
                        {error}
                    </p>
                </section>

            ) : (

                <>

                    {/* BENGALI FAVOURITES */}
                    <section className="home-section">

                        <div className="home-section-heading">

                            <div>
                                <span className="home-section-label">
                                    FROM THE BENGALI KITCHEN
                                </span>

                                <h2>Our Bengali favourites</h2>

                                <p>
                                    Traditional recipes that bring home closer.
                                </p>
                            </div>

                            <Link
                                to="/recipes?tags=bengali"
                                className="home-text-link"
                            >
                                View all
                                <ArrowRight size={17} />
                            </Link>

                        </div>

                        {bengaliRecipes.length > 0 ? (

                            <div className="home-recipe-grid">

                                {bengaliRecipes.slice(0, 4).map((recipe) => (
                                    <RecipeCard
                                        key={recipe._id}
                                        recipe={recipe}
                                    />
                                ))}

                            </div>

                        ) : (

                            <p className="home-status">
                                No Bengali recipes found yet.
                            </p>

                        )}

                    </section>

                    {/* COMMUNITY PICKS */}
                    <section className="home-section">

                        <div className="home-section-heading">

                            <div>
                                <span className="home-section-label">
                                    COMMUNITY PICKS
                                </span>

                                <h2>Recipes to try next</h2>

                                <p>
                                    Explore more dishes from our cooking community.
                                </p>
                            </div>

                            <Link
                                to="/recipes"
                                className="home-text-link"
                            >
                                Discover more
                                <ArrowRight size={17} />
                            </Link>

                        </div>

                        {featuredRecipes.length > 0 ? (

                            <div className="home-recipe-grid">

                                {featuredRecipes.map((recipe) => (
                                    <RecipeCard
                                        key={recipe._id}
                                        recipe={recipe}
                                    />
                                ))}

                            </div>

                        ) : (

                            <p className="home-status">
                                No featured recipes available yet.
                            </p>

                        )}

                    </section>

                </>

            )}

            {/* JOIN COMMUNITY SECTION */}
            <section className="home-join-section">

                <div>

                    <span className="home-section-label">
                        YOUR KITCHEN, YOUR STORY
                    </span>

                    <h2>Have a recipe worth sharing?</h2>

                    <p>
                        Join our cooking community and inspire someone
                        to prepare something delicious today.
                    </p>

                </div>

                <Link
                    to="/create-recipe"
                    className="home-primary-button"
                >
                    Share Your Recipe
                    <ArrowRight size={18} />
                </Link>

            </section>

        </main>
    );
};

export default Home;
