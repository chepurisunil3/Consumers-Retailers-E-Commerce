import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { retailerApi, ITEM_STATUS_LABELS } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import Banner from "../components/Banner";
import { formatCurrency, formatDate } from "../utils/format";

const FILTERS = ["all", "pending", "accepted", "dispatched", "out_for_delivery", "delivered", "cancelled", "return_requested", "returned"];

export default function OrdersListPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    retailerApi
      .getOrders(token, filter === "all" ? undefined : filter)
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, filter]);

  return (
    <DashboardLayout title="Orders">
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Orders</h2>
            <p>Accept new orders and move them through fulfilment.</p>
          </div>
        </div>
        <Banner>{error}</Banner>

        <div className="pill-tabs" style={{ marginBottom: 16 }}>
          {FILTERS.map((status) => (
            <button
              key={status}
              className={`pill-tab${filter === status ? " active" : ""}`}
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "All" : ITEM_STATUS_LABELS[status]}
            </button>
          ))}
        </div>

        <div className="card">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : orders.length === 0 ? (
            <div className="empty-state">No orders in this view yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order</th>
                    <th>Items</th>
                    <th>Payment</th>
                    <th>Total</th>
                    <th>Placed</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td>#{order.id.slice(-6)}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          {order.items.map((item) => (
                            <span key={item.id} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                              {item.name} × {item.quantity} <StatusBadge status={item.status} />
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textTransform: "capitalize" }}>
                        {order.paymentMethod === "cod" ? "COD" : "Paid online"}
                      </td>
                      <td>{formatCurrency(order.items.reduce((s, i) => s + i.lineTotal, 0))}</td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        <Link to={`/dashboard/orders/${order.id}`} className="btn btn-secondary btn-sm">
                          Manage
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
