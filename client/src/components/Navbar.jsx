
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ChefHat,
  Search,
  UserRound,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => setMenuOpen(false);

  const handleLogout = () => {
    closeMenu();
    logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }) =>
    `nav-link ${isActive ? 'active' : ''}`;

  return (
    <header className="navbar">
      <div className="navbar-container">

        <Link to="/" className="navbar-logo" onClick={closeMenu}>
          <ChefHat size={28} />
          <span>RecipeBox</span>
        </Link>

        <button
          type="button"
          className="navbar-menu-toggle"
          onClick={() => setMenuOpen((previous) => !previous)}
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          aria-controls="recipebox-navigation"
        >
          {menuOpen ? <X size={25} /> : <Menu size={25} />}
        </button>

        <nav
          id="recipebox-navigation"
          className={`navbar-links ${menuOpen ? 'is-open' : ''}`}
        >
          <NavLink to="/" end className={navLinkClass} onClick={closeMenu}>
            Home
          </NavLink>

          <NavLink to="/recipes" className={navLinkClass} onClick={closeMenu}>
            Explore Recipes
          </NavLink>

          {isAuthenticated && (
            <>
              <NavLink to="/my-cookbooks" className={navLinkClass} onClick={closeMenu}>
                My Cookbooks
              </NavLink>

              <NavLink to="/meal-planner" className={navLinkClass} onClick={closeMenu}>
                Meal Planner
              </NavLink>

              <NavLink to="/following-feed" className={navLinkClass} onClick={closeMenu}>
                Following Feed
              </NavLink>
            </>
          )}

          {isAuthenticated ? (
            <NavLink to="/create-recipe" className={navLinkClass} onClick={closeMenu}>
              Share Recipe
            </NavLink>
          ) : (
            <NavLink to="/login" className={navLinkClass} onClick={closeMenu}>
              Share Recipe
            </NavLink>
          )}
        </nav>

        <div className="navbar-actions">

          <Link to="/recipes" aria-label="Explore recipes" onClick={closeMenu}>
            <Search size={21} />
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to={`/profile/${user?._id}`}
                className="navbar-user"
                title="View your profile"
                onClick={closeMenu}
              >
                <UserRound size={18} />
                {user?.name}
              </Link>

              <button
                type="button"
                className="navbar-logout"
                onClick={handleLogout}
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" aria-label="Login" onClick={closeMenu}>
                <UserRound size={21} />
              </Link>

              <Link
                to="/register"
                className="navbar-register"
                onClick={closeMenu}
              >
                Join Us
              </Link>
            </>
          )}

        </div>
      </div>
    </header>
  );
};

export default Navbar;
