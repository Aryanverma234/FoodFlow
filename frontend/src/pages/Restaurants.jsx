
import { useEffect, useState } from "react";
import axios from "axios";
import "./Restaurants.css";
import { useNavigate } from "react-router-dom";

const API_URL = "http://localhost:5000/api";

function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
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

  if (loading) return <h2>Loading restaurants...</h2>;
  if (error) return <p>{error}</p>;

  return (
    <div className="restaurants-page">
      <h1>Explore Restaurants 🍽️</h1>

      {restaurants.length === 0 ? (
        <p>Abhi koi approved restaurant available nahi hai.</p>
      ) : (
        <div className="restaurant-list">
          {restaurants.map((restaurant) => (
            <div
  className="restaurant-card"
  key={restaurant._id}
  onClick={() => navigate(`/menu/${restaurant._id}`)}
  style={{ cursor: "pointer" }}
>
              {restaurant.coverImage && (
                <img
                  src={restaurant.coverImage}
                  alt={restaurant.name}
                />
              )}

              <h2>{restaurant.name}</h2>
              <p>{restaurant.description}</p>
              <p>
                Cuisine: {restaurant.cuisine?.join(", ") || "Not specified"}
              </p>
              <p>Delivery: {restaurant.deliveryTime || "Not specified"}</p>
              <p>Minimum order: ₹{restaurant.minimumOrder ?? 0}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Restaurants;
