import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { retailerApi, INDUSTRIES } from "../services/api";
import Banner from "../components/Banner";
import ImageUploader from "../components/ImageUploader";

const emptyForm = {
  companyName: "",
  contactName: "",
  contactNumber: "",
  email: "",
  password: "",
  industry: "",
  gstNumber: "",
  panNumber: "",
  address: { line1: "", city: "", state: "", postalCode: "" },
  bankDetails: { accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "" },
  companyLogo: "",
};

const STEPS = ["Business", "Tax details", "Address", "Bank payout", "Logo"];

export default function RegisterPage() {
  const { login, token } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(false);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));
  const updateNested = (group, field, value) =>
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [field]: value } }));

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const handleRegister = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await retailerApi.register(form);
      login(res.token, res.data);
      setRegistered(true);
      next();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogoChange = async (url) => {
    update("companyLogo", url);
    try {
      await retailerApi.updateProfile(token, { companyLogo: url });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <span className="brand">RetailHub Seller Console</span>
        <h1>Register your business.</h1>
        <p>
          A few quick steps to get your store set up — business details, GST &amp; PAN for
          compliance, your store address, and payout bank details.
        </p>
      </div>
      <div className="auth-card-wrap">
        <div className="auth-card">
          <h2>{STEPS[step]}</h2>
          <p className="subtitle">Step {step + 1} of {STEPS.length}</p>
          <div className="step-indicator">
            {STEPS.map((label, i) => (
              <span key={label} className={i <= step ? "active" : ""} />
            ))}
          </div>
          <Banner>{error}</Banner>

          {step === 0 && (
            <div>
              <div className="form-group">
                <label>Company name</label>
                <input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Your name</label>
                  <input value={form.contactName} onChange={(e) => update("contactName", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Contact number</label>
                  <input value={form.contactNumber} onChange={(e) => update("contactNumber", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
              </div>
              <div className="form-group">
                <label>Password</label>
                <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)} />
                <span className="hint">At least 6 characters.</span>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <div className="form-group">
                <label>Industry</label>
                <select value={form.industry} onChange={(e) => update("industry", e.target.value)}>
                  <option value="">Select an industry</option>
                  {INDUSTRIES.map((industry) => (
                    <option key={industry.value} value={industry.value}>
                      {industry.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>GSTIN</label>
                <input
                  value={form.gstNumber}
                  onChange={(e) => update("gstNumber", e.target.value.toUpperCase())}
                  placeholder="27AABCT1234C1Z5"
                  maxLength={15}
                />
                <span className="hint">15-character GST Identification Number.</span>
              </div>
              <div className="form-group">
                <label>PAN</label>
                <input
                  value={form.panNumber}
                  onChange={(e) => update("panNumber", e.target.value.toUpperCase())}
                  placeholder="AABCT1234C"
                  maxLength={10}
                />
                <span className="hint">10-character business PAN.</span>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div className="form-group">
                <label>Store address</label>
                <input
                  value={form.address.line1}
                  onChange={(e) => updateNested("address", "line1", e.target.value)}
                  placeholder="Shop / building, street"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>City</label>
                  <input value={form.address.city} onChange={(e) => updateNested("address", "city", e.target.value)} />
                </div>
                <div className="form-group">
                  <label>State</label>
                  <input value={form.address.state} onChange={(e) => updateNested("address", "state", e.target.value)} />
                </div>
              </div>
              <div className="form-group">
                <label>PIN code</label>
                <input
                  value={form.address.postalCode}
                  onChange={(e) => updateNested("address", "postalCode", e.target.value)}
                  maxLength={6}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <p className="hint" style={{ marginBottom: 14 }}>
                Used to pay out your earnings. Stored for demo purposes only — never share real bank
                details with a portfolio project.
              </p>
              <div className="form-group">
                <label>Account holder name</label>
                <input
                  value={form.bankDetails.accountHolderName}
                  onChange={(e) => updateNested("bankDetails", "accountHolderName", e.target.value)}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Account number</label>
                  <input
                    value={form.bankDetails.accountNumber}
                    onChange={(e) => updateNested("bankDetails", "accountNumber", e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>IFSC code</label>
                  <input
                    value={form.bankDetails.ifscCode}
                    onChange={(e) => updateNested("bankDetails", "ifscCode", e.target.value.toUpperCase())}
                    placeholder="HDFC0001234"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Bank name</label>
                <input
                  value={form.bankDetails.bankName}
                  onChange={(e) => updateNested("bankDetails", "bankName", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 4 && registered && (
            <div>
              <p className="hint" style={{ marginBottom: 14 }}>
                Your account is live. Add a store logo now, or skip and add it later from your
                business profile.
              </p>
              <ImageUploader value={form.companyLogo} onChange={handleLogoChange} label="Store logo" />
              <button className="btn btn-primary btn-block" onClick={() => navigate("/dashboard")}>
                Go to dashboard
              </button>
            </div>
          )}

          {step < 4 && (
            <div className="btn-row">
              {step > 0 && (
                <button className="btn btn-secondary" onClick={back} type="button">
                  Back
                </button>
              )}
              {step < 3 && (
                <button className="btn btn-primary" onClick={next} type="button">
                  Continue
                </button>
              )}
              {step === 3 && (
                <button className="btn btn-primary" onClick={handleRegister} disabled={loading} type="button">
                  {loading ? "Creating account…" : "Create account"}
                </button>
              )}
            </div>
          )}

          {step === 0 && (
            <div className="auth-switch">
              Already registered? <Link to="/login">Sign in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
