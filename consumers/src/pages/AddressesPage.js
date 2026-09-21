import { useEffect, useState } from "react";
import StorefrontLayout from "../components/StorefrontLayout";
import Banner from "../components/Banner";
import { useAuth } from "../context/AuthContext";
import { consumerApi } from "../services/api";

const emptyForm = { label: "Home", line1: "", line2: "", city: "", state: "", postalCode: "", phone: "" };

export default function AddressesPage() {
  const { token } = useAuth();
  const [addresses, setAddresses] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    consumerApi.getAddresses(token).then((res) => setAddresses(res.data)).finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await consumerApi.addAddress(token, form);
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    try {
      await consumerApi.deleteAddress(token, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await consumerApi.updateAddress(token, id, { isDefault: true });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <StorefrontLayout>
      <h2>Your addresses</h2>
      <Banner>{error}</Banner>

      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : (
        <div style={{ display: "grid", gap: 12, maxWidth: 560 }}>
          {addresses.map((address) => (
            <div className="card" key={address._id}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{address.label} {address.isDefault && <span className="badge badge-delivered">Default</span>}</strong>
              </div>
              <p style={{ fontSize: 13.5, color: "var(--muted)" }}>
                {address.line1}{address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}
                {address.phone ? ` · ${address.phone}` : ""}
              </p>
              <div className="btn-row">
                {!address.isDefault && (
                  <button className="btn btn-secondary btn-sm" onClick={() => handleSetDefault(address._id)}>
                    Set as default
                  </button>
                )}
                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(address._id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!showForm ? (
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
          + Add new address
        </button>
      ) : (
        <form className="card" onSubmit={handleSubmit} style={{ marginTop: 16, maxWidth: 480 }}>
          <div className="form-group">
            <label>Label</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
          </div>
          <div className="form-group">
            <label>Address line</label>
            <input required value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input required value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
            </div>
            <div className="form-group">
              <label>State</label>
              <input required value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>PIN code</label>
              <input required value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
          </div>
          <div className="btn-row">
            <button className="btn btn-primary" type="submit">Save address</button>
            <button className="btn btn-secondary" type="button" onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </form>
      )}
    </StorefrontLayout>
  );
}
