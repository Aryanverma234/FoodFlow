
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

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

  if (loading) return <h2>Loading addresses...</h2>;

  return (
    <div style={{ maxWidth: "900px", margin: "30px auto", padding: "20px" }}>
      <h1>My Addresses 📍</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {message && <p style={{ color: "green" }}>{message}</p>}

      <button onClick={() => {
        if (showForm) cancelForm();
        else {
          setForm(initialForm);
          setEditingId(null);
          setShowForm(true);
        }
      }}>
        {showForm ? "Cancel" : "+ Add New Address"}
      </button>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          style={{
            display: "grid",
            gap: "12px",
            marginTop: "20px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "12px",
          }}
        >
          <h2>{editingId ? "Edit Address" : "Add New Address"}</h2>

          <label>Address Type</label>
          <select name="label" value={form.label} onChange={handleChange}>
            <option value="Home">Home</option>
            <option value="Work">Work</option>
            <option value="Other">Other</option>
          </select>

          <input name="fullName" placeholder="Full Name" value={form.fullName} onChange={handleChange} required />
          <input name="phone" type="tel" placeholder="Phone Number" value={form.phone} onChange={handleChange} required />
          <input name="addressLine1" placeholder="House No. / Street / Area" value={form.addressLine1} onChange={handleChange} required />
          <input name="addressLine2" placeholder="Address Line 2 (Optional)" value={form.addressLine2} onChange={handleChange} />
          <input name="landmark" placeholder="Landmark (Optional)" value={form.landmark} onChange={handleChange} />
          <input name="city" placeholder="City" value={form.city} onChange={handleChange} required />
          <input name="state" placeholder="State" value={form.state} onChange={handleChange} required />
          <input name="pincode" placeholder="Pincode" value={form.pincode} onChange={handleChange} required />

          <label>
            <input
              type="checkbox"
              name="isDefault"
              checked={form.isDefault}
              onChange={handleChange}
            />
            Set as default address
          </label>

          <button type="submit" disabled={saving}>
            {saving ? "Saving..." : editingId ? "Update Address" : "Save Address"}
          </button>

          <button type="button" onClick={cancelForm}>
            Cancel
          </button>
        </form>
      )}

      <h2 style={{ marginTop: "30px" }}>Saved Addresses</h2>

      {addresses.length === 0 ? (
        <p>Abhi koi saved address nahi hai.</p>
      ) : (
        addresses.map((address) => (
          <div
            key={address._id}
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "18px",
              marginTop: "15px",
            }}
          >
            <h3>{address.label}</h3>
            <p>{address.fullName}</p>
            <p>{address.addressLine1}</p>
            {address.addressLine2 && <p>{address.addressLine2}</p>}
            {address.landmark && <p>Landmark: {address.landmark}</p>}
            <p>{address.city}, {address.state} - {address.pincode}</p>
            <p>Phone: {address.phone}</p>

            {address.isDefault ? (
              <strong style={{ color: "green" }}>✓ Default Address</strong>
            ) : (
              <button onClick={() => handleSetDefault(address._id)}>
                Set as Default
              </button>
            )}

            <div style={{ display: "flex", gap: "10px", marginTop: "12px" }}>
              <button onClick={() => handleEdit(address)}>Edit</button>
              <button onClick={() => handleDelete(address._id)}>Delete</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default Address;
