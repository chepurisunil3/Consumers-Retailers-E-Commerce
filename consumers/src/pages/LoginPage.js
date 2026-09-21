import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import Banner from "../components/Banner";
import { useAuth } from "../context/AuthContext";
import { consumerApi } from "../services/api";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await consumerApi.login(form);
      login(res.token, res.data);
      navigate(searchParams.get("next") || "/");
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
          <h2>Sign in</h2>
          <p className="subtitle">Sign in to check out, track orders and manage your account.</p>
          <Banner>{error}</Banner>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
}
