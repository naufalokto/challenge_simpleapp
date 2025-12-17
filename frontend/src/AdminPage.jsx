import React from "react";

function AdminPage({ user, onLogout }) {
  return (
    <div
      style={{
        fontFamily: "'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100vh",
        background: "#f9fafb",
      }}
    >
      {/* Header dengan logout button */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 24px",
          background: "#fff",
          borderBottom: "1px solid #e5e7eb",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "20px", fontWeight: 600, color: "#111827" }}>
          Admin Page
        </h1>
        <button
          onClick={onLogout}
          style={{
            padding: "8px 16px",
            background: "#dc2626",
            color: "#fff",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: 500,
          }}
        >
          Logout
        </button>
      </div>

      {/* Main Content - Admin Page */}
      <div
        style={{
          padding: "48px 24px",
          maxWidth: "1200px",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "#fff",
            borderRadius: "12px",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px 0",
              fontSize: "32px",
              fontWeight: 600,
              color: "#111827",
            }}
          >
            Selamat Datang, Admin
          </h2>
          <p
            style={{
              margin: "0 0 24px 0",
              fontSize: "18px",
              color: "#6b7280",
            }}
          >
            Ini adalah halaman khusus untuk Administrator
          </p>
          <div
            style={{
              marginTop: "32px",
              padding: "24px",
              background: "#fef3c7",
              borderRadius: "8px",
              border: "1px solid #fbbf24",
            }}
          >
            <h3 style={{ margin: "0 0 8px 0", color: "#92400e" }}>Admin Panel</h3>
            <p style={{ margin: "0", color: "#92400e" }}>
              Anda memiliki akses penuh sebagai Administrator. Fitur admin akan tersedia di sini.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;

