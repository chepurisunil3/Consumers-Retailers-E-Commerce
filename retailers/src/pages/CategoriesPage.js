import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import Banner from "../components/Banner";

export default function CategoriesPage() {
  const { token, can } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const canWrite = can("categories.write");

  const load = () => {
    retailerApi
      .getCategories(token)
      .then((res) => setCategories(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    try {
      await retailerApi.createCategory(token, form);
      setForm({ name: "", description: "" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (id) => {
    setError("");
    try {
      await retailerApi.deleteCategory(token, id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout title="Categories">
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Categories</h2>
            <p>Organize your catalog so shoppers can browse by category.</p>
          </div>
        </div>
        <Banner>{error}</Banner>

        {canWrite && (
          <form className="card" onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Category name</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>
            </div>
            <button className="btn btn-primary" type="submit">Add category</button>
          </form>
        )}

        <div className="card">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : categories.length === 0 ? (
            <div className="empty-state">No categories yet. Add your first one above.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    {canWrite && <th></th>}
                  </tr>
                </thead>
                <tbody>
                  {categories.map((category) => (
                    <tr key={category.id}>
                      <td>{category.name}</td>
                      <td>{category.description || "—"}</td>
                      {canWrite && (
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(category.id)}>
                            Delete
                          </button>
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
