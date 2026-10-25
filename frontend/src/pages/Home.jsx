
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const API_URL = "http://localhost:5000/api";

const categories = [
  { emoji: "🍕", name: "Pizza" },
  { emoji: "🍔", name: "Burgers" },
  { emoji: "🍜", name: "Noodles" },
  { emoji: "🍛", name: "Biryani" },
  { emoji: "🥗", name: "Healthy Food" },
  { emoji: "🍰", name: "Desserts" },
];

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantError, setRestaurantError] = useState("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_URL}/restaurants`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load restaurants");
        }

        setRestaurants(
          Array.isArray(data.restaurants) ? data.restaurants.slice(0, 3) : []
        );
      } catch (error) {
        setRestaurantError(error.message || "Something went wrong");
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, []);

  return (
    <main className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-badge">
            <span>✦</span> FRESH • FAST • DELICIOUS
          </span>

          <h1>
            GOOD FOOD,
            <br />
            <span>GOOD MOOD ✨</span>
          </h1>

          <h2 className="hero-subtitle">
            Your favourite food,
            <br />
            delivered with love.
          </h2>

          <p>
            Discover the best food around you and get it delivered
            fresh to your doorstep.
          </p>

          <form
            className="hero-search"
            onSubmit={(event) => {
              event.preventDefault();
              window.location.href = "/restaurants";
            }}
          >
            <span className="search-location-icon">📍</span>

            <input
              type="text"
              placeholder="Search restaurants or dishes..."
              aria-label="Search restaurants or dishes"
            />

            <button type="submit">Explore Food →</button>
          </form>

          <div className="hero-highlights">
            <span>✓ Freshly prepared</span>
            <span>✓ Easy payments</span>
            <span>✓ Food you love</span>
          </div>
        </div>

        <div className="hero-food-art">
          <img
            className="hero-food-image"
            src="https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&w=1100&q=90"
            alt="Freshly prepared delicious biryani"
          />

          <div className="hero-image-caption">
            <span>✦</span>
            <div>
              <strong>Freshly made</strong>
              <small>with love ❤️</small>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="home-section categories-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">WHAT ARE YOU CRAVING?</span>
            <h2>Explore by category</h2>
          </div>

          <Link to="/restaurants" className="section-link">
            View all →
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              to="/restaurants"
              className="category-card"
              key={category.name}
            >
              <span className="category-emoji">{category.emoji}</span>
              <span>{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* Restaurants */}
      <section className="home-section restaurants-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">HANDPICKED FOR YOU</span>
            <h2>Restaurants you’ll love</h2>
            <p className="section-description">
              Find your next favourite meal.
            </p>
          </div>

          <Link to="/restaurants" className="section-link">
            Explore all →
          </Link>
        </div>

        {loadingRestaurants ? (
          <p className="restaurant-message">Loading restaurants...</p>
        ) : restaurantError ? (
          <p className="restaurant-message">{restaurantError}</p>
        ) : restaurants.length === 0 ? (
          <p className="restaurant-message">
            No restaurants available right now.
          </p>
        ) : (
          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <article className="home-restaurant-card" key={restaurant._id}>
                <div className="restaurant-visual">
                  {restaurant.coverImage || restaurant.logo ? (
                    <img
                      src={restaurant.coverImage || restaurant.logo}
                      alt={restaurant.name}
                      className="restaurant-cover-image"
                    />
                  ) : (
                    <div className="restaurant-image-fallback">
                      <span>🍽️</span>
                      <small>Delicious food awaits</small>
                    </div>
                  )}

                  <span
                    className={`restaurant-offer ${
                      restaurant.isOpen ? "is-open" : "is-closed"
                    }`}
                  >
                    {restaurant.isOpen ? "● OPEN NOW" : "● CLOSED"}
                  </span>
                </div>

                <div className="restaurant-card-content">
                  <div className="restaurant-title-row">
                    <h3>{restaurant.name}</h3>

                    <span className="restaurant-rating">
                      ★ {Number(restaurant.rating || 0).toFixed(1)}
                    </span>
                  </div>

                  <p className="restaurant-cuisine">
                    {Array.isArray(restaurant.cuisine)
                      ? restaurant.cuisine.join(" · ")
                      : "Restaurant"}
                  </p>

                  <div className="restaurant-meta">
                    <span>◷ {restaurant.deliveryTime || 30} min</span>
                    <span>₹{restaurant.minimumOrder || 0} minimum</span>
                  </div>

                  <Link
                    to={`/menu/${restaurant._id}`}
                    className="restaurant-order-link"
                  >
                    Explore restaurant <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="home-cta">
        <div className="cta-content">
          <span className="section-eyebrow">YOUR NEXT MEAL IS WAITING</span>
          <h2>Good food. Great moments.</h2>
          <p>Discover something delicious today with FoodFlow.</p>

          <Link to="/restaurants" className="cta-button">
            Order your favourite food →
          </Link>
        </div>

        <div className="cta-decoration" aria-hidden="true">
          🥗
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <Link to="/" className="home-logo">
          Food<span>Flow</span>
        </Link>

        <p>Made with ❤️ for food lovers.</p>

        <span>© {new Date().getFullYear()} FoodFlow</span>
      </footer>
    </main>
  );
}

export default Home;
