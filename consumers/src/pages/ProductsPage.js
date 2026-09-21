import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import ProductCard from "../components/ProductCard";
import { consumerApi } from "../services/api";

const SORT_OPTIONS = [
  { value: "", label: "Featured" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
  { value: "discount", label: "Best Discount" },
];

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const q = searchParams.get("q") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const sort = searchParams.get("sort") || "";
  const onDiscount = searchParams.get("onDiscount") || "";

  useEffect(() => {
    consumerApi.getCategories().then((res) => setCategories(res.data));
  }, []);

  useEffect(() => {
    setLoading(true);
    consumerApi
      .getProducts({ q, categoryId, sort, onDiscount })
      .then((res) => setProducts(res.data))
      .finally(() => setLoading(false));
  }, [q, categoryId, sort, onDiscount]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    setSearchParams(next);
  };

  return (
    <StorefrontLayout>
      <div className="page-header" style={{ marginBottom: 6 }}>
        <h2 style={{ margin: 0 }}>{q ? `Results for "${q}"` : "All Products"}</h2>
      </div>

      <div className="filter-bar">
        <button className={`pill-tab${!categoryId ? " active" : ""}`} onClick={() => updateParam("categoryId", "")}>
          All categories
        </button>
        {categories.map((category) => (
          <button
            key={category.id}
            className={`pill-tab${categoryId === category.id ? " active" : ""}`}
            onClick={() => updateParam("categoryId", category.id)}
          >
            {category.name}
          </button>
        ))}
        <button className={`pill-tab${onDiscount ? " active" : ""}`} onClick={() => updateParam("onDiscount", onDiscount ? "" : "true")}>
          On discount
        </button>
        <select value={sort} onChange={(e) => updateParam("sort", e.target.value)} style={{ marginLeft: "auto", maxWidth: 200 }}>
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="empty-state">Loading products…</div>
      ) : products.length === 0 ? (
        <div className="empty-state">No products match your search.</div>
      ) : (
        <div className="product-grid">
          {products.map((product) => <ProductCard key={product.id} product={product} />)}
        </div>
      )}
    </StorefrontLayout>
  );
}
