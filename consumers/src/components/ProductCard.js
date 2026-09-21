import { Link } from "react-router-dom";
import { formatCurrency } from "../utils/format";

export default function ProductCard({ product }) {
  const outOfStock = product.inventory <= 0;
  const lowStock = !outOfStock && product.inventory <= 5;

  return (
    <Link to={`/products/${product.id}`} className="product-card">
      {product.discountPercent > 0 && <span className="badge-tag">{product.discountPercent}% OFF</span>}
      <img className="thumb" src={product.imageUrl || "https://placehold.co/300x300"} alt={product.name} />
      <p className="name">{product.name}</p>
      <div className="price-row">
        <span className="price-final">{formatCurrency(product.price)}</span>
        {product.mrp > product.price && <span className="price-mrp">{formatCurrency(product.mrp)}</span>}
        {product.discountPercent > 0 && <span className="price-discount">{product.discountPercent}% off</span>}
      </div>
      <div className={`stock-line${outOfStock ? " out" : lowStock ? " low" : ""}`}>
        {outOfStock ? "Out of stock" : lowStock ? `Only ${product.inventory} left` : "In stock"}
      </div>
    </Link>
  );
}
