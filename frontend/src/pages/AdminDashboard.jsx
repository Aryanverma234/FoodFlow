import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5000/api";

const menuItems = [
  { id: "overview", icon: "📊", label: "Overview" },
  { id: "restaurants", icon: "🏪", label: "Restaurants" },
  { id: "owners", icon: "👥", label: "Restaurant Owners" },
  { id: "orders", icon: "🛍️", label: "All Orders" },
];

function AdminDashboard() {
  const { user, token } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ownersLoading, setOwnersLoading] = useState(true);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [approvingId, setApprovingId] = useState("");
  const [creatingOwner, setCreatingOwner] = useState(false);

  const [showOwnerForm, setShowOwnerForm] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [ownerForm, setOwnerForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const authConfig = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  // FETCH RESTAURANTS
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/admin/restaurants`,
        authConfig
      );

      setRestaurants(response.data.restaurants || []);
console.log(
  "FULL RESTAURANT DATA:",
  JSON.stringify(response.data.restaurants, null, 2)
);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Restaurants load nahi ho paye."
      );
    } finally {
      setLoading(false);
    }
  };

  // FETCH RESTAURANT OWNERS
  const fetchOwners = async () => {
    try {
      setOwnersLoading(true);

      const response = await axios.get(
        `${API_URL}/admin/owners`,
        authConfig
      );

      setOwners(response.data.owners || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Restaurant owners load nahi ho paye."
      );
    } finally {
      setOwnersLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchRestaurants();
      fetchOwners();
    }
  }, [token]);

  // CHANGE SECTION
  const handleSectionChange = (section) => {
    setActiveSection(section);
    setSidebarOpen(false);
    setError("");
    setSuccess("");

    window.history.replaceState(null, "", `#${section}`);
  };

  // APPROVE RESTAURANT
  const handleApprove = async (restaurantId) => {
    try {
      setApprovingId(restaurantId);
      setError("");
      setSuccess("");

      const response = await axios.patch(
        `${API_URL}/admin/restaurants/${restaurantId}/approve`,
        {},
        authConfig
      );

      setSuccess(
        response.data.message ||
          "Restaurant approved successfully!"
      );

      await fetchRestaurants();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Restaurant approve nahi ho paya."
      );
    } finally {
      setApprovingId("");
    }
  };

  // OWNER FORM INPUT
  const handleOwnerInput = (e) => {
    const { name, value } = e.target;

    setOwnerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // CREATE RESTAURANT OWNER
  const handleCreateOwner = async (e) => {
    e.preventDefault();

    try {
      setCreatingOwner(true);
      setError("");
      setSuccess("");

      const response = await axios.post(
        `${API_URL}/admin/owners`,
        ownerForm,
        authConfig
      );

      setSuccess(
        response.data.message ||
          "Restaurant owner created successfully!"
      );

      setOwnerForm({
        name: "",
        email: "",
        phone: "",
        password: "",
      });

      setShowOwnerForm(false);

      await fetchOwners();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Restaurant owner create nahi ho paya."
      );
    } finally {
      setCreatingOwner(false);
    }
  };

  // FORMAT ADDRESS
  const getAddress = (address) => {
    if (typeof address === "object" && address !== null) {
      return [
        address.street,
        address.city,
        address.state,
        address.pincode,
      ]
        .filter(Boolean)
        .join(", ") || "N/A";
    }

    return address || "N/A";
  };

  // GET RESTAURANT IMAGE
  const getRestaurantImage = (restaurant) => {
    const possibleImages = [
      restaurant.coverImage,
      restaurant.logo,
      restaurant.image,
      restaurant.imageUrl,
      restaurant.restaurantImage,
      restaurant.images?.[0],
    ];

    const image = possibleImages.find(Boolean);

    if (!image) return "";

    // Handle Cloudinary or other image objects
    if (typeof image === "object") {
      const imageUrl =
        image.url ||
        image.secure_url ||
        image.path ||
        image.src;

      if (!imageUrl) return "";

      return getValidImageUrl(imageUrl);
    }

    return getValidImageUrl(image);
  };

  // FORMAT IMAGE URL
  const getValidImageUrl = (image) => {
    if (typeof image !== "string") return "";

    const cleanImage = image.trim();

    if (!cleanImage) return "";

    // Full image URL
    if (
      cleanImage.startsWith("https://") ||
      cleanImage.startsWith("http://") ||
      cleanImage.startsWith("data:image/")
    ) {
      return cleanImage;
    }

    // Protocol-relative URL
    if (cleanImage.startsWith("//")) {
      return `https:${cleanImage}`;
    }

    // Backend-relative image path
    return `http://localhost:5000${
      cleanImage.startsWith("/") ? "" : "/"
    }${cleanImage}`;
  };

  // COUNTS
  const pendingCount = restaurants.filter(
    (restaurant) => !restaurant.isApproved
  ).length;

  const approvedCount = restaurants.length - pendingCount;

  const currentSection =
    menuItems.find((item) => item.id === activeSection) ||
    menuItems[0];

  // DASHBOARD STATS
  const stats = [
    {
      icon: "🏪",
      title: "Total Restaurants",
      value: restaurants.length,
      note: "Registered restaurants",
    },
    {
      icon: "👥",
      title: "Restaurant Owners",
      value: owners.length,
      note: "Registered owner accounts",
    },
    {
      icon: "🛍️",
      title: "Total Orders",
      value: "—",
      note: "Orders API pending",
    },
    {
      icon: "⏳",
      title: "Pending Approvals",
      value: pendingCount,
      note: "Awaiting review",
    },
  ];

  return (
    <div className="admin-layout">
      {/* SIDEBAR OVERLAY */}
      {sidebarOpen && (
        <button
          type="button"
          className="admin-sidebar-overlay"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`admin-sidebar ${
          sidebarOpen ? "admin-sidebar-open" : ""
        }`}
      >
        <div className="admin-brand">
          <span className="admin-brand-icon">F</span>
          <span>FoodFlow</span>
        </div>

        <p className="admin-sidebar-label">MAIN MENU</p>

        <nav className="admin-side-nav">
          {menuItems.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`admin-nav-link ${
                activeSection === item.id ? "active" : ""
              }`}
              onClick={() => handleSectionChange(item.id)}
            >
              <span>{item.icon}</span>

              {item.label}

              {activeSection === item.id && (
                <span className="admin-nav-indicator">●</span>
              )}
            </button>
          ))}
        </nav>

        <div className="admin-sidebar-bottom">
          <div className="admin-profile">
            <div className="admin-avatar">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{user?.name || "Admin"}</strong>
              <small>Administrator</small>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="admin-main">
        {/* TOPBAR */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-menu-toggle"
              onClick={() => setSidebarOpen((prev) => !prev)}
              aria-label="Toggle navigation"
            >
              ☰
            </button>

            <div>
              <p className="admin-breadcrumb">
                FoodFlow / Admin / {currentSection.label}
              </p>

              <h2>{currentSection.label}</h2>
            </div>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-status">
              <span className="admin-status-dot" />
              Admin Panel
            </span>

            <div className="admin-top-avatar">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="admin-content">
          {/* ERROR MESSAGE */}
          {error && (
            <div className="admin-alert admin-alert-error">
              {error}

              <button
                type="button"
                onClick={() => setError("")}
              >
                ×
              </button>
            </div>
          )}

          {/* SUCCESS MESSAGE */}
          {success && (
            <div className="admin-alert admin-alert-success">
              {success}

              <button
                type="button"
                onClick={() => setSuccess("")}
              >
                ×
              </button>
            </div>
          )}

          {/* =========================
              OVERVIEW
          ========================= */}
          {activeSection === "overview" && (
            <>
              <section className="admin-welcome">
                <div>
                  <span className="admin-eyebrow">
                    ADMINISTRATION
                  </span>

                  <h1>
                    Welcome back, {user?.name || "Admin"} 👋
                  </h1>

                  <p>
                    Manage your restaurants, owners and orders
                    from one place.
                  </p>
                </div>

                <div className="admin-welcome-icon">🍽️</div>
              </section>

              {/* STATS */}
              <section className="admin-stats-grid">
                {stats.map((stat) => (
                  <article
                    className="admin-stat-card"
                    key={stat.title}
                  >
                    <div className="admin-stat-top">
                      <span className="admin-stat-icon">
                        {stat.icon}
                      </span>

                      <span className="admin-stat-menu">
                        •••
                      </span>
                    </div>

                    <p>{stat.title}</p>

                    <h2>
                      {loading || ownersLoading
                        ? "..."
                        : stat.value}
                    </h2>

                    <small>{stat.note}</small>
                  </article>
                ))}
              </section>

              {/* APPROVAL SUMMARY */}
              <section className="admin-section admin-overview-summary">
                <div className="admin-section-heading">
                  <div>
                    <span className="admin-eyebrow">
                      QUICK SUMMARY
                    </span>

                    <h2>Restaurant Approvals</h2>

                    <p>
                      Current restaurant approval status.
                    </p>
                  </div>

                  <span className="admin-section-icon">🏪</span>
                </div>

                <div className="admin-approval-summary">
                  <div>
                    <span className="admin-summary-number">
                      {approvedCount}
                    </span>

                    <span>Approved Restaurants</span>
                  </div>

                  <div>
                    <span className="admin-summary-number">
                      {pendingCount}
                    </span>

                    <span>Pending Approvals</span>
                  </div>

                  <button
                    type="button"
                    className="admin-primary-btn"
                    onClick={() =>
                      handleSectionChange("restaurants")
                    }
                  >
                    Manage Restaurants →
                  </button>
                </div>
              </section>

              {/* QUICK ACCESS */}
              <section className="admin-section">
                <div className="admin-section-heading">
                  <div>
                    <span className="admin-eyebrow">
                      QUICK ACCESS
                    </span>

                    <h2>Manage FoodFlow</h2>

                    <p>
                      Jump directly to a management section.
                    </p>
                  </div>
                </div>

                <div className="admin-quick-links">
                  {menuItems
                    .filter((item) => item.id !== "overview")
                    .map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() =>
                          handleSectionChange(item.id)
                        }
                      >
                        <span>{item.icon}</span>

                        <strong>{item.label}</strong>

                        <span className="admin-quick-arrow">
                          →
                        </span>
                      </button>
                    ))}
                </div>
              </section>
            </>
          )}

          {/* =========================
              RESTAURANTS
          ========================= */}
          {activeSection === "restaurants" && (
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <span className="admin-eyebrow">
                    BUSINESS MANAGEMENT
                  </span>

                  <h2>Restaurant Management</h2>

                  <p>
                    Review restaurants and manage their approval.
                  </p>
                </div>

                <span className="admin-section-icon">🏪</span>
              </div>

              {/* TOOLBAR */}
              <div className="admin-management-toolbar">
                <div className="admin-approval-counts">
                  <span className="admin-count-approved">
                    ✓ Approved: {approvedCount}
                  </span>

                  <span className="admin-count-pending">
                    ⏳ Pending: {pendingCount}
                  </span>
                </div>

                <button
                  type="button"
                  className="admin-outline-btn"
                  onClick={fetchRestaurants}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "↻ Refresh"}
                </button>
              </div>

              {/* LOADING */}
              {loading ? (
                <div className="admin-empty-state">
                  <div>⏳</div>

                  <h3>Loading restaurants...</h3>

                  <p>
                    Please wait while we fetch restaurant details.
                  </p>
                </div>
              ) : restaurants.length === 0 ? (
                /* NO RESTAURANTS */
                <div className="admin-empty-state">
                  <div>🏪</div>

                  <h3>No restaurants found</h3>

                  <p>
                    New restaurant registrations will appear here.
                  </p>
                </div>
              ) : (
                /* RESTAURANT LIST */
                <div className="admin-restaurant-list">
                  {restaurants.map((restaurant) => {
                    const imageUrl =
                      getRestaurantImage(restaurant);

                    return (
                      <article
                        className="admin-restaurant-card"
                        key={restaurant._id}
                      >
                        {/* RESTAURANT IMAGE */}
                        <div className="admin-restaurant-image">
                          {imageUrl && (
                            <img
                              src={imageUrl}
                              alt={restaurant.name || "Restaurant"}
                              loading="lazy"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";

                                const fallback =
                                  e.currentTarget.parentElement?.querySelector(
                                    ".admin-restaurant-image-fallback"
                                  );

                                if (fallback) {
                                  fallback.style.display = "flex";
                                }
                              }}
                            />
                          )}

                          {/* FALLBACK IMAGE */}
                          <div
                            className="admin-restaurant-image-fallback"
                            style={{
                              display: imageUrl ? "none" : "flex",
                            }}
                          >
                            <span className="admin-fallback-icon">
                              🍽️
                            </span>

                            <span>{restaurant.name}</span>
                          </div>

                          {/* APPROVAL STATUS */}
                          <span
                            className={`admin-image-status ${
                              restaurant.isApproved
                                ? "is-approved"
                                : "is-pending"
                            }`}
                          >
                            {restaurant.isApproved
                              ? "✓ APPROVED"
                              : "⏳ PENDING"}
                          </span>
                        </div>

                        {/* RESTAURANT NAME */}
                        <div className="admin-restaurant-card-top">
                          <div>
                            <h3>{restaurant.name}</h3>

                            <p>
                              {restaurant.description ||
                                "Welcome to our restaurant."}
                            </p>
                          </div>
                        </div>

                        {/* RESTAURANT DETAILS */}
                        <div className="admin-restaurant-details">
                          <p>
                            <strong>👤 Owner</strong>

                            <span>
                              {restaurant.owner?.name || "Unknown"}
                            </span>
                          </p>

                          <p>
                            <strong>✉️ Email</strong>

                            <span>
                              {restaurant.owner?.email || "N/A"}
                            </span>
                          </p>

                          <p>
                            <strong>📞 Phone</strong>

                            <span>
                              {restaurant.phone || "N/A"}
                            </span>
                          </p>

                          <p>
                            <strong>🍴 Cuisine</strong>

                            <span>
                              {Array.isArray(restaurant.cuisine)
                                ? restaurant.cuisine.join(", ")
                                : restaurant.cuisine || "N/A"}
                            </span>
                          </p>

                          <p>
                            <strong>🕒 Delivery Time</strong>

                            <span>
                              {restaurant.deliveryTime || "N/A"}
                              {restaurant.deliveryTime ? " minutes" : ""}
                            </span>
                          </p>

                          <p>
                            <strong>💰 Minimum Order</strong>

                            <span>
                              {restaurant.minimumOrder != null
                                ? `₹${restaurant.minimumOrder}`
                                : "N/A"}
                            </span>
                          </p>

                          <p className="admin-address-detail">
                            <strong>📍 Address</strong>

                            <span>
                              {getAddress(restaurant.address)}
                            </span>
                          </p>
                        </div>

                        {/* APPROVE BUTTON */}
                        {!restaurant.isApproved && (
                          <div className="admin-restaurant-card-actions">
                            <button
                              type="button"
                              className="admin-primary-btn"
                              disabled={
                                approvingId === restaurant._id
                              }
                              onClick={() =>
                                handleApprove(restaurant._id)
                              }
                            >
                              {approvingId === restaurant._id
                                ? "Approving..."
                                : "✓ Approve Restaurant"}
                            </button>
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* =========================
              RESTAURANT OWNERS
          ========================= */}
          {activeSection === "owners" && (
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <span className="admin-eyebrow">
                    ACCOUNT MANAGEMENT
                  </span>

                  <h2>Restaurant Owners</h2>

                  <p>
                    Create and manage independent restaurant owner
                    accounts.
                  </p>
                </div>

                <span className="admin-section-icon">👥</span>
              </div>

              {/* OWNER TOOLBAR */}
              <div className="admin-management-toolbar">
                <div>
                  <span className="admin-owner-total">
                    {owners.length}
                  </span>

                  <span>Total Restaurant Owners</span>
                </div>

                <button
                  type="button"
                  className="admin-primary-btn"
                  onClick={() => {
                    setShowOwnerForm((prev) => !prev);
                    setError("");
                    setSuccess("");
                  }}
                >
                  {showOwnerForm
                    ? "✕ Close Form"
                    : "+ Add Restaurant Owner"}
                </button>
              </div>

              {/* CREATE OWNER FORM */}
              {showOwnerForm && (
                <form
                  onSubmit={handleCreateOwner}
                  className="admin-owner-form"
                >
                  <div className="admin-subheading">
                    <h3>Create Owner Account</h3>

                    <p>
                      Enter the details to register a new restaurant
                      owner.
                    </p>
                  </div>

                  <div className="admin-owner-form-grid">
                    <label>
                      Full Name

                      <input
                        type="text"
                        name="name"
                        value={ownerForm.name}
                        onChange={handleOwnerInput}
                        placeholder="Enter owner's full name"
                        required
                      />
                    </label>

                    <label>
                      Email Address

                      <input
                        type="email"
                        name="email"
                        value={ownerForm.email}
                        onChange={handleOwnerInput}
                        placeholder="owner@example.com"
                        required
                      />
                    </label>

                    <label>
                      Phone Number

                      <input
                        type="tel"
                        name="phone"
                        value={ownerForm.phone}
                        onChange={handleOwnerInput}
                        placeholder="Enter phone number"
                      />
                    </label>

                    <label>
                      Password

                      <input
                        type="password"
                        name="password"
                        value={ownerForm.password}
                        onChange={handleOwnerInput}
                        placeholder="Minimum 6 characters"
                        minLength={6}
                        required
                      />
                    </label>
                  </div>

                  <button
                    type="submit"
                    className="admin-primary-btn"
                    disabled={creatingOwner}
                  >
                    {creatingOwner
                      ? "Creating Account..."
                      : "Create Restaurant Owner"}
                  </button>
                </form>
              )}

              {/* OWNER LOADING */}
              {ownersLoading ? (
                <p>Loading restaurant owners...</p>
              ) : owners.length === 0 ? (
                <div className="admin-empty-state">
                  <div>👥</div>

                  <h3>No restaurant owners found</h3>

                  <p>
                    Create an owner account to get started.
                  </p>
                </div>
              ) : (
                /* OWNER LIST */
                <div className="admin-owner-grid">
                  {owners.map((owner) => {
                    const linkedRestaurants = restaurants.filter(
                      (restaurant) => {
                        const ownerId =
                          restaurant.owner?._id ||
                          restaurant.owner;

                        return String(ownerId) === String(owner._id);
                      }
                    );

                    return (
                      <article
                        className="admin-owner-card"
                        key={owner._id}
                      >
                        <div className="admin-owner-card-top">
                          <div className="admin-owner-avatar">
                            {(owner.name || "O")
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span
                            className={
                              owner.isActive
                                ? "admin-owner-active"
                                : "admin-owner-inactive"
                            }
                          >
                            {owner.isActive
                              ? "● Active"
                              : "● Inactive"}
                          </span>
                        </div>

                        <h3>{owner.name}</h3>

                        <p className="admin-owner-email">
                          {owner.email}
                        </p>

                        <div className="admin-owner-info">
                          <span>
                            📞 {owner.phone || "Phone not added"}
                          </span>

                          <span>
                            🏪 {linkedRestaurants.length} Restaurant(s)
                          </span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* REFRESH OWNERS */}
              <button
                type="button"
                className="admin-outline-btn admin-refresh-owners"
                onClick={fetchOwners}
                disabled={ownersLoading}
              >
                {ownersLoading ? "Loading..." : "↻ Refresh Owners"}
              </button>
            </section>
          )}

          {/* =========================
              ALL ORDERS
          ========================= */}
          {activeSection === "orders" && (
            <section className="admin-section">
              <div className="admin-section-heading">
                <div>
                  <span className="admin-eyebrow">
                    ORDER MANAGEMENT
                  </span>

                  <h2>All Orders</h2>

                  <p>
                    Monitor and manage customer orders across
                    restaurants.
                  </p>
                </div>

                <span className="admin-section-icon">🛍️</span>
              </div>

              <div className="admin-empty-state admin-orders-empty">
                <div>📦</div>

                <h3>Order data will appear here</h3>

                <p>
                  Connect the admin orders API to view all restaurant
                  orders.
                </p>
              </div>
            </section>
          )}

          {/* FOOTER */}
          <footer className="admin-page-footer">
            <span>
              © {new Date().getFullYear()} FoodFlow Admin
            </span>

            <span>Manage smarter. Serve better.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

export default AdminDashboard;