
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";

function Cart() {
  const navigate = useNavigate();

  const {
    cartItems,
    increaseQuantity,
    decreaseQuantity,
    clearCart,
    totalAmount,
  } = useCart();

  return (
    <div className="restaurants-page">
      <h1>My Cart 🛒</h1>

      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <>
          <div className="restaurant-list">
            {cartItems.map((item) => (
              <div className="restaurant-card" key={item._id}>
                {item.image && (
                  <img src={item.image} alt={item.name} />
                )}

                <h2>{item.name}</h2>

                <p>
                  Price: ₹{item.price}
                </p>

                <div className="cart-quantity">
                  <button onClick={() => decreaseQuantity(item._id)}>
                    −
                  </button>

                  <strong style={{ margin: "0 15px" }}>
                    {item.quantity}
                  </strong>

                  <button onClick={() => increaseQuantity(item._id)}>
                    +
                  </button>
                </div>

                <p>
                  Subtotal: ₹{item.price * item.quantity}
                </p>
              </div>
            ))}
          </div>

          <h2>Total Amount: ₹{totalAmount}</h2>

          <button onClick={clearCart}>
            Clear Cart
          </button>

          <button
            onClick={() => navigate("/checkout")}
            style={{ marginLeft: "12px" }}
          >
            Proceed to Checkout →
          </button>
        </>
      )}
    </div>
  );
}

export default Cart;
