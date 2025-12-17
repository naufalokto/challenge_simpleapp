import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

// Helper function untuk format Rupiah
const formatRupiah = (amount) => {
  return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
};

function Payout({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [payments, setPayments] = useState([]);
  const [filter, setFilter] = useState("all"); // all, paid, pending, failed
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [filter]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const statusFilter = filter === "all" ? null : filter;
      const [transactionsRes, paymentsRes] = await Promise.all([
        fetch(
          `${API_BASE}/api/transactions${statusFilter ? `?status=${statusFilter}` : ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
        fetch(
          `${API_BASE}/api/payments${statusFilter === "paid" ? "?transaction_status=settlement" : statusFilter === "pending" ? "?transaction_status=pending" : ""}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        ),
      ]);

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data);
      }

      if (paymentsRes.ok) {
        const data = await paymentsRes.json();
        setPayments(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "paid":
      case "settlement":
        return "#10b981";
      case "pending":
        return "#f59e0b";
      case "failed":
      case "deny":
      case "cancel":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "settlement":
        return "Paid";
      case "pending":
        return "Pending";
      case "deny":
        return "Denied";
      case "cancel":
        return "Cancelled";
      case "expire":
        return "Expired";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Loading...</p>
      </div>
    );
  }

  // Combine transactions with payment data
  const combinedData = transactions.map((transaction) => {
    const payment = payments.find(
      (p) => p.transaction_id === transaction.id
    );
    return {
      ...transaction,
      payment,
    };
  });

  const paidCount = combinedData.filter(
    (item) => item.status === "paid" || item.payment?.transaction_status === "settlement"
  ).length;
  const pendingCount = combinedData.filter(
    (item) => item.status === "pending" || item.payment?.transaction_status === "pending"
  ).length;
  const failedCount = combinedData.filter(
    (item) =>
      item.status === "failed" ||
      ["deny", "cancel", "expire"].includes(item.payment?.transaction_status || "")
  ).length;

  return (
    <div style={{ padding: "20px", width: "100%", boxSizing: "border-box", overflowX: "hidden" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          padding: "0",
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
          Payout
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
            Paid ({paidCount})
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
            Failed ({failedCount})
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
              </tr>
            </thead>
            <tbody>
              {combinedData.length === 0 ? (
                <tr>
                  <td
                    colSpan="6"
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
                combinedData.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: "1px solid #e6e6e6" }}
                  >
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      {item.order_id}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      {item.customer_name || "N/A"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px" }}>
                      {item.product_name || "N/A"}
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", fontWeight: 600 }}>
                      {formatRupiah(item.total_amount)}
                    </td>
                    <td style={{ padding: "16px" }}>
                      <span
                        style={{
                          background: getStatusColor(
                            item.payment?.transaction_status || item.status
                          ),
                          color: "#fff",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        {getStatusLabel(
                          item.payment?.transaction_status || item.status
                        )}
                      </span>
                    </td>
                    <td style={{ padding: "16px", fontSize: "14px", color: "#6b7280" }}>
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Payout;

