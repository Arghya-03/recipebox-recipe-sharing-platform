
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import './App.css';

import Recipes from './pages/Recipes';
import RecipeDetails from './pages/RecipeDetails';
import Login from './pages/Login';
import Register from './pages/Register';
import CreateRecipe from './pages/CreateRecipe';
import FollowingFeed from './pages/FollowingFeed';
import UserProfile from './pages/UserProfile';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import MyCookbooks from './pages/MyCookbooks';
import CookbookDetails from './pages/CookbookDetails';
import MealPlanner from './pages/MealPlanner';
import Home from './pages/Home';
import EditProfile from './components/EditProfile';
import EditRecipe from './pages/EditRecipe';


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />

        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/recipes/:id" element={<RecipeDetails />} />

          {/* Authentication routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/create-recipe" element={<CreateRecipe />} />
            <Route path="/recipes/:id/edit" element={<EditRecipe />} />
            <Route path="/following-feed" element={<FollowingFeed />} />
            <Route path="/profile/:userId" element={<UserProfile />} />
            <Route path="/edit-profile" element={<EditProfile />} />
            <Route path="/my-cookbooks" element={<MyCookbooks />} />
            <Route path="/cookbooks/:id" element={<CookbookDetails />} />
            <Route path="/meal-planner" element={<MealPlanner />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
