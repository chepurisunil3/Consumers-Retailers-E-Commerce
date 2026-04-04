import "./App.css";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import CartPanel from "./components/CartPanel";
import OrderList from "./components/OrderList";
import ProductCard from "./components/ProductCard";
import StorefrontHeader from "./components/StorefrontHeader";
import { consumerApi } from "./services/api";

const CONSUMER_TOKEN_KEY = "consumer_token";

const emptyAuthForm = {
  name: "",
  email: "",
  password: "",
  mobileNumber: "",
};

const emptyCheckoutForm = {
  line1: "",
  city: "",
  state: "",
  country: "",
  postalCode: "",
};

const getShippingForm = (shippingAddress = {}) => ({
  line1: shippingAddress.line1 || "",
  city: shippingAddress.city || "",
  state: shippingAddress.state || "",
  country: shippingAddress.country || "",
  postalCode: shippingAddress.postalCode || "",
});

const getAccountForm = (consumer = {}) => ({
  name: consumer.name || "",
  email: consumer.email || "",
  mobileNumber: consumer.mobileNumber || "",
  profilePhoto: consumer.profilePhoto || "",
  shippingAddress: getShippingForm(consumer.shippingAddress),
});

function App() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [token, setToken] = useState(
    localStorage.getItem(CONSUMER_TOKEN_KEY) || "",
  );
  const [user, setUser] = useState({});
  const [accountForm, setAccountForm] = useState(getAccountForm());
  const [authMode, setAuthMode] = useState("login");
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [authForm, setAuthForm] = useState(emptyAuthForm);
  const [checkoutForm, setCheckoutForm] = useState(emptyCheckoutForm);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState("");
  const ordersSectionRef = useRef(null);

  const loadStorefront = useCallback(async () => {
    setLoading(true);
    try {
      const [categoriesResponse, productsResponse] = await Promise.all([
        consumerApi.getCategories(),
        consumerApi.getProducts({ q: query, categoryId: selectedCategory }),
      ]);

      setCategories(categoriesResponse.data || []);
      setProducts(productsResponse.data || []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [query, selectedCategory]);

  const loadOrders = useCallback(async (currentToken) => {
    if (!currentToken) {
      setOrders([]);
      return;
    }

    try {
      const [profileResponse, ordersResponse] = await Promise.all([
        consumerApi.getProfile(currentToken),
        consumerApi.getOrders(currentToken),
      ]);

      setUser(profileResponse.data || {});
      setOrders(ordersResponse.data || []);
    } catch (error) {
      localStorage.removeItem(CONSUMER_TOKEN_KEY);
      setToken("");
      setOrders([]);
      setUser({});
      setMessage(error.message);
    }
  }, []);

  useEffect(() => {
    loadStorefront();
  }, [loadStorefront]);

  useEffect(() => {
    loadOrders(token);
  }, [loadOrders, token]);

  useEffect(() => {
    if (!token || !user?.id) {
      return;
    }

    setAccountForm(getAccountForm(user));
    setCheckoutForm((current) => {
      const hasCheckoutInput = Object.values(current).some(Boolean);
      return hasCheckoutInput ? current : getShippingForm(user.shippingAddress);
    });
  }, [token, user]);

  const summary = useMemo(() => {
    const subtotal = cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const shippingFee = subtotal > 100 || subtotal === 0 ? 0 : 4.99;
    return {
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
    };
  }, [cart]);

  const featuredProducts = useMemo(
    () => products.filter((product) => product.isFeatured).slice(0, 3),
    [products],
  );

  const handleAddToCart = (product) => {
    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(item.quantity + 1, product.inventory),
              }
            : item,
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });
    setMessage(`${product.name} added to cart.`);
  };

  const handleQuantityChange = (productId, nextQuantity) => {
    setCart((current) =>
      current
        .map((item) =>
          item.id === productId
            ? {
                ...item,
                quantity: Math.max(1, Math.min(nextQuantity, item.inventory)),
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleRemove = (productId) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  };

  const handleAuthSubmit = async () => {
    setActionLoading(true);
    try {
      const response =
        authMode === "login"
          ? await consumerApi.login({
              email: authForm.email,
              password: authForm.password,
            })
          : await consumerApi.register(authForm);

      localStorage.setItem(CONSUMER_TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.data || {});
      setAccountForm(getAccountForm(response.data || {}));
      setCheckoutForm(getShippingForm(response.data?.shippingAddress));
      setAuthForm(emptyAuthForm);
      setAuthOpen(false);
      setProfileOpen(false);
      setAccountMenuOpen(false);
      setMessage(
        authMode === "login" ? "Welcome back." : "Consumer account created.",
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!token) {
      setAuthMode("login");
      setAuthOpen(true);
      setMessage("Login or register to complete checkout.");
      return;
    }

    if (!checkoutForm.line1 || !checkoutForm.city || !checkoutForm.country) {
      setMessage("Please complete the shipping address before checkout.");
      return;
    }

    setActionLoading(true);
    try {
      await consumerApi.createOrder(token, {
        items: cart.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
        })),
        shippingAddress: checkoutForm,
        paymentMethod: "card",
      });

      setCart([]);
      setCheckoutForm(emptyCheckoutForm);
      setMessage("Order placed successfully.");
      await Promise.all([loadOrders(token), loadStorefront()]);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(CONSUMER_TOKEN_KEY);
    setToken("");
    setUser({});
    setAccountForm(getAccountForm());
    setOrders([]);
    setCheckoutForm(emptyCheckoutForm);
    setAccountMenuOpen(false);
    setProfileOpen(false);
    setMessage("Logged out successfully.");
  };

  const handleAuthToggle = (nextMode = "login") => {
    setAuthMode(nextMode);
    setAccountMenuOpen(false);
    setProfileOpen(false);
    setAuthOpen(true);
  };

  const handleViewOrders = () => {
    setAccountMenuOpen(false);
    ordersSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleProfileSave = async () => {
    if (!token) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await consumerApi.updateProfile(token, accountForm);
      setUser(response.data || {});
      setAccountForm(getAccountForm(response.data || {}));
      setCheckoutForm(getShippingForm(response.data?.shippingAddress));
      setProfileOpen(false);
      setAccountMenuOpen(false);
      setMessage("Account details updated.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <main className="consumer-app-shell">
      <div className="background-glow background-glow-left" />
      <div className="background-glow background-glow-right" />

      <div className="consumer-content">
        <StorefrontHeader
          user={user}
          query={query}
          setQuery={setQuery}
          cartCount={cart.reduce((sum, item) => sum + item.quantity, 0)}
          onAuthToggle={handleAuthToggle}
          isAuthenticated={Boolean(token)}
          accountMenuOpen={accountMenuOpen}
          onAccountMenuToggle={() => setAccountMenuOpen((current) => !current)}
          onCloseAccountMenu={() => setAccountMenuOpen(false)}
          onViewOrders={handleViewOrders}
          onOpenProfile={() => {
            setAccountMenuOpen(false);
            setProfileOpen(true);
          }}
          onLogout={handleLogout}
        />

        {message ? <div className="feedback-banner">{message}</div> : null}

        <section className="hero-summary-grid">
          <article className="hero-feature-card glass-card">
            <span className="eyebrow">Fast discovery</span>
            <h2>
              Shop verified products with category filters and live stock data.
            </h2>
            <p className="muted-text">
              Consumer checkout is now backed by a working order API and synced
              to retailer inventory.
            </p>
            <div className="pill-row">
              <button
                type="button"
                className={
                  selectedCategory === "" ? "pill-button active" : "pill-button"
                }
                onClick={() => setSelectedCategory("")}
              >
                All products
              </button>
              {categories.slice(0, 6).map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={
                    selectedCategory === category.id
                      ? "pill-button active"
                      : "pill-button"
                  }
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </article>

          <article className="featured-showcase glass-card">
            <span className="eyebrow">Featured right now</span>
            <div className="featured-stack">
              {featuredProducts.length ? (
                featuredProducts.map((product) => (
                  <div key={product.id} className="featured-row">
                    <div>
                      <strong>{product.name}</strong>
                      <p className="muted-text">
                        {product.retailer?.companyName || "Retailer"}
                      </p>
                    </div>
                    <strong>${Number(product.price).toFixed(2)}</strong>
                  </div>
                ))
              ) : (
                <p className="empty-state">
                  Featured retailer products will appear here.
                </p>
              )}
            </div>
          </article>
        </section>

        <section className="store-grid">
          <section className="catalog-panel">
            <div className="section-heading section-heading-space">
              <div>
                <span className="eyebrow">Live catalog</span>
                <h2>Browse products</h2>
              </div>
            </div>

            {loading ? (
              <div className="glass-card loading-state">
                <h3>Loading products...</h3>
              </div>
            ) : (
              <div className="products-grid">
                {products.length ? (
                  products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={handleAddToCart}
                    />
                  ))
                ) : (
                  <div className="glass-card empty-block">
                    <p className="empty-state">
                      No products matched your current search or filter.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <CartPanel
            cart={cart}
            onQuantityChange={handleQuantityChange}
            onRemove={handleRemove}
            summary={summary}
            checkoutForm={checkoutForm}
            setCheckoutForm={setCheckoutForm}
            onCheckout={handleCheckout}
            checkoutLoading={actionLoading}
            isAuthenticated={Boolean(token)}
          />
        </section>

        <div ref={ordersSectionRef}>
          <OrderList orders={orders} />
        </div>
      </div>

      {authOpen ? (
        <div className="auth-modal-backdrop">
          <div className="auth-modal glass-card">
            <div className="section-heading section-heading-space">
              <div>
                <span className="eyebrow">Secure account access</span>
                <h2>{authMode === "login" ? "Login" : "Register"}</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setAuthOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="toggle-row">
              <button
                type="button"
                className={
                  authMode === "login"
                    ? "toggle-button active"
                    : "toggle-button"
                }
                onClick={() => setAuthMode("login")}
              >
                Login
              </button>
              <button
                type="button"
                className={
                  authMode === "register"
                    ? "toggle-button active"
                    : "toggle-button"
                }
                onClick={() => setAuthMode("register")}
              >
                Register
              </button>
            </div>

            <div className="stack-gap compact-form">
              {authMode === "register" ? (
                <label className="input-group">
                  <span>Name</span>
                  <input
                    value={authForm.name}
                    onChange={(event) =>
                      setAuthForm((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    placeholder="Jamie Carter"
                  />
                </label>
              ) : null}
              <label className="input-group">
                <span>Email</span>
                <input
                  value={authForm.email}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="jamie@example.com"
                  type="email"
                />
              </label>
              {authMode === "register" ? (
                <label className="input-group">
                  <span>Mobile</span>
                  <input
                    value={authForm.mobileNumber}
                    onChange={(event) =>
                      setAuthForm((current) => ({
                        ...current,
                        mobileNumber: event.target.value,
                      }))
                    }
                    placeholder="+1 555 000 1234"
                  />
                </label>
              ) : null}
              <label className="input-group">
                <span>Password</span>
                <input
                  value={authForm.password}
                  onChange={(event) =>
                    setAuthForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                  placeholder="At least 6 characters"
                  type="password"
                />
              </label>
            </div>

            <button
              type="button"
              className="primary-button wide-button"
              onClick={handleAuthSubmit}
              disabled={actionLoading}
            >
              {actionLoading
                ? "Please wait..."
                : authMode === "login"
                  ? "Login and continue"
                  : "Create account"}
            </button>
          </div>
        </div>
      ) : null}

      {profileOpen ? (
        <div className="auth-modal-backdrop">
          <div className="auth-modal glass-card">
            <div className="section-heading section-heading-space">
              <div>
                <span className="eyebrow">Consumer account</span>
                <h2>Update account details</h2>
              </div>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setProfileOpen(false)}
              >
                Close
              </button>
            </div>

            <div className="stack-gap compact-form">
              <label className="input-group">
                <span>Name</span>
                <input
                  value={accountForm.name}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  placeholder="Olivia Parker"
                />
              </label>

              <div className="inline-grid">
                <label className="input-group">
                  <span>Email</span>
                  <input
                    type="email"
                    value={accountForm.email}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    placeholder="olivia.parker@example.com"
                  />
                </label>
                <label className="input-group">
                  <span>Mobile</span>
                  <input
                    value={accountForm.mobileNumber}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        mobileNumber: event.target.value,
                      }))
                    }
                    placeholder="+1 555 200 1001"
                  />
                </label>
              </div>

              <label className="input-group">
                <span>Profile photo URL</span>
                <input
                  value={accountForm.profilePhoto}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      profilePhoto: event.target.value,
                    }))
                  }
                  placeholder="https://images..."
                />
              </label>

              <label className="input-group">
                <span>Address line</span>
                <input
                  value={accountForm.shippingAddress.line1}
                  onChange={(event) =>
                    setAccountForm((current) => ({
                      ...current,
                      shippingAddress: {
                        ...current.shippingAddress,
                        line1: event.target.value,
                      },
                    }))
                  }
                  placeholder="11 Riverwalk Lane"
                />
              </label>

              <div className="inline-grid">
                <label className="input-group">
                  <span>City</span>
                  <input
                    value={accountForm.shippingAddress.city}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        shippingAddress: {
                          ...current.shippingAddress,
                          city: event.target.value,
                        },
                      }))
                    }
                    placeholder="Seattle"
                  />
                </label>
                <label className="input-group">
                  <span>State</span>
                  <input
                    value={accountForm.shippingAddress.state}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        shippingAddress: {
                          ...current.shippingAddress,
                          state: event.target.value,
                        },
                      }))
                    }
                    placeholder="Washington"
                  />
                </label>
              </div>

              <div className="inline-grid">
                <label className="input-group">
                  <span>Country</span>
                  <input
                    value={accountForm.shippingAddress.country}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        shippingAddress: {
                          ...current.shippingAddress,
                          country: event.target.value,
                        },
                      }))
                    }
                    placeholder="USA"
                  />
                </label>
                <label className="input-group">
                  <span>Postal code</span>
                  <input
                    value={accountForm.shippingAddress.postalCode}
                    onChange={(event) =>
                      setAccountForm((current) => ({
                        ...current,
                        shippingAddress: {
                          ...current.shippingAddress,
                          postalCode: event.target.value,
                        },
                      }))
                    }
                    placeholder="98101"
                  />
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() => setProfileOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button"
                onClick={handleProfileSave}
                disabled={actionLoading}
              >
                {actionLoading ? "Saving..." : "Save account"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

export default App;
