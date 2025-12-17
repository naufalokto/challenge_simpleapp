import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

// Helper function untuk format Rupiah
const formatRupiah = (amount) => {
  return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
};

function Overview({ token }) {
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [transactionsRes, earningsRes] = await Promise.all([
        fetch(`${API_BASE}/api/dashboard/recent-transactions?limit=4`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch(`${API_BASE}/api/dashboard/earnings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (transactionsRes.ok) {
        const transactions = await transactionsRes.json();
        setRecentTransactions(transactions);
      }

      if (earningsRes.ok) {
        const earningsData = await earningsRes.json();
        setEarnings(earningsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
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
      {/* Recent Transactions */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          width: "100%",
          padding: "0",
          boxSizing: "border-box",
          flexWrap: "wrap",
        }}
      >
        {/* Recent Transactions Card */}
        <div style={{ flex: 1 }}>
          <h2
            style={{
              fontSize: "14px",
              fontWeight: 800,
              color: "#000",
              margin: "0 0 15px 0",
              lineHeight: "0.915",
            }}
          >
            Recent Transactions
          </h2>
          <div
            style={{
              background: "#fff",
              borderRadius: "10px",
              padding: "35px 33px",
              boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
              minHeight: "344px",
            }}
          >
            {recentTransactions.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9e9e9e" }}>No transactions yet</p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
                {recentTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "15px",
                    }}
                  >
                    <div
                      style={{
                        width: "55px",
                        height: "55px",
                        background: "#f0f0f0",
                        borderRadius: "10px",
                        flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <p
                        style={{
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "#000",
                          margin: "0 0 4px 0",
                        }}
                      >
                        {transaction.product_name || transaction.order_id}
                      </p>
                      <p
                        style={{
                          fontSize: "10px",
                          fontWeight: 500,
                          color: "#bdbdbd",
                          margin: 0,
                        }}
                      >
                        {new Date(transaction.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div
                      style={{
                        fontSize: "14px",
                        fontWeight: 800,
                        color: "#000",
                      }}
                    >
                      {formatRupiah(transaction.total_amount)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Overview;

