
import { useAuth } from "../context/AuthContext";
import "./Settings.css";

function Settings({ darkMode, toggleTheme }) {
  const { user } = useAuth();

  const displayName = user?.name || "FoodFlow User";
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div>
          <span className="settings-eyebrow">ACCOUNT CONTROL</span>
          <h1>Settings</h1>
          <p>Manage your account and personalize your experience.</p>
        </div>
      </div>

      <div className="settings-layout">

        {/* Sidebar Profile */}
        <aside className="settings-profile-card">
          <div className="profile-avatar">{initial}</div>
          <h2>{displayName}</h2>
          <p>{user?.email || "Your FoodFlow account"}</p>
          <span className="profile-status">● Active Account</span>

          <div className="profile-divider"></div>

          <div className="profile-info">
            <span>ACCOUNT</span>
            <strong>Personal Profile</strong>
          </div>
          <div className="profile-info">
            <span>PLATFORM</span>
            <strong>FoodFlow Customer</strong>
          </div>
        </aside>

        {/* Main Settings */}
        <div className="settings-content">

          <section className="settings-section">
            <div className="section-heading">
              <div className="section-icon">◐</div>
              <div>
                <h2>Appearance</h2>
                <p>Make FoodFlow comfortable for your eyes.</p>
              </div>
            </div>

            <div className="settings-option">
              <div>
                <h3>Dark Mode</h3>
                <p>Choose between light and dark appearance.</p>
              </div>

              <label className="theme-switch">
                <input
                  type="checkbox"
                  checked={darkMode}
                  onChange={toggleTheme}
                />
                <span className="theme-slider"></span>
              </label>
            </div>
          </section>

          <section className="settings-section">
            <div className="section-heading">
              <div className="section-icon">♙</div>
              <div>
                <h2>Account Information</h2>
                <p>Your personal account details.</p>
              </div>
            </div>

            <div className="account-details">
              <div className="account-detail">
                <span>Full Name</span>
                <strong>{user?.name || "Not available"}</strong>
              </div>

              <div className="account-detail">
                <span>Email Address</span>
                <strong>{user?.email || "Not available"}</strong>
              </div>
            </div>
          </section>

          <section className="settings-section settings-about">
            <div className="section-heading">
              <div className="section-icon">✦</div>
              <div>
                <h2>About FoodFlow</h2>
                <p>Your food, your way. Fresh food. Simple payments.</p>
              </div>
            </div>
            <span className="app-version">FoodFlow · Version 1.0</span>
          </section>

        </div>
      </div>
    </div>
  );
}

export default Settings;
