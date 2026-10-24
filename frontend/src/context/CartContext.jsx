
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const CartContext = createContext(null);

const API_URL = "http://localhost:5000/api";

function normalizeCart(cart) {
  if (!cart || !Array.isArray(cart.items)) {
    return [];
  }

  return cart.items.map((item) => {
    const food = item.foodItem;

    return {
      ...item,
      _id:
        typeof food === "object" && food !== null
          ? food._id
          : food,
      name: item.name,
      price: item.price,
      image: item.image || "",
      quantity: item.quantity,
    };
  });
}

export function CartProvider({ children }) {
  const { token } = useAuth();

  const [cartItems, setCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);
  const [cartError, setCartError] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const loadCart = async () => {
    if (!token) {
      setCartItems([]);
      return;
    }

    setCartLoading(true);
    setCartError("");

    try {
      const response = await axios.get(`${API_URL}/cart`, {
        headers,
      });

      setCartItems(normalizeCart(response.data.cart));
    } catch (error) {
      setCartError(
        error.response?.data?.message || "Cart load nahi ho paaya."
      );
    } finally {
      setCartLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [token]);

  const addToCart = async (item) => {
    if (!token) {
      setCartError("Cart mein item add karne ke liye login karein.");
      return false;
    }

    setCartError("");

    try {
      const response = await axios.post(
        `${API_URL}/cart`,
        {
          foodItemId: item._id,
          quantity: 1,
        },
        { headers }
      );

      setCartItems(normalizeCart(response.data.cart));
      return true;
    } catch (error) {
      setCartError(
        error.response?.data?.message || "Item add nahi ho paaya."
      );
      return false;
    }
  };

  const increaseQuantity = async (itemId) => {
    if (!token) return false;

    const item = cartItems.find((item) => item._id === itemId);
    if (!item) return false;

    setCartError("");

    try {
      const response = await axios.patch(
        `${API_URL}/cart/item/${itemId}`,
        { quantity: item.quantity + 1 },
        { headers }
      );

      setCartItems(normalizeCart(response.data.cart));
      return true;
    } catch (error) {
      setCartError(
        error.response?.data?.message || "Quantity update nahi hui."
      );
      return false;
    }
  };

  const decreaseQuantity = async (itemId) => {
    if (!token) return false;

    const item = cartItems.find((item) => item._id === itemId);
    if (!item) return false;

    setCartError("");

    try {
      if (item.quantity === 1) {
        const response = await axios.delete(
          `${API_URL}/cart/item/${itemId}`,
          { headers }
        );

        setCartItems(normalizeCart(response.data.cart));
      } else {
        const response = await axios.patch(
          `${API_URL}/cart/item/${itemId}`,
          { quantity: item.quantity - 1 },
          { headers }
        );

        setCartItems(normalizeCart(response.data.cart));
      }

      return true;
    } catch (error) {
      setCartError(
        error.response?.data?.message || "Quantity update nahi hui."
      );
      return false;
    }
  };

  const clearCart = async () => {
    if (!token) return false;

    if (cartItems.length === 0) {
      setCartItems([]);
      return true;
    }

    setCartError("");

    try {
      await axios.delete(`${API_URL}/cart/clear`, { headers });
      setCartItems([]);
      return true;
    } catch (error) {
      setCartError(
        error.response?.data?.message || "Cart clear nahi ho paaya."
      );
      return false;
    }
  };

  const totalAmount = cartItems.reduce(
    (total, item) =>
      total + item.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        increaseQuantity,
        decreaseQuantity,
        clearCart,
        totalAmount,
        cartLoading,
        cartError,
        loadCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
