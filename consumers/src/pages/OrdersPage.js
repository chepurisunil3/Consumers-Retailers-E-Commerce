import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import StatusBadge from "../components/StatusBadge";
import Banner from "../components/Banner";
import { useAuth } from "../context/AuthContext";
import { consumerApi } from "../services/api";
import { formatCurrency, formatDate } from "../utils/format";

export default function OrdersPage() {
  const { token } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    consumerApi
      .getOrders(token)
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  return (
    <StorefrontLayout>
      <h2>Your orders</h2>
      <Banner>{error}</Banner>
      {loading ? (
        <div className="empty-state">Loading…</div>
      ) : orders.length === 0 ? (
        <div className="empty-state card">
          You haven't placed any orders yet. <Link to="/products">Start shopping</Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 14 }}>
          {orders.map((order) => (
            <Link to={`/orders/${order.id}`} key={order.id} className="card" style={{ display: "block" }}>
              <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10, marginBottom: 10 }}>
                <div>
                  <strong>Order #{order.id.slice(-6)}</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 12.5, color: "var(--muted)" }}>
                    Placed {formatDate(order.createdAt)} · {formatCurrency(order.total)}
                  </p>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <div style={{ display: "flex", gap: 10, overflowX: "auto" }}>
                {order.items.map((item) => (
                  <img key={item.id} src={item.imageUrl || "https://placehold.co/60x60"} alt={item.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover" }} />
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </StorefrontLayout>
  );
}
