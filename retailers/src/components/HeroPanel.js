import React from "react";

function HeroPanel() {
  return (
    <section className="hero-panel glass-card">
      <span className="hero-badge">Modern retailer workspace</span>
      <h1>Launch a polished catalog, manage stock, and sell faster.</h1>
      <p>
        The retailer app now supports live authentication, category setup,
        product publishing and order visibility with a modern control-room
        experience.
      </p>

      <div className="feature-grid">
        <article>
          <strong>Smart overview</strong>
          <span>
            Monitor product counts, low-stock risk and inventory value
            instantly.
          </span>
        </article>
        <article>
          <strong>Catalog control</strong>
          <span>
            Create categories and products with feature flags and archive
            controls.
          </span>
        </article>
        <article>
          <strong>Order insight</strong>
          <span>
            Recent consumer purchases flow into the dashboard for quick
            follow-up.
          </span>
        </article>
        <article>
          <strong>Consistent branding</strong>
          <span>
            Refined gradients and glassmorphism keep the UI aligned across both
            apps.
          </span>
        </article>
      </div>
    </section>
  );
}

export default HeroPanel;
