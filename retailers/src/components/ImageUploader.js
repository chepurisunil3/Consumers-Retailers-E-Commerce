import { useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { retailerApi } from "../services/api";

export default function ImageUploader({ value, onChange, label = "Image" }) {
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
      const res = await retailerApi.uploadImage(token, file);
      onChange(res.data.url);
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
        <img
          className="preview"
          src={value || "https://placehold.co/100x100?text=%20"}
          alt="Preview"
        />
        <div>
          <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} disabled={uploading} />
          {uploading && <p className="hint">Uploading…</p>}
          {error && <p className="hint" style={{ color: "var(--danger)" }}>{error}</p>}
        </div>
      </div>
    </div>
  );
}
