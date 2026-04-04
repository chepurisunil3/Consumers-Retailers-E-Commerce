import React from "react";

function CartPanel({
  cart,
  onQuantityChange,
  onRemove,
  summary,
  checkoutForm,
  setCheckoutForm,
  onCheckout,
  checkoutLoading,
  isAuthenticated,
}) {
  return (
    <aside className="cart-panel glass-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">Ready to order</span>
          <h2>Your cart</h2>
        </div>
        <strong>{cart.length} items</strong>
      </div>

      <div className="cart-items">
        {cart.length ? (
          cart.map((item) => (
            <div key={item.id} className="cart-row">
              <div>
                <strong>{item.name}</strong>
                <p className="muted-text">
                  ${Number(item.price).toFixed(2)} each
                </p>
              </div>
              <div className="cart-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onQuantityChange(item.id, item.quantity - 1)}
                >
                  −
                </button>
                <span>{item.quantity}</span>
                <button
                  type="button"
                  className="text-button"
                  onClick={() => onQuantityChange(item.id, item.quantity + 1)}
                >
                  +
                </button>
                <button
                  type="button"
                  className="text-button danger"
                  onClick={() => onRemove(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="empty-state">
            Your cart is empty. Add products to create an order.
          </p>
        )}
      </div>

      <div className="order-summary">
        <div>
          <span>Subtotal</span>
          <strong>${summary.subtotal.toFixed(2)}</strong>
        </div>
        <div>
          <span>Shipping</span>
          <strong>${summary.shippingFee.toFixed(2)}</strong>
        </div>
        <div className="order-total">
          <span>Total</span>
          <strong>${summary.total.toFixed(2)}</strong>
        </div>
      </div>

      <div className="stack-gap compact-form">
        <label className="input-group">
          <span>Address line</span>
          <input
            value={checkoutForm.line1}
            onChange={(event) =>
              setCheckoutForm((current) => ({
                ...current,
                line1: event.target.value,
              }))
            }
            placeholder="221B Baker Street"
          />
        </label>
        <div className="inline-grid">
          <label className="input-group">
            <span>City</span>
            <input
              value={checkoutForm.city}
              onChange={(event) =>
                setCheckoutForm((current) => ({
                  ...current,
                  city: event.target.value,
                }))
              }
              placeholder="London"
            />
          </label>
          <label className="input-group">
            <span>State</span>
            <input
              value={checkoutForm.state}
              onChange={(event) =>
                setCheckoutForm((current) => ({
                  ...current,
                  state: event.target.value,
                }))
              }
              placeholder="Greater London"
            />
          </label>
        </div>
        <div className="inline-grid">
          <label className="input-group">
            <span>Country</span>
            <input
              value={checkoutForm.country}
              onChange={(event) =>
                setCheckoutForm((current) => ({
                  ...current,
                  country: event.target.value,
                }))
              }
              placeholder="UK"
            />
          </label>
        </div>
        <label className="input-group">
          <span>Postal code</span>
          <input
            value={checkoutForm.postalCode}
            onChange={(event) =>
              setCheckoutForm((current) => ({
                ...current,
                postalCode: event.target.value,
              }))
            }
            placeholder="NW1"
          />
        </label>
      </div>

      <button
        type="button"
        className="primary-button wide-button"
        onClick={onCheckout}
        disabled={!cart.length || checkoutLoading}
      >
        {isAuthenticated
          ? checkoutLoading
            ? "Placing order..."
            : "Place order"
          : "Login to checkout"}
      </button>
    </aside>
  );
}

export default CartPanel;
