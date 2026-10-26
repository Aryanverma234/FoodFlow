import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Restaurants.css";

const API_URL = "http://localhost:5000/api";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCuisine, setSelectedCuisine] = useState("All");
  const [sortBy, setSortBy] = useState("recommended");

  const navigate = useNavigate();

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await axios.get(`${API_URL}/restaurants`);
        setRestaurants(response.data.restaurants || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Restaurants load nahi ho paaye."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, []);

  const cuisines = useMemo(() => {
    const allCuisines = restaurants.flatMap((restaurant) =>
      Array.isArray(restaurant.cuisine) ? restaurant.cuisine : []
    );

    return ["All", ...new Set(allCuisines)];
  }, [restaurants]);

  const filteredRestaurants = useMemo(() => {
    let result = restaurants.filter((restaurant) => {
      const searchText = search.toLowerCase();

      const matchesSearch =
        restaurant.name?.toLowerCase().includes(searchText) ||
        restaurant.description?.toLowerCase().includes(searchText) ||
        restaurant.cuisine?.some((item) =>
          item.toLowerCase().includes(searchText)
        );

      const matchesCuisine =
        selectedCuisine === "All" ||
        restaurant.cuisine?.includes(selectedCuisine);

      return matchesSearch && matchesCuisine;
    });

    if (sortBy === "rating") {
      result.sort(
        (a, b) => Number(b.rating || 0) - Number(a.rating || 0)
      );
    } else if (sortBy === "delivery") {
      result.sort(
        (a, b) =>
          Number(a.deliveryTime || 999) -
          Number(b.deliveryTime || 999)
      );
    } else if (sortBy === "cost") {
      result.sort(
        (a, b) =>
          Number(a.minimumOrder || 0) -
          Number(b.minimumOrder || 0)
      );
    }

    return result;
  }, [restaurants, search, selectedCuisine, sortBy]);

  if (loading) {
    return (
      <div className="restaurants-loading">
        <div className="loading-spinner"></div>
        <h2>Finding delicious restaurants...</h2>
        <p>Please wait a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="restaurants-error">
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
      </div>
    );
  }

  return (
    <main className="restaurants-page">
      <section className="restaurants-hero">
        <div>
          <span className="restaurants-eyebrow">
            DISCOVER YOUR NEXT FAVOURITE MEAL
          </span>
          <h1>
            Explore <span>Restaurants</span> 🍽️
          </h1>
          <p>
            Discover amazing places and delicious food, all in one place.
          </p>
        </div>

        <div className="restaurants-hero-icon">🍜</div>
      </section>

      <section className="restaurant-discovery">
        <div className="restaurant-search-box">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search restaurants or cuisines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} aria-label="Clear search">
              ✕
            </button>
          )}
        </div>

        <div className="restaurant-filter-heading">
          <div>
            <h2>Popular cuisines</h2>
            <p>Choose what you are craving today</p>
          </div>
        </div>

        <div className="cuisine-filters">
          {cuisines.map((cuisine) => (
            <button
              key={cuisine}
              className={
                selectedCuisine === cuisine ? "cuisine-chip active" : "cuisine-chip"
              }
              onClick={() => setSelectedCuisine(cuisine)}
            >
              {cuisine === "All" ? "🍽️" : "🥘"} {cuisine}
            </button>
          ))}
        </div>
      </section>

      <section className="restaurant-results">
        <div className="restaurant-results-heading">
          <div>
            <span className="restaurants-eyebrow">HANDPICKED FOR YOU</span>
            <h2>Restaurants near you</h2>
            <p>{filteredRestaurants.length} restaurants to explore</p>
          </div>

          <div className="restaurant-sort">
            <label htmlFor="restaurant-sort">Sort by</label>
            <select
              id="restaurant-sort"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="recommended">Recommended</option>
              <option value="rating">Top Rated</option>
              <option value="delivery">Fastest Delivery</option>
              <option value="cost">Minimum Order: Low to High</option>
            </select>
          </div>
        </div>

        {filteredRestaurants.length === 0 ? (
          <div className="no-restaurants">
            <span>🍽️</span>
            <h2>No restaurants found</h2>
            <p>Try another search or select a different cuisine.</p>
            <button
              onClick={() => {
                setSearch("");
                setSelectedCuisine("All");
              }}
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="restaurant-list">
            {filteredRestaurants.map((restaurant) => (
              <article
                className="restaurant-card"
                key={restaurant._id}
                onClick={() => navigate(`/menu/${restaurant._id}`)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    navigate(`/menu/${restaurant._id}`);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <div className="restaurant-card-image">
                  {restaurant.coverImage || restaurant.logo ? (
                    <img
                      src={restaurant.coverImage || restaurant.logo}
                      alt={restaurant.name}
                      loading="lazy"
                    />
                  ) : (
                    <div className="restaurant-image-placeholder">
                      🍽️
                    </div>
                  )}

                  <span
                    className={`restaurant-status ${
                      restaurant.isOpen ? "open" : "closed"
                    }`}
                  >
                    {restaurant.isOpen ? "● OPEN NOW" : "● CLOSED"}
                  </span>
                </div>

                <div className="restaurant-card-content">
                  <div className="restaurant-card-title">
                    <h3>{restaurant.name}</h3>
                    <span className="restaurant-rating">
                      ★ {Number(restaurant.rating || 0).toFixed(1)}
                    </span>
                  </div>

                  <p className="restaurant-description">
                    {restaurant.description ||
                      "Delicious food delivered fresh to your doorstep."}
                  </p>

                  <p className="restaurant-cuisines">
                    {restaurant.cuisine?.join(" • ") || "Multi-cuisine"}
                  </p>

                  <div className="restaurant-card-divider"></div>

                  <div className="restaurant-card-details">
                    <span>🕒 {restaurant.deliveryTime || 30} min</span>
                    <span>
                      Minimum order ₹{restaurant.minimumOrder ?? 0}
                    </span>
                  </div>

                  <button
                    className="restaurant-view-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/menu/${restaurant._id}`);
                    }}
                  >
                    Explore Menu <span>→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Restaurants;