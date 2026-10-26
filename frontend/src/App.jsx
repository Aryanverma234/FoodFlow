
import { useEffect, useState } from "react";
import {
  Navigate,
  Route,
  Routes,
  Link,
  useNavigate,
} from "react-router-dom";

import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";

import Home from "./pages/Home";
import Login from "./pages/Login";
import MyOrders from "./pages/MyOrders";
import Restaurants from "./pages/Restaurants";
import Menu from "./pages/Menu";
import Cart from "./pages/Cart";
import Address from "./pages/Address";
import Checkout from "./pages/Checkout";
import Settings from "./pages/Settings";
import Register from "./pages/Register";
import AdminDashboard from "./pages/AdminDashboard";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import Footer from "./Footer";

import "./App.css";

function App() {
  const { token, setToken, user, setUser } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("foodflow-theme") === "dark"
  );

  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const isRestaurant = user?.role === "restaurant";

  const dashboardPath = isAdmin
    ? "/admin/dashboard"
    : isRestaurant
      ? "/restaurant/dashboard"
      : "/";

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("foodflow-theme", theme);
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((previous) => !previous);
  };

  const closeMenu = () => {
    setMenuOpen(false);
  };

 const handleLogout = () => {
  // Clear saved login details
  localStorage.removeItem("foodflow_token");
  localStorage.removeItem("foodflow_user");

  // Clear React authentication state
  setToken("");
  setUser(null);
  setMenuOpen(false);

  // Open login page
  window.location.replace("/login");
};

  return (
    <>
      <nav className="navbar">
        <Link
          to={dashboardPath}
          className="logo"
          onClick={closeMenu}
        >
          <img src="/foodflow-logo.png" alt="FoodFlow" />
        </Link>

        <div className="nav-links">
          {isAdmin ? (
            <Link to="/admin/dashboard" onClick={closeMenu}>
              Admin Dashboard
            </Link>
          ) : isRestaurant ? (
            <Link to="/restaurant/dashboard" onClick={closeMenu}>
              Restaurant Dashboard
            </Link>
          ) : (
            <>
              <Link to="/" onClick={closeMenu}>Home</Link>
              <Link to="/restaurants" onClick={closeMenu}>Restaurants</Link>
              <Link to="/cart" onClick={closeMenu}>
                Cart 🛒 ({cartCount})
              </Link>
            </>
          )}

          {token ? (
            <div className="nav-menu-container">
              <button
                type="button"
                className="hamburger-button"
                onClick={() => setMenuOpen((previous) => !previous)}
                aria-label="Open settings menu"
                aria-expanded={menuOpen}
              >
                {menuOpen ? "✕" : "☰"}
              </button>

              {menuOpen && (
                <div className="nav-dropdown">
                  <div className="dropdown-heading">
                    <span>
                      {isAdmin
                        ? "Admin Menu"
                        : isRestaurant
                          ? "Restaurant Menu"
                          : "Settings"}
                    </span>
                    <span>⚙️</span>
                  </div>

                  {isAdmin ? (
                    <Link to="/admin/dashboard" onClick={closeMenu}>
                      🛠️ Admin Dashboard
                    </Link>
                  ) : isRestaurant ? (
                    <Link to="/restaurant/dashboard" onClick={closeMenu}>
                      🍽️ Restaurant Dashboard
                    </Link>
                  ) : (
                    <>
                      <Link to="/addresses" onClick={closeMenu}>
                        📍 My Addresses
                      </Link>
                      <Link to="/orders" onClick={closeMenu}>
                        📦 My Orders
                      </Link>
                      <Link to="/settings" onClick={closeMenu}>
                        👤 Account Settings
                      </Link>
                    </>
                  )}

                  <button type="button" onClick={toggleTheme}>
                    {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
                  </button>

                  <button
                    type="button"
                    className="dropdown-logout"
                    onClick={handleLogout}
                  >
                    ↪ Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" onClick={closeMenu}>Login</Link>
          )}

          {!token && (
            <button
              type="button"
              className="theme-toggle"
              onClick={toggleTheme}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
          )}
        </div>
      </nav>

      <Routes>
        {/* Home */}
        <Route
          path="/"
          element={
            token && (isAdmin || isRestaurant)
              ? <Navigate to={dashboardPath} replace />
              : <Home />
          }
        />

        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            token && isAdmin
              ? <AdminDashboard />
              : <Navigate to={dashboardPath} replace />
          }
        />

        {/* Restaurant Owner Dashboard */}
        <Route
          path="/restaurant/dashboard"
          element={
            token && isRestaurant
              ? <RestaurantDashboard />
              : <Navigate to={dashboardPath} replace />
          }
        />

        {/* Customer Pages */}
        <Route
          path="/restaurants"
          element={
            isAdmin || isRestaurant
              ? <Navigate to={dashboardPath} replace />
              : <Restaurants />
          }
        />

        <Route
          path="/menu/:restaurantId"
          element={
            isAdmin || isRestaurant
              ? <Navigate to={dashboardPath} replace />
              : <Menu />
          }
        />

        <Route
          path="/cart"
          element={
            isAdmin || isRestaurant
              ? <Navigate to={dashboardPath} replace />
              : <Cart />
          }
        />

        <Route
          path="/checkout"
          element={
            token && !isAdmin && !isRestaurant
              ? <Checkout />
              : <Navigate to={dashboardPath === "/" ? "/login" : dashboardPath} replace />
          }
        />

        <Route
          path="/addresses"
          element={
            token && !isAdmin && !isRestaurant
              ? <Address />
              : <Navigate to={dashboardPath === "/" ? "/login" : dashboardPath} replace />
          }
        />

        <Route
          path="/settings"
          element={
            token && !isAdmin && !isRestaurant
              ? <Settings darkMode={darkMode} toggleTheme={toggleTheme} />
              : <Navigate to={dashboardPath === "/" ? "/login" : dashboardPath} replace />
          }
        />

        <Route
          path="/orders"
          element={
            token && !isAdmin && !isRestaurant
              ? <MyOrders />
              : <Navigate to={dashboardPath === "/" ? "/login" : dashboardPath} replace />
          }
        />

        {/* Authentication */}
        <Route
          path="/login"
          element={
            token
              ? <Navigate to={dashboardPath} replace />
              : <Login />
          }
        />

        <Route
          path="/register"
          element={
            token
              ? <Navigate to={dashboardPath} replace />
              : <Register />
          }
        />

        {/* Invalid Route */}
        <Route
          path="*"
          element={<Navigate to={dashboardPath} replace />}
        />
      </Routes>

      {!isAdmin && !isRestaurant && <Footer />}
    </>
  );
}

export default App;
