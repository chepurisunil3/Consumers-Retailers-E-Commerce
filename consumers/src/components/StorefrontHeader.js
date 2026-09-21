import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { consumerApi } from "../services/api";

export default function StorefrontHeader() {
  const { isAuthenticated, user, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [categories, setCategories] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    consumerApi.getCategories().then((res) => setCategories(res.data.slice(0, 8))).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(`/products${query ? `?q=${encodeURIComponent(query)}` : ""}`);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <header className="storefront-header">
      <div className="header-top">
        <Link to="/" className="header-brand">
          Shop<span>Desi</span>
        </Link>
        <form className="header-search" onSubmit={handleSearch}>
          <input
            placeholder="Search for products, brands and more"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit">Search</button>
        </form>
        <div className="header-links">
          {isAuthenticated ? (
            <div className="account-menu" ref={menuRef}>
              <div className="header-link header-cart" onClick={() => setMenuOpen((v) => !v)} role="button" tabIndex={0}>
                <small>Hello, {user?.name?.split(" ")[0]}</small>
                <strong>Account ▾</strong>
              </div>
              {menuOpen && (
                <div className="account-dropdown">
                  <Link to="/orders" onClick={() => setMenuOpen(false)}>Your orders</Link>
                  <Link to="/addresses" onClick={() => setMenuOpen(false)}>Your addresses</Link>
                  <Link to="/profile" onClick={() => setMenuOpen(false)}>Your profile</Link>
                  <button onClick={handleLogout}>Log out</button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="header-link">
              <small>Hello, sign in</small>
              <strong>Account</strong>
            </Link>
          )}
          <Link to="/orders" className="header-link">
            <small>Returns</small>
            <strong>& Orders</strong>
          </Link>
          <Link to="/cart" className="header-link header-cart">
            🛒 Cart {itemCount > 0 && <span className="cart-badge">{itemCount}</span>}
          </Link>
        </div>
      </div>
      <nav className="header-categories">
        <Link to="/products">All Products</Link>
        {categories.map((category) => (
          <Link key={category.id} to={`/products?categoryId=${category.id}`}>
            {category.name}
          </Link>
        ))}
      </nav>
    </header>
  );
}
