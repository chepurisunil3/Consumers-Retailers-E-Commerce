import React from "react";

function ProductCard({ product, onAddToCart }) {
  return (
    <article className="product-card glass-card">
      <div className="product-image-wrap">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="product-image"
          />
        ) : (
          <div className="product-image placeholder-gradient" />
        )}
      </div>
      <div className="product-body">
        <p className="eyebrow">{product.category?.name || "General"}</p>
        <h3>{product.name}</h3>
        <p className="muted-text product-description">
          {product.description || "Freshly published by the retailer."}
        </p>
        <div className="product-meta muted-text">
          <span>{product.retailer?.companyName || "Retailer"}</span>
          <span>{product.inventory} in stock</span>
        </div>
        <div className="product-footer">
          <strong>${Number(product.price).toFixed(2)}</strong>
          <button
            type="button"
            className="primary-button"
            onClick={() => onAddToCart(product)}
            disabled={!product.inventory}
          >
            {product.inventory ? "Add to cart" : "Out of stock"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
