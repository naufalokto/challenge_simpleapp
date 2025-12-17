import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "http://127.0.0.1:8000";
const PRIMARY_COLOR = "#2148C0";

// Helper Rupiah
const formatRupiah = (amount) =>
  `Rp ${Number(amount || 0).toLocaleString("id-ID")}`;

function CustomerPage({ user, onLogout }) {
  const displayName =
    user?.full_name || user?.username || user?.email || "Customer";
  const token = useMemo(
    () => localStorage.getItem("token") || "",
    []
  );

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);

  const [view, setView] = useState("cart"); // cart | checkout | invoice | payment_result

  const [shipping, setShipping] = useState({
    full_name: user?.full_name || "",
    phone: "",
    address: "",
    city: "",
    postal_code: "",
  });
  const [formErrors, setFormErrors] = useState({});

  const [invoiceData, setInvoiceData] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null); // { status, order_id, message }

  // Handle redirect dari Midtrans setelah payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get("order_id");
    const statusCode = urlParams.get("status_code");
    const transactionStatus = urlParams.get("transaction_status");
    const paymentParam = urlParams.get("payment"); // payment=success/unfinish/error
    
    // Jika ada query params dari Midtrans redirect
    if (orderId && (statusCode || transactionStatus || paymentParam)) {
      // Auto-check status dari Midtrans API untuk memastikan status terupdate
      const checkStatusFromMidtrans = async () => {
        try {
          const res = await fetch(`${API_BASE}/api/payment/check-status/${orderId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          
          if (res.ok) {
            const data = await res.json();
            console.log("Status checked from Midtrans:", data);
            
            // Update payment result dengan status terbaru dari Midtrans
            let message = "Status pembayaran tidak diketahui";
            const status = data.transaction_status;
            
            if (status === "settlement" || status === "capture") {
              message = "Pembayaran berhasil!";
            } else if (status === "pending") {
              message = "Pembayaran sedang diproses";
            } else if (status === "deny" || status === "cancel" || status === "expire") {
              message = "Pembayaran gagal atau dibatalkan";
            }
            
            setPaymentResult({
              order_id: orderId,
              status: status || "unknown",
              status_code: statusCode,
              message: message
            });
          } else {
            // Fallback ke query params jika check status gagal
            let status = transactionStatus;
            let message = "Status pembayaran tidak diketahui";
            
            if (transactionStatus) {
              status = transactionStatus;
              if (status === "settlement" || status === "capture") {
                message = "Pembayaran berhasil!";
              } else if (status === "pending") {
                message = "Pembayaran sedang diproses";
              } else if (status === "deny" || status === "cancel" || status === "expire") {
                message = "Pembayaran gagal atau dibatalkan";
              }
            } else if (statusCode === "200") {
              status = "settlement";
              message = "Pembayaran berhasil!";
            } else if (paymentParam === "success") {
              status = "settlement";
              message = "Pembayaran berhasil!";
            }
            
            setPaymentResult({
              order_id: orderId,
              status: status || "unknown",
              status_code: statusCode,
              message: message
            });
          }
        } catch (error) {
          console.error("Error checking status from Midtrans:", error);
          // Fallback ke query params
          let status = transactionStatus || (statusCode === "200" ? "settlement" : "pending");
          setPaymentResult({
            order_id: orderId,
            status: status,
            status_code: statusCode,
            message: status === "settlement" ? "Pembayaran berhasil!" : "Status pembayaran sedang dicek..."
          });
        }
        
        setView("payment_result");
        // Bersihkan URL dari query params
        window.history.replaceState({}, document.title, window.location.pathname);
      };
      
      checkStatusFromMidtrans();
    }
  }, [token]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoadingProducts(true);
      try {
        const res = await fetch(`${API_BASE}/api/products`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Error loading products", err);
      } finally {
        setLoadingProducts(false);
      }
    };

    if (token) {
      fetchProducts();
    }
  }, [token]);

  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setView("cart"); // tetap di cart, hanya munculkan card checkout
  };

  const goToCheckout = () => {
    if (!selectedProduct) return;
    setView("checkout");
  };

  const handleShippingChange = (field, value) => {
    setShipping((prev) => ({ ...prev, [field]: value }));
    setFormErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validateShipping = () => {
    const errors = {};
    if (!shipping.full_name.trim()) errors.full_name = "Isi nama lengkap";
    if (!shipping.phone.trim()) errors.phone = "Isi nomor telepon";
    if (!shipping.address.trim()) errors.address = "Isi alamat lengkap";
    if (!shipping.city.trim()) errors.city = "Isi kota";
    if (!shipping.postal_code.trim())
      errors.postal_code = "Isi kode pos";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!selectedProduct || !user) return;
    if (!validateShipping()) return;

    setPlacingOrder(true);
    try {
      const orderId = `ORD-${Date.now()}`;
      const totalAmount =
        Number(selectedProduct.price) * Number(quantity || 1);

      // 1) Buat transaction di backend
      const txRes = await fetch(`${API_BASE}/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          order_id: orderId,
          customer_id: user.id,
          product_id: selectedProduct.id,
          quantity,
          total_amount: totalAmount,
          status: "pending",
          shipping_name: shipping.full_name,
          shipping_phone: shipping.phone,
          shipping_address: shipping.address,
          shipping_city: shipping.city,
          shipping_postal_code: shipping.postal_code,
        }),
      });

      if (!txRes.ok) {
        const err = await txRes.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal membuat transaksi");
      }

      const paymentPayload = {
        order_id: orderId,
        gross_amount: totalAmount,
        items: [
          {
            id: String(selectedProduct.id),
            price: Number(selectedProduct.price),
            quantity,
            name: selectedProduct.name,
          },
        ],
        customer_details: {
          first_name: shipping.full_name,
          email: user.email,
          phone: shipping.phone,
          address: shipping.address,
          city: shipping.city,
          postal_code: shipping.postal_code,
        },
      };

      // 2) Panggil Midtrans create payment
      const payRes = await fetch(`${API_BASE}/api/payment/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(paymentPayload),
      });

      if (!payRes.ok) {
        const err = await payRes.json().catch(() => ({}));
        throw new Error(err.detail || "Gagal membuat pembayaran");
      }

      const payData = await payRes.json();

      setInvoiceData({
        orderId,
        productName: selectedProduct.name,
        qty: quantity,
        total: totalAmount,
      });
      setPaymentUrl(payData.redirect_url);
      setView("invoice");
    } catch (err) {
      console.error(err);
      alert(err.message || "Terjadi kesalahan saat place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  const handleGoToPayment = () => {
    if (paymentUrl) {
      window.location.href = paymentUrl;
    }
  };

  // ====== RENDER UI BERSAMA (HEADER, NAV, SEARCH) ======
  const renderHeaderLayout = () => (
    <>
      {/* bar atas kecil */}
      <div
        style={{
          height: 40,
          borderRadius: 10,
          background: "#ffffff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          fontSize: 12,
          color: "#111827",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "4px 10px",
              borderRadius: 6,
              background: "#ebeef6",
            }}
          >
            <span style={{ fontWeight: 700 }}>📞</span>
            <span>Hotline 24/7</span>
          </div>
          <span style={{ fontWeight: 500 }}>(025) 3886 25 16</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
            fontSize: 14,
          }}
        >
          <span>Sell on Swoo</span>
          <span>Order Track</span>
          <span>USD</span>

          {/* user + logout */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ textAlign: "right" }}>
              <div
                style={{
                  fontSize: 11,
                  textTransform: "uppercase",
                  color: "#6b7280",
                }}
              >
                Welcome
              </div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>
                {displayName}
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #e5e7eb",
                background: "#ffffff",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* navbar utama */}
      <div
        style={{
          height: 100,
          borderRadius: 10,
          background: "#ffffff",
          padding: "0 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 4px 10px rgba(0,0,0,0.04)",
          marginBottom: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>
          {/* Logo teks challenge-app */}
          <div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 800,
                letterSpacing: 0.8,
              }}
            >
              challenge-app
            </div>
            <div
              style={{
                fontSize: 11,
                color: "#6b7280",
                marginTop: 2,
              }}
            >
              SIMPLE FASTAPI + REACT
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              textTransform: "uppercase",
              fontSize: 13,
              fontWeight: 600,
              color: "#374151",
            }}
          >
            <span>Home</span>
            <span>Products</span>
            <span>Cart</span>
          </div>
        </div>

        {/* Cart ringkas */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              position: "relative",
              width: 40,
              height: 40,
              borderRadius: 20,
              background: "#ebeef6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 18 }}>🛒</span>
          </div>
        </div>
      </div>

      {/* search bar biru */}
      <div
        style={{
          height: 75,
          borderRadius: 10,
          background: PRIMARY_COLOR,
          padding: "15px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "#ffffff",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            background: "#ffffff",
            borderRadius: 30,
            overflow: "hidden",
            maxWidth: 540,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 155,
              padding: "0 16px",
              borderRight: "1px solid #e5e7eb",
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>
              All Products
            </span>
          </div>
          <input
            type="text"
            placeholder="Search (belum aktif)..."
            style={{
              flex: 1,
              border: "none",
              outline: "none",
              padding: "0 16px",
              fontSize: 13,
              color: "#374151",
            }}
            disabled
          />
          <button
            type="button"
            style={{
              width: 56,
              height: 45,
              border: "none",
              background: "transparent",
              color: PRIMARY_COLOR,
              fontSize: 18,
            }}
          >
            🔍
          </button>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 36,
            fontSize: 13,
            textTransform: "uppercase",
            fontWeight: 500,
          }}
        >
          <span>Free shipping over Rp 1.000.000</span>
          <span>30 days money back</span>
          <span>100% secure payment</span>
        </div>
      </div>
    </>
  );

  // ======= VIEW: CART (LIST PRODUK + CARD CHECKOUT DINAMIS) =======
  const renderCartView = () => (
    <div
      style={{
        borderRadius: 10,
        background: "#ffffff",
        padding: 24,
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      {/* List produk */}
      <div style={{ flex: 3, display: "flex", flexDirection: "column", gap: 16 }}>
        {loadingProducts && <div>Loading products...</div>}
        {!loadingProducts && products.length === 0 && (
          <div>Tidak ada produk. Sales belum mengupload produk.</div>
        )}

        {products.map((p) => (
          <div
            key={p.id}
            style={{
              background: "#fafafa",
              borderRadius: 10,
              padding: 16,
              display: "flex",
              gap: 24,
              alignItems: "stretch",
              cursor: "pointer",
            }}
            onClick={() => handleSelectProduct(p)}
          >
            <div
              style={{
                width: 160,
                borderRadius: 10,
                overflow: "hidden",
                background: "#ffffff",
              }}
            >
              {p.image_url ? (
                <img
                  src={`${API_BASE}${p.image_url}`}
                  alt={p.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    color: "#9ca3af",
                  }}
                >
                  No Image
                </div>
              )}
            </div>
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: "#111827",
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "#6b7280",
                }}
              >
                {p.description || "-"}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#f1352b",
                  marginTop: 4,
                }}
              >
                {formatRupiah(p.price)}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#16a34a",
                  marginTop: 4,
                }}
              >
                Stock: {p.stock}
              </div>
              <div style={{ marginTop: 8 }}>
                <button
                  type="button"
                  style={{
                    padding: "8px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: PRIMARY_COLOR,
                    color: "#fff",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectProduct(p);
                    goToCheckout();
                  }}
                >
                  Checkout
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Card checkout dinamis: hanya tampil jika selectedProduct */}
      {selectedProduct && view === "cart" && (
        <div
          style={{
            flex: 1.4,
            borderRadius: 10,
            border: `1px solid ${PRIMARY_COLOR}`,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              marginBottom: 12,
            }}
          >
            Ringkasan Pesanan
          </div>
          <div
            style={{
              fontSize: 14,
              marginBottom: 8,
            }}
          >
            {selectedProduct.name}
          </div>
          <div style={{ fontSize: 13, marginBottom: 8 }}>
            {formatRupiah(selectedProduct.price)} x {quantity}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
            }}
          >
            <button
              type="button"
              onClick={() =>
                setQuantity((q) => (q > 1 ? q - 1 : 1))
              }
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              −
            </button>
            <span>{quantity}</span>
            <button
              type="button"
              onClick={() =>
                setQuantity((q) =>
                  q < selectedProduct.stock ? q + 1 : q
                )
              }
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid #d1d5db",
                background: "#fff",
                cursor: "pointer",
              }}
            >
              +
            </button>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 12,
              fontSize: 14,
            }}
          >
            <span>Total</span>
            <span style={{ fontWeight: 700 }}>
              {formatRupiah(
                Number(selectedProduct.price) * quantity
              )}
            </span>
          </div>

          <button
            type="button"
            style={{
              width: "100%",
              height: 44,
              borderRadius: 10,
              border: "none",
              background: PRIMARY_COLOR,
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              textTransform: "uppercase",
            }}
            onClick={goToCheckout}
          >
            Checkout
          </button>
        </div>
      )}
    </div>
  );

  // ======= VIEW: CHECKOUT (FORM ALAMAT + ORDER SUMMARY) =======
  const handleBackFromCheckout = () => {
    const confirmLeave = window.confirm(
      "Jika anda keluar dari billing detail, data yang anda isi tidak tersimpan. Lanjutkan?"
    );
    if (confirmLeave) {
      setView("cart");
    }
  };

  const renderCheckoutView = () => (
    <div
      style={{
        borderRadius: 10,
        background: "#ffffff",
        padding: 24,
        display: "flex",
        gap: 24,
        alignItems: "flex-start",
      }}
    >
      <div style={{ flex: 2 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            Data Pengiriman
          </h2>
          <button
            type="button"
            onClick={handleBackFromCheckout}
            style={{
              padding: "6px 14px",
              borderRadius: 999,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Back
          </button>
        </div>
        {/* Form dibuat vertikal ke bawah */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Nama Lengkap
            </label>
            <input
              type="text"
              value={shipping.full_name}
              onChange={(e) =>
                handleShippingChange("full_name", e.target.value)
              }
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                borderRadius: 6,
                border: `1px solid ${
                  formErrors.full_name ? "#ef4444" : "#d1d5db"
                }`,
                fontSize: 13,
              }}
            />
            {formErrors.full_name && (
              <div style={{ color: "#ef4444", fontSize: 11 }}>
                {formErrors.full_name}
              </div>
            )}
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>
              Nomor Telepon
            </label>
            <input
              type="text"
              value={shipping.phone}
              onChange={(e) =>
                handleShippingChange("phone", e.target.value)
              }
              style={{
                width: "100%",
                marginTop: 4,
                padding: "8px 10px",
                borderRadius: 6,
                border: `1px solid ${
                  formErrors.phone ? "#ef4444" : "#d1d5db"
                }`,
                fontSize: 13,
              }}
            />
            {formErrors.phone && (
              <div style={{ color: "#ef4444", fontSize: 11 }}>
                {formErrors.phone}
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Alamat Lengkap
          </label>
          <textarea
            value={shipping.address}
            onChange={(e) =>
              handleShippingChange("address", e.target.value)
            }
            rows={3}
            style={{
              width: "100%",
              marginTop: 4,
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${
                formErrors.address ? "#ef4444" : "#d1d5db"
              }`,
              fontSize: 13,
              resize: "vertical",
            }}
          />
          {formErrors.address && (
            <div style={{ color: "#ef4444", fontSize: 11 }}>
              {formErrors.address}
            </div>
          )}
        </div>

        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Kota
          </label>
          <input
            type="text"
            value={shipping.city}
            onChange={(e) =>
              handleShippingChange("city", e.target.value)
            }
            style={{
              width: "100%",
              marginTop: 4,
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${
                formErrors.city ? "#ef4444" : "#d1d5db"
              }`,
              fontSize: 13,
            }}
          />
          {formErrors.city && (
            <div style={{ color: "#ef4444", fontSize: 11 }}>
              {formErrors.city}
            </div>
          )}
        </div>
        <div>
          <label style={{ fontSize: 13, fontWeight: 600 }}>
            Kode Pos
          </label>
          <input
            type="text"
            value={shipping.postal_code}
            onChange={(e) =>
              handleShippingChange(
                "postal_code",
                e.target.value
              )
            }
            style={{
              width: "100%",
              marginTop: 4,
              padding: "8px 10px",
              borderRadius: 6,
              border: `1px solid ${
                formErrors.postal_code ? "#ef4444" : "#d1d5db"
              }`,
              fontSize: 13,
            }}
          />
          {formErrors.postal_code && (
            <div style={{ color: "#ef4444", fontSize: 11 }}>
              {formErrors.postal_code}
            </div>
          )}
        </div>
      </div>

      {/* Ringkasan order di checkout */}
      <div
        style={{
          flex: 1.5,
          borderRadius: 10,
          border: `1px solid ${PRIMARY_COLOR}`,
          padding: 20,
        }}
      >
        {selectedProduct ? (
          <>
            <div
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 12,
              }}
            >
              Order Summary
            </div>
            <div style={{ fontSize: 14, marginBottom: 6 }}>
              {selectedProduct.name}
            </div>
            <div style={{ fontSize: 13, marginBottom: 12 }}>
              {formatRupiah(selectedProduct.price)} x {quantity}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 13,
              }}
            >
              <span>Sub Total</span>
              <span>
                {formatRupiah(
                  Number(selectedProduct.price) * quantity
                )}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 8,
                fontSize: 13,
              }}
            >
              <span>Ongkir (estimasi)</span>
              <span>{formatRupiah(0)}</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 12,
                marginBottom: 16,
                fontSize: 14,
                fontWeight: 700,
              }}
            >
              <span>Total</span>
              <span>
                {formatRupiah(
                  Number(selectedProduct.price) * quantity
                )}
              </span>
            </div>

            <button
              type="button"
              disabled={placingOrder}
              onClick={handlePlaceOrder}
              style={{
                width: "100%",
                height: 44,
                borderRadius: 10,
                border: "none",
                background: placingOrder
                  ? "#9ca3af"
                  : PRIMARY_COLOR,
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 600,
                cursor: placingOrder ? "not-allowed" : "pointer",
                textTransform: "uppercase",
              }}
            >
              {placingOrder ? "Processing..." : "Place Order"}
            </button>
          </>
        ) : (
          <div>Pilih produk terlebih dahulu di halaman cart.</div>
        )}
      </div>
    </div>
  );

  // ======= VIEW: INVOICE =======
  const renderInvoiceView = () =>
    invoiceData ? (
      <div
        style={{
          borderRadius: 10,
          background: "#ffffff",
          padding: 24,
          maxWidth: 600,
          margin: "0 auto",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 700,
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Invoice
        </h2>
        <div
          style={{
            fontSize: 13,
            marginBottom: 4,
          }}
        >
          Order ID: <strong>{invoiceData.orderId}</strong>
        </div>
        <div style={{ fontSize: 13, marginBottom: 4 }}>
          Produk: {invoiceData.productName}
        </div>
        <div style={{ fontSize: 13, marginBottom: 4 }}>
          Qty: {invoiceData.qty}
        </div>
        <div style={{ fontSize: 13, marginBottom: 12 }}>
          Total:{" "}
          <strong>{formatRupiah(invoiceData.total)}</strong>
        </div>
        <div
          style={{
            fontSize: 12,
            marginBottom: 16,
            color: "#6b7280",
          }}
        >
          Setelah klik tombol di bawah, Anda akan diarahkan ke
          halaman pembayaran Midtrans. Setelah pembayaran selesai,
          redirect akhir dapat diatur di dashboard Midtrans.
        </div>
        <div
          style={{
            fontSize: 12,
            marginBottom: 16,
            color: "#6b7280",
          }}
        >
          Setelah klik tombol di bawah, Anda akan diarahkan ke
          halaman pembayaran Midtrans. Setelah pembayaran selesai,
          Anda akan diarahkan kembali ke aplikasi.
        </div>
        <button
          type="button"
          onClick={handleGoToPayment}
          style={{
            width: "100%",
            height: 44,
            borderRadius: 10,
            border: "none",
            background: PRIMARY_COLOR,
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            textTransform: "uppercase",
          }}
        >
          Lanjut ke Pembayaran
        </button>
      </div>
    ) : null;

  // ======= VIEW: PAYMENT RESULT (SETELAH REDIRECT DARI MIDTRANS) =======
  const renderPaymentResultView = () => {
    if (!paymentResult) return null;
    
    const isSuccess = paymentResult.status === "settlement" || paymentResult.status === "capture";
    const isPending = paymentResult.status === "pending";
    
    return (
      <div
        style={{
          borderRadius: 10,
          background: "#ffffff",
          padding: 32,
          maxWidth: 600,
          margin: "0 auto",
          boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 48,
            marginBottom: 16,
          }}
        >
          {isSuccess ? "✅" : isPending ? "⏳" : "❌"}
        </div>
        <h2
          style={{
            fontSize: 24,
            fontWeight: 700,
            marginBottom: 12,
            color: isSuccess ? "#16a34a" : isPending ? "#f59e0b" : "#ef4444",
          }}
        >
          {paymentResult.message}
        </h2>
        <div
          style={{
            fontSize: 14,
            color: "#6b7280",
            marginBottom: 8,
          }}
        >
          Order ID: <strong>{paymentResult.order_id}</strong>
        </div>
        <div
          style={{
            fontSize: 13,
            color: "#9ca3af",
            marginBottom: 24,
          }}
        >
          Status: {paymentResult.status}
        </div>
        <button
          type="button"
          onClick={() => {
            setView("cart");
            setPaymentResult(null);
            setSelectedProduct(null);
            setInvoiceData(null);
          }}
          style={{
            padding: "12px 24px",
            borderRadius: 8,
            border: "none",
            background: PRIMARY_COLOR,
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Kembali ke Cart
        </button>
      </div>
    );
  };

  return (
    <div
      style={{
        fontFamily:
          "'Inter', 'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        minHeight: "100vh",
        background: "#f2f3f7",
        padding: 15,
        boxSizing: "border-box",
      }}
    >
      {renderHeaderLayout()}

      {view === "cart" && renderCartView()}
      {view === "checkout" && renderCheckoutView()}
      {view === "invoice" && renderInvoiceView()}
      {view === "payment_result" && renderPaymentResultView()}
    </div>
  );
}

export default CustomerPage;

