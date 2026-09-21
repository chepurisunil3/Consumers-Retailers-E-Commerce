import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import Banner from "../components/Banner";
import { useAuth } from "../context/AuthContext";
import { consumerApi } from "../services/api";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", mobileNumber: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await consumerApi.register(form);
      login(res.token, res.data);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StorefrontLayout>
      <div className="auth-page">
        <div className="auth-card">
          <h2>Create your account</h2>
          <p className="subtitle">Join to shop, track orders and save your addresses.</p>
          <Banner>{error}</Banner>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Full name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Mobile number</label>
              <input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              <span style={{ fontSize: 12, color: "var(--muted)" }}>At least 6 characters.</span>
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
          <div className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
