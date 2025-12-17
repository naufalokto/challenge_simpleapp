import React, { useState } from "react";
import Overview from "./components/Overview";
import Product from "./components/Product";
import Payout from "./components/Payout";

function SalesPage({ user, onLogout }) {
  const [activeMenu, setActiveMenu] = useState("overview");
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const token = localStorage.getItem("token") || "";

  const handleLogout = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    onLogout();
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  // Warna konsisten dengan login page
  const sidebarColor = "#2148C0";
  const activeColor = "#0500ff";
  const textColor = "#000";
  const grayText = "#9e9e9e";
  const lightGray = "#e6e6e6";

  // Icon assets dari Figma
  const iconOverview = "https://www.figma.com/api/mcp/asset/a2079737-796d-41fb-bbb7-4e10017eb90a";
  const iconProduct = "https://www.figma.com/api/mcp/asset/82953336-7969-4fea-9f6f-05d47236009e";
  const iconPayout = "https://www.figma.com/api/mcp/asset/82953336-7969-4fea-9f6f-05d47236009e"; // Same as Product
  const iconLogout = "https://www.figma.com/api/mcp/asset/f10295f0-49aa-4230-b8ab-8c31d2210fff";

  return (
    <div
      style={{
        fontFamily: "'Urbanist', 'Montserrat', system-ui, sans-serif",
        width: "100vw",
        height: "100vh",
        display: "flex",
        background: "#fff",
        overflow: "hidden",
        margin: 0,
        padding: 0,
        boxSizing: "border-box",
        position: "fixed",
        top: 0,
        left: 0,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: "247px",
          minWidth: "247px",
          height: "100vh",
          background: sidebarColor,
          borderRight: `1px solid ${lightGray}`,
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflowY: "auto",
          flexShrink: 0,
          margin: 0,
          padding: 0,
          boxSizing: "border-box",
        }}
      >
        {/* Navigation Menu */}
        <div
          style={{
            padding: "20px 50px",
            display: "flex",
            flexDirection: "column",
            gap: "59px",
            flex: 1,
          }}
        >
          {/* Primary Navigation */}
          <div style={{ display: "flex", flexDirection: "column", gap: "59px" }}>
            {/* Overview */}
            <div
              style={{ cursor: "pointer", position: "relative" }}
              onClick={() => setActiveMenu("overview")}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "25px",
                  padding: "8px 0",
                }}
              >
                {activeMenu === "overview" && (
                  <div
                    style={{
                      width: "4px",
                      height: "19px",
                      background: "#fff",
                      borderRadius: "2px",
                    }}
                  />
                )}
                <img
                  src={iconOverview}
                  alt="Overview"
                  style={{
                    width: "19px",
                    height: "19px",
                    objectFit: "contain",
                    filter: "grayscale(100%) opacity(0.6)",
                  }}
                />
                <span
                  style={{
                    fontSize: "15px",
                    fontWeight: 800,
                    color: grayText,
                    lineHeight: "0.915",
                  }}
                >
                  Overview
                </span>
              </div>
            </div>

            {/* Products */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "25px",
                padding: "8px 0",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => setActiveMenu("products")}
            >
              {activeMenu === "products" && (
                <div
                  style={{
                    width: "4px",
                    height: "19px",
                    background: "#fff",
                    borderRadius: "2px",
                  }}
                />
              )}
              <img
                src={iconProduct}
                alt="Products"
                style={{
                  width: "19px",
                  height: "19px",
                  objectFit: "contain",
                  filter: "grayscale(100%) opacity(0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: grayText,
                  lineHeight: "0.915",
                }}
              >
                Products
              </span>
            </div>

            {/* Payout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "25px",
                padding: "8px 0",
                cursor: "pointer",
                position: "relative",
              }}
              onClick={() => setActiveMenu("payout")}
            >
              {activeMenu === "payout" && (
                <div
                  style={{
                    width: "4px",
                    height: "19px",
                    background: "#fff",
                    borderRadius: "2px",
                  }}
                />
              )}
              <img
                src={iconPayout}
                alt="Payout"
                style={{
                  width: "19px",
                  height: "19px",
                  objectFit: "contain",
                  filter: "grayscale(100%) opacity(0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: grayText,
                  lineHeight: "0.915",
                }}
              >
                Payout
              </span>
            </div>

            {/* Logout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "25px",
                padding: "8px 0",
                cursor: "pointer",
              }}
              onClick={handleLogout}
            >
              <img
                src={iconLogout}
                alt="Logout"
                style={{
                  width: "19px",
                  height: "19px",
                  objectFit: "contain",
                  filter: "grayscale(100%) opacity(0.6)",
                }}
              />
              <span
                style={{
                  fontSize: "15px",
                  fontWeight: 800,
                  color: grayText,
                  lineHeight: "0.915",
                }}
              >
                Logout
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "0",
          display: "flex",
          flexDirection: "column",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Header - Greeting Only */}
        <div
          style={{
            padding: "20px 20px 0 20px",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <h1
            style={{
              fontSize: "36px",
              fontWeight: 800,
              color: textColor,
              margin: 0,
              lineHeight: "0.915",
            }}
          >
            Hello, {user?.username || "John"}
          </h1>
        </div>

        {/* Main Content Area - Dynamic based on active menu */}
        {activeMenu === "overview" && <Overview token={token} />}
        {activeMenu === "products" && <Product token={token} />}
        {activeMenu === "payout" && <Payout token={token} />}
      </div>

      {/* Logout Confirmation Notification */}
      {showLogoutConfirm && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            background: "#fff",
            borderRadius: "8px",
            padding: "16px 20px",
            boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
            zIndex: 1000,
            minWidth: "280px",
            border: "1px solid #e6e6e6",
          }}
        >
          <p
            style={{
              fontSize: "14px",
              fontWeight: 600,
              color: "#000",
              margin: "0 0 12px 0",
            }}
          >
            Anda yakin ingin logout?
          </p>
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={cancelLogout}
              style={{
                background: "#f5f5f5",
                color: "#000",
                border: "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Batal
            </button>
            <button
              onClick={confirmLogout}
              style={{
                background: "#2148C0",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 16px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default SalesPage;
