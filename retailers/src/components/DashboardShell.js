import React from "react";

function StatCard({ label, value, hint }) {
  return (
    <article className="stat-card glass-card">
      <p className="stat-label">{label}</p>
      <h3>{value}</h3>
      <p className="muted-text">{hint}</p>
    </article>
  );
}

function DashboardShell({
  user,
  dashboard,
  categories,
  products,
  categoryForm,
  setCategoryForm,
  productForm,
  setProductForm,
  onCategorySubmit,
  onCategoryDelete,
  onProductSubmit,
  onProductDelete,
  onProductToggle,
  saving,
  onLogout,
  feedback,
}) {
  const stats = dashboard?.stats || {
    categoriesCount: 0,
    productsCount: 0,
    lowStockProducts: 0,
    inventoryValue: 0,
  };

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header glass-card">
        <div>
          <p className="eyebrow">Retailer control center</p>
          <h1>{user.companyName || "Your storefront"}</h1>
          <p className="muted-text">
            Welcome back {user.contactName || "owner"}. Keep your assortment
            fresh and inventory healthy.
          </p>
        </div>
        <div className="header-actions">
          {user.companyLogo ? (
            <img
              className="brand-avatar"
              src={user.companyLogo}
              alt={user.companyName}
            />
          ) : (
            <div className="brand-avatar fallback-avatar">
              {(user.companyName || "R").slice(0, 1)}
            </div>
          )}
          <button type="button" className="ghost-button" onClick={onLogout}>
            Logout
          </button>
        </div>
      </header>

      {feedback ? <div className="feedback-banner">{feedback}</div> : null}

      <section className="stats-grid">
        <StatCard
          label="Categories"
          value={stats.categoriesCount}
          hint="Organize catalog with clear taxonomy."
        />
        <StatCard
          label="Products"
          value={stats.productsCount}
          hint="Live items available for shoppers."
        />
        <StatCard
          label="Low stock"
          value={stats.lowStockProducts}
          hint="Products with 5 units or fewer."
        />
        <StatCard
          label="Inventory value"
          value={`$${Number(stats.inventoryValue || 0).toFixed(2)}`}
          hint="Approximate stock value at current pricing."
        />
      </section>

      <section className="two-column-grid">
        <article className="glass-card manager-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Catalog foundation</p>
              <h2>Categories</h2>
            </div>
          </div>

          <form
            className="stack-gap compact-form"
            onSubmit={(event) => {
              event.preventDefault();
              onCategorySubmit();
            }}
          >
            <label className="input-group">
              <span>Category name</span>
              <input
                value={categoryForm.name}
                placeholder="Electronics"
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="input-group">
              <span>Description</span>
              <textarea
                rows="3"
                value={categoryForm.description}
                placeholder="Short category summary"
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label className="input-group">
              <span>Image URL</span>
              <input
                value={categoryForm.imageUrl}
                placeholder="https://images..."
                onChange={(event) =>
                  setCategoryForm((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
              />
            </label>
            <button type="submit" className="primary-button" disabled={saving}>
              Add category
            </button>
          </form>

          <div className="data-list">
            {categories.length ? (
              categories.map((category) => (
                <div key={category.id} className="list-row">
                  <div>
                    <strong>{category.name}</strong>
                    <p className="muted-text">
                      {category.description || "No description yet."}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-button danger"
                    onClick={() => onCategoryDelete(category.id)}
                  >
                    Delete
                  </button>
                </div>
              ))
            ) : (
              <p className="empty-state">
                No categories yet. Add your first one to start building the
                catalog.
              </p>
            )}
          </div>
        </article>

        <article className="glass-card manager-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Sellable inventory</p>
              <h2>Products</h2>
            </div>
          </div>

          <form
            className="stack-gap compact-form"
            onSubmit={(event) => {
              event.preventDefault();
              onProductSubmit();
            }}
          >
            <label className="input-group">
              <span>Product name</span>
              <input
                value={productForm.name}
                placeholder="Wireless headphones"
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
            </label>
            <label className="input-group">
              <span>Category</span>
              <select
                value={productForm.categoryId}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    categoryId: event.target.value,
                  }))
                }
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <div className="inline-grid">
              <label className="input-group">
                <span>Price</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.price}
                  placeholder="129.99"
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      price: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="input-group">
                <span>Inventory</span>
                <input
                  type="number"
                  min="0"
                  value={productForm.inventory}
                  placeholder="35"
                  onChange={(event) =>
                    setProductForm((current) => ({
                      ...current,
                      inventory: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
            <label className="input-group">
              <span>Description</span>
              <textarea
                rows="3"
                value={productForm.description}
                placeholder="Why customers will love it"
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
              />
            </label>
            <label className="input-group">
              <span>Image URL</span>
              <input
                value={productForm.imageUrl}
                placeholder="https://images..."
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    imageUrl: event.target.value,
                  }))
                }
              />
            </label>
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={productForm.isFeatured}
                onChange={(event) =>
                  setProductForm((current) => ({
                    ...current,
                    isFeatured: event.target.checked,
                  }))
                }
              />
              <span>Feature this product</span>
            </label>
            <button
              type="submit"
              className="primary-button"
              disabled={saving || !categories.length}
            >
              Add product
            </button>
          </form>

          <div className="data-list product-list">
            {products.length ? (
              products.map((product) => (
                <div key={product.id} className="list-row product-row">
                  <div>
                    <strong>{product.name}</strong>
                    <p className="muted-text">
                      ${Number(product.price).toFixed(2)} · {product.inventory}{" "}
                      in stock · {product.category?.name || "Unassigned"}
                    </p>
                  </div>
                  <div className="row-actions">
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        onProductToggle(product, {
                          isFeatured: !product.isFeatured,
                        })
                      }
                    >
                      {product.isFeatured ? "Unfeature" : "Feature"}
                    </button>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() =>
                        onProductToggle(product, {
                          isActive: !product.isActive,
                        })
                      }
                    >
                      {product.isActive ? "Archive" : "Activate"}
                    </button>
                    <button
                      type="button"
                      className="text-button danger"
                      onClick={() => onProductDelete(product.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">
                No products yet. Add your first product to publish inventory.
              </p>
            )}
          </div>
        </article>
      </section>

      <section className="two-column-grid lower-grid">
        <article className="glass-card manager-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest updates</p>
              <h2>Recent products</h2>
            </div>
          </div>
          <div className="data-list">
            {(dashboard?.recentProducts || []).length ? (
              dashboard.recentProducts.map((product) => (
                <div key={product.id} className="list-row">
                  <div>
                    <strong>{product.name}</strong>
                    <p className="muted-text">
                      {product.category?.name || "No category"} · $
                      {Number(product.price).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="empty-state">
                Your newest products will appear here.
              </p>
            )}
          </div>
        </article>

        <article className="glass-card manager-card">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Sales pulse</p>
              <h2>Recent orders</h2>
            </div>
          </div>
          <div className="data-list">
            {(dashboard?.recentOrders || []).length ? (
              dashboard.recentOrders.map((order) => (
                <div key={order.id} className="list-row">
                  <div>
                    <strong>{order.itemCount} items</strong>
                    <p className="muted-text">
                      {new Date(order.createdAt).toLocaleDateString()} ·{" "}
                      {order.status}
                    </p>
                  </div>
                  <strong>${Number(order.total).toFixed(2)}</strong>
                </div>
              ))
            ) : (
              <p className="empty-state">
                Orders created by consumers will show here.
              </p>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}

export default DashboardShell;
