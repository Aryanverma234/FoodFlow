
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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
          color: "#16a34a",
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

  return (
    <main className="foodflow-container">
      <section className="foodflow-card">
        <div className="orders-heading">
          <h1>My Orders</h1>

          <button
            type="button"
            className="secondary-button"
            onClick={fetchMyOrders}
            disabled={ordersLoading}
          >
            {ordersLoading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {ordersLoading && orders.length === 0 && (
          <p>Loading your orders...</p>
        )}

        {ordersError && (
          <div className="status-message" role="alert">
            <p>{ordersError}</p>
            <button onClick={fetchMyOrders} disabled={ordersLoading}>
              Try Again
            </button>
          </div>
        )}

        {!ordersLoading && !ordersError && orders.length === 0 && (
          <div className="empty-orders">
            <h3>No orders yet</h3>
            <p>Your food orders will appear here.</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="orders-list">
            {orders.map((order) => {
              const canPay =
                order.paymentMethod === "ONLINE" &&
                order.paymentStatus !== "PAID" &&
                order.paymentStatus !== "REFUNDED" &&
                order.orderStatus !== "CANCELLED";

              return (
                <article className="order-card" key={order._id}>
                  <div className="order-card-header">
                    <div>
                      <h3>{order.orderNumber || "FoodFlow Order"}</h3>
                      <p className="order-date">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <strong className="order-total">
                      {formatCurrency(order.total)}
                    </strong>
                  </div>

                  <div className="order-details">
                    <p>
                      <strong>Restaurant:</strong>{" "}
                      {order.restaurant?.name || "Restaurant"}
                    </p>

                    <p>
                      <strong>Order ID:</strong>{" "}
                      <span className="order-id">{order._id}</span>
                    </p>

                    <p>
                      <strong>Payment Method:</strong>{" "}
                      {formatStatus(order.paymentMethod)}
                    </p>

                    <p>
                      <strong>Payment:</strong>{" "}
                      <span
                        className={`status-badge ${
                          order.paymentStatus === "PAID"
                            ? "status-success"
                            : "status-pending"
                        }`}
                      >
                        {formatStatus(order.paymentStatus)}
                      </span>
                    </p>

                    <p>
                      <strong>Order Status:</strong>{" "}
                      <span className="status-badge">
                        {formatStatus(order.orderStatus)}
                      </span>
                    </p>
                  </div>

                  {Array.isArray(order.items) &&
                    order.items.length > 0 && (
                      <div className="order-items">
                        <strong>Items:</strong>

                        <ul>
                          {order.items.map((item, index) => (
                            <li key={item._id || index}>
                              {item.name ||
                                item.food?.name ||
                                item.menuItem?.name ||
                                "Food item"}{" "}
                              × {item.quantity || 1}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {canPay && (
                    <button
                      type="button"
                      onClick={() => handlePayment(order._id)}
                      disabled={loading}
                    >
                      {loading ? "Please wait..." : "Pay Now"}
                    </button>
                  )}
                </article>
              );
            })}
          </div>
        )}

        {message && (
          <p className="status-message" role="status">
            {message}
          </p>
        )}

        <p className="test-note">
          Razorpay Test Mode integration for FoodFlow.
        </p>
      </section>
    </main>
  );
}

export default MyOrders;
