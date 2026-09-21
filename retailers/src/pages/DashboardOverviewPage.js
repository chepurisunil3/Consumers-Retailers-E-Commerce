import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import StatusBadge from "../components/StatusBadge";
import Banner from "../components/Banner";
import { formatCurrency, formatDate } from "../utils/format";

export default function DashboardOverviewPage() {
  const { token, can } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    retailerApi
      .getDashboard(token)
      .then((res) => setData(res.data))
      .catch((err) => setError(err.message));
  }, [token]);

  const showEarnings = can("dashboard.earnings");
  const maxTrend = Math.max(1, ...(data?.trend || []).map((t) => t.total));

  return (
    <DashboardLayout title="Overview">
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Welcome back</h2>
            <p>Here's how your store is performing.</p>
          </div>
        </div>
        <Banner>{error}</Banner>

        {!data ? (
          <div className="empty-state card">Loading dashboard…</div>
        ) : (
          <>
            <div className="stat-grid">
              <div className="stat-card">
                <div className="label">Products</div>
                <div className="value">{data.stats.productsCount}</div>
              </div>
              <div className="stat-card">
                <div className="label">Categories</div>
                <div className="value">{data.stats.categoriesCount}</div>
              </div>
              <div className={`stat-card${data.stats.pendingAttentionCount > 0 ? " attention" : ""}`}>
                <div className="label">Pending orders needing attention</div>
                <div className="value">{data.stats.pendingAttentionCount}</div>
              </div>
              <div className="stat-card attention">
                <div className="label">Low stock items</div>
                <div className="value">{data.stats.lowStockProducts}</div>
              </div>
              {showEarnings && (
                <>
                  <div className="stat-card">
                    <div className="label">Earnings (delivered)</div>
                    <div className="value">{formatCurrency(data.stats.earnings)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="label">Inventory value</div>
                    <div className="value">{formatCurrency(data.stats.inventoryValue)}</div>
                  </div>
                </>
              )}
            </div>

            <div className="grid-2">
              <div className="card">
                <h3 className="section-title">Recent orders</h3>
                {data.recentOrders.length === 0 ? (
                  <div className="empty-state">No orders yet.</div>
                ) : (
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Order</th>
                          <th>Status</th>
                          <th>Items</th>
                          <th>Total</th>
                          <th>Placed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentOrders.map((order) => (
                          <tr key={order.id}>
                            <td>
                              <Link to={`/dashboard/orders/${order.id}`}>#{order.id.slice(-6)}</Link>
                            </td>
                            <td><StatusBadge status={order.status} /></td>
                            <td>{order.itemCount}</td>
                            <td>{formatCurrency(order.total)}</td>
                            <td>{formatDate(order.createdAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {showEarnings && data.trend.length > 0 && (
                  <div style={{ marginTop: 24 }}>
                    <h3 className="section-title">Sales trend (last 14 days)</h3>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 90 }}>
                      {data.trend.map((point) => (
                        <div
                          key={point.date}
                          title={`${point.date}: ${formatCurrency(point.total)}`}
                          style={{
                            flex: 1,
                            height: `${Math.max(6, (point.total / maxTrend) * 90)}px`,
                            background: "var(--primary)",
                            borderRadius: 4,
                          }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="card">
                <h3 className="section-title">Low stock</h3>
                {data.lowStockList.length === 0 ? (
                  <div className="empty-state">All products are well stocked.</div>
                ) : (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 }}>
                    {data.lowStockList.map((product) => (
                      <li key={product._id || product.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                        <span>{product.name}</span>
                        <strong style={{ color: "var(--warning)" }}>{product.inventory} left</strong>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
