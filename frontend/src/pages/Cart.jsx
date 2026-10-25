
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "./Cart.css";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalAmount,
    cartLoading,
    cartError,
  } = useCart();

  const deliveryFee = 0;
  const grandTotal = totalAmount + deliveryFee;

  if (cartLoading && cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="cart-empty-state">
          <h2>Loading your cart...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="cart-heading">
        <div>
          <span className="cart-eyebrow">YOUR FOOD JOURNEY</span>
          <h1>My Cart <span>🛒</span></h1>
          <p>Review your favourite food before checkout.</p>
        </div>

        <div className="cart-count-badge">
          {cartItems.reduce((sum, item) => sum + item.quantity, 0)} Items
        </div>
      </div>

      {cartError && (
        <div className="cart-error">{cartError}</div>
      )}

      {cartItems.length === 0 ? (
        <div className="cart-empty-state">
          <div className="cart-empty-icon">🛒</div>
          <h2>Your cart is feeling lonely!</h2>
          <p>Looks like you haven't added anything delicious yet.</p>
          <button onClick={() => navigate("/restaurants")}>
            Explore Restaurants →
          </button>
        </div>
      ) : (
        <div className="cart-layout">
          <section className="cart-items-section">
            <div className="cart-section-heading">
              <h2>Your Items</h2>
              <button
                className="cart-clear-button"
                onClick={clearCart}
                disabled={cartLoading}
              >
                Clear Cart
              </button>
            </div>

            <div className="cart-items-list">
              {cartItems.map((item) => (
                <article className="cart-item-card" key={item._id}>
                  <div className="cart-item-image">
                    {item.image ? (
                      <img src={item.image} alt={item.name} />
                    ) : (
                      <span>🍽️</span>
                    )}
                  </div>

                  <div className="cart-item-details">
                    <h3>{item.name}</h3>
                    <p className="cart-item-unit-price">
                      ₹{item.price} <span>per item</span>
                    </p>

                    <div className="cart-item-bottom">
                      <div className="cart-quantity">
                        <button
                          onClick={() => decreaseQuantity(item._id)}
                          disabled={cartLoading}
                          aria-label={`Decrease ${item.name}`}
                        >
                          −
                        </button>

                        <strong>{item.quantity}</strong>

                        <button
                          onClick={() => increaseQuantity(item._id)}
                          disabled={cartLoading}
                          aria-label={`Increase ${item.name}`}
                        >
                          +
                        </button>
                      </div>

                      <strong className="cart-item-subtotal">
                        ₹{item.price * item.quantity}
                      </strong>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button
              className="cart-continue-button"
              onClick={() => navigate(-1)}
            >
              ← Continue Shopping
            </button>
          </section>

          <aside className="cart-summary">
            <h2>Order Summary</h2>

            <div className="cart-summary-row">
              <span>Items Total</span>
              <span>₹{totalAmount}</span>
            </div>

            <div className="cart-summary-row">
              <span>Delivery Fee</span>
              <span className="cart-free">FREE</span>
            </div>

            <div className="cart-summary-divider"></div>

            <div className="cart-summary-total">
              <strong>Grand Total</strong>
              <strong>₹{grandTotal}</strong>
            </div>

            <p className="cart-summary-note">
              Taxes and final charges, if any, will be shown at checkout.
            </p>

            <button
              className="cart-checkout-button"
              onClick={() => navigate("/checkout")}
            >
              Proceed to Checkout <span>→</span>
            </button>

            <div className="cart-safe-note">
              🔒 Secure checkout
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

export default Cart;
