import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="loading-screen" style={{ flexDirection: "column", gap: 12 }}>
      <h2>Page not found</h2>
      <Link to="/" className="btn btn-primary">Go home</Link>
    </div>
  );
}
