
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, Link } from "react-router-dom";
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

import "./App.css";

function App() {
  const { token, setToken } = useAuth();
  const { cartCount } = useCart();

  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem("foodflow-theme") === "dark"
  );

  useEffect(() => {
    const theme = darkMode ? "dark" : "light";

    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("foodflow-theme", theme);
  }, [darkMode]);

  const toggleTheme = () => {
    setDarkMode((previous) => !previous);
  };

  const handleLogout = () => {
    setToken("");
  };

  return (
    <>
      <nav className="navbar">
        <Link to="/" className="logo">
          <img src="/foodflow-logo.png" alt="FoodFlow" />
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>

          <Link to="/restaurants">Restaurants</Link>

          <Link to="/cart">
            Cart 🛒 ({cartCount})
          </Link>

          {token ? (
            <>
              <Link to="/addresses">My Addresses</Link>

              <Link to="/orders">My Orders</Link>

              <button onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login">Login</Link>
          )}

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={
              darkMode
                ? "Switch to light mode"
                : "Switch to dark mode"
            }
          >
            {darkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/restaurants"
          element={<Restaurants />}
        />

        <Route
          path="/menu/:restaurantId"
          element={<Menu />}
        />

        <Route
          path="/cart"
          element={<Cart />}
        />

        <Route
          path="/checkout"
          element={
            token ? (
              <Checkout />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/addresses"
          element={
            token ? (
              <Address />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/login"
          element={
            token ? (
              <Navigate to="/orders" replace />
            ) : (
              <Login />
            )
          }
        />

        <Route
          path="/orders"
          element={
            token ? (
              <MyOrders />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </>
  );
}

export default App;
