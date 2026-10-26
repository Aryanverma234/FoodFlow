
import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const API_URL = "http://localhost:5000/api";

function Login() {
  const { setToken, setUser } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
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
        error.response?.data?.message || "Login failed. Check the backend."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="foodflow-container">
      <section className="foodflow-card">
        <h1>FoodFlow</h1>
        <p className="subtitle">Fresh food. Simple payments.</p>

        <form onSubmit={handleLogin} className="foodflow-form">
          <h2>Customer Login</h2>

          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Please wait..." : "Login"}
          </button>
        </form>

        {message && <p className="status-message">{message}</p>}

        <p className="register-login">
          Don't have an account?{" "}
          <Link to="/register">Create Account</Link>
        </p>
      </section>
    </main>
  );
}

export default Login;
