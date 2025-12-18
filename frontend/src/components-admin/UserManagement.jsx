import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

function UserManagement({ token }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    full_name: "",
    password: "",
    role_id: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/roles`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          full_name: formData.full_name,
          password: formData.password,
          role_id: parseInt(formData.role_id),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to create user");
      }

      setSuccess("User berhasil dibuat!");
      setShowCreateForm(false);
      setFormData({
        username: "",
        email: "",
        full_name: "",
        password: "",
        role_id: "",
      });
      fetchUsers();
    } catch (err) {
      setError(err.message || "Gagal membuat user");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Anda yakin ingin menghapus user ini?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Failed to delete user");
      }

      setSuccess("User berhasil dihapus!");
      fetchUsers();
    } catch (err) {
      setError(err.message || "Gagal menghapus user");
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "20px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            fontSize: "20px",
            fontWeight: 800,
            color: "#000",
            margin: 0,
          }}
        >
          User Management
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{
            background: "#2148C0",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M8 3V13M3 8H13"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
          {showCreateForm ? "Batal" : "Tambah User"}
        </button>
      </div>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#dc2626",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {success && (
        <div
          style={{
            background: "#d1fae5",
            color: "#059669",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {success}
        </div>
      )}

      {showCreateForm && (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
            marginBottom: "30px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 800,
              color: "#000",
              margin: "0 0 20px 0",
            }}
          >
            Buat User Baru
          </h3>
          <form onSubmit={handleCreateUser}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "8px",
                  }}
                >
                  Username
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e6e6e6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "8px",
                  }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e6e6e6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "8px",
                  }}
                >
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData({ ...formData, full_name: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e6e6e6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "8px",
                  }}
                >
                  Password
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e6e6e6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#000",
                    marginBottom: "8px",
                  }}
                >
                  Role
                </label>
                <select
                  value={formData.role_id}
                  onChange={(e) =>
                    setFormData({ ...formData, role_id: e.target.value })
                  }
                  required
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: "1px solid #e6e6e6",
                    borderRadius: "8px",
                    fontSize: "14px",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Pilih Role</option>
                  {roles
                    .filter((role) => role.name === "admin" || role.name === "sales")
                    .map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.name.charAt(0).toUpperCase() + role.name.slice(1)}
                      </option>
                    ))}
                </select>
              </div>

              <button
                type="submit"
                style={{
                  background: "#2148C0",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                Buat User
              </button>
            </div>
          </form>
        </div>
      )}

      <div
        style={{
          background: "#fff",
          borderRadius: "10px",
          boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
          overflowX: "auto",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px" }}>
          <thead>
            <tr style={{ background: "#f9fafb", borderBottom: "1px solid #e6e6e6" }}>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Username
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Email
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Nama Lengkap
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Role
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Status
              </th>
              <th
                style={{
                  padding: "16px",
                  textAlign: "left",
                  fontSize: "14px",
                  fontWeight: 800,
                  color: "#000",
                }}
              >
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {users.filter((user) => user.role_name === "admin" || user.role_name === "sales").length === 0 ? (
              <tr>
                <td
                  colSpan="6"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#9e9e9e",
                  }}
                >
                  No users found
                </td>
              </tr>
            ) : (
              users
                .filter((user) => user.role_name === "admin" || user.role_name === "sales")
                .map((user) => (
                <tr key={user.id} style={{ borderBottom: "1px solid #e6e6e6" }}>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    {user.username || "-"}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    {user.email || "-"}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    {user.full_name || "-"}
                  </td>
                  <td style={{ padding: "16px", fontSize: "14px" }}>
                    <span
                      style={{
                        background: "#f5f5f5",
                        color: "#000",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {user.role_name
                        ? user.role_name.charAt(0).toUpperCase() +
                          user.role_name.slice(1)
                        : "-"}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <span
                      style={{
                        background: user.is_active ? "#d1fae5" : "#fee2e2",
                        color: user.is_active ? "#059669" : "#dc2626",
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                      }}
                    >
                      {user.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "16px" }}>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      style={{
                        background: "#ef4444",
                        color: "#fff",
                        border: "none",
                        borderRadius: "6px",
                        padding: "6px 12px",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Hapus
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default UserManagement;

