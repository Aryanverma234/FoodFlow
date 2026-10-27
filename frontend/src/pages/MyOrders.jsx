import { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./MyOrders.css";

const API_URL = "http://localhost:5000/api";

const ORDER_STEPS = [
  { key: "PLACED", label: "Placed", icon: "📝" },
  { key: "CONFIRMED", label: "Confirmed", icon: "👍" },
  { key: "PREPARING", label: "Cooking", icon: "🍳" },
  { key: "READY", label: "Ready", icon: "🥡" },
  { key: "OUT_FOR_DELIVERY", label: "On the Way", icon: "🛵" },
  { key: "DELIVERED", label: "Delivered", icon: "✨" },
];

function MyOrders() {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState("");
  const [paymentLoadingId, setPaymentLoadingId] = useState(null);
  const [message, setMessage] = useState("");
  const [copiedOrderId, setCopiedOrderId] = useState(null);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'active' | 'delivered' | 'cancelled'
  const [expandedOrders, setExpandedOrders] = useState({});

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
          "Unable to load your orders. Please check your connection and try again."
      );
    } finally {
      setOrdersLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [token]);

  const toggleExpandOrder = (id) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopyOrderId = (orderNum) => {
    if (!orderNum) return;
    navigator.clipboard?.writeText(orderNum);
    setCopiedOrderId(orderNum);
    setTimeout(() => setCopiedOrderId(null), 2000);
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount ?? 0);

  const formatDate = (date) => {
    if (!date) return "Date unavailable";
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return "Date unavailable";

    return parsedDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatStatus = (status) => {
    if (!status) return "Unknown";
    return status
      .replaceAll("_", " ")
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const getStepIndex = (status) => {
    const statusMap = {
      PLACED: 0,
      CONFIRMED: 1,
      PREPARING: 2,
      READY: 3,
      OUT_FOR_DELIVERY: 4,
      DELIVERED: 5,
    };
    return statusMap[status] ?? 0;
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

    setPaymentLoadingId(selectedOrderId);
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
          setPaymentLoadingId(selectedOrderId);

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

            navigate("/order-success", {
              state: {
                order: verification.data.order || {
                  _id: selectedOrderId,
                },
                paymentMethod: "ONLINE",
                paymentStatus: "PAID",
              },
            });
          } catch (error) {
            setMessage(
              error.response?.data?.message ||
                "Payment verification failed. Check payment status before retrying."
            );
          } finally {
            setPaymentLoadingId(null);
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
      setPaymentLoadingId(null);
    }
  };

  // Filter orders according to active tab
  const filteredOrders = useMemo(() => {
    if (activeTab === "active") {
      return orders.filter(
        (o) => o.orderStatus !== "DELIVERED" && o.orderStatus !== "CANCELLED"
      );
    }
    if (activeTab === "delivered") {
      return orders.filter((o) => o.orderStatus === "DELIVERED");
    }
    if (activeTab === "cancelled") {
      return orders.filter((o) => o.orderStatus === "CANCELLED");
    }
    return orders;
  }, [orders, activeTab]);

  const counts = useMemo(() => {
    const active = orders.filter(
      (o) => o.orderStatus !== "DELIVERED" && o.orderStatus !== "CANCELLED"
    ).length;
    const delivered = orders.filter((o) => o.orderStatus === "DELIVERED").length;
    const cancelled = orders.filter((o) => o.orderStatus === "CANCELLED").length;
    return { all: orders.length, active, delivered, cancelled };
  }, [orders]);

  return (
    <main className="myorders-page">
      {/* ===== HEADER SECTION ===== */}
      <header className="myorders-header">
        <div className="myorders-header-title">
          <span className="myorders-tag">
            <span className="sparkle">✦</span> ORDER HUB
          </span>
          <h1>My Orders</h1>
          <p>Real-time tracking, order history, and payment details.</p>
        </div>

        <button
          type="button"
          className="myorders-refresh-btn"
          onClick={fetchMyOrders}
          disabled={ordersLoading}
          aria-label="Refresh orders"
        >
          <span className={`refresh-icon ${ordersLoading ? "spinning" : ""}`}>
            ↻
          </span>
          <span>{ordersLoading ? "Syncing..." : "Refresh"}</span>
        </button>
      </header>

      {/* ===== STATUS MESSAGE TOAST ===== */}
      {message && (
        <div className="myorders-alert" role="status">
          <div className="alert-content">
            <span className="alert-icon">ℹ</span>
            <span>{message}</span>
          </div>
          <button
            type="button"
            className="alert-close"
            onClick={() => setMessage("")}
            aria-label="Dismiss alert"
          >
            ×
          </button>
        </div>
      )}

      {/* ===== ERROR BANNER ===== */}
      {ordersError && (
        <div className="myorders-error-card" role="alert">
          <span className="error-icon">⚠️</span>
          <div className="error-body">
            <h3>Something went wrong</h3>
            <p>{ordersError}</p>
          </div>
          <button
            type="button"
            className="error-retry-btn"
            onClick={fetchMyOrders}
            disabled={ordersLoading}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ===== FILTER TABS ===== */}
      {!ordersLoading && orders.length > 0 && (
        <nav className="myorders-tabs" aria-label="Order filters">
          <button
            type="button"
            className={`tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Orders <span className="tab-count">{counts.all}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "active" ? "active" : ""}`}
            onClick={() => setActiveTab("active")}
          >
            Active <span className="tab-count pulse-count">{counts.active}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "delivered" ? "active" : ""}`}
            onClick={() => setActiveTab("delivered")}
          >
            Delivered <span className="tab-count">{counts.delivered}</span>
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            Cancelled <span className="tab-count">{counts.cancelled}</span>
          </button>
        </nav>
      )}

      {/* ===== SKELETON LOADING STATE ===== */}
      {ordersLoading && orders.length === 0 && !ordersError && (
        <div className="myorders-skeletons">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card">
              <div className="skeleton-line shimmer title" />
              <div className="skeleton-line shimmer subtitle" />
              <div className="skeleton-box shimmer" />
            </div>
          ))}
        </div>
      )}

      {/* ===== EMPTY STATE ===== */}
      {!ordersLoading && !ordersError && filteredOrders.length === 0 && (
        <div className="myorders-empty-state">
          <div className="empty-badge">
            <span className="empty-emoji">🍱</span>
          </div>
          <h2>
            {activeTab === "all"
              ? "No orders placed yet"
              : `No ${activeTab} orders`}
          </h2>
          <p>
            {activeTab === "all"
              ? "Explore mouth-watering dishes from top restaurants and place your first order now!"
              : `You don't have any orders marked as ${activeTab} right now.`}
          </p>
          <Link to="/restaurants" className="empty-cta-btn">
            Explore Restaurants <span>→</span>
          </Link>
        </div>
      )}

      {/* ===== ORDER CARDS LIST ===== */}
      {filteredOrders.length > 0 && (
        <div className="myorders-grid">
          {filteredOrders.map((order) => {
            const isCancelled = order.orderStatus === "CANCELLED";
            const isDelivered = order.orderStatus === "DELIVERED";
            const isActiveOrder = !isCancelled && !isDelivered;
            const currentStep = getStepIndex(order.orderStatus);

            const isOnline = order.paymentMethod === "ONLINE";
            const isPaid =
              order.paymentStatus === "PAID" ||
              order.paymentStatus === "SUCCESS";
            const canPay =
              isOnline &&
              !isPaid &&
              order.paymentStatus !== "REFUNDED" &&
              !isCancelled;

            const isExpanded = !!expandedOrders[order._id];
            const restaurantName =
              order.restaurant?.name || "FoodFlow Kitchen";
            const orderNum = order.orderNumber || order._id;

            return (
              <article
                className={`order-card ${isActiveOrder ? "card-active" : ""}`}
                key={order._id}
              >
                {/* --- Top Bar --- */}
                <div className="order-card-header">
                  <div className="restaurant-info">
                    <div className="restaurant-avatar">
                      {order.restaurant?.logo ? (
                        <img
                          src={order.restaurant.logo}
                          alt={restaurantName}
                          className="restaurant-logo-img"
                        />
                      ) : (
                        <span className="avatar-fallback">🍴</span>
                      )}
                    </div>
                    <div>
                      <h2 className="restaurant-name">{restaurantName}</h2>
                      <div className="order-meta">
                        <span className="order-date">
                          📅 {formatDate(order.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="order-header-right">
                    <button
                      type="button"
                      className="order-id-pill"
                      onClick={() => handleCopyOrderId(orderNum)}
                      title="Click to copy Order ID"
                    >
                      <span className="id-label">ORDER #</span>
                      <strong>{orderNum.slice(-10)}</strong>
                      <span className="copy-icon">
                        {copiedOrderId === orderNum ? "✓" : "📋"}
                      </span>
                    </button>

                    <div className="status-badges-wrap">
                      <span
                        className={`status-pill status-${order.orderStatus.toLowerCase()}`}
                      >
                        <span className="pill-dot" />
                        {formatStatus(order.orderStatus)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* --- Live Progress Stepper (Active Orders) --- */}
                {isActiveOrder && (
                  <div className="order-tracker">
                    <div className="tracker-line">
                      <div
                        className="tracker-progress-fill"
                        style={{
                          width: `${(currentStep / (ORDER_STEPS.length - 1)) * 100}%`,
                        }}
                      />
                    </div>
                    <div className="tracker-steps">
                      {ORDER_STEPS.map((step, idx) => {
                        const isDone = idx <= currentStep;
                        const isCurrent = idx === currentStep;
                        return (
                          <div
                            key={step.key}
                            className={`tracker-step ${isDone ? "step-done" : ""} ${
                              isCurrent ? "step-current" : ""
                            }`}
                          >
                            <div className="step-circle">
                              {isCurrent ? (
                                <span className="step-pulsing-icon">
                                  {step.icon}
                                </span>
                              ) : isDone ? (
                                "✓"
                              ) : (
                                idx + 1
                              )}
                            </div>
                            <span className="step-label">{step.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* --- Cancelled Banner if cancelled --- */}
                {isCancelled && (
                  <div className="order-cancelled-banner">
                    <span className="cancel-icon">✕</span>
                    <div>
                      <strong>Order was cancelled</strong>
                      {order.cancellationReason && (
                        <p>Reason: {order.cancellationReason}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* --- Items List --- */}
                <div className="order-card-body">
                  <div className="order-items-header">
                    <h3>
                      Items (
                      {order.items?.reduce(
                        (sum, it) => sum + (it.quantity || 1),
                        0
                      ) || 0}
                      )
                    </h3>
                  </div>

                  <ul className="order-items-list">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((item, idx) => (
                        <li className="order-item-row" key={item._id || idx}>
                          <div className="item-details">
                            <span className="veg-badge" aria-hidden="true">
                              <span className="veg-dot" />
                            </span>
                            <span className="item-name">{item.name}</span>
                            <span className="item-qty">
                              × {item.quantity || 1}
                            </span>
                          </div>
                          <span className="item-price">
                            {formatCurrency(
                              item.subtotal ||
                                (item.price || 0) * (item.quantity || 1)
                            )}
                          </span>
                        </li>
                      ))
                    ) : (
                      <li className="order-items-empty">No items listed.</li>
                    )}
                  </ul>

                  {/* --- Expandable Details Toggle --- */}
                  <button
                    type="button"
                    className="details-toggle-btn"
                    onClick={() => toggleExpandOrder(order._id)}
                  >
                    <span>
                      {isExpanded
                        ? "Hide Delivery & Bill Details"
                        : "View Delivery Address & Bill Details"}
                    </span>
                    <span className={`toggle-arrow ${isExpanded ? "up" : ""}`}>
                      ▾
                    </span>
                  </button>

                  {isExpanded && (
                    <div className="order-expanded-details">
                      {/* Address Snapshot */}
                      {order.deliveryAddress && (
                        <div className="address-snapshot">
                          <h4>📍 Delivery Address</h4>
                          <p className="addr-recipient">
                            <strong>{order.deliveryAddress.fullName}</strong> •{" "}
                            {order.deliveryAddress.phone}
                          </p>
                          <p className="addr-text">
                            {order.deliveryAddress.addressLine1}
                            {order.deliveryAddress.addressLine2
                              ? `, ${order.deliveryAddress.addressLine2}`
                              : ""}
                            {order.deliveryAddress.landmark
                              ? ` (Near ${order.deliveryAddress.landmark})`
                              : ""}
                            , {order.deliveryAddress.city},{" "}
                            {order.deliveryAddress.state} -{" "}
                            {order.deliveryAddress.pincode}
                          </p>
                        </div>
                      )}

                      {/* Bill Breakdown */}
                      <div className="bill-snapshot">
                        <h4>🧾 Bill Summary</h4>
                        <div className="bill-row">
                          <span>Subtotal</span>
                          <span>{formatCurrency(order.subtotal)}</span>
                        </div>
                        {order.deliveryFee > 0 ? (
                          <div className="bill-row">
                            <span>Delivery Fee</span>
                            <span>{formatCurrency(order.deliveryFee)}</span>
                          </div>
                        ) : (
                          <div className="bill-row">
                            <span>Delivery Fee</span>
                            <span className="text-free">FREE</span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="bill-row text-discount">
                            <span>Coupon & Discount</span>
                            <span>- {formatCurrency(order.discount)}</span>
                          </div>
                        )}
                        <div className="bill-row grand-total">
                          <strong>Grand Total</strong>
                          <strong>{formatCurrency(order.total)}</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* --- Bottom Footer Bar --- */}
                <div className="order-card-footer">
                  <div className="order-footer-left">
                    <div className="payment-method-tag">
                      <span className="payment-icon">
                        {isOnline ? "💳" : "💵"}
                      </span>
                      <span>
                        {isOnline ? "Online Payment" : "Cash on Delivery (COD)"}
                      </span>
                    </div>

                    <span
                      className={`payment-status-pill payment-${order.paymentStatus?.toLowerCase()}`}
                    >
                      {isPaid
                        ? "✓ Paid"
                        : order.paymentStatus === "FAILED"
                        ? "✕ Payment Failed"
                        : isOnline
                        ? "⏳ Payment Pending"
                        : "Pay on Delivery"}
                    </span>
                  </div>

                  <div className="order-footer-right">
                    <div className="order-total-badge">
                      <span className="total-label">Total Amount</span>
                      <span className="total-value">
                        {formatCurrency(order.total)}
                      </span>
                    </div>

                    {canPay && (
                      <button
                        type="button"
                        className="order-pay-now-btn"
                        onClick={() => handlePayment(order._id)}
                        disabled={paymentLoadingId === order._id}
                      >
                        {paymentLoadingId === order._id ? (
                          <>
                            <span className="btn-spinner" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <span>Pay Now</span>
                            <span className="btn-arrow">→</span>
                          </>
                        )}
                      </button>
                    )}

                    {isDelivered && order.restaurant?._id && (
                      <Link
                        to={`/menu/${order.restaurant._id}`}
                        className="order-reorder-btn"
                      >
                        <span>Reorder</span>
                        <span>↺</span>
                      </Link>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* ===== FOOTER SECURITY NOTE ===== */}
      <footer className="myorders-footer">
        <span className="shield-icon">🛡️</span>
        <span>
          End-to-end encrypted order tracking with secure payments powered by{" "}
          <strong>Razorpay</strong>.
        </span>
      </footer>
    </main>
  );
}

export default MyOrders;
