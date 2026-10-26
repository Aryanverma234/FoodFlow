import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./RestaurantDashboard.css";

const API_URL = "http://localhost:5000/api";

const initialForm = {
  name: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  cuisine: "",
  deliveryTime: "",
  minimumOrder: "",
};

const initialCategoryForm = {
  name: "",
  description: "",
  image: "",
  sortOrder: 0,
};

const initialFoodForm = {
  name: "",
  description: "",
  category: "",
  price: "",
  discountPrice: "",
  image: "",
  isVeg: "true",
  ingredients: "",
  preparationTime: 20,
  isAvailable: "true",
  isFeatured: "false",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1547592180-85f173990554?w=700";

function getCategoryImage(category) {
  if (category.image) return category.image;

  const name = category.name?.toLowerCase() || "";

  if (name.includes("momo")) {
    return "https://images.unsplash.com/photo-1563245372-f21724e3856d?w=700";
  }
  if (name.includes("noodle")) {
    return "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=700";
  }
  if (name.includes("rice")) {
    return "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=700";
  }
  if (name.includes("starter") || name.includes("chinese")) {
    return "https://images.unsplash.com/photo-1541696432-82c6da8ce7bf?w=700";
  }

  return fallbackImage;
}

function RestaurantDashboard() {
  const { user, token } = useAuth();

  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [activeTab, setActiveTab] = useState("categories");

  const [categories, setCategories] = useState([]);
  const [categoryForm, setCategoryForm] = useState(initialCategoryForm);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const [categoryCreating, setCategoryCreating] = useState(false);

  const [foodItems, setFoodItems] = useState([]);
  const [foodForm, setFoodForm] = useState(initialFoodForm);
  const [foodLoading, setFoodLoading] = useState(false);
  const [foodCreating, setFoodCreating] = useState(false);

  const authHeaders = {
    Authorization: `Bearer ${token}`,
  };

  const fetchMyRestaurants = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/restaurants/my`, {
        headers: authHeaders,
      });
      setRestaurants(response.data.restaurants || []);
    } catch (err) {
      setError(err.response?.data?.message || "Restaurants load nahi ho paye.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchMyRestaurants();
  }, [token]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreateRestaurant = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    try {
      setCreating(true);

      const payload = {
        ...form,
        deliveryTime: Number(form.deliveryTime) || undefined,
        minimumOrder: Number(form.minimumOrder) || undefined,
      };

      const response = await axios.post(`${API_URL}/restaurants`, payload, {
        headers: authHeaders,
      });

      setMessage(response.data.message || "Restaurant successfully created!");
      setForm(initialForm);
      setShowForm(false);
      await fetchMyRestaurants();
    } catch (err) {
      setError(err.response?.data?.message || "Restaurant create nahi ho paya.");
    } finally {
      setCreating(false);
    }
  };

  const fetchCategories = async (restaurant) => {
    try {
      setCategoryLoading(true);
      const response = await axios.get(
        `${API_URL}/categories/my/${restaurant._id}`,
        { headers: authHeaders }
      );
      setCategories(response.data.categories || []);
    } catch (err) {
      setError(err.response?.data?.message || "Categories load nahi ho payi.");
    } finally {
      setCategoryLoading(false);
    }
  };

  const fetchFoodItems = async (restaurant) => {
    try {
      setFoodLoading(true);
      const response = await axios.get(
        `${API_URL}/food-items/my/${restaurant._id}`,
        { headers: authHeaders }
      );
      setFoodItems(response.data.foodItems || []);
    } catch (err) {
      setError(err.response?.data?.message || "Food items load nahi ho paye.");
    } finally {
      setFoodLoading(false);
    }
  };

  const handleManageRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    setActiveTab("categories");
    setCategories([]);
    setFoodItems([]);
    setCategoryForm(initialCategoryForm);
    setFoodForm(initialFoodForm);
    setMessage("");
    setError("");

    await Promise.all([
      fetchCategories(restaurant),
      fetchFoodItems(restaurant),
    ]);
  };

  const handleCategoryChange = (e) => {
    setCategoryForm({ ...categoryForm, [e.target.name]: e.target.value });
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedRestaurant) return;

    try {
      setCategoryCreating(true);

      const payload = {
        ...categoryForm,
        restaurant: selectedRestaurant._id,
        sortOrder: Number(categoryForm.sortOrder) || 0,
      };

      const response = await axios.post(`${API_URL}/categories`, payload, {
        headers: authHeaders,
      });

      setMessage(response.data.message || "Category successfully created!");
      setCategoryForm(initialCategoryForm);
      await fetchCategories(selectedRestaurant);
    } catch (err) {
      setError(err.response?.data?.message || "Category create nahi ho payi.");
    } finally {
      setCategoryCreating(false);
    }
  };

  const handleFoodChange = (e) => {
    setFoodForm({ ...foodForm, [e.target.name]: e.target.value });
  };

  const handleCreateFoodItem = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!selectedRestaurant) return;

    if (!foodForm.category) {
      setError("Please select a food category.");
      return;
    }

    try {
      setFoodCreating(true);

      const payload = {
        name: foodForm.name.trim(),
        description: foodForm.description,
        restaurant: selectedRestaurant._id,
        category: foodForm.category,
        price: Number(foodForm.price),
        discountPrice:
          foodForm.discountPrice === "" ? null : Number(foodForm.discountPrice),
        image: foodForm.image,
        isVeg: foodForm.isVeg === "true",
        ingredients: foodForm.ingredients
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        preparationTime: Number(foodForm.preparationTime) || 20,
        isAvailable: foodForm.isAvailable === "true",
        isFeatured: foodForm.isFeatured === "true",
      };

      const response = await axios.post(`${API_URL}/food-items`, payload, {
        headers: authHeaders,
      });

      setMessage(response.data.message || "Food item created successfully!");
      setFoodForm(initialFoodForm);
      await fetchFoodItems(selectedRestaurant);
    } catch (err) {
      setError(err.response?.data?.message || "Food item create nahi ho paya.");
    } finally {
      setFoodCreating(false);
    }
  };

  const handleDeleteFoodItem = async (foodItemId) => {
    if (!window.confirm("Kya tum is food item ko delete karna chahte ho?")) {
      return;
    }

    setMessage("");
    setError("");

    try {
      const response = await axios.delete(
        `${API_URL}/food-items/${foodItemId}`,
        { headers: authHeaders }
      );

      setMessage(response.data.message || "Food item deleted successfully!");
      await fetchFoodItems(selectedRestaurant);
    } catch (err) {
      setError(err.response?.data?.message || "Food item delete nahi ho paya.");
    }
  };

  const closeManagement = () => {
    setSelectedRestaurant(null);
    setCategories([]);
    setFoodItems([]);
    setMessage("");
    setError("");
  };

  return (
    <main className="restaurant-dashboard">
      <header className="rd-page-heading">
        <div>
          <span className="rd-eyebrow">FOODFLOW PARTNER PORTAL</span>
          <h1>Restaurant Dashboard</h1>
          <p>Manage your restaurant and serve something wonderful.</p>
        </div>
        <span className="rd-heading-icon">🍽️</span>
      </header>

      <section className="rd-welcome">
        <div>
          <span className="rd-eyebrow">RESTAURANT MANAGEMENT</span>
          <h2>Welcome back, {user?.name || "Restaurant Owner"}!</h2>
          <p>
            Manage your restaurants, categories and delicious food items — all
            in one place.
          </p>
        </div>
        <div className="rd-welcome-icon">🍽️</div>
      </section>

      <section className="rd-stats">
        <div className="rd-stat-card">
          <span className="rd-stat-icon">🏪</span>
          <div>
            <p>Total Restaurants</p>
            <h3>{restaurants.length}</h3>
          </div>
        </div>

        <div className="rd-stat-card">
          <span className="rd-stat-icon">📂</span>
          <div>
            <p>Categories</p>
            <h3>{selectedRestaurant ? categories.length : "—"}</h3>
          </div>
        </div>

        <div className="rd-stat-card">
          <span className="rd-stat-icon">🍔</span>
          <div>
            <p>Food Items</p>
            <h3>{selectedRestaurant ? foodItems.length : "—"}</h3>
          </div>
        </div>
      </section>

      {message && <div className="rd-alert rd-success">{message}</div>}
      {error && <div className="rd-alert rd-error">{error}</div>}

      <section className="rd-section">
        <div className="rd-section-heading">
          <div>
            <span className="rd-eyebrow">YOUR BUSINESS</span>
            <h2>My Restaurants</h2>
            <p>Your restaurants, all in one place.</p>
          </div>

          <button
            type="button"
            className="rd-primary-btn"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? "Cancel" : "+ Add Restaurant"}
          </button>
        </div>

        {showForm && (
          <form className="rd-form" onSubmit={handleCreateRestaurant}>
            <h3>Create Your Restaurant</h3>
            <div className="rd-form-grid">
              <input name="name" placeholder="Restaurant Name *" value={form.name} onChange={handleChange} required />
              <input name="phone" placeholder="Phone Number" value={form.phone} onChange={handleChange} />
              <input name="email" type="email" placeholder="Restaurant Email" value={form.email} onChange={handleChange} />
              <input name="cuisine" placeholder="Cuisine (e.g. Indian, Chinese)" value={form.cuisine} onChange={handleChange} />
              <input name="deliveryTime" type="number" min="1" placeholder="Delivery Time (minutes)" value={form.deliveryTime} onChange={handleChange} />
              <input name="minimumOrder" type="number" min="0" placeholder="Minimum Order Amount (₹)" value={form.minimumOrder} onChange={handleChange} />
              <textarea className="rd-full-field" name="description" placeholder="Restaurant Description" value={form.description} onChange={handleChange} />
              <textarea className="rd-full-field" name="address" placeholder="Restaurant Address" value={form.address} onChange={handleChange} />
            </div>
            <button className="rd-primary-btn" type="submit" disabled={creating}>
              {creating ? "Creating..." : "Create Restaurant"}
            </button>
          </form>
        )}

        {loading ? (
          <div className="rd-empty">Loading restaurants...</div>
        ) : restaurants.length === 0 ? (
          <div className="rd-empty">
            <span>🏪</span>
            <h3>No restaurants yet</h3>
            <p>Click Add Restaurant to create your first restaurant.</p>
          </div>
        ) : (
          <div className="rd-restaurant-grid">
            {restaurants.map((restaurant) => (
              <article className="rd-restaurant-card" key={restaurant._id}>
                <div className="rd-restaurant-top">
                  <span className="rd-restaurant-icon">🍴</span>
                  <span className={`rd-status ${restaurant.isApproved ? "approved" : "pending"}`}>
                    <span className="rd-status-dot" />
                    {restaurant.isApproved ? "Approved" : "Awaiting Approval"}
                  </span>
                </div>

                <h3>{restaurant.name}</h3>
                <p>{restaurant.description || "Welcome to our restaurant."}</p>
                <div className="rd-restaurant-meta">
                  <span>📍 {restaurant.address || "Address not added"}</span>
                  <span>🍴 {restaurant.cuisine || "Cuisine not added"}</span>
                </div>

                <button
                  type="button"
                  className="rd-manage-btn"
                  onClick={() => handleManageRestaurant(restaurant)}
                >
                  Manage Categories & Food Items <span>→</span>
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      {selectedRestaurant && (
        <section className="rd-management">
          <div className="rd-section-heading">
            <div>
              <span className="rd-eyebrow">RESTAURANT WORKSPACE</span>
              <h2>{selectedRestaurant.name}</h2>
              <p>Manage your menu and food categories.</p>
            </div>
            <button type="button" className="rd-outline-btn" onClick={closeManagement}>
              Close ✕
            </button>
          </div>

          <div className="rd-tabs">
            <button
              type="button"
              className={activeTab === "categories" ? "active" : ""}
              onClick={() => setActiveTab("categories")}
            >
              📂 Categories
            </button>
            <button
              type="button"
              className={activeTab === "food" ? "active" : ""}
              onClick={() => setActiveTab("food")}
            >
              🍔 Food Items
            </button>
          </div>

          {activeTab === "categories" && (
            <div className="rd-tab-content">
              <div className="rd-subheading">
                <h3>Add New Category</h3>
                <p>Create categories to organise your menu.</p>
              </div>

              <form className="rd-form" onSubmit={handleCreateCategory}>
                <div className="rd-form-grid">
                  <input name="name" placeholder="Category Name *" value={categoryForm.name} onChange={handleCategoryChange} minLength={2} maxLength={50} required />
                  <input name="image" placeholder="Category Image URL (optional)" value={categoryForm.image} onChange={handleCategoryChange} />
                  <textarea className="rd-full-field" name="description" placeholder="Category Description" value={categoryForm.description} onChange={handleCategoryChange} maxLength={200} />
                  <input name="sortOrder" type="number" placeholder="Display Order" value={categoryForm.sortOrder} onChange={handleCategoryChange} />
                </div>
                <button className="rd-primary-btn" type="submit" disabled={categoryCreating}>
                  {categoryCreating ? "Creating..." : "+ Add Category"}
                </button>
              </form>

              <div className="rd-subheading">
                <h3>Existing Categories</h3>
                <p>{categories.length} categories in this restaurant.</p>
              </div>

              {categoryLoading ? (
                <div className="rd-empty">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="rd-empty">No categories added yet.</div>
              ) : (
                <div className="rd-category-grid">
                  {categories.map((category) => (
                    <article className="rd-category-card" key={category._id}>
                      <img
                        src={getCategoryImage(category)}
                        alt={category.name}
                        className="rd-category-image"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackImage;
                        }}
                      />
                      <div className="rd-category-content">
                        <h4>{category.name}</h4>
                        <p>{category.description || "Freshly prepared for you."}</p>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "food" && (
            <div className="rd-tab-content">
              <div className="rd-subheading">
                <h3>Add New Food Item</h3>
                <p>Add delicious dishes to your restaurant menu.</p>
              </div>

              {categoryLoading ? (
                <div className="rd-empty">Loading categories...</div>
              ) : categories.length === 0 ? (
                <div className="rd-empty">Please create a category first.</div>
              ) : (
                <form className="rd-form" onSubmit={handleCreateFoodItem}>
                  <div className="rd-form-grid">
                    <input name="name" placeholder="Food Name *" value={foodForm.name} onChange={handleFoodChange} minLength={2} maxLength={100} required />
                    <select name="category" value={foodForm.category} onChange={handleFoodChange} required>
                      <option value="">Select Category *</option>
                      {categories.map((category) => (
                        <option key={category._id} value={category._id}>{category.name}</option>
                      ))}
                    </select>
                    <input name="price" type="number" min="0" step="0.01" placeholder="Price (₹) *" value={foodForm.price} onChange={handleFoodChange} required />
                    <input name="discountPrice" type="number" min="0" step="0.01" placeholder="Discount Price (₹)" value={foodForm.discountPrice} onChange={handleFoodChange} />
                    <input name="image" placeholder="Food Image URL (optional)" value={foodForm.image} onChange={handleFoodChange} />
                    <input name="preparationTime" type="number" min="1" placeholder="Preparation Time (minutes)" value={foodForm.preparationTime} onChange={handleFoodChange} required />
                    <select name="isVeg" value={foodForm.isVeg} onChange={handleFoodChange}>
                      <option value="true">🟢 Veg</option>
                      <option value="false">🔴 Non-Veg</option>
                    </select>
                    <select name="isAvailable" value={foodForm.isAvailable} onChange={handleFoodChange}>
                      <option value="true">Available</option>
                      <option value="false">Not Available</option>
                    </select>
                    <select name="isFeatured" value={foodForm.isFeatured} onChange={handleFoodChange}>
                      <option value="false">Not Featured</option>
                      <option value="true">Featured Item</option>
                    </select>
                    <textarea className="rd-full-field" name="description" placeholder="Food Description" value={foodForm.description} onChange={handleFoodChange} maxLength={500} />
                    <textarea className="rd-full-field" name="ingredients" placeholder="Ingredients (comma separated)" value={foodForm.ingredients} onChange={handleFoodChange} />
                  </div>

                  <button className="rd-primary-btn" type="submit" disabled={foodCreating}>
                    {foodCreating ? "Adding Food Item..." : "+ Add Food Item"}
                  </button>
                </form>
              )}

              <div className="rd-subheading">
                <h3>Existing Food Items</h3>
                <p>{foodItems.length} food items in this restaurant.</p>
              </div>

              {foodLoading ? (
                <div className="rd-empty">Loading food items...</div>
              ) : foodItems.length === 0 ? (
                <div className="rd-empty">No food items added yet.</div>
              ) : (
                <div className="rd-food-grid">
                  {foodItems.map((item) => (
                    <article className="rd-food-card" key={item._id}>
                      <img
                        src={item.image || fallbackImage}
                        alt={item.name}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = fallbackImage;
                        }}
                      />
                      <div className="rd-food-content">
                        <div className="rd-food-title-row">
                          <h4>{item.name}</h4>
                          <span className={`rd-food-type ${item.isVeg ? "veg" : "nonveg"}`}>
                            {item.isVeg ? "Veg" : "Non-Veg"}
                          </span>
                        </div>
                        <p>{item.description}</p>
                        <span className="rd-food-category">
                          {item.category?.name || "Uncategorized"}
                        </span>
                        <div className="rd-food-price">
                          <strong>₹{item.discountPrice ?? item.price}</strong>
                          {item.discountPrice !== null &&
                            item.discountPrice !== undefined &&
                            <del>₹{item.price}</del>}
                        </div>
                        <div className="rd-food-details">
                          <span>⏱ {item.preparationTime} min</span>
                          <span>{item.isAvailable ? "Available" : "Unavailable"}</span>
                        </div>
                        <button
                          type="button"
                          className="rd-delete-btn"
                          onClick={() => handleDeleteFoodItem(item._id)}
                        >
                          Delete Item
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </main>
  );
}

export default RestaurantDashboard;