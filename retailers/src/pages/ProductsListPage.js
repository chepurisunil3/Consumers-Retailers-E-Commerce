import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import Banner from "../components/Banner";
import { formatCurrency } from "../utils/format";

export default function ProductsListPage() {
  const { token, can } = useAuth();
  const [products, setProducts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const canWrite = can("products.write");

  const load = () => {
    setLoading(true);
    retailerApi
      .getProducts(token)
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product? This cannot be undone.")) return;
    try {
      await retailerApi.deleteProduct(token, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleActive = async (product) => {
    try {
      await retailerApi.updateProduct(token, product.id, { isActive: !product.isActive });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout title="Products">
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Products</h2>
            <p>{products.length} product{products.length === 1 ? "" : "s"} in your catalog.</p>
          </div>
          {canWrite && (
            <Link to="/dashboard/products/new" className="btn btn-primary">
              + Add product
            </Link>
          )}
        </div>
        <Banner>{error}</Banner>

        <div className="card">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : products.length === 0 ? (
            <div className="empty-state">No products yet. Add your first one to start selling.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Category</th>
                    <th>MRP</th>
                    <th>Discount</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Status</th>
                    {canWrite && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <img className="row-thumb" src={product.imageUrl || "https://placehold.co/60x60"} alt="" />
                      </td>
                      <td>{product.name}</td>
                      <td>{product.category?.name || "—"}</td>
                      <td>{formatCurrency(product.mrp)}</td>
                      <td>{product.discountPercent}%</td>
                      <td><strong>{formatCurrency(product.price)}</strong></td>
                      <td style={{ color: product.inventory <= 5 ? "var(--warning)" : undefined }}>
                        {product.inventory}
                      </td>
                      <td>
                        <span className={`badge ${product.isActive ? "badge-delivered" : "badge-neutral"}`}>
                          {product.isActive ? "Active" : "Hidden"}
                        </span>
                      </td>
                      {canWrite && (
                        <td>
                          <div className="btn-row" style={{ marginTop: 0 }}>
                            <Link to={`/dashboard/products/${product.id}/edit`} className="btn btn-secondary btn-sm">
                              Edit
                            </Link>
                            <button className="btn btn-ghost btn-sm" onClick={() => toggleActive(product)}>
                              {product.isActive ? "Hide" : "Show"}
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(product.id)}>
                              Delete
                            </button>
                          </div>
                        </td>
                      )}
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
