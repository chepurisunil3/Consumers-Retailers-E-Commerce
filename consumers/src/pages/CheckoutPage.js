import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import Banner from "../components/Banner";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { consumerApi } from "../services/api";
import { formatCurrency } from "../utils/format";

const emptyAddress = { label: "Home", line1: "", city: "", state: "", postalCode: "", phone: "" };
// Fallback values match the backend default (server/config/shipping.js) so
// totals are still correct before the real config has loaded. The fetched
// config is always the source of truth — see consumerApi.getShippingConfig.
const DEFAULT_SHIPPING_CONFIG = { shippingFee: 4.99, freeShippingThreshold: 100 };

export default function CheckoutPage() {
  const { token } = useAuth();
  const { items, subtotal, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [newAddress, setNewAddress] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [error, setError] = useState("");
  const [placing, setPlacing] = useState(false);
  const [shippingConfig, setShippingConfig] = useState(DEFAULT_SHIPPING_CONFIG);

  useEffect(() => {
    consumerApi
      .getAddresses(token)
      .then((res) => {
        setAddresses(res.data);
        const defaultAddress = res.data.find((a) => a.isDefault) || res.data[0];
        if (defaultAddress) setSelectedId(defaultAddress._id);
        else setNewAddress(emptyAddress);
      })
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    consumerApi
      .getShippingConfig()
      .then((res) => setShippingConfig(res.data))
      .catch(() => {
        // Non-critical background fetch — keep the correct default values.
      });
  }, []);

  if (items.length === 0) {
    navigate("/cart");
    return null;
  }

  const shippingFee = subtotal > shippingConfig.freeShippingThreshold ? 0 : shippingConfig.shippingFee;
  const total = subtotal + shippingFee;

  const handlePlaceOrder = async () => {
    setError("");
    let shippingAddress;

    if (newAddress) {
      if (!newAddress.line1 || !newAddress.city || !newAddress.state || !newAddress.postalCode) {
        setError("Please fill in the full address.");
        return;
      }
      shippingAddress = newAddress;
    } else {
      const selected = addresses.find((a) => a._id === selectedId);
      if (!selected) {
        setError("Please select a delivery address.");
        return;
      }
      shippingAddress = selected;
    }

    setPlacing(true);
    try {
      if (newAddress) {
        await consumerApi.addAddress(token, shippingAddress);
      }
      const res = await consumerApi.createOrder(token, {
        items: items.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        shippingAddress,
        paymentMethod,
      });
      clearCart();
      navigate(`/orders/${res.data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  return (
    <StorefrontLayout>
      <h2>Checkout</h2>
      <Banner>{error}</Banner>
      <div className="two-col">
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ marginTop: 0 }}>Delivery address</h3>
            {addresses.map((address) => (
              <div
                key={address._id}
                className={`address-card${!newAddress && selectedId === address._id ? " selected" : ""}`}
                onClick={() => { setNewAddress(null); setSelectedId(address._id); }}
              >
                <strong>{address.label}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 13.5 }}>
                  {address.line1}, {address.city}, {address.state} {address.postalCode}
                </p>
              </div>
            ))}
            {!newAddress ? (
              <button className="btn btn-secondary btn-sm" onClick={() => setNewAddress(emptyAddress)}>
                + Add a new address
              </button>
            ) : (
              <div style={{ marginTop: 10 }}>
                <div className="form-group">
                  <label>Address line</label>
                  <input value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>City</label>
                    <input value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>State</label>
                    <input value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>PIN code</label>
                    <input value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} />
                  </div>
                </div>
                {addresses.length > 0 && (
                  <button className="btn btn-secondary btn-sm" onClick={() => { setNewAddress(null); setSelectedId(addresses[0]._id); }}>
                    Use a saved address instead
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Payment method</h3>
            <div className="checkbox-row" style={{ marginBottom: 10 }}>
              <input type="radio" id="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
              <label htmlFor="cod" style={{ fontWeight: 500 }}>Cash on Delivery</label>
            </div>
            <div className="checkbox-row">
              <input type="radio" id="online" checked={paymentMethod === "mock-online"} onChange={() => setPaymentMethod("mock-online")} />
              <label htmlFor="online" style={{ fontWeight: 500 }}>Pay online (simulated — no real payment gateway)</label>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Order summary</h3>
          {items.map((item) => (
            <div key={item.productId} className="summary-row">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="summary-row"><span>Shipping</span><span>{shippingFee === 0 ? "Free" : formatCurrency(shippingFee)}</span></div>
          <div className="summary-row total"><span>Total</span><span>{formatCurrency(total)}</span></div>
          <button className="btn btn-primary btn-block" disabled={placing} onClick={handlePlaceOrder}>
            {placing ? "Placing order…" : "Place order"}
          </button>
        </div>
      </div>
    </StorefrontLayout>
  );
}
