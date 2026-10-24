
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useCart } from "../context/CartContext";

const API_URL = "http://localhost:5000/api";

function Menu() {
  const { restaurantId } = useParams();
  const { addToCart } = useCart();

  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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

  const handleAddToCart = (item) => {
    addToCart(item);
    setMessage(`${item.name} cart mein add ho gaya!`);

    setTimeout(() => setMessage(""), 2000);
  };

  if (loading) return <h2>Loading menu...</h2>;
  if (error) return <p>{error}</p>;

  return (
    <div className="restaurants-page">
      <h1>Food Menu 🍔</h1>

      {message && <p>{message}</p>}

      {foodItems.length === 0 ? (
        <p>Is restaurant mein abhi food items available nahi hain.</p>
      ) : (
        <div className="restaurant-list">
          {foodItems.map((item) => (
            <div className="restaurant-card" key={item._id}>
              {item.image && (
                <img src={item.image} alt={item.name} />
              )}

              <h2>{item.name}</h2>
              <p>{item.description}</p>
              <p>Category: {item.category?.name || "General"}</p>

              <p>
                Price: ₹{item.discountPrice ?? item.price}
                {item.discountPrice != null && (
                  <span> (Original: ₹{item.price})</span>
                )}
              </p>

              <p>
                {item.isVeg ? "🟢 Vegetarian" : "🔴 Non-Vegetarian"}
              </p>

              <p>Preparation: {item.preparationTime} minutes</p>

              <button
                onClick={() => handleAddToCart(item)}
                disabled={!item.isAvailable}
              >
                {item.isAvailable ? "Add to Cart 🛒" : "Unavailable"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Menu;
