import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";
import ProductCard from "../components/ProductCard";
import Banner from "../components/Banner";
import { consumerApi } from "../services/api";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/format";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const [product, setProduct] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setProduct(null);
    setAdded(false);
    setQuantity(1);
    consumerApi
      .getProduct(id)
      .then((res) => setProduct(res.data))
      .catch((err) => setError(err.message));
    consumerApi.getSuggestions(id).then((res) => setSuggestions(res.data)).catch(() => {});
    window.scrollTo(0, 0);
  }, [id]);

  if (error) {
    return (
      <StorefrontLayout>
        <Banner>{error}</Banner>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="empty-state">Loading…</div>
      </StorefrontLayout>
    );
  }

  const outOfStock = product.inventory <= 0;

  const handleAddToCart = () => {
    addItem(product, quantity);
    setAdded(true);
  };

  const handleBuyNow = () => {
    addItem(product, quantity);
    navigate("/cart");
  };

  return (
    <StorefrontLayout>
      <div className="two-col">
        <div className="card">
          <img
            src={product.imageUrl || "https://placehold.co/500x500"}
            alt={product.name}
            style={{ width: "100%", borderRadius: 10, objectFit: "cover", aspectRatio: "1/1" }}
          />
        </div>
        <div className="card">
          <p style={{ color: "var(--muted)", fontSize: 13, margin: "0 0 4px" }}>
            Sold by {product.retailer?.companyName}
          </p>
          <h1 style={{ fontSize: 22, margin: "0 0 10px" }}>{product.name}</h1>

          <div className="price-row" style={{ marginBottom: 6 }}>
            <span className="price-final" style={{ fontSize: 26 }}>{formatCurrency(product.price)}</span>
            {product.mrp > product.price && <span className="price-mrp">{formatCurrency(product.mrp)}</span>}
            {product.discountPercent > 0 && <span className="price-discount">{product.discountPercent}% off</span>}
          </div>
          {product.savings > 0 && (
            <p style={{ color: "var(--success)", fontSize: 13, margin: "0 0 14px" }}>
              You save {formatCurrency(product.savings)}
            </p>
          )}

          <p className={`stock-line${outOfStock ? " out" : product.inventory <= 5 ? " low" : ""}`}>
            {outOfStock ? "Out of stock" : product.inventory <= 5 ? `Only ${product.inventory} left in stock` : "In stock"}
          </p>

          {!outOfStock && (
            <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "14px 0" }}>
              <div className="qty-control">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantity}</span>
                <button onClick={() => setQuantity((q) => Math.min(product.inventory, q + 1))}>+</button>
              </div>
            </div>
          )}

          <div className="btn-row">
            <button className="btn btn-secondary" disabled={outOfStock} onClick={handleAddToCart}>
              {added ? "Added ✓" : "Add to cart"}
            </button>
            <button className="btn btn-primary" disabled={outOfStock} onClick={handleBuyNow}>
              Buy now
            </button>
          </div>

          {product.description && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ fontSize: 14 }}>About this item</h3>
              <p style={{ fontSize: 14, color: "var(--muted)" }}>{product.description}</p>
            </div>
          )}

          {product.attributes && Object.keys(product.attributes).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <h3 style={{ fontSize: 14 }}>Details</h3>
              <table style={{ width: "100%", fontSize: 13.5 }}>
                <tbody>
                  {Object.entries(product.attributes).map(([key, value]) => (
                    <tr key={key}>
                      <td style={{ padding: "4px 0", color: "var(--muted)", width: "40%" }}>{key}</td>
                      <td style={{ padding: "4px 0" }}>{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {suggestions.length > 0 && (
        <>
          <div className="section-heading"><h2>You may also like</h2></div>
          <div className="product-grid">
            {suggestions.map((item) => <ProductCard key={item.id} product={item} />)}
          </div>
        </>
      )}
    </StorefrontLayout>
  );
}
