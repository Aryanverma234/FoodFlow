
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./AdminDashboard.css";

const API_URL = "http://localhost:5000/api";

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

  // =====================================
  // FETCH RESTAURANTS
  // =====================================
  const fetchRestaurants = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        `${API_URL}/admin/restaurants`,
        authConfig
      );

      setRestaurants(response.data.restaurants || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Restaurants load nahi ho paye."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================
  // FETCH ALL RESTAURANT OWNERS
  // =====================================
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

  // =====================================
  // APPROVE RESTAURANT
  // =====================================
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

  // =====================================
  // OWNER FORM INPUT CHANGE
  // =====================================
  const handleOwnerInput = (e) => {
    const { name, value } = e.target;

    setOwnerForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================
  // CREATE RESTAURANT OWNER
  // =====================================
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

  const pendingCount = restaurants.filter(
    (restaurant) => !restaurant.isApproved
  ).length;

  const approvedCount = restaurants.length - pendingCount;

  const ownerIds = new Set(
    restaurants
      .map((restaurant) => restaurant.owner?._id)
      .filter(Boolean)
  );

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

  const menuItems = [
    { icon: "📊", label: "Overview", href: "#overview" },
    { icon: "🏪", label: "Restaurants", href: "#restaurants" },
    { icon: "👥", label: "Restaurant Owners", href: "#owners" },
    { icon: "🛍️", label: "All Orders", href: "#orders" },
  ];

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <span className="admin-brand-icon">F</span>
          <span>FoodFlow</span>
        </div>

        <p className="admin-sidebar-label">MAIN MENU</p>

        <nav className="admin-side-nav">
          {menuItems.map((item, index) => (
            <a
              key={item.label}
              href={item.href}
              className={`admin-nav-link ${
                index === 0 ? "active" : ""
              }`}
            >
              <span>{item.icon}</span>
              {item.label}
            </a>
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

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <p className="admin-breadcrumb">FoodFlow / Admin</p>
            <h2>Dashboard Overview</h2>
          </div>

          <div className="admin-topbar-right">
            <span className="admin-status">
              <span className="admin-status-dot"></span>
              Admin Panel
            </span>

            <div className="admin-top-avatar">
              {(user?.name || "A").charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        <div className="admin-content" id="overview">
          <section className="admin-welcome">
            <div>
              <span className="admin-eyebrow">ADMINISTRATION</span>
              <h1>Welcome back, {user?.name || "Admin"} 👋</h1>
              <p>
                Manage your restaurants, owners and orders from one place.
              </p>
            </div>

            <div className="admin-welcome-icon">🍽️</div>
          </section>

          {error && (
            <p style={{ color: "red", margin: "15px 0" }}>
              {error}
            </p>
          )}

          {success && (
            <p style={{ color: "green", margin: "15px 0" }}>
              {success}
            </p>
          )}

          {/* DASHBOARD STATS */}
          <section className="admin-stats-grid">
            {stats.map((stat) => (
              <article className="admin-stat-card" key={stat.title}>
                <div className="admin-stat-top">
                  <span className="admin-stat-icon">{stat.icon}</span>
                  <span className="admin-stat-menu">•••</span>
                </div>

                <p>{stat.title}</p>
                <h2>{loading ? "..." : stat.value}</h2>
                <small>{stat.note}</small>
              </article>
            ))}
          </section>

          {/* RESTAURANT MANAGEMENT */}
          <section className="admin-section" id="restaurants">
            <div className="admin-section-heading">
              <div>
                <h2>Restaurant Management</h2>
                <p>
                  Review restaurants and manage their approval.
                </p>
              </div>

              <span className="admin-section-icon">🏪</span>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <strong>Approved: {approvedCount}</strong>
              {" | "}
              <strong>Pending: {pendingCount}</strong>

              <button
                type="button"
                onClick={fetchRestaurants}
                style={{
                  marginLeft: "15px",
                  padding: "8px 14px",
                  cursor: "pointer",
                }}
              >
                ↻ Refresh
              </button>
            </div>

            {loading ? (
              <p>Loading restaurants...</p>
            ) : restaurants.length === 0 ? (
              <div className="admin-empty-state">
                <div>🏪</div>
                <h3>No restaurants found</h3>
                <p>
                  New restaurant registrations will appear here.
                </p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {restaurants.map((restaurant) => (
                  <article
                    key={restaurant._id}
                    style={{
                      background: "var(--card-bg, #fff)",
                      border: "1px solid #ddd",
                      borderRadius: "12px",
                      padding: "20px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: "12px",
                      }}
                    >
                      <div>
                        <h3 style={{ margin: "0 0 8px" }}>
                          {restaurant.name}
                        </h3>

                        <p>{restaurant.description}</p>

                        <p>
                          <strong>Owner:</strong>{" "}
                          {restaurant.owner?.name || "Unknown"}
                        </p>

                        <p>
                          <strong>Email:</strong>{" "}
                          {restaurant.owner?.email || "N/A"}
                        </p>

                        <p>
                          <strong>Phone:</strong>{" "}
                          {restaurant.phone || "N/A"}
                        </p>

                        <p>
                          <strong>Cuisine:</strong>{" "}
                          {Array.isArray(restaurant.cuisine)
                            ? restaurant.cuisine.join(", ")
                            : restaurant.cuisine || "N/A"}
                        </p>

                        <p>
                          <strong>Delivery Time:</strong>{" "}
                          {restaurant.deliveryTime || "N/A"} minutes
                        </p>

                        <p>
                          <strong>Minimum Order:</strong> ₹
                          {restaurant.minimumOrder ?? "N/A"}
                        </p>

                        <p>
                          <strong>Address:</strong>{" "}
                          {typeof restaurant.address === "object"
                            ? [
                                restaurant.address?.street,
                                restaurant.address?.city,
                                restaurant.address?.state,
                                restaurant.address?.pincode,
                              ]
                                .filter(Boolean)
                                .join(", ") || "N/A"
                            : restaurant.address || "N/A"}
                        </p>
                      </div>

                      <div>
                        {restaurant.isApproved ? (
                          <span
                            style={{
                              color: "green",
                              fontWeight: "bold",
                            }}
                          >
                            ✓ Approved
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={approvingId === restaurant._id}
                            onClick={() =>
                              handleApprove(restaurant._id)
                            }
                            style={{
                              padding: "10px 18px",
                              background: "#176b45",
                              color: "white",
                              border: "none",
                              borderRadius: "7px",
                              cursor: "pointer",
                            }}
                          >
                            {approvingId === restaurant._id
                              ? "Approving..."
                              : "Approve Restaurant"}
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          {/* RESTAURANT OWNERS MANAGEMENT */}
          <section className="admin-section" id="owners">
            <div className="admin-section-heading">
              <div>
                <h2>Restaurant Owners</h2>
                <p>
                  Create and manage independent restaurant owner accounts.
                </p>
              </div>

              <span className="admin-section-icon">👥</span>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <p>
                Total Restaurant Owners:{" "}
                <strong>{owners.length}</strong>
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowOwnerForm((prev) => !prev);
                  setError("");
                  setSuccess("");
                }}
                style={{
                  padding: "10px 16px",
                  background: "#176b45",
                  color: "#fff",
                  border: "none",
                  borderRadius: "7px",
                  cursor: "pointer",
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
                style={{
                  background: "var(--card-bg, #fff)",
                  border: "1px solid #ddd",
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "25px",
                  display: "grid",
                  gap: "14px",
                  maxWidth: "600px",
                }}
              >
                <h3 style={{ margin: 0 }}>
                  Create Restaurant Owner Account
                </h3>

                <label>
                  Full Name
                  <input
                    type="text"
                    name="name"
                    value={ownerForm.name}
                    onChange={handleOwnerInput}
                    placeholder="Enter owner's full name"
                    required
                    style={inputStyle}
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
                    style={inputStyle}
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
                    style={inputStyle}
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
                    style={inputStyle}
                  />
                </label>

                <button
                  type="submit"
                  disabled={creatingOwner}
                  style={{
                    padding: "12px",
                    background: "#176b45",
                    color: "#fff",
                    border: "none",
                    borderRadius: "7px",
                    cursor: creatingOwner ? "not-allowed" : "pointer",
                  }}
                >
                  {creatingOwner
                    ? "Creating Account..."
                    : "Create Restaurant Owner"}
                </button>
              </form>
            )}

            {/* OWNERS LIST */}
            {ownersLoading ? (
              <p>Loading restaurant owners...</p>
            ) : owners.length === 0 ? (
              <div className="admin-empty-state">
                <div>👥</div>
                <h3>No restaurant owners found</h3>
                <p>Create an owner account to get started.</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "15px" }}>
                {owners.map((owner) => {
                  const linkedRestaurants = restaurants.filter(
                    (restaurant) =>
                      restaurant.owner?._id === owner._id
                  );

                  return (
                    <article
                      key={owner._id}
                      style={{
                        background: "var(--card-bg, #fff)",
                        border: "1px solid #ddd",
                        borderRadius: "12px",
                        padding: "20px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: "12px",
                        }}
                      >
                        <div>
                          <h3 style={{ margin: "0 0 10px" }}>
                            {owner.name}
                          </h3>

                          <p>
                            <strong>Email:</strong> {owner.email}
                          </p>

                          <p>
                            <strong>Phone:</strong>{" "}
                            {owner.phone || "N/A"}
                          </p>

                          <p>
                            <strong>Restaurants:</strong>{" "}
                            {linkedRestaurants.length}
                          </p>
                        </div>

                        <span
                          style={{
                            color: owner.isActive ? "green" : "red",
                            fontWeight: "bold",
                          }}
                        >
                          {owner.isActive ? "● Active" : "● Inactive"}
                        </span>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={fetchOwners}
              style={{
                marginTop: "18px",
                padding: "8px 14px",
                cursor: "pointer",
              }}
            >
              ↻ Refresh Owners
            </button>
          </section>

          {/* ALL ORDERS */}
          <section className="admin-section" id="orders">
            <div className="admin-section-heading">
              <div>
                <h2>All Orders</h2>
                <p>Order management will be connected next.</p>
              </div>

              <span className="admin-section-icon">🛍️</span>
            </div>

            <div className="admin-empty-state">
              <div>📦</div>
              <h3>Order data will appear here</h3>
              <p>
                Connect the admin orders API to view all restaurant orders.
              </p>
            </div>
          </section>

          <footer className="admin-page-footer">
            <span>© {new Date().getFullYear()} FoodFlow Admin</span>
            <span>Manage smarter. Serve better.</span>
          </footer>
        </div>
      </main>
    </div>
  );
}

const inputStyle = {
  display: "block",
  width: "100%",
  boxSizing: "border-box",
  padding: "11px",
  marginTop: "6px",
  border: "1px solid #ccc",
  borderRadius: "7px",
  fontSize: "14px",
};

export default AdminDashboard;
