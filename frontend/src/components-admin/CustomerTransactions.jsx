import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

// Helper function untuk format Rupiah
const formatRupiah = (amount) => {
  return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
};

function CustomerTransactions({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all"); // all, paid, pending, failed
  const [loading, setLoading] = useState(true);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const statusFilter = filter === "all" ? null : filter;
      const res = await fetch(
        `${API_BASE}/api/transactions${statusFilter ? `?status=${statusFilter}` : ""}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.ok) {
        const data = await res.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "failed":
      case "cancelled":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "paid":
        return "Berhasil";
      case "pending":
        return "Pending";
      case "failed":
        return "Gagal";
      case "cancelled":
        return "Dibatalkan";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const paidCount = transactions.filter((t) => t.status === "paid").length;
  const pendingCount = transactions.filter((t) => t.status === "pending").length;
  const failedCount = transactions.filter(
    (t) => t.status === "failed" || t.status === "cancelled"
  ).length;

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
          flexWrap: "wrap",
          gap: "12px",
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
          Customer Transactions
        </h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setFilter("all")}
            style={{
              background: filter === "all" ? "#0038ff" : "#f5f5f5",
              color: filter === "all" ? "#fff" : "#000",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            All
          </button>
          <button
            onClick={() => setFilter("paid")}
            style={{
              background: filter === "paid" ? "#0038ff" : "#f5f5f5",
              color: filter === "paid" ? "#fff" : "#000",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Berhasil ({paidCount})
          </button>
          <button
            onClick={() => setFilter("pending")}
            style={{
              background: filter === "pending" ? "#0038ff" : "#f5f5f5",
              color: filter === "pending" ? "#fff" : "#000",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter("failed")}
            style={{
              background: filter === "failed" ? "#0038ff" : "#f5f5f5",
              color: filter === "failed" ? "#fff" : "#000",
              border: "none",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Gagal ({failedCount})
          </button>
        </div>
      </div>

      <div style={{ padding: "0", width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: "8px",
            boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.08)",
            overflowX: "auto",
            overflowY: "hidden",
            width: "100%",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "800px" }}>
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
                  Order ID
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
                  Customer
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
                  Product
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
                  Quantity
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
                  Amount
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
                  Date
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
                  Detail
                </th>
              </tr>
            </thead>
            <tbody>
              {transactions.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    style={{
                      padding: "40px",
                      textAlign: "center",
                      color: "#9e9e9e",
                    }}
                  >
                    No transactions found
                  </td>
                </tr>
              ) : (
                transactions.map((transaction) => (
                  <tr
                    key={transaction.id}
                    style={{ borderBottom: "1px solid #e6e6e6" }}
                  >
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      {transaction.order_id}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      {transaction.customer_name || "N/A"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      {transaction.product_name || "N/A"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      {transaction.quantity}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600 }}>
                      {formatRupiah(transaction.total_amount)}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          background: getStatusColor(transaction.status),
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {getStatusLabel(transaction.status)}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                      {new Date(transaction.created_at).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <button
                        onClick={() => setSelectedTransaction(transaction)}
                        style={{
                          background: "#2148C0",
                          color: "#fff",
                          border: "none",
                          borderRadius: "6px",
                          padding: "6px 12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Lihat Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Transaction */}
      {selectedTransaction && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
            padding: "20px",
          }}
          onClick={() => setSelectedTransaction(null)}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "30px",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 800,
                  color: "#000",
                  margin: 0,
                }}
              >
                Detail Transaksi
              </h3>
              <button
                onClick={() => setSelectedTransaction(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: "#9e9e9e",
                }}
              >
                ×
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#9e9e9e",
                    margin: "0 0 8px 0",
                  }}
                >
                  Order ID
                </p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#000", margin: 0 }}>
                  {selectedTransaction.order_id}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#9e9e9e",
                    margin: "0 0 8px 0",
                  }}
                >
                  Customer
                </p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#000", margin: 0 }}>
                  {selectedTransaction.customer_name || "N/A"}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#9e9e9e",
                    margin: "0 0 8px 0",
                  }}
                >
                  Product
                </p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#000", margin: 0 }}>
                  {selectedTransaction.product_name || "N/A"}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#9e9e9e",
                    margin: "0 0 8px 0",
                  }}
                >
                  Quantity
                </p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#000", margin: 0 }}>
                  {selectedTransaction.quantity}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#9e9e9e",
                    margin: "0 0 8px 0",
                  }}
                >
                  Total Amount
                </p>
                <p style={{ fontSize: "14px", fontWeight: 600, color: "#000", margin: 0 }}>
                  {formatRupiah(selectedTransaction.total_amount)}
                </p>
              </div>

              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#9e9e9e",
                    margin: "0 0 8px 0",
                  }}
                >
                  Status
                </p>
                <span
                  style={{
                    background: getStatusColor(selectedTransaction.status),
                    color: "#fff",
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                  }}
                >
                  {getStatusLabel(selectedTransaction.status)}
                </span>
              </div>

              {selectedTransaction.shipping_name && (
                <>
                  <div style={{ borderTop: "1px solid #e6e6e6", paddingTop: "20px" }}>
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "#000",
                        margin: "0 0 16px 0",
                      }}
                    >
                      Billing Detail
                    </p>
                  </div>

                  <div>
                    <p
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#9e9e9e",
                        margin: "0 0 8px 0",
                      }}
                    >
                      Nama
                    </p>
                    <p style={{ fontSize: "14px", color: "#000", margin: 0 }}>
                      {selectedTransaction.shipping_name}
                    </p>
                  </div>

                  {selectedTransaction.shipping_phone && (
                    <div>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#9e9e9e",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Phone
                      </p>
                      <p style={{ fontSize: "14px", color: "#000", margin: 0 }}>
                        {selectedTransaction.shipping_phone}
                      </p>
                    </div>
                  )}

                  {selectedTransaction.shipping_address && (
                    <div>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#9e9e9e",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Alamat
                      </p>
                      <p style={{ fontSize: "14px", color: "#000", margin: 0 }}>
                        {selectedTransaction.shipping_address}
                      </p>
                    </div>
                  )}

                  {selectedTransaction.shipping_city && (
                    <div>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#9e9e9e",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Kota
                      </p>
                      <p style={{ fontSize: "14px", color: "#000", margin: 0 }}>
                        {selectedTransaction.shipping_city}
                      </p>
                    </div>
                  )}

                  {selectedTransaction.shipping_postal_code && (
                    <div>
                      <p
                        style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "#9e9e9e",
                          margin: "0 0 8px 0",
                        }}
                      >
                        Kode Pos
                      </p>
                      <p style={{ fontSize: "14px", color: "#000", margin: 0 }}>
                        {selectedTransaction.shipping_postal_code}
                      </p>
                    </div>
                  )}
                </>
              )}

              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#9e9e9e",
                    margin: "0 0 8px 0",
                  }}
                >
                  Tanggal Transaksi
                </p>
                <p style={{ fontSize: "14px", color: "#000", margin: 0 }}>
                  {new Date(selectedTransaction.created_at).toLocaleString("id-ID", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerTransactions;

