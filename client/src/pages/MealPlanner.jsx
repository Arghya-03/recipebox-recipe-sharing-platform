
import { useEffect, useState } from 'react';

import {
    DndContext,
    DragOverlay,
    pointerWithin,
    useDraggable,
    useDroppable,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';

import {
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Plus,
    Clock,
    Trash2,
} from 'lucide-react';

import API from '../services/api';
import { useAuth } from '../context/AuthContext';

// Draggable recipe from the recipe library
const DraggableRecipe = ({ recipe }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
    } = useDraggable({
        id: recipe._id,
        data: { recipe },
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="draggable-recipe-card"
        >
            {recipe.image?.url ? (
                <img src={recipe.image.url} alt={recipe.title} />
            ) : (
                <div className="recipe-image-placeholder">
                    <CalendarDays size={24} />
                </div>
            )}

            <div>
                <h4>{recipe.title}</h4>

                <p>
                    <Clock size={14} />
                    {(recipe.preparationTime || 0) +
                        (recipe.cookingTime || 0)}{' '}
                    mins
                </p>
            </div>

            <span className="drag-indicator">Drag</span>
        </div>
    );
};

// Draggable meal that is already scheduled
const DraggablePlannedMeal = ({ meal, onDelete }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
    } = useDraggable({
        id: `planned-${meal._id}`,
        data: { mealPlan: meal },
    });

    const style = transform
        ? {
            transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        }
        : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className="planned-meal-card draggable-planned-meal"
        >
            {meal.recipe?.image?.url && (
                <img
                    src={meal.recipe.image.url}
                    alt={meal.recipe.title}
                />
            )}

            <p>
                {meal.recipe?.title || 'Recipe unavailable'}
            </p>

            <button
                type="button"
                className="delete-planned-meal"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={(event) => {
                    event.stopPropagation();
                    onDelete(meal._id);
                }}
                title="Remove this meal"
                aria-label={`Remove ${meal.recipe?.title || 'planned meal'}`}
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

// Droppable calendar meal slot
const MealDropSlot = ({ date, mealType, children }) => {
    const { setNodeRef, isOver } = useDroppable({
        id: `${date}-${mealType}`,
        data: { date, mealType },
    });

    return (
        <div
            ref={setNodeRef}
            className={`meal-calendar-slot ${isOver ? 'meal-slot-over' : ''
                }`}
        >
            {children}
        </div>
    );
};

const MealPlanner = () => {
    const { token } = useAuth();
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 180,
                tolerance: 8,
            },
        })
    );

    const [mealPlans, setMealPlans] = useState([]);
    const [recipes, setRecipes] = useState([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    const [currentDate, setCurrentDate] = useState(new Date());
    const [activeRecipe, setActiveRecipe] = useState(null);

    const authHeaders = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    // Generate Monday to Sunday dates
    const getWeekDates = (date) => {
        const start = new Date(date);
        const day = start.getDay();

        const difference = day === 0 ? -6 : 1 - day;

        start.setDate(start.getDate() + difference);
        start.setHours(0, 0, 0, 0);

        return Array.from({ length: 7 }, (_, index) => {
            const weekDate = new Date(start);
            weekDate.setDate(start.getDate() + index);

            return weekDate;
        });
    };

    const weekDates = getWeekDates(currentDate);

    // Format dates as YYYY-MM-DD using local calendar dates
    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return `${year}-${month}-${day}`;
    };

    // Navigate between weeks
    const changeWeek = (direction) => {
        setCurrentDate((previous) => {
            const next = new Date(previous);
            next.setDate(next.getDate() + direction * 7);

            return next;
        });
    };

    // Return to the current week
    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Fetch recipes and existing meal plans
    useEffect(() => {
        const fetchPlannerData = async () => {
            try {
                setLoading(true);
                setError('');

                const headers = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };

                const [mealResponse, recipeResponse] = await Promise.all([
                    API.get('/meal-plans', headers),
                    API.get('/recipes'),
                ]);

                setMealPlans(mealResponse.data.mealPlans || []);
                setRecipes(recipeResponse.data.recipes || []);
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    'Unable to load meal planner data.'
                );
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchPlannerData();
        }
    }, [token]);

    // Handle dragging recipes and scheduled meals
    const handleDragEnd = async (event) => {
        const { active, over } = event;

        setActiveRecipe(null);

        if (!over) return;

        const dragData = active.data.current;
        const dropData = over.data.current;

        // CASE 1: Move an existing scheduled meal
        const plannedMeal = dragData?.mealPlan;

        if (plannedMeal) {
            if (!dropData?.date || !dropData?.mealType) {
                return;
            }

            // Ignore drops into the same calendar slot
            const oldDate = formatDate(new Date(plannedMeal.date));

            if (
                oldDate === dropData.date &&
                plannedMeal.mealType === dropData.mealType
            ) {
                return;
            }

            try {
                setError('');
                setMessage('');

                const response = await API.put(
                    `/meal-plans/${plannedMeal._id}`,
                    {
                        date: dropData.date,
                        mealType: dropData.mealType,
                    },
                    authHeaders
                );

                setMealPlans((previous) =>
                    previous.map((meal) =>
                        meal._id === plannedMeal._id
                            ? response.data.mealPlan
                            : meal
                    )
                );

                setMessage(
                    `${plannedMeal.recipe?.title || 'Meal'} moved to ${dropData.mealType} successfully!`
                );
            } catch (error) {
                setError(
                    error.response?.data?.message ||
                    'Unable to move this meal.'
                );
            }

            return;
        }

        // CASE 2: Add a new recipe from the recipe library
        const recipe = dragData?.recipe;

        if (!recipe || !dropData?.date || !dropData?.mealType) {
            return;
        }

        try {
            setError('');
            setMessage('');

            const response = await API.post(
                '/meal-plans',
                {
                    recipe: recipe._id,
                    date: dropData.date,
                    mealType: dropData.mealType,
                },
                authHeaders
            );

            setMealPlans((previous) => [
                ...previous,
                response.data.mealPlan,
            ]);

            setMessage(
                `${recipe.title} added to ${dropData.mealType} successfully!`
            );
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to schedule this recipe.'
            );
        }
    };

    // Remove a scheduled meal
    const handleDeleteMeal = async (mealPlanId) => {
        try {
            setError('');
            setMessage('');

            await API.delete(
                `/meal-plans/${mealPlanId}`,
                authHeaders
            );

            setMealPlans((previous) =>
                previous.filter((meal) => meal._id !== mealPlanId)
            );

            setMessage('Meal removed from your planner successfully!');
        } catch (error) {
            setError(
                error.response?.data?.message ||
                'Unable to remove this meal.'
            );
        }
    };

    if (loading) {
        return (
            <p className="recipes-status">
                Loading your meal planner...
            </p>
        );
    }

    return (
        <main className="meal-planner-page">
            {/* Page Header */}
            <header className="meal-planner-header">
                <CalendarDays size={30} />

                <h1>My Meal Planner</h1>

                <p>
                    Plan your meals and organize your weekly cooking schedule.
                </p>
            </header>

            {error && <p className="recipes-error">{error}</p>}
            {message && <p className="meal-planner-message">{message}</p>}

            <DndContext
                sensors={sensors}
                collisionDetection={(args) =>
                    pointerWithin({
                        ...args,
                        droppableContainers: args.droppableContainers.filter(
                            (container) =>
                                container.data.current?.date &&
                                container.data.current?.mealType
                        ),
                    })
                }
                onDragStart={(event) => {
                    const dragData = event.active.data.current;

                    setActiveRecipe(
                        dragData?.recipe ||
                        dragData?.mealPlan?.recipe ||
                        null
                    );
                }}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveRecipe(null)}
            >
                <div className="meal-planner-layout">

                    {/* Recipe Library */}
                    <aside className="meal-recipe-library">
                        <h2>
                            <Plus size={21} />
                            Recipe Library
                        </h2>

                        <p>
                            Drag a recipe into your preferred meal slot.
                        </p>

                        {recipes.length === 0 ? (
                            <p>No recipes available. Create a recipe first.</p>
                        ) : (
                            <div className="meal-recipe-list">
                                {recipes.map((recipe) => (
                                    <DraggableRecipe
                                        key={recipe._id}
                                        recipe={recipe}
                                    />
                                ))}
                            </div>
                        )}
                    </aside>

                    {/* Weekly Calendar */}
                    <section className="meal-planner-content">
                        <div className="meal-planner-navigation">
                            <button
                                type="button"
                                onClick={() => changeWeek(-1)}
                            >
                                <ChevronLeft size={20} />
                                Previous
                            </button>

                            <button
                                type="button"
                                onClick={goToToday}
                                className="today-button"
                            >
                                Today
                            </button>

                            <h2>
                                {weekDates[0].toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                })}
                                {' - '}
                                {weekDates[6].toLocaleDateString('en-IN', {
                                    day: 'numeric',
                                    month: 'short',
                                    year: 'numeric',
                                })}
                            </h2>

                            <button
                                type="button"
                                onClick={() => changeWeek(1)}
                            >
                                Next
                                <ChevronRight size={20} />
                            </button>
                        </div>

                        <p>
                            Planned meals: <strong>{mealPlans.length}</strong>
                        </p>

                        <div className="meal-calendar-scroll">
                            <div className="meal-calendar-grid">
                                {weekDates.map((date) => (
                                    <div
                                        className={`meal-calendar-day ${formatDate(date) === formatDate(new Date())
                                            ? 'today-highlight'
                                            : ''
                                            }`}
                                        key={formatDate(date)}
                                    >
                                        <h3>
                                            {date.toLocaleDateString('en-IN', {
                                                weekday: 'short',
                                            })}
                                        </h3>

                                        <p className="meal-calendar-date">
                                            {date.getDate()}
                                        </p>

                                        {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(
                                            (mealType) => {
                                                const dayMeals = mealPlans.filter(
                                                    (meal) =>
                                                        formatDate(new Date(meal.date)) ===
                                                        formatDate(date) &&
                                                        meal.mealType === mealType
                                                );

                                                return (
                                                    <MealDropSlot
                                                        key={mealType}
                                                        date={formatDate(date)}
                                                        mealType={mealType}
                                                    >
                                                        <h4>{mealType}</h4>

                                                        {dayMeals.length === 0 ? (
                                                            <p className="empty-meal-slot">
                                                                Drop a recipe here
                                                            </p>
                                                        ) : (
                                                            dayMeals.map((meal) => (
                                                                <DraggablePlannedMeal
                                                                    key={meal._id}
                                                                    meal={meal}
                                                                    onDelete={handleDeleteMeal}
                                                                />
                                                            ))
                                                        )}
                                                    </MealDropSlot>
                                                );
                                            }
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                </div>

                {/* Drag Preview */}
                <DragOverlay>
                    {activeRecipe ? (
                        <div className="draggable-recipe-card drag-overlay-card">
                            {activeRecipe.image?.url && (
                                <img
                                    src={activeRecipe.image.url}
                                    alt={activeRecipe.title}
                                />
                            )}

                            <span>{activeRecipe.title}</span>
                        </div>
                    ) : null}
                </DragOverlay>
            </DndContext>
        </main>
    );
};

export default MealPlanner;
