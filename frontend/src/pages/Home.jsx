
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Home.css";

const API_URL = "http://localhost:5000/api";

const categories = [
  {
    name: "Pizza",
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Burgers",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Noodles",
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Biryani",
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Healthy Food",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=700&q=85",
  },
  {
    name: "Desserts",
    image: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=700&q=85",
  },
];

// HERO SLIDER IMAGES
const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1400&q=90",
    title: "Made for food lovers",
    subtitle: "A little joy in every bite",
  },
  {
    image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1400&q=90",
    title: "Pizza perfection",
    subtitle: "Freshly baked happiness",
  },
  {
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1400&q=90",
    title: "Burger cravings",
    subtitle: "Big flavours, bigger smiles",
  },
  {
    image: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?auto=format&fit=crop&w=1400&q=90",
    title: "The taste of India",
    subtitle: "Delicious biryani moments",
  },
  {
    image: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=1400&q=90",
    title: "Explore new flavours",
    subtitle: "Something special in every bowl",
  },
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
  const [activeSlide, setActiveSlide] = useState(0);

  // Automatic hero slider
  useEffect(() => {
    const sliderTimer = setInterval(() => {
      setActiveSlide((previous) => (previous + 1) % heroSlides.length);
    }, 4000);

    return () => clearInterval(sliderTimer);
  }, []);

  // Fetch restaurants
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

  // Restaurant search
  const filteredRestaurants = restaurants.filter((restaurant) => {
    const query = search.toLowerCase().trim();

    if (!query) return true;

    const name = (restaurant.name || "").toLowerCase();

    const cuisine = Array.isArray(restaurant.cuisine)
      ? restaurant.cuisine.join(" ").toLowerCase()
      : "";

    return name.includes(query) || cuisine.includes(query);
  });

  // Slider controls
  const showPreviousSlide = () => {
    setActiveSlide(
      (previous) => (previous - 1 + heroSlides.length) % heroSlides.length
    );
  };

  const showNextSlide = () => {
    setActiveSlide(
      (previous) => (previous + 1) % heroSlides.length
    );
  };

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

        {/* HERO IMAGE SLIDER */}
        <div className="hero-food-art">

          <img
            key={activeSlide}
            src={heroSlides[activeSlide].image}
            alt={heroSlides[activeSlide].title}
          />

          <div className="hero-image-caption">
            <span>✦</span>

            <div>
              <strong>{heroSlides[activeSlide].title}</strong>
              <small>{heroSlides[activeSlide].subtitle}</small>
            </div>
          </div>

          <div className="hero-image-number">
            {String(activeSlide + 1).padStart(2, "0")} / FOODFLOW
          </div>

          {/* Previous button */}
          <button
            type="button"
            className="hero-slider-arrow hero-slider-prev"
            onClick={showPreviousSlide}
            aria-label="Previous image"
          >
            &#8249;
          </button>

          {/* Next button */}
          <button
            type="button"
            className="hero-slider-arrow hero-slider-next"
            onClick={showNextSlide}
            aria-label="Next image"
          >
            &#8250;
          </button>

          {/* Slider dots */}
          <div className="hero-slider-dots">
            {heroSlides.map((slide, index) => (
              <button
                type="button"
                key={index}
                className={activeSlide === index ? "active" : ""}
                onClick={() => setActiveSlide(index)}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>

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
              <img
                src={category.image}
                alt={category.name}
                className="category-image"
                loading="lazy"
              />

              <div className="category-overlay">
                <h3>{category.name}</h3>
                <span className="category-arrow">↗</span>
              </div>
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
                            getRestaurantFallbackImage(restaurant);
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
