import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import Banner from "../components/Banner";
import { formatCurrency, formatDateTime } from "../utils/format";

const NEXT_ACTIONS = {
  pending: [
    { status: "accepted", label: "Accept", className: "btn-primary" },
    { status: "declined", label: "Decline", className: "btn-danger" },
  ],
  accepted: [
    { status: "dispatched", label: "Mark dispatched", className: "btn-primary" },
    { status: "cancelled", label: "Cancel", className: "btn-danger" },
  ],
  dispatched: [{ status: "out_for_delivery", label: "Out for delivery", className: "btn-primary" }],
  out_for_delivery: [{ status: "delivered", label: "Mark delivered", className: "btn-primary" }],
  return_requested: [{ status: "returned", label: "Confirm return", className: "btn-primary" }],
};

export default function OrderDetailPage() {
  const { token, can } = useAuth();
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [updatingItem, setUpdatingItem] = useState(null);
  const canUpdate = can("orders.updateStatus");

  const load = useCallback(() => {
    retailerApi
      .getOrder(token, id)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err.message));
  }, [token, id]);

  useEffect(load, [load]);

  const handleAction = async (itemId, status) => {
    setUpdatingItem(itemId);
    setError("");
    try {
      const res = await retailerApi.updateOrderItemStatus(token, id, itemId, { status });
      setOrder(res.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingItem(null);
    }
  };

  if (!order) {
    return (
      <DashboardLayout title="Order detail">
        <div className="page"><Banner>{error}</Banner><div className="empty-state card">Loading…</div></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={`Order #${order.id.slice(-6)}`}>
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Order #{order.id.slice(-6)}</h2>
            <p>Placed {formatDateTime(order.createdAt)} · {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online"}</p>
          </div>
          <StatusBadge status={order.status} />
        </div>
        <Banner>{error}</Banner>

        <div className="card" style={{ marginBottom: 18 }}>
          <h3 className="section-title">Delivery address</h3>
          <p style={{ margin: 0, fontSize: 14, color: "var(--muted)" }}>
            {order.shippingAddress?.line1}, {order.shippingAddress?.city}, {order.shippingAddress?.state}{" "}
            {order.shippingAddress?.postalCode}
            {order.shippingAddress?.phone ? ` · ${order.shippingAddress.phone}` : ""}
          </p>
        </div>

        {order.items.map((item) => (
          <div className="card" key={item.id} style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
              <div style={{ display: "flex", gap: 12 }}>
                <img className="row-thumb" style={{ width: 56, height: 56 }} src={item.imageUrl || "https://placehold.co/60x60"} alt="" />
                <div>
                  <strong>{item.name}</strong>
                  <p className="hint" style={{ margin: "4px 0 0" }}>
                    Qty {item.quantity} · {formatCurrency(item.unitPrice)} each · {formatCurrency(item.lineTotal)} total
                  </p>
                </div>
              </div>
              <StatusBadge status={item.status} />
            </div>

            {canUpdate && NEXT_ACTIONS[item.status] && (
              <div className="btn-row">
                {NEXT_ACTIONS[item.status].map((action) => (
                  <button
                    key={action.status}
                    className={`btn ${action.className} btn-sm`}
                    disabled={updatingItem === item.id}
                    onClick={() => handleAction(item.id, action.status)}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <h4 className="hint" style={{ margin: "0 0 8px", fontWeight: 700 }}>Timeline</h4>
              <div className="status-stepper">
                {item.statusHistory.map((entry, index) => (
                  <span
                    key={index}
                    className={`status-step ${index === item.statusHistory.length - 1 ? "current" : "done"}`}
                  >
                    {entry.status.replace(/_/g, " ")} · {formatDateTime(entry.at)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
