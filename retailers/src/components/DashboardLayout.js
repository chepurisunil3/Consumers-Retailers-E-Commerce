import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/dashboard", label: "Overview", end: true },
  { to: "/dashboard/products", label: "Products" },
  { to: "/dashboard/categories", label: "Categories" },
  { to: "/dashboard/orders", label: "Orders" },
  { to: "/dashboard/staff", label: "Team", permission: "staff.manage" },
  { to: "/dashboard/profile", label: "Business Profile" },
];

export default function DashboardLayout({ title, children }) {
  const { user, staffRole, can, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="dashboard-shell">
      <aside className="sidebar">
        <div className="brand">
          Retail<span>Hub</span>
        </div>
        <nav>
          {NAV_ITEMS.filter((item) => !item.permission || can(item.permission)).map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.companyName || user?.name}</strong>
            {staffRole === "owner" ? "Owner" : `${staffRole[0].toUpperCase()}${staffRole.slice(1)}`}
          </div>
          <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="main-col">
        <header className="topbar">
          <h1>{title}</h1>
          <span className="topbar-role">{staffRole}</span>
        </header>
        {children}
      </div>
    </div>
  );
}
