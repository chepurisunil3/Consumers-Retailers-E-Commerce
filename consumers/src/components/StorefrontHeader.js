import React, { useEffect, useRef } from "react";

function StorefrontHeader({
  user,
  query,
  setQuery,
  cartCount,
  onAuthToggle,
  isAuthenticated,
  accountMenuOpen,
  onAccountMenuToggle,
  onCloseAccountMenu,
  onViewOrders,
  onOpenProfile,
  onLogout,
}) {
  const menuRef = useRef(null);

  useEffect(() => {
    if (!accountMenuOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onCloseAccountMenu();
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [accountMenuOpen, onCloseAccountMenu]);

  const initials = (user.name || "Guest")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="storefront-header glass-card">
      <div className="store-header-copy">
        <span className="eyebrow">Modern commerce storefront</span>
        <h1>Discover curated products from live retailer catalogs.</h1>
        <p>
          Shop from multiple retailers, filter inventory by category, and place
          verified orders from a refreshed consumer experience.
        </p>
      </div>

      <div className="storefront-actions">
        <label className="search-box">
          <span>Search</span>
          <input
            value={query}
            placeholder="Search products or tags"
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="profile-chip" ref={menuRef}>
          {isAuthenticated ? (
            <>
              <div className="account-summary">
                {user.profilePhoto ? (
                  <img
                    src={user.profilePhoto}
                    alt={user.name || "Consumer"}
                    className="account-avatar"
                  />
                ) : (
                  <div className="account-avatar account-avatar-fallback">
                    {initials}
                  </div>
                )}
                <div>
                  <strong>{user.name || "shopper"}</strong>
                  <p className="muted-text account-summary-text">
                    {user.email || "Signed-in consumer"}
                  </p>
                </div>
              </div>

              <div className="profile-actions-inline">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={onAccountMenuToggle}
                >
                  Account
                </button>
                <div className="cart-pill">Cart {cartCount}</div>
              </div>

              {accountMenuOpen ? (
                <div className="account-dropdown glass-card">
                  <div className="account-dropdown-header">
                    <strong>{user.name || "Consumer account"}</strong>
                    <span>{user.mobileNumber || user.email}</span>
                  </div>
                  <button
                    type="button"
                    className="dropdown-action"
                    onClick={onViewOrders}
                  >
                    My orders
                  </button>
                  <button
                    type="button"
                    className="dropdown-action"
                    onClick={onOpenProfile}
                  >
                    Update account
                  </button>
                  <button
                    type="button"
                    className="dropdown-action danger"
                    onClick={onLogout}
                  >
                    Logout
                  </button>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <span>Guest shopper</span>
              <button
                type="button"
                className="ghost-button"
                onClick={() => onAuthToggle("login")}
              >
                Login / Register
              </button>
              <div className="cart-pill">Cart {cartCount}</div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default StorefrontHeader;
