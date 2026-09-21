import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import Banner from "../components/Banner";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [asTeamMember, setAsTeamMember] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = asTeamMember ? await retailerApi.staffLogin(form) : await retailerApi.login(form);
      login(res.token, res.data);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <span className="brand">RetailHub Seller Console</span>
        <h1>Welcome back.</h1>
        <p>Sign in to manage your catalog, fulfil orders and track your business performance.</p>
      </div>
      <div className="auth-card-wrap">
        <div className="auth-card">
          <h2>Sign in</h2>
          <p className="subtitle">
            {asTeamMember ? "Sign in with your team member credentials." : "Sign in with your business owner account."}
          </p>
          <Banner>{error}</Banner>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
            <div className="checkbox-row" style={{ marginBottom: 16 }}>
              <input
                type="checkbox"
                id="team-login"
                checked={asTeamMember}
                onChange={(e) => setAsTeamMember(e.target.checked)}
              />
              <label htmlFor="team-login" style={{ fontWeight: 500 }}>
                I'm signing in as a manager or sales team member
              </label>
            </div>
            <button className="btn btn-primary btn-block" disabled={loading} type="submit">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
          <div className="auth-switch">
            New to RetailHub? <Link to="/register">Register your business</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
