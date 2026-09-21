import StorefrontHeader from "./StorefrontHeader";

export default function StorefrontLayout({ children }) {
  return (
    <div className="app-shell">
      <StorefrontHeader />
      <div className="page-container">{children}</div>
      <footer className="footer">
        ShopDesi — a portfolio project. Not a real store. Built with React, Node.js, Express & MongoDB.
      </footer>
    </div>
  );
}
