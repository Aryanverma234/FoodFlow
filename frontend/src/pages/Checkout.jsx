
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import "./Checkout.css";

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

  const selectedAddressData = addresses.find(
    (address) => address._id === selectedAddress
  );

  return (
    <main className="checkout-page">
      <div className="checkout-heading">
        <div>
          <span className="checkout-eyebrow">FOODFLOW CHECKOUT</span>
          <h1>Complete your order</h1>
          <p>Just a few steps away from delicious food.</p>
        </div>

        <div className="checkout-secure">
          <span>🔒</span>
          Secure Checkout
        </div>
      </div>

      {error && (
        <div className="checkout-alert" role="alert">
          <span>⚠️</span>
          {error}
        </div>
      )}

      <div className="checkout-layout">
        <div className="checkout-main">
          <section className="checkout-section">
            <div className="checkout-section-heading">
              <div className="checkout-step">1</div>
              <div>
                <h2>Delivery address</h2>
                <p>Where should we deliver your food?</p>
              </div>
            </div>

            {addresses.length === 0 ? (
              <div className="checkout-empty-address">
                <span className="checkout-empty-icon">📍</span>
                <h3>No saved address</h3>
                <p>Add a delivery address to continue with your order.</p>
                <button
                  type="button"
                  className="checkout-outline-btn"
                  onClick={() => navigate("/addresses")}
                >
                  + Add delivery address
                </button>
              </div>
            ) : (
              <>
                <div className="checkout-address-list">
                  {addresses.map((address) => (
                    <label
                      key={address._id}
                      className={`checkout-address-option ${
                        selectedAddress === address._id
                          ? "selected"
                          : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="deliveryAddress"
                        value={address._id}
                        checked={selectedAddress === address._id}
                        onChange={() =>
                          setSelectedAddress(address._id)
                        }
                      />

                      <span className="checkout-custom-radio" />

                      <div className="checkout-address-content">
                        <div className="checkout-address-title">
                          <strong>
                            {address.label || "Address"}
                          </strong>
                          {address.isDefault && (
                            <span className="checkout-default-tag">
                              DEFAULT
                            </span>
                          )}
                          {selectedAddress === address._id && (
                            <span className="checkout-selected-tag">
                              SELECTED
                            </span>
                          )}
                        </div>

                        <h3>{address.fullName}</h3>

                        <p>
                          {address.addressLine1}
                          {address.addressLine2
                            ? `, ${address.addressLine2}`
                            : ""}
                        </p>

                        <p>
                          {address.city}, {address.state} -{" "}
                          {address.pincode}
                        </p>

                        {address.landmark && (
                          <p>Landmark: {address.landmark}</p>
                        )}

                        <span className="checkout-address-phone">
                          ☎ {address.phone}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>

                <button
                  type="button"
                  className="checkout-manage-link"
                  onClick={() => navigate("/addresses")}
                >
                  Manage saved addresses →
                </button>
              </>
            )}
          </section>

          <section className="checkout-section">
            <div className="checkout-section-heading">
              <div className="checkout-step">2</div>
              <div>
                <h2>Payment method</h2>
                <p>Choose how you would like to pay.</p>
              </div>
            </div>

            <div className="checkout-payment-list">
              <label
                className={`checkout-payment-option ${
                  paymentMethod === "COD" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="COD"
                  checked={paymentMethod === "COD"}
                  onChange={() => setPaymentMethod("COD")}
                />
                <span className="checkout-payment-icon">💵</span>
                <span className="checkout-payment-text">
                  <strong>Cash on Delivery</strong>
                  <small>Pay when your order arrives</small>
                </span>
                <span className="checkout-custom-radio" />
              </label>

              <label
                className={`checkout-payment-option ${
                  paymentMethod === "ONLINE" ? "selected" : ""
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="ONLINE"
                  checked={paymentMethod === "ONLINE"}
                  onChange={() => setPaymentMethod("ONLINE")}
                />
                <span className="checkout-payment-icon">💳</span>
                <span className="checkout-payment-text">
                  <strong>Online Payment</strong>
                  <small>Secure payment with Razorpay</small>
                </span>
                <span className="checkout-custom-radio" />
              </label>
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <div className="checkout-summary-heading">
            <h2>Order Summary</h2>
            <span>{cartItems.length} items</span>
          </div>

          <div className="checkout-summary-items">
            {cartItems.map((item) => (
              <div className="checkout-summary-item" key={item._id}>
                <div className="checkout-item-info">
                  <strong>{item.name}</strong>
                  <span>Qty: {item.quantity}</span>
                </div>
                <strong>
                  ₹{Number(item.price) * Number(item.quantity)}
                </strong>
              </div>
            ))}

            {cartItems.length === 0 && (
              <p className="checkout-empty-cart">
                Your cart is currently empty.
              </p>
            )}
          </div>

          <div className="checkout-summary-divider" />

          <div className="checkout-total-row">
            <span>Item total</span>
            <strong>₹{totalAmount}</strong>
          </div>

          <div className="checkout-total-row">
            <span>Delivery fee</span>
            <strong className="checkout-free">To be calculated</strong>
          </div>

          <div className="checkout-summary-divider" />

          <div className="checkout-grand-total">
            <span>To pay</span>
            <strong>₹{totalAmount}</strong>
          </div>

          {selectedAddressData && (
            <div className="checkout-delivery-preview">
              <span>📍 Delivering to</span>
              <strong>
                {selectedAddressData.label} ·{" "}
                {selectedAddressData.city}
              </strong>
            </div>
          )}

          <button
            type="button"
            className="checkout-place-order-btn"
            onClick={handlePlaceOrder}
            disabled={
              loading ||
              cartItems.length === 0 ||
              addresses.length === 0 ||
              !selectedAddress
            }
          >
            {loading ? "Placing Order..." : "Place Order"}
            {!loading && <span>→</span>}
          </button>

          <p className="checkout-terms">
            🔒 Your order details are secure with FoodFlow.
          </p>
        </aside>
      </div>
    </main>
  );
}

export default Checkout;
