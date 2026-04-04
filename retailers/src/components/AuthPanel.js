import React from "react";

const fieldGroups = {
  login: [
    {
      name: "email",
      label: "Work email",
      type: "email",
      placeholder: "store@brand.com",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "Enter password",
    },
  ],
  register: [
    {
      name: "companyName",
      label: "Company name",
      type: "text",
      placeholder: "Northwind Retail",
    },
    {
      name: "contactName",
      label: "Owner name",
      type: "text",
      placeholder: "Alex Johnson",
    },
    {
      name: "email",
      label: "Work email",
      type: "email",
      placeholder: "store@brand.com",
    },
    {
      name: "contactNumber",
      label: "Phone",
      type: "text",
      placeholder: "+1 555 000 1234",
    },
    {
      name: "password",
      label: "Password",
      type: "password",
      placeholder: "At least 6 characters",
    },
    {
      name: "companyLogo",
      label: "Logo URL",
      type: "text",
      placeholder: "https://images...",
    },
  ],
};

function AuthPanel({
  mode,
  form,
  setForm,
  onSubmit,
  onModeChange,
  loading,
  error,
}) {
  const fields = fieldGroups[mode];

  return (
    <section className="auth-card glass-card">
      <p className="eyebrow">Get started</p>
      <h2>
        {mode === "login" ? "Login to retailer studio" : "Register your store"}
      </h2>
      <p className="muted-text auth-copy">
        Manage categories, products, pricing, stock and customer-ready catalog
        experiences.
      </p>

      <div className="toggle-row">
        <button
          type="button"
          className={
            mode === "login" ? "toggle-button active" : "toggle-button"
          }
          onClick={() => onModeChange("login")}
        >
          Login
        </button>
        <button
          type="button"
          className={
            mode === "register" ? "toggle-button active" : "toggle-button"
          }
          onClick={() => onModeChange("register")}
        >
          Register
        </button>
      </div>

      <form
        className="stack-gap"
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        {fields.map((field) => (
          <label key={field.name} className="input-group">
            <span>{field.label}</span>
            <input
              type={field.type}
              value={form[field.name] || ""}
              placeholder={field.placeholder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  [field.name]: event.target.value,
                }))
              }
            />
          </label>
        ))}

        {error ? <div className="form-error">{error}</div> : null}

        <button
          type="submit"
          className="primary-button wide-button"
          style={{
            paddingTop: 10,
            paddingBottom: 10,
            marginBottom: 10,
            borderRadius: 5,
          }}
          disabled={loading}
        >
          {loading
            ? "Please wait..."
            : mode === "login"
              ? "Open retailer dashboard"
              : "Create retailer account"}
        </button>
      </form>

      <button
        type="button"
        className="ghost-button wide-button"
        onClick={() => onModeChange(mode === "login" ? "register" : "login")}
      >
        {mode === "login"
          ? "Need an account? Switch to register"
          : "Already registered? Switch to login"}
      </button>
    </section>
  );
}

export default AuthPanel;
