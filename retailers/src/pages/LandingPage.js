import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="auth-page">
      <div className="auth-hero">
        <span className="brand">RetailHub Seller Console</span>
        <h1>Sell to millions of Indian shoppers. All from one dashboard.</h1>
        <p>
          List products with GST-ready onboarding, manage stock in real time, fulfil orders through
          every stage of delivery, and bring your whole team on board with role-based access.
        </p>
        <ul className="auth-hero-list">
          <li>
            <span className="dot">✓</span>
            Full retailer onboarding — industry, GSTIN, PAN and bank details
          </li>
          <li>
            <span className="dot">✓</span>
            Live inventory that updates the instant a customer checks out
          </li>
          <li>
            <span className="dot">✓</span>
            Accept, dispatch and track orders through delivery, cancellation or return
          </li>
          <li>
            <span className="dot">✓</span>
            Add managers and sales staff with permission-scoped access
          </li>
        </ul>
        <div className="btn-row">
          <Link to="/register" className="btn btn-primary">
            Start selling
          </Link>
          <Link to="/login" className="btn btn-secondary">
            Sign in
          </Link>
        </div>
      </div>
      <div className="auth-card-wrap">
        <div className="auth-card">
          <h2>Why sellers choose RetailHub</h2>
          <p className="subtitle">A production-grade seller platform, built for the Indian market.</p>
          <ul className="auth-hero-list">
            <li><span className="dot">₹</span>Transparent MRP, discount &amp; payout tracking</li>
            <li><span className="dot">📦</span>Amazon-style split shipments per order</li>
            <li><span className="dot">👥</span>Admin, manager &amp; sales team roles</li>
            <li><span className="dot">📈</span>Earnings, trends and low-stock alerts</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
