import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { consumerApi } from "../services/api";
import { formatCurrency } from "../utils/format";

// Fallback values match the backend default (server/config/shipping.js) so
// totals are still correct before the real config has loaded. The fetched
// config is always the source of truth — see consumerApi.getShippingConfig.
const DEFAULT_SHIPPING_CONFIG = { shippingFee: 4.99, freeShippingThreshold: 100 };

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [shippingConfig, setShippingConfig] = useState(DEFAULT_SHIPPING_CONFIG);

  useEffect(() => {
    consumerApi
      .getShippingConfig()
      .then((res) => setShippingConfig(res.data))
      .catch(() => {
        // Non-critical background fetch — keep the correct default values.
      });
  }, []);

  const shippingFee =
    subtotal > shippingConfig.freeShippingThreshold || subtotal === 0 ? 0 : shippingConfig.shippingFee;
  const total = subtotal + shippingFee;

  const handleCheckout = () => {
    navigate(isAuthenticated ? "/checkout" : "/login?next=/checkout");
  };

  return (
    <StorefrontLayout>
      <h2>Your cart</h2>
      {items.length === 0 ? (
        <div className="empty-state card">
          Your cart is empty. <Link to="/products">Start shopping</Link>
        </div>
      ) : (
        <div className="two-col">
          <div className="card">
            {items.map((item) => (
              <div className="cart-line" key={item.productId}>
                <img src={item.imageUrl || "https://placehold.co/80x80"} alt={item.name} />
                <div style={{ flex: 1 }}>
                  <Link to={`/products/${item.productId}`} style={{ fontWeight: 600, fontSize: 14 }}>{item.name}</Link>
                  {item.retailerName && <p style={{ fontSize: 12, color: "var(--muted)", margin: "2px 0" }}>Sold by {item.retailerName}</p>}
                  <p style={{ fontWeight: 700, margin: "4px 0" }}>{formatCurrency(item.price)}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div className="qty-control">
                      <button onClick={() => updateQuantity(item.productId, item.quantity - 1)}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.productId, item.quantity + 1)} disabled={item.quantity >= item.inventory}>+</button>
                    </div>
                    <button className="btn btn-danger btn-sm" onClick={() => removeItem(item.productId)}>Remove</button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Order summary</h3>
            <div className="summary-row"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
            <div className="summary-row"><span>Shipping</span><span>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</span></div>
            <div className="summary-row total"><span>Total</span><span>{formatCurrency(total)}</span></div>
            <button className="btn btn-primary btn-block" onClick={handleCheckout}>Proceed to checkout</button>
          </div>
        </div>
      )}
    </StorefrontLayout>
  );
}
