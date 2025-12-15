import React, { useEffect, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchItems = async () => {
    try {
      setError("");
      const res = await fetch(`${API_BASE}/items`);
      const data = await res.json();
      setItems(data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError("Gagal mengambil data");
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      if (!res.ok) {
        throw new Error("Gagal menyimpan data");
      }

      setTitle("");
      setDescription("");
      await fetchItems();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err);
      setError("Gagal menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        padding: "24px",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      <h1>Simple React + FastAPI App</h1>
      <p>
        Backend: <code>{API_BASE}</code>
      </p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          marginBottom: "24px",
          padding: "16px",
          borderRadius: "8px",
          border: "1px solid #ccc",
        }}
      >
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ padding: "8px", fontSize: "14px" }}
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          style={{ padding: "8px", fontSize: "14px" }}
        />
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "8px 12px",
            background: "#2563eb",
            color: "#fff",
            borderRadius: "4px",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Saving..." : "Save Item"}
        </button>
        {error && (
          <p style={{ color: "red", marginTop: "4px" }}>
            {error}
          </p>
        )}
      </form>

      <h2>Items</h2>
      {items.length === 0 ? (
        <p>Belum ada data.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "8px",
              }}
            >
              <strong>{item.title}</strong>
              {item.description && (
                <p style={{ margin: "4px 0 0 0" }}>{item.description}</p>
              )}
              <small style={{ color: "#6b7280" }}>ID: {item.id}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default App;


