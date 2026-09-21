import { useEffect, useState } from "react";
import StorefrontLayout from "../components/StorefrontLayout";
import Banner from "../components/Banner";
import ImageUploader from "../components/ImageUploader";
import { useAuth } from "../context/AuthContext";
import { consumerApi } from "../services/api";

export default function ProfilePage() {
  const { token, user, setUser } = useAuth();
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name: user.name, email: user.email, mobileNumber: user.mobileNumber, profilePhoto: user.profilePhoto });
    }
  }, [user]);

  if (!form) return null;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await consumerApi.updateProfile(token, form);
      setUser(res.data);
      setSuccess("Profile updated.");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <StorefrontLayout>
      <h2>Your profile</h2>
      <Banner>{error}</Banner>
      <Banner type="success">{success}</Banner>

      <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 480 }}>
        <ImageUploader value={form.profilePhoto} onChange={(url) => setForm({ ...form, profilePhoto: url })} label="Profile photo" />
        <div className="form-group">
          <label>Name</label>
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="form-group">
          <label>Mobile number</label>
          <input value={form.mobileNumber} onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })} />
        </div>
        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>
    </StorefrontLayout>
  );
}
