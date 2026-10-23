import { useState } from "react";
import axios from "axios";
import "./App.css";

const API_URL = "http://localhost:5000/api";

function App() {
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
const [token, setToken] = useState("");
const [orderId, setOrderId] = useState("");
const [message, setMessage] = useState("");
const [loading, setLoading] = useState(false);

const handleLogin = async (event) => {
event.preventDefault();
setLoading(true);
setMessage("");

try {
  const response = await axios.post(`${API_URL}/auth/login`, {
    email,
    password,
  });

  setToken(response.data.token);
  setMessage(`Welcome, ${response.data.user.name}! Login successful.`);
  setPassword("");
} catch (error) {
  setMessage(
    error.response?.data?.message || "Login failed. Check the backend."
  );
} finally {
  setLoading(false);
}

};

const handlePayment = async () => {
if (!token) {
setMessage("Please login first.");
return;
}

if (!/^[0-9a-fA-F]{24}$/.test(orderId)) {
  setMessage("Please enter a valid order ID.");
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
    { orderId },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const {
    keyId,
    razorpayOrderId,
    amount,
    currency,
  } = response.data;

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
            orderId,
            razorpay_order_id: paymentResponse.razorpay_order_id,
            razorpay_payment_id: paymentResponse.razorpay_payment_id,
            razorpay_signature: paymentResponse.razorpay_signature,
          },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setMessage(
          verification.data.message || "Payment verified successfully!"
        );
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
        setMessage("Payment window closed. Check order status before retrying.");
      },
    },

    theme: {
      color: "#16a34a",
    },
  };

  const checkout = new window.Razorpay(options);

  checkout.on("payment.failed", (event) => {
    setMessage(
      event.error?.description || "Payment failed. Please check the order status."
    );
  });

  checkout.open();
} catch (error) {
  setMessage(
    error.response?.data?.message ||
      "Unable to start payment. Check your order ID and login."
  );
} finally {
  setLoading(false);
}

};

return ( <main className="foodflow-container"> <section className="foodflow-card"> <h1>FoodFlow</h1> <p className="subtitle">Fresh food. Simple payments.</p>

    {!token ? (
      <form onSubmit={handleLogin} className="foodflow-form">
        <h2>Customer Login</h2>

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Enter your email"
          autoComplete="username"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Enter your password"
          autoComplete="current-password"
          required
        />

        <button type="submit" disabled={loading}>
          {loading ? "Please wait..." : "Login"}
        </button>
      </form>
    ) : (
      <section className="foodflow-form">
        <h2>Pay for Your Order</h2>

        <label htmlFor="orderId">Order ID</label>
        <input
          id="orderId"
          type="text"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value.trim())}
          placeholder="Paste your order ID"
          required
        />

        <button onClick={handlePayment} disabled={loading}>
          {loading ? "Please wait..." : "Pay with Razorpay"}
        </button>

        <button
          type="button"
          className="secondary-button"
          onClick={() => {
            setToken("");
            setOrderId("");
            setMessage("");
          }}
          disabled={loading}
        >
          Logout
        </button>
      </section>
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

export default App;
