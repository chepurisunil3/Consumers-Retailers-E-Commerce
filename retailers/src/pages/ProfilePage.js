import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";
import DashboardLayout from "../components/DashboardLayout";
import Banner from "../components/Banner";
import ImageUploader from "../components/ImageUploader";

export default function ProfilePage() {
  const { token, user, setUser, staffRole } = useAuth();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        companyName: user.companyName,
        contactName: user.contactName,
        contactNumber: user.contactNumber,
        companyLogo: user.companyLogo,
        address: user.address || {},
        bankDetails: { ...user.bankDetails, accountNumber: "" },
      });
    }
  }, [user]);

  if (!form) return null;

  const canEdit = staffRole === "owner";

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const payload = { ...form };
      if (!payload.bankDetails.accountNumber) delete payload.bankDetails.accountNumber;
      const res = await retailerApi.updateProfile(token, payload);
      setUser({ ...res.data, staffRole });
      setSuccess("Business profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout title="Business profile">
      <div className="page">
        <div className="page-header">
          <div>
            <h2>Business profile</h2>
            <p>Update your store details, address and payout information.</p>
          </div>
        </div>
        <Banner>{error}</Banner>
        <Banner type="success">{success}</Banner>

        <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 640 }}>
          <ImageUploader
            value={form.companyLogo}
            onChange={(url) => setForm({ ...form, companyLogo: url })}
            label="Store logo"
          />
          <fieldset disabled={!canEdit} style={{ border: "none", padding: 0, margin: 0 }}>
            <div className="form-row">
              <div className="form-group">
                <label>Company name</label>
                <input value={form.companyName} onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Contact name</label>
                <input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
            </div>
            <div className="form-group">
              <label>Contact number</label>
              <input value={form.contactNumber} onChange={(e) => setForm({ ...form, contactNumber: e.target.value })} />
            </div>

            <h3 className="section-title" style={{ marginTop: 8 }}>Address</h3>
            <div className="form-group">
              <label>Address line</label>
              <input
                value={form.address.line1 || ""}
                onChange={(e) => setForm({ ...form, address: { ...form.address, line1: e.target.value } })}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>City</label>
                <input
                  value={form.address.city || ""}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, city: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label>State</label>
                <input
                  value={form.address.state || ""}
                  onChange={(e) => setForm({ ...form, address: { ...form.address, state: e.target.value } })}
                />
              </div>
            </div>

            <h3 className="section-title" style={{ marginTop: 8 }}>Payout bank details</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Account holder</label>
                <input
                  value={form.bankDetails.accountHolderName || ""}
                  onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountHolderName: e.target.value } })}
                />
              </div>
              <div className="form-group">
                <label>Bank name</label>
                <input
                  value={form.bankDetails.bankName || ""}
                  onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, bankName: e.target.value } })}
                />
              </div>
            </div>
            <div className="form-group">
              <label>New account number (leave blank to keep current — currently {form.bankDetails.accountNumberMasked || "not set"})</label>
              <input
                value={form.bankDetails.accountNumber || ""}
                onChange={(e) => setForm({ ...form, bankDetails: { ...form.bankDetails, accountNumber: e.target.value } })}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
          </fieldset>
          {!canEdit && <p className="hint" style={{ marginTop: 10 }}>Only the account owner can edit business details.</p>}
        </form>
      </div>
    </DashboardLayout>
  );
}
