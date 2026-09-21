import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:4000";

export default function ImageUploader({ value, onChange, label = "Photo" }) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  const handleFile = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("image", file);
      const response = await fetch(`${API_BASE_URL}/api/uploads/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || "Upload failed.");
      onChange(payload.data.url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="form-group">
      <label>{label}</label>
      <div className="image-upload">
        <img className="preview" src={value || "https://placehold.co/100x100?text=%20"} alt="Preview" />
        <div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={uploading} />
          {uploading && <p style={{ fontSize: 12 }}>Uploading…</p>}
          {error && <p style={{ fontSize: 12, color: "var(--danger)" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
