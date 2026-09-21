import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import Banner from "../components/Banner";
import ImageUploader from "../components/ImageUploader";
import { formatCurrency } from "../utils/format";

const emptyForm = {
  name: "",
  description: "",
  categoryId: "",
  mrp: "",
  discountPercent: "0",
  inventory: "",
  imageUrl: "",
  sku: "",
  tags: "",
  isFeatured: false,
};

export default function ProductFormPage() {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [attributes, setAttributes] = useState([{ key: "", value: "" }]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    retailerApi.getCategories(token).then((res) => setCategories(res.data));
  }, [token]);

  useEffect(() => {
    if (!isEdit) return;
    retailerApi.getProducts(token).then((res) => {
      const product = res.data.find((p) => p.id === id);
      if (!product) return;
      setForm({
        name: product.name,
        description: product.description || "",
        categoryId: product.category?.id || "",
        mrp: product.mrp,
        discountPercent: product.discountPercent,
        inventory: product.inventory,
        imageUrl: product.imageUrl || "",
        sku: product.sku || "",
        tags: (product.tags || []).join(", "),
        isFeatured: product.isFeatured,
      });
      const attrs = Object.entries(product.attributes || {});
      setAttributes(attrs.length ? attrs.map(([key, value]) => ({ key, value })) : [{ key: "", value: "" }]);
      setLoading(false);
    });
  }, [id, isEdit, token]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const updateAttribute = (index, field, value) => {
    setAttributes((prev) => prev.map((attr, i) => (i === index ? { ...attr, [field]: value } : attr)));
  };
  const addAttribute = () => setAttributes((prev) => [...prev, { key: "", value: "" }]);
  const removeAttribute = (index) => setAttributes((prev) => prev.filter((_, i) => i !== index));

  const finalPrice = (Number(form.mrp) || 0) * (1 - (Number(form.discountPercent) || 0) / 100);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");

    const attributesObject = attributes.reduce((acc, attr) => {
      if (attr.key.trim()) acc[attr.key.trim()] = attr.value;
      return acc;
    }, {});

    const payload = { ...form, attributes: attributesObject };

    try {
      if (isEdit) {
        await retailerApi.updateProduct(token, id, payload);
      } else {
        await retailerApi.createProduct(token, payload);
      }
      navigate("/dashboard/products");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Edit product">
        <div className="page"><div className="empty-state card">Loading…</div></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={isEdit ? "Edit product" : "Add product"}>
      <div className="page">
        <div className="page-header">
          <div>
            <h2>{isEdit ? "Edit product" : "Add a new product"}</h2>
            <p>Set pricing, stock and any details specific to your industry.</p>
          </div>
        </div>
        <Banner>{error}</Banner>

        <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 720 }}>
          <div className="form-group">
            <label>Product name</label>
            <input required value={form.name} onChange={(e) => update("name", e.target.value)} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea value={form.description} onChange={(e) => update("description", e.target.value)} />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select required value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input value={form.sku} onChange={(e) => update("sku", e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>MRP (₹)</label>
              <input type="number" min="0" required value={form.mrp} onChange={(e) => update("mrp", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Discount %</label>
              <input
                type="number"
                min="0"
                max="90"
                value={form.discountPercent}
                onChange={(e) => update("discountPercent", e.target.value)}
              />
            </div>
          </div>
          <p className="hint" style={{ marginTop: -8, marginBottom: 16 }}>
            Customers will see: <strong>{formatCurrency(finalPrice)}</strong> (was {formatCurrency(form.mrp)})
          </p>

          <div className="form-row">
            <div className="form-group">
              <label>Stock quantity</label>
              <input type="number" min="0" required value={form.inventory} onChange={(e) => update("inventory", e.target.value)} />
            </div>
            <div className="form-group">
              <label>Tags (comma separated)</label>
              <input value={form.tags} onChange={(e) => update("tags", e.target.value)} />
            </div>
          </div>

          <ImageUploader value={form.imageUrl} onChange={(url) => update("imageUrl", url)} label="Product image" />

          <div className="form-group">
            <label>Custom details (industry-specific)</label>
            {attributes.map((attr, index) => (
              <div className="attribute-row" key={index}>
                <input placeholder="e.g. Size" value={attr.key} onChange={(e) => updateAttribute(index, "key", e.target.value)} />
                <input placeholder="e.g. M / L / XL" value={attr.value} onChange={(e) => updateAttribute(index, "value", e.target.value)} />
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => removeAttribute(index)}>✕</button>
              </div>
            ))}
            <button type="button" className="btn btn-secondary btn-sm" onClick={addAttribute}>+ Add detail</button>
          </div>

          <div className="checkbox-row" style={{ margin: "16px 0" }}>
            <input
              type="checkbox"
              id="featured"
              checked={form.isFeatured}
              onChange={(e) => update("isFeatured", e.target.checked)}
            />
            <label htmlFor="featured" style={{ fontWeight: 500 }}>Feature on storefront homepage</label>
          </div>

          <div className="btn-row">
            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
            </button>
            <button className="btn btn-secondary" type="button" onClick={() => navigate("/dashboard/products")}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
