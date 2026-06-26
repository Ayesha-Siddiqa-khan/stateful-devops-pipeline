import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export default function Home() {
  const [form, setForm] = useState({ name: "", role: "", tool: "", headline: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ status: "error", profile_card: "Could not reach the backend." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>DevOps Profile Card Generator</h1>
        <p style={styles.subtitle}>Fill in your details and generate a profile card</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { label: "Name", name: "name", placeholder: "e.g. Ali" },
            { label: "Role", name: "role", placeholder: "e.g. DevOps Engineer" },
            { label: "Favourite DevOps Tool", name: "tool", placeholder: "e.g. Kubernetes" },
            { label: "LinkedIn Headline", name: "headline", placeholder: "e.g. Building cloud-native pipelines" },
          ].map((field) => (
            <div key={field.name} style={styles.field}>
              <label style={styles.label}>{field.label}</label>
              <input
                name={field.name}
                value={form[field.name]}
                onChange={handleChange}
                placeholder={field.placeholder}
                required
                style={styles.input}
              />
            </div>
          ))}

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Generating..." : "Generate Profile Card"}
          </button>
        </form>

        {result && (
          <div
            style={{
              ...styles.result,
              borderColor: result.status === "success" ? "#22c55e" : "#ef4444",
            }}
          >
            <span style={styles.badge}>{result.status === "success" ? "SUCCESS" : "ERROR"}</span>
            <p style={styles.message}>{result.profile_card}</p>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    fontFamily: "system-ui, sans-serif",
    padding: "1rem",
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: "12px",
    padding: "2rem",
    width: "100%",
    maxWidth: "480px",
    boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
  },
  title: {
    color: "#f8fafc",
    fontSize: "1.5rem",
    fontWeight: 700,
    margin: 0,
    marginBottom: "0.25rem",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.875rem",
    margin: "0 0 1.5rem 0",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
  },
  label: {
    color: "#cbd5e1",
    fontSize: "0.875rem",
    fontWeight: 500,
  },
  input: {
    padding: "0.625rem 0.75rem",
    borderRadius: "8px",
    border: "1px solid #334155",
    backgroundColor: "#0f172a",
    color: "#f8fafc",
    fontSize: "0.875rem",
    outline: "none",
  },
  button: {
    padding: "0.625rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    fontSize: "0.875rem",
    fontWeight: 600,
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  result: {
    marginTop: "1.25rem",
    padding: "1rem",
    borderRadius: "8px",
    border: "1px solid",
    backgroundColor: "#0f172a",
  },
  badge: {
    display: "inline-block",
    padding: "0.125rem 0.5rem",
    borderRadius: "4px",
    backgroundColor: "#1e293b",
    color: "#94a3b8",
    fontSize: "0.75rem",
    fontWeight: 600,
    letterSpacing: "0.05em",
  },
  message: {
    color: "#f8fafc",
    fontSize: "0.875rem",
    margin: "0.5rem 0 0 0",
  },
};
