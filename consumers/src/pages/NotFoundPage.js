import { Link } from "react-router-dom";
import StorefrontLayout from "../components/StorefrontLayout";

export default function NotFoundPage() {
  return (
    <StorefrontLayout>
      <div className="loading-screen" style={{ flexDirection: "column", gap: 12 }}>
        <h2>Page not found</h2>
        <Link to="/" className="btn btn-primary">Go home</Link>
      </div>
    </StorefrontLayout>
  );
}
