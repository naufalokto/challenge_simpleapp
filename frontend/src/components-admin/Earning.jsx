import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

// Helper function untuk format Rupiah
const formatRupiah = (amount) => {
  return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
};

function Earning({ token }) {
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/dashboard/earnings`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setEarnings(data);
      }
    } catch (error) {
      console.error("Error fetching earnings:", error);
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
      <h2
        style={{
          fontSize: "20px",
          fontWeight: 800,
          color: "#000",
          margin: "0 0 20px 0",
        }}
      >
        Earning
      </h2>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "30px",
        }}
      >
        {/* Total Earnings Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
            flex: 1,
            minWidth: "250px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#9e9e9e",
              margin: "0 0 10px 0",
            }}
          >
            Total Pendapatan
          </p>
          <h3
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#000",
              margin: 0,
            }}
          >
            {earnings ? formatRupiah(earnings.total_earnings) : formatRupiah(0)}
          </h3>
        </div>

        {/* Paid Count Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
            flex: 1,
            minWidth: "250px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#9e9e9e",
              margin: "0 0 10px 0",
            }}
          >
            Transaksi Berhasil
          </p>
          <h3
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#10b981",
              margin: 0,
            }}
          >
            {earnings?.paid_count || 0}
          </h3>
        </div>

        {/* Pending Count Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
            flex: 1,
            minWidth: "250px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#9e9e9e",
              margin: "0 0 10px 0",
            }}
          >
            Transaksi Pending
          </p>
          <h3
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#f59e0b",
              margin: 0,
            }}
          >
            {earnings?.pending_count || 0}
          </h3>
        </div>

        {/* Failed Count Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "30px",
            boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
            flex: 1,
            minWidth: "250px",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#9e9e9e",
              margin: "0 0 10px 0",
            }}
          >
            Transaksi Gagal
          </p>
          <h3
            style={{
              fontSize: "32px",
              fontWeight: 800,
              color: "#ef4444",
              margin: 0,
            }}
          >
            {earnings?.failed_count || 0}
          </h3>
        </div>
      </div>
    </div>
  );
}

export default Earning;

