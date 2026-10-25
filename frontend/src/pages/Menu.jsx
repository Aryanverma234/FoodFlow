
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";
import "./Menu.css";

const API_URL = "http://localhost:5000/api";

function Menu() {
  const { restaurantId } = useParams();
  const navigate = useNavigate();

  const {
    cartItems,
    cartCount,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    totalAmount,
    cartError,
  } = useCart();

  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [foodType, setFoodType] = useState("All");
  const [busyItemId, setBusyItemId] = useState("");

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/food-items/restaurant/${restaurantId}`
        );
        setFoodItems(response.data.foodItems || []);
      } catch (err) {
        setError(
          err.response?.data?.message || "Menu load nahi ho paaya."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [restaurantId]);

  const getCartItem = (foodItemId) =>
    cartItems.find((cartItem) => cartItem._id === foodItemId);

  const handleAdd = async (item) => {
    if (busyItemId) return;

    setBusyItemId(item._id);
    await addToCart(item);
    setBusyItemId("");
  };

  const handleIncrease = async (itemId) => {
    if (busyItemId) return;

    setBusyItemId(itemId);
    await increaseQuantity(itemId);
    setBusyItemId("");
  };

  const handleDecrease = async (itemId) => {
    if (busyItemId) return;

    setBusyItemId(itemId);
    await decreaseQuantity(itemId);
    setBusyItemId("");
  };

  const categories = [
    "All",
    ...new Set(
      foodItems.map((item) => item.category?.name || "General")
    ),
  ];

  const filteredItems = foodItems.filter((item) => {
    const matchesSearch = item.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      (item.category?.name || "General") === selectedCategory;

    const matchesType =
      foodType === "All" ||
      (foodType === "Veg" && item.isVeg) ||
      (foodType === "Non-Veg" && !item.isVeg);

    return matchesSearch && matchesCategory && matchesType;
  });

  if (loading) {
    return (
      <div className="menu-loading">
        <div className="menu-spinner"></div>
        <h2>Preparing your menu...</h2>
      </div>
    );
  }

  if (error) {
    return <div className="menu-error">{error}</div>;
  }

  return (
    <div className="menu-page">
      <div className="menu-hero">
        <div>
          <span className="menu-eyebrow">
            ✦ FRESH • TASTY • DELICIOUS
          </span>
          <h1>Explore Our Menu 🍽️</h1>
          <p>Discover delicious food made fresh just for you.</p>
        </div>
        <div className="menu-hero-icon">🍛</div>
      </div>

      {cartError && (
        <div className="menu-error">{cartError}</div>
      )}

      <div className="menu-toolbar">
        <input
          type="text"
          placeholder="Search your favourite food..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="menu-search"
        />

        <div className="food-type-filters">
          {["All", "Veg", "Non-Veg"].map((type) => (
            <button
              key={type}
              className={foodType === type ? "active" : ""}
              onClick={() => setFoodType(type)}
            >
              {type === "Veg" ? "🟢 " : ""}
              {type === "Non-Veg" ? "🔴 " : ""}
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="menu-section-heading">
        <div>
          <span className="menu-eyebrow">MADE WITH LOVE ❤️</span>
          <h2>Our Delicious Food</h2>
        </div>
        <span className="menu-item-count">
          {filteredItems.length} items
        </span>
      </div>

      <div className="menu-categories">
        {categories.map((category) => (
          <button
            key={category}
            className={
              selectedCategory === category ? "active" : ""
            }
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {foodItems.length === 0 ? (
        <div className="menu-empty">
          <span>🍽️</span>
          <h2>No food items available</h2>
          <p>This restaurant has not added any food items yet.</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="menu-empty">
          <span>🔍</span>
          <h2>No matching food found</h2>
          <p>Try another search or category.</p>
        </div>
      ) : (
        <div className="menu-grid">
          {filteredItems.map((item) => {
            const cartItem = getCartItem(item._id);
            const quantity = cartItem?.quantity || 0;
            const isBusy = busyItemId === item._id;

            return (
              <div className="menu-card" key={item._id}>
                <div className="menu-card-image">
                  {item.image ? (
                    <img src={item.image} alt={item.name} />
                  ) : (
                    <div className="menu-image-placeholder">🍛</div>
                  )}

                  <span
                    className={`food-badge ${
                      item.isVeg ? "veg" : "nonveg"
                    }`}
                  >
                    {item.isVeg ? "🟢 VEG" : "🔴 NON-VEG"}
                  </span>

                  {!item.isAvailable && (
                    <span className="unavailable-badge">
                      Currently Unavailable
                    </span>
                  )}
                </div>

                <div className="menu-card-content">
                  <span className="menu-card-category">
                    {item.category?.name || "General"}
                  </span>

                  <h3>{item.name}</h3>

                  <p className="menu-description">
                    {item.description}
                  </p>

                  <div className="menu-preparation">
                    ◷ Preparation: {item.preparationTime} min
                  </div>

                  <div className="menu-card-bottom">
                    <div className="menu-price">
                      <strong>
                        ₹{item.discountPrice ?? item.price}
                      </strong>
                      {item.discountPrice != null && (
                        <del>₹{item.price}</del>
                      )}
                    </div>

                    {!item.isAvailable ? (
                      <button
                        className="menu-add-button"
                        disabled
                      >
                        Unavailable
                      </button>
                    ) : quantity === 0 ? (
                      <button
                        className="menu-add-button"
                        onClick={() => handleAdd(item)}
                        disabled={isBusy || Boolean(busyItemId)}
                      >
                        {isBusy ? "Adding..." : "+ Add"}
                      </button>
                    ) : (
                      <div className="menu-quantity-control">
                        <button
                          onClick={() => handleDecrease(item._id)}
                          disabled={Boolean(busyItemId)}
                          aria-label={`Decrease ${item.name} quantity`}
                        >
                          −
                        </button>

                        <span>{quantity}</span>

                        <button
                          onClick={() => handleIncrease(item._id)}
                          disabled={Boolean(busyItemId)}
                          aria-label={`Increase ${item.name} quantity`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {cartCount > 0 && (
        <div className="menu-cart-bar">
          <div className="menu-cart-info">
            <strong>
              {cartCount} {cartCount === 1 ? "ITEM" : "ITEMS"} ADDED
            </strong>
            <span>Total: ₹{totalAmount}</span>
          </div>

          <button onClick={() => navigate("/cart")}>
            View Cart <span>→</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default Menu;
