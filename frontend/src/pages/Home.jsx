
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

// Cuisine ke hisaab se default restaurant image
const getRestaurantFallbackImage = (restaurant) => {
  const cuisine = Array.isArray(restaurant.cuisine)
    ? restaurant.cuisine.join(" ").toLowerCase()
    : "";

  if (
    cuisine.includes("chinese") ||
    cuisine.includes("asian") ||
    cuisine.includes("noodle")
  ) {
    return "https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=85";
  }

  if (
    cuisine.includes("indian") ||
    cuisine.includes("north indian") ||
    cuisine.includes("mughlai")
  ) {
    return "https://images.unsplash.com/photo-1585937421612-70a008356fbe?auto=format&fit=crop&w=1000&q=85";
  }

  if (cuisine.includes("pizza")) {
    return "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1000&q=85";
  }

  if (
    cuisine.includes("burger") ||
    cuisine.includes("fast food")
  ) {
    return "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85";
  }

  if (cuisine.includes("healthy")) {
    return "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85";
  }

  return "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1000&q=85";
};

function Home() {
  const [restaurants, setRestaurants] = useState([]);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [restaurantError, setRestaurantError] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await fetch(`${API_URL}/restaurants`);
        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "Unable to load restaurants");
        }

        setRestaurants(
          Array.isArray(data.restaurants) ? data.restaurants : []
        );
      } catch (error) {
        setRestaurantError(error.message || "Something went wrong");
      } finally {
        setLoadingRestaurants(false);
      }
    };

    fetchRestaurants();
  }, []);

  const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    const name = (restaurant.name || "").toLowerCase();

    const cuisine = Array.isArray(restaurant.cuisine)
      ? restaurant.cuisine.join(" ").toLowerCase()
      : "";

    return name.includes(query) || cuisine.includes(query);
  });

  return (
    <main className="home-page">
      {/* HERO SECTION */}
      <section className="home-hero">
        <div className="hero-content">
          <span className="hero-badge">
            <span>✦</span> THE ART OF GOOD FOOD
          </span>

          <h1>
            A taste worth
            <br />
            <span>coming back for.</span>
          </h1>

          <p className="hero-description">
            Discover exceptional flavours, beautiful food and
            restaurants made for your best moments.
          </p>

          <form
            className="hero-search"
            onSubmit={(event) => {
              event.preventDefault();

              document.getElementById("restaurants")?.scrollIntoView({
                behavior: "smooth",
              });
            }}
          >
            <span>⌕</span>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search restaurants or cuisines..."
              aria-label="Search restaurants or cuisines"
            />

            <button type="submit">Discover</button>
          </form>

          <div className="hero-highlights">
            <span>✦ Thoughtfully prepared</span>
            <span>✦ Delivered with care</span>
          </div>
        </div>

        <div className="hero-food-art">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90"
            alt="Beautifully presented gourmet food"
          />

          <div className="hero-image-caption">
            <span>✦</span>

            <div>
              <strong>Made for food lovers</strong>
              <small>A little joy in every bite</small>
            </div>
          </div>

          <div className="hero-image-number">01 / FOODFLOW</div>
        </div>
      </section>

      {/* CATEGORIES SECTION */}
      <section className="home-section categories-section">
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">A WORLD OF FLAVOURS</span>
            <h2>What are you craving?</h2>

            <p className="section-description">
              Find something wonderful for every mood.
            </p>
          </div>

          <Link to="/restaurants" className="section-link">
            Explore all <span>↗</span>
          </Link>
        </div>

        <div className="category-grid">
          {categories.map((category) => (
            <Link
              to="/restaurants"
              className="category-card"
              key={category.name}
            >
              <span className="category-emoji">
                {category.emoji}
              </span>

              <span>{category.name}</span>

              <span className="category-arrow">↗</span>
            </Link>
          ))}
        </div>
      </section>

      {/* RESTAURANTS SECTION */}
      <section
        className="home-section restaurants-section"
        id="restaurants"
      >
        <div className="section-heading">
          <div>
            <span className="section-eyebrow">CURATED FOR YOU</span>
            <h2>Places worth discovering.</h2>

            <p className="section-description">
              Meet the restaurants bringing great flavours to your table.
            </p>
          </div>

          <Link to="/restaurants" className="section-link">
            View all <span>↗</span>
          </Link>
        </div>

        {loadingRestaurants ? (
          <p className="restaurant-message">
            Discovering restaurants...
          </p>
        ) : restaurantError ? (
          <p className="restaurant-message">
            {restaurantError}
          </p>
        ) : filteredRestaurants.length === 0 ? (
          <p className="restaurant-message">
            No matching restaurants found. Try another search.
          </p>
        ) : (
          <div className="restaurant-grid">
            {filteredRestaurants.map((restaurant, index) => {
              const restaurantImage =
                restaurant.coverImage ||
                restaurant.logo ||
                getRestaurantFallbackImage(restaurant);

              return (
                <article
                  className="home-restaurant-card"
                  key={restaurant._id}
                >
                  <Link
                    to={`/menu/${restaurant._id}`}
                    className="restaurant-image-link"
                  >
                    <div className="restaurant-visual">
                      <img
                        src={restaurantImage}
                        alt={restaurant.name}
                        className="restaurant-cover-image"
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src =
                            getRestaurantFallbackImage({
                              cuisine: [],
                            });
                        }}
                      />

                      <span
                        className={`restaurant-status ${
                          restaurant.isOpen
                            ? "is-open"
                            : "is-closed"
                        }`}
                      >
                        {restaurant.isOpen ? "OPEN NOW" : "CLOSED"}
                      </span>

                      <span className="restaurant-image-index">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  </Link>

                  <div className="restaurant-card-content">
                    <div className="restaurant-title-row">
                      <h3>{restaurant.name}</h3>

                      <span className="restaurant-rating">
                        ★ {Number(restaurant.rating || 0).toFixed(1)}
                      </span>
                    </div>

                    <p className="restaurant-cuisine">
                      {Array.isArray(restaurant.cuisine) &&
                      restaurant.cuisine.length
                        ? restaurant.cuisine.join(" · ")
                        : "Discover our menu"}
                    </p>

                    <div className="restaurant-meta">
                      <span>
                        ◷ {restaurant.deliveryTime || 30} min
                      </span>

                      <span>
                        Min. order ₹{restaurant.minimumOrder || 0}
                      </span>
                    </div>

                    <Link
                      to={`/menu/${restaurant._id}`}
                      className="restaurant-order-link"
                    >
                      Explore restaurant <span>↗</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* BOTTOM CTA */}
      <section className="home-cta">
        <div>
          <span className="section-eyebrow">
            GOOD FOOD, BEAUTIFUL MOMENTS
          </span>

          <h2>Make today a little more delicious.</h2>

          <p>
            Your next favourite meal is only a discovery away.
          </p>

          <Link to="/restaurants" className="cta-button">
            Explore restaurants <span>↗</span>
          </Link>
        </div>

        <div className="cta-decoration" aria-hidden="true">
          ✳
        </div>
      </section>
    </main>
  );
}

export default Home;
