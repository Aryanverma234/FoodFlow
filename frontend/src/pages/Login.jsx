
import { useState } from "react";
import api from "../api";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { setToken, setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      setToken(response.data.token);
      setUser(response.data.user);

      setMessage(
        `Welcome, ${response.data.user.name}! Login successful.`
      );

      setPassword("");
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Login failed. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">

        {/* LEFT FOOD IMAGE PANEL */}
        <div className="login-image-panel">
          <img
  src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=90"
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=85";
  }}
  alt="Fresh and delicious food"
  className="login-food-image"
/>

          <div className="login-image-overlay">
            <div className="login-image-brand">
              <span>🍃</span>
              <span>FoodFlow</span>
            </div>

            <div className="login-image-content">
              <span className="login-image-tag">
                FRESH • TASTY • DELICIOUS
              </span>

              <h2>
                Good food.
                <br />
                Great moments.
              </h2>

              <p>
                Your favourite flavours, delivered fresh
                to your doorstep.
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT LOGIN PANEL */}
        <div className="login-form-panel">

          <div className="login-mobile-brand">
            <span>🍃</span>
            <span>FoodFlow</span>
          </div>

          <div className="login-form-content">

           <div className="login-heading">
  <h1>Welcome Back</h1>

  <p>
    Sign in to continue your food journey.
  </p>
</div> 

            <form onSubmit={handleLogin} className="login-form">

              <div className="login-field">
                <label htmlFor="email">
                  Email Address
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  autoComplete="email"
                  required
                />
              </div>

              <div className="login-field">
                <label htmlFor="password">
                  Password
                </label>

                <div className="login-password-wrap">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    required
                  />

                  <button
                    type="button"
                    className="login-eye-button"
                    onClick={() =>
                      setShowPassword((prev) => !prev)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                    aria-pressed={showPassword}
                    title={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="login-submit"
                disabled={loading}
              >
                {loading ? "Please wait..." : "Log In"}
                {!loading && <span>→</span>}
              </button>

            </form>

            {message && (
              <p className="login-status" role="status">
                {message}
              </p>
            )}

            <div className="login-register">
              <span>Don't have an account?</span>
              <Link to="/register">Create Account</Link>
            </div>

            <div className="login-divider">
              <span>FOODFLOW</span>
            </div>

            <p className="login-footer">
              Made with care, served with love. ♥
            </p>

          </div>
        </div>
      </section>
    </main>
  );
}

export default Login;
