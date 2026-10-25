
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import "./Address.css";

const API_URL = "http://localhost:5000/api";

const initialForm = {
  label: "Home",
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
  isDefault: false,
};

function Address() {
  const { token } = useAuth();

  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const headers = {
    Authorization: `Bearer ${token}`,
  };

  const fetchAddresses = async () => {
    try {
      const response = await axios.get(`${API_URL}/addresses`, {
        headers,
      });
      setAddresses(response.data.addresses || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.message || "Addresses load nahi ho paaye.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchAddresses();
    else setLoading(false);
  }, [token]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (editingId) {
        await axios.patch(`${API_URL}/addresses/${editingId}`, form, {
          headers,
        });
        setMessage("Address updated successfully!");
      } else {
        await axios.post(`${API_URL}/addresses`, form, { headers });
        setMessage("Address added successfully!");
      }

      setForm(initialForm);
      setEditingId(null);
      setShowForm(false);
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || "Address save nahi ho paaya.");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (address) => {
    setForm({
      label: address.label || "Home",
      fullName: address.fullName || "",
      phone: address.phone || "",
      addressLine1: address.addressLine1 || "",
      addressLine2: address.addressLine2 || "",
      landmark: address.landmark || "",
      city: address.city || "",
      state: address.state || "",
      pincode: address.pincode || "",
      country: address.country || "India",
      isDefault: address.isDefault || false,
    });

    setEditingId(address._id);
    setShowForm(true);
    setError("");
    setMessage("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Kya tum ye address delete karna chahte ho?")) {
      return;
    }

    try {
      setError("");
      await axios.delete(`${API_URL}/addresses/${id}`, { headers });
      setMessage("Address deleted successfully!");
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || "Address delete nahi hua.");
    }
  };

  const handleSetDefault = async (id) => {
    try {
      setError("");
      await axios.patch(`${API_URL}/addresses/${id}/default`, {}, {
        headers,
      });
      setMessage("Default address updated!");
      await fetchAddresses();
    } catch (err) {
      setError(err.response?.data?.message || "Default address update nahi hua.");
    }
  };

  const cancelForm = () => {
    setForm(initialForm);
    setEditingId(null);
    setShowForm(false);
  };

  if (loading) {
    return <div className="address-loading">Loading addresses...</div>;
  }

  return (
    <main className="address-page">
      <div className="address-header">
        <div>
          <h1>My Addresses</h1>
          <p>Manage your saved delivery locations</p>
        </div>

        <button
          className="address-add-btn"
          onClick={() => {
            if (showForm) {
              cancelForm();
            } else {
              setForm(initialForm);
              setEditingId(null);
              setShowForm(true);
              setError("");
              setMessage("");
            }
          }}
        >
          {showForm ? "Cancel" : "+ Add New Address"}
        </button>
      </div>

      {error && <div className="address-alert error">{error}</div>}
      {message && <div className="address-alert success">{message}</div>}

      {showForm && (
        <form className="address-form" onSubmit={handleSubmit}>
          <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>

          <div className="address-form-grid">
            <div className="address-field">
              <label>Address Type</label>
              <select name="label" value={form.label} onChange={handleChange}>
                <option value="Home">Home</option>
                <option value="Work">Work</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="address-field">
              <label>Full Name</label>
              <input name="fullName" placeholder="Enter full name" value={form.fullName} onChange={handleChange} required />
            </div>

            <div className="address-field">
              <label>Phone Number</label>
              <input name="phone" type="tel" placeholder="Enter phone number" value={form.phone} onChange={handleChange} required />
            </div>

            <div className="address-field">
              <label>House No. / Street / Area</label>
              <input name="addressLine1" placeholder="Enter address" value={form.addressLine1} onChange={handleChange} required />
            </div>

            <div className="address-field">
              <label>Address Line 2</label>
              <input name="addressLine2" placeholder="Optional" value={form.addressLine2} onChange={handleChange} />
            </div>

            <div className="address-field">
              <label>Landmark</label>
              <input name="landmark" placeholder="Nearby landmark" value={form.landmark} onChange={handleChange} />
            </div>

            <div className="address-field">
              <label>City</label>
              <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
            </div>

            <div className="address-field">
              <label>State</label>
              <input name="state" placeholder="State" value={form.state} onChange={handleChange} required />
            </div>

            <div className="address-field">
              <label>Pincode</label>
              <input name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} required />
            </div>
          </div>

          <label className="address-default-check">
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
            />
            Set as default address
          </label>

          <div className="address-form-actions">
            <button type="submit" disabled={saving} className="address-save-btn">
              {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
            </button>
            <button type="button" onClick={cancelForm} className="address-cancel-btn">
              Cancel
            </button>
          </div>
        </form>
      )}

      <section className="saved-address-section">
        <div className="saved-address-heading">
          <h2>Saved Addresses</h2>
          <span>{addresses.length} saved</span>
        </div>

        {addresses.length === 0 ? (
          <div className="address-empty">
            <span>📍</span>
            <h3>No saved addresses</h3>
            <p>Add an address to make your next order easier.</p>
          </div>
        ) : (
          <div className="saved-address-grid">
            {addresses.map((address) => (
              <article className="saved-address-card" key={address._id}>
                <div className="saved-address-top">
                  <div className="saved-address-label">
                    <span>📍</span>
                    <h3>{address.label || "Home"}</h3>
                  </div>

                  {address.isDefault && (
                    <span className="default-badge">✓ Default Address</span>
                  )}
                </div>

                <div className="saved-address-details">
                  <strong>{address.fullName}</strong>
                  <p>{address.addressLine1}</p>
                  {address.addressLine2 && <p>{address.addressLine2}</p>}
                  {address.landmark && <p>Landmark: {address.landmark}</p>}
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                  <p className="address-phone">☎ {address.phone}</p>
                </div>

                <div className="saved-address-actions">
                  {!address.isDefault && (
                    <button
                      className="set-default-btn"
                      onClick={() => handleSetDefault(address._id)}
                    >
                      Set as Default
                    </button>
                  )}

                  <div className="address-card-buttons">
                    <button onClick={() => handleEdit(address)}>Edit</button>
                    <button onClick={() => handleDelete(address._id)}>Delete</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default Address;
