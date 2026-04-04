import React from "react";

function OrderList({ orders }) {
  return (
    <section className="orders-panel glass-card">
      <div className="section-heading">
        <div>
          <span className="eyebrow">After checkout</span>
          <h2>Your recent orders</h2>
        </div>
      </div>

      <div className="data-list">
        {orders.length ? (
          orders.map((order) => (
            <div key={order.id} className="list-row order-row">
              <div>
                <strong>{order.items.length} products</strong>
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
            Orders placed from this consumer account will appear here.
          </p>
        )}
      </div>
    </section>
  );
}

export default OrderList;
