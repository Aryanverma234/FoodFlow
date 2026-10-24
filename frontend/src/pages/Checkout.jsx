
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const API_URL = "http://localhost:5000/api";

function Checkout() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const { cartItems, totalAmount, loadCart } = useCart();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const response = await axios.get(`${API_URL}/addresses`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const savedAddresses = response.data.addresses || [];
        setAddresses(savedAddresses);

        const defaultAddress = savedAddresses.find(
          (address) => address.isDefault
        );

        if (defaultAddress) {
          setSelectedAddress(defaultAddress._id);
        } else if (savedAddresses.length > 0) {
          setSelectedAddress(savedAddresses[0]._id);
        }
      } catch (err) {
        setError(
          err.response?.data?.message ||
            "Addresses load nahi ho paaye."
        );
      }
    };

    if (token) {
      fetchAddresses();
    }
  }, [token]);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }

    if (cartItems.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${API_URL}/orders`,
        {
          addressId: selectedAddress,
          paymentMethod,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        await loadCart();
        navigate("/orders", {
          state: {
            message:
              paymentMethod === "ONLINE"
                ? "Order placed! Complete your payment using Pay Now."
                : "Your order has been placed successfully!",
          },
        });
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Order place nahi ho paaya. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="restaurants-page">
      <h1>Checkout 🛍️</h1>

      {error && (
        <p role="alert" style={{ color: "red" }}>
          {error}
        </p>
      )}

      <section className="restaurant-card" style={{ padding: 20 }}>
        <h2>Delivery Address</h2>

        {addresses.length === 0 ? (
          <>
            <p>No saved address found.</p>
            <button onClick={() => navigate("/addresses")}>
              Add Address
            </button>
          </>
        ) : (
          addresses.map((address) => (
            <label
              key={address._id}
              style={{
                display: "block",
                padding: 12,
                margin: "12px 0",
                border: "1px solid #ddd",
                borderRadius: 10,
                cursor: "pointer",
              }}
            >
              <input
                type="radio"
                name="deliveryAddress"
                value={address._id}
                checked={selectedAddress === address._id}
                onChange={() => setSelectedAddress(address._id)}
              />

              <strong style={{ marginLeft: 10 }}>
                {address.label} — {address.fullName}
                {address.isDefault ? " (Default)" : ""}
              </strong>

              <p>
                {address.addressLine1}
                {address.addressLine2
                  ? `, ${address.addressLine2}`
                  : ""}
                , {address.city}, {address.state} - {address.pincode}
              </p>

              <p>Phone: {address.phone}</p>
            </label>
          ))
        )}

        {addresses.length > 0 && (
          <button
            type="button"
            onClick={() => navigate("/addresses")}
          >
            Manage Addresses
          </button>
        )}
      </section>

      <section className="restaurant-card" style={{ padding: 20, marginTop: 20 }}>
        <h2>Payment Method</h2>

        <label style={{ display: "block", margin: "15px 0" }}>
          <input
            type="radio"
            name="paymentMethod"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
          />
          <span style={{ marginLeft: 10 }}>
            Cash on Delivery (COD)
          </span>
        </label>

        <label style={{ display: "block", margin: "15px 0" }}>
          <input
            type="radio"
            name="paymentMethod"
            value="ONLINE"
            checked={paymentMethod === "ONLINE"}
            onChange={() => setPaymentMethod("ONLINE")}
          />
          <span style={{ marginLeft: 10 }}>
            Online Payment (Razorpay)
          </span>
        </label>
      </section>

      <section className="restaurant-card" style={{ padding: 20, marginTop: 20 }}>
        <h2>Order Summary</h2>

        {cartItems.map((item) => (
          <p key={item._id}>
            {item.name} × {item.quantity} — ₹
            {item.price * item.quantity}
          </p>
        ))}

        <h3>Total: ₹{totalAmount}</h3>

        <button
          type="button"
          onClick={handlePlaceOrder}
          disabled={
            loading ||
            cartItems.length === 0 ||
            addresses.length === 0
          }
        >
          {loading ? "Placing Order..." : "Place Order"}
        </button>
      </section>
    </div>
  );
}

export default Checkout;
