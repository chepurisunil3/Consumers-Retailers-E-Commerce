import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import Banner from "../components/Banner";

const ROLES = [
  { value: "admin", label: "Admin — full access" },
  { value: "manager", label: "Manager — products, categories & orders" },
  { value: "sales", label: "Sales — view & update orders only" },
];

const emptyForm = { name: "", email: "", password: "", role: "sales" };

export default function StaffPage() {
  const { token } = useAuth();
  const [staff, setStaff] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const load = () => {
    retailerApi
      .getStaff(token)
      .then((res) => setStaff(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, [token]);

  const handleInvite = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");
    try {
      await retailerApi.inviteStaff(token, form);
      setForm(emptyForm);
      setSuccess(`${form.name} was added as ${form.role}.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleToggleActive = async (member) => {
    try {
      await retailerApi.updateStaff(token, member.id, { isActive: !member.isActive });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRemove = async (member) => {
    if (!window.confirm(`Remove ${member.name} from your team?`)) return;
    try {
      await retailerApi.removeStaff(token, member.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <DashboardLayout title="Team">
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Team members</h2>
            <p>Add managers and sales staff with permission-scoped access to your store.</p>
          </div>
        </div>
        <Banner>{error}</Banner>
        <Banner type="success">{success}</Banner>

        <form className="card" onSubmit={handleInvite} style={{ marginBottom: 20, maxWidth: 560 }}>
          <h3 className="section-title">Invite a team member</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Full name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Temporary password</label>
              <input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ROLES.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Add team member</button>
        </form>

        <div className="card">
          {loading ? (
            <div className="empty-state">Loading…</div>
          ) : staff.length === 0 ? (
            <div className="empty-state">No team members yet.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id}>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td style={{ textTransform: "capitalize" }}>{member.role}</td>
                      <td>
                        <span className={`badge ${member.isActive ? "badge-delivered" : "badge-neutral"}`}>
                          {member.isActive ? "Active" : "Disabled"}
                        </span>
                      </td>
                      <td>
                        <div className="btn-row" style={{ marginTop: 0 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => handleToggleActive(member)}>
                            {member.isActive ? "Disable" : "Enable"}
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemove(member)}>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
