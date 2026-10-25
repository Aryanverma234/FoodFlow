
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./MyOrders.css";

const API_URL = "http://localhost:5000/api";

function MyOrders() {
  const { token } = useAuth();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersError, setOrdersError] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchMyOrders = async () => {
    if (!token) return;

    setOrdersLoading(true);
    setOrdersError("");

    try {
      const response = await axios.get(`${API_URL}/orders`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setOrders(response.data.orders || []);
    } catch (error) {
      setOrdersError(
        error.response?.data?.message ||
          "Unable to load your orders. Please try again."
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [token]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount ?? 0);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "Date unavailable";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";

    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  };

  const handlePayment = async (selectedOrderId) => {
    if (!token) {
      setMessage("Please login first.");
      return;
    }

    if (!window.Razorpay) {
      setMessage("Razorpay Checkout failed to load. Refresh the page.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.post(
        `${API_URL}/payments/razorpay/order`,
        { orderId: selectedOrderId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const { keyId, razorpayOrderId, amount, currency } = response.data;

      const options = {
        key: keyId,
        amount,
        currency,
        name: "FoodFlow",
        description: "Food order payment",
        order_id: razorpayOrderId,

        handler: async (paymentResponse) => {
          setLoading(true);

          try {
            const verification = await axios.post(
              `${API_URL}/payments/razorpay/verify`,
              {
                orderId: selectedOrderId,
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              },
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            setMessage(
              verification.data.message ||
                "Payment verified successfully!"
            );

            await fetchMyOrders();
          } catch (error) {
            setMessage(
              error.response?.data?.message ||
                "Payment verification failed. Check payment status before retrying."
            );
          } finally {
            setLoading(false);
          }
        },

        modal: {
          ondismiss: () => {
            setMessage(
              "Payment window closed. Check order status before retrying."
            );
          },
        },

        theme: {
          color: "#e83b4b",
        },
      };

      const checkout = new window.Razorpay(options);

      checkout.on("payment.failed", (event) => {
        setMessage(
          event.error?.description ||
            "Payment failed. Please check the order status."
        );
      });

      checkout.open();
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Unable to start payment. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const getPaymentClass = (status) => {
    const value = (status || "").toUpperCase();

    if (value === "PAID" || value === "SUCCESS") return "paid";
    if (value === "FAILED") return "failed";
    if (value === "REFUNDED") return "refunded";

    return "pending";
  };

  const getOrderClass = (status) => {
    const value = (status || "").toUpperCase();

    if (value === "DELIVERED" || value === "COMPLETED") {
      return "delivered";
    }
    if (value === "CANCELLED") return "cancelled";

    return "processing";
  };

  return (
    <main className="myorders-page">
      <div className="myorders-heading">
        <div>
          <span className="myorders-eyebrow">FOODFLOW</span>
          <h1>My Orders</h1>
          <p>Track your orders and view your purchase history.</p>
        </div>

        <button
          type="button"
          className="myorders-refresh"
          onClick={fetchMyOrders}
          disabled={ordersLoading}
        >
          <span>↻</span>
          {ordersLoading ? "Refreshing..." : "Refresh Orders"}
        </button>
      </div>

      {message && (
        <div className="myorders-message" role="status">
          <span>ℹ️</span>
          {message}
          <button type="button" onClick={() => setMessage("")}>
            ×
          </button>
        </div>
      )}

      {ordersError && (
        <div className="myorders-error" role="alert">
          <p>{ordersError}</p>
          <button
            type="button"
            onClick={fetchMyOrders}
            disabled={ordersLoading}
          >
            Try Again
          </button>
        </div>
      )}

      {ordersLoading && orders.length === 0 && !ordersError && (
        <div className="myorders-empty">
          <div className="myorders-empty-icon">🍽️</div>
          <h2>Loading your orders...</h2>
          <p>Please wait while we fetch your order history.</p>
        </div>
      )}

      {!ordersLoading && !ordersError && orders.length === 0 && (
        <div className="myorders-empty">
          <div className="myorders-empty-icon">🛍️</div>
          <h2>No orders yet</h2>
          <p>Your delicious food orders will appear here.</p>
        </div>
      )}

      {orders.length > 0 && (
        <div className="myorders-list">
          {orders.map((order) => {
            const canPay =
              order.paymentMethod === "ONLINE" &&
              order.paymentStatus !== "PAID" &&
              order.paymentStatus !== "REFUNDED" &&
              order.orderStatus !== "CANCELLED";

            return (
              <article className="myorder-card" key={order._id}>
                <div className="myorder-top">
                  <div className="myorder-identity">
                    <div className="myorder-restaurant-icon">🍴</div>
                    <div>
                      <h2>
                        {order.restaurant?.name || "FoodFlow Restaurant"}
                      </h2>
                      <p>{formatDate(order.createdAt)}</p>
                    </div>
                  </div>

                  <div className="myorder-number">
                    <span>ORDER ID</span>
                    <strong>
                      {order.orderNumber || order._id}
                    </strong>
                  </div>
                </div>

                <div className="myorder-body">
                  <div className="myorder-items-section">
                    <h3>Order Items</h3>

                    {Array.isArray(order.items) &&
                    order.items.length > 0 ? (
                      <ul className="myorder-items">
                        {order.items.map((item, index) => (
                          <li key={item._id || index}>
                            <span>
                              {item.name ||
                                item.food?.name ||
                                item.menuItem?.name ||
                                "Food item"}
                            </span>
                            <strong>× {item.quantity || 1}</strong>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="myorder-muted">No item details available.</p>
                    )}
                  </div>

                  <div className="myorder-status-section">
                    <div className="myorder-status-row">
                      <span>Order Status</span>
                      <strong
                        className={`myorder-badge order-${getOrderClass(
                          order.orderStatus
                        )}`}
                      >
                        {formatStatus(order.orderStatus)}
                      </strong>
                    </div>

                    <div className="myorder-status-row">
                      <span>Payment Status</span>
                      <strong
                        className={`myorder-badge payment-${getPaymentClass(
                          order.paymentStatus
                        )}`}
                      >
                        {formatStatus(order.paymentStatus)}
                      </strong>
                    </div>

                    <div className="myorder-status-row">
                      <span>Payment Method</span>
                      <strong>
                        {formatStatus(order.paymentMethod)}
                      </strong>
                    </div>
                  </div>
                </div>

                <div className="myorder-bottom">
                  <div className="myorder-total">
                    <span>Order Total</span>
                    <strong>{formatCurrency(order.total)}</strong>
                  </div>

                  {canPay && (
                    <button
                      type="button"
                      className="myorder-pay-btn"
                      onClick={() => handlePayment(order._id)}
                      disabled={loading}
                    >
                      {loading ? "Please wait..." : "Pay Now →"}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="myorders-footer-note">
        🔒 Your order and payment information is securely managed by FoodFlow.
      </p>
    </main>
  );
}

export default MyOrders;
