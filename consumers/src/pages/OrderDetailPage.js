import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import StatusBadge from "../components/StatusBadge";
import Banner from "../components/Banner";
import { useAuth } from "../context/AuthContext";
import { consumerApi, TRACKING_STEPS } from "../services/api";
import { formatCurrency, formatDateTime } from "../utils/format";

export default function OrderDetailPage() {
  const { token } = useAuth();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busyItem, setBusyItem] = useState(null);

  const load = useCallback(() => {
    consumerApi.getOrder(token, id).then((res) => setOrder(res.data)).catch((err) => setError(err.message));
  }, [token, id]);

  useEffect(load, [load]);

  const handleCancel = async (itemId) => {
    setBusyItem(itemId);
    try {
      const res = await consumerApi.cancelOrderItem(token, id, itemId);
      setOrder(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  };

  const handleReturn = async (itemId) => {
    const reason = window.prompt("Tell us why you're returning this item (optional):", "") || "";
    setBusyItem(itemId);
    try {
      const res = await consumerApi.returnOrderItem(token, id, itemId, reason);
      setOrder(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyItem(null);
    }
  };

  if (!order) {
    return (
      <StorefrontLayout>
        <Banner>{error}</Banner>
        <div className="empty-state">Loading…</div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="page-header" style={{ marginBottom: 8 }}>
        <div>
          <h2 style={{ margin: 0 }}>Order #{order.id.slice(-6)}</h2>
          <p style={{ color: "var(--muted)", fontSize: 13.5 }}>
            Placed {formatDateTime(order.createdAt)} · {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"}
          </p>
        </div>
        <StatusBadge status={order.status} />
      </div>
      <Banner>{error}</Banner>

      <div className="card" style={{ marginBottom: 16 }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>Delivery address</h3>
        <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
          {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
          {order.shippingAddress?.postalCode}
        </p>
      </div>

      {order.items.map((item) => {
        const stepIndex = TRACKING_STEPS.indexOf(item.status);
        const isTerminalBad = ["declined", "cancelled", "return_requested", "returned"].includes(item.status);
        return (
          <div className="card" key={item.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <img src={item.imageUrl || "https://placehold.co/60x60"} alt={item.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
                <div>
                  <strong>{item.name}</strong>
                  <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
                    Qty {item.quantity} · {formatCurrency(item.unitPrice)} each · {formatCurrency(item.lineTotal)} total
                  </p>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>

            {!isTerminalBad && (
              <div className="status-stepper">
                {TRACKING_STEPS.map((step, index) => (
                  <span key={step} className={`status-step${index <= stepIndex ? " done" : ""}`}>
                    {step.replace(/_/g, " ")}
                  </span>
                ))}
              </div>
            )}

            <div className="btn-row">
              {["pending", "accepted"].includes(item.status) && (
                <button className="btn btn-danger btn-sm" disabled={busyItem === item.id} onClick={() => handleCancel(item.id)}>
                  Cancel item
                </button>
              )}
              {item.status === "delivered" && (
                <button className="btn btn-secondary btn-sm" disabled={busyItem === item.id} onClick={() => handleReturn(item.id)}>
                  Return item
                </button>
              )}
            </div>

            <details style={{ marginTop: 12 }}>
              <summary style={{ fontSize: 12.5, color: "var(--muted)", cursor: "pointer" }}>Full timeline</summary>
              <ul style={{ fontSize: 12.5, color: "var(--muted)", paddingLeft: 18 }}>
                {item.statusHistory.map((entry, index) => (
                  <li key={index}>{entry.status.replace(/_/g, " ")} — {formatDateTime(entry.at)}</li>
                ))}
              </ul>
            </details>
          </div>
        );
      })}
    </StorefrontLayout>
  );
}
