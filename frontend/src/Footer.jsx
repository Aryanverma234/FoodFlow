import { Link } from "react-router-dom";
import "./Footer.css";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <h2>FoodFlow</h2>
          <p>Fresh food. Simple payments.</p>
        </div>

        <div className="footer-column">
          <h3>Explore</h3>
          <Link to="/">Home</Link>
          <Link to="/restaurants">Restaurants</Link>
          <Link to="/cart">My Cart</Link>
        </div>

        <div className="footer-column">
          <h3>My Account</h3>
          <Link to="/orders">My Orders</Link>
          <Link to="/addresses">My Addresses</Link>
          <Link to="/settings">Account Settings</Link>
        </div>

        <div className="footer-column">
          <h3>About FoodFlow</h3>
          <a href="mailto:support@foodflow.com">Contact Us</a>
          <a href="#about">About Us</a>
          <Link to="/settings">Help & Support</Link>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© 2026 FoodFlow. All rights reserved.</p>
        <p>Made with ❤️ for food lovers.</p>
      </div>
    </footer>
  );
}

export default Footer;