
import { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import "./OrderSuccess.css";

function OrderSuccess() {
  const { state } = useLocation();
  const audioContextRef = useRef(null);

  const order = state?.order;
  const paymentMethod = state?.paymentMethod || "COD";
  const paymentStatus = state?.paymentStatus || order?.paymentStatus;

  const isOnline = paymentMethod === "ONLINE";
  const isPaid =
    paymentStatus === "PAID" || paymentStatus === "SUCCESS";

  const isConfirmed = !isOnline || isPaid;

  const orderId = order?._id || order?.id;

  const playSuccessSound = async () => {
    try {
      const AudioContext =
        window.AudioContext || window.webkitAudioContext;

      if (!AudioContext) return;

      const context =
        audioContextRef.current || new AudioContext();

      audioContextRef.current = context;

      if (context.state === "suspended") {
        await context.resume();
      }

      const notes = [523.25, 659.25, 783.99];

      notes.forEach((frequency, index) => {
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        const startTime = context.currentTime + index * 0.14;

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.setValueAtTime(0.001, startTime);
        gain.gain.exponentialRampToValueAtTime(
          0.16,
          startTime + 0.04
        );
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          startTime + 0.32
        );

        oscillator.connect(gain);
        gain.connect(context.destination);

        oscillator.start(startTime);
        oscillator.stop(startTime + 0.34);
      });
    } catch (error) {
      console.log("Success sound could not play:", error);
    }
  };

  useEffect(() => {
    if (isConfirmed) {
      playSuccessSound();
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
    };
  }, [isConfirmed]);

  const message = isOnline
    ? isPaid
      ? "Payment received successfully! Your delicious food is now being prepared."
      : "Your order has been created. Please complete your payment from My Orders."
    : "Your order is confirmed! Get ready for something delicious.";

  return (
    <main className="order-success-page">
      <div className="success-glow success-glow-one" />
      <div className="success-glow success-glow-two" />

      <section className="success-card">
        <div className="success-confetti" aria-hidden="true">
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
          <span>✧</span>
          <span>✦</span>
          <span>✧</span>
        </div>

        <div className="success-icon-wrap">
          <div className="success-icon">
            <svg viewBox="0 0 52 52" aria-hidden="true">
              <path d="M14 27 L22 35 L39 17" />
            </svg>
          </div>
        </div>

        <span className="success-eyebrow">
          {isOnline && !isPaid ? "ORDER CREATED" : "ORDER CONFIRMED"}
        </span>

        <h1>
          {isOnline && !isPaid
            ? "Almost there!"
            : "Order Successfully Placed!"}
        </h1>

        <p className="success-message">{message}</p>

        {orderId && (
          <div className="success-order-info">
            <span>YOUR ORDER ID</span>
            <strong>{orderId}</strong>
          </div>
        )}

        <div className="success-status">
          <span className="status-dot" />
          {isOnline && !isPaid
            ? "Payment pending"
            : isOnline
              ? "Payment successful"
              : "Order confirmed"}
        </div>

        <div className="success-actions">
          <Link to="/orders" className="view-orders-btn">
            View My Orders <span>→</span>
          </Link>

          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>

        <p className="success-footer">
          Thank you for choosing <strong>FoodFlow</strong> ❤️
        </p>
      </section>
    </main>
  );
}

export default OrderSuccess;
