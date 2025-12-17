import React, { useState, useEffect } from "react";

const API_BASE = "http://127.0.0.1:8000";

// Helper function untuk format Rupiah
const formatRupiah = (amount) => {
  return `Rp ${parseFloat(amount).toLocaleString('id-ID')}`;
};

function Product({ token }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    description: "",
    stock: "",
  });
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
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
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = editingProduct
        ? `${API_BASE}/api/products/${editingProduct.id}`
        : `${API_BASE}/api/products`;
      const method = editingProduct ? "PUT" : "POST";

      // Create FormData for file upload
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("price", formData.price.toString());
      formDataToSend.append("stock", formData.stock.toString() || "0");
      if (formData.description) {
        formDataToSend.append("description", formData.description);
      }
      if (selectedImage) {
        formDataToSend.append("image", selectedImage);
      }

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type, let browser set it with boundary for FormData
        },
        body: formDataToSend,
      });

      if (res.ok) {
        await fetchProducts();
        setShowForm(false);
        setFormData({ name: "", price: "", description: "", stock: "" });
        setSelectedImage(null);
        setImagePreview(null);
        setEditingProduct(null);
      } else {
        const error = await res.json();
        alert(error.detail || "Error saving product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("Error saving product");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || "",
      stock: product.stock?.toString() || "0",
    });
    setSelectedImage(null);
    setImagePreview(product.image_url ? `${API_BASE}${product.image_url}` : null);
    setShowForm(true);
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        await fetchProducts();
      } else {
        alert("Error deleting product");
      }
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Error deleting product");
    }
  };

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
          Products
        </h2>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingProduct(null);
            setFormData({ name: "", price: "", description: "", stock: "" });
            setSelectedImage(null);
            setImagePreview(null);
          }}
          style={{
            background: "#0038ff",
            color: "#fff",
            border: "none",
            borderRadius: "8px",
            padding: "10px 20px",
            fontSize: "13px",
            fontWeight: 800,
            cursor: "pointer",
            whiteSpace: "nowrap",
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
              strokeLinejoin="round"
            />
          </svg>
          Add Product
        </button>
      </div>

      {showForm && (
        <div
          style={{
            background: "#fff",
            borderRadius: "10px",
            padding: "20px",
            marginBottom: "20px",
            boxShadow: "0px 4px 50px 0px rgba(0,0,0,0.06)",
            width: "100%",
            boxSizing: "border-box",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: 800,
              marginBottom: "20px",
            }}
          >
            {editingProduct ? "Edit Product" : "Add New Product"}
          </h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Product Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
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

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Price *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
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

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Stock *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) =>
                  setFormData({ ...formData, stock: e.target.value })
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

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={4}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e6e6e6",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                  resize: "vertical",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                Product Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                style={{
                  width: "100%",
                  padding: "12px",
                  border: "1px solid #e6e6e6",
                  borderRadius: "8px",
                  fontSize: "14px",
                  boxSizing: "border-box",
                }}
              />
              {imagePreview && (
                <div style={{ marginTop: "12px" }}>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: "300px",
                      maxHeight: "300px",
                      borderRadius: "8px",
                      border: "1px solid #e6e6e6",
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="submit"
                disabled={loading}
                style={{
                  background: loading ? "#9ca3af" : "#0038ff",
                  color: "#fff",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Saving..." : editingProduct ? "Update" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingProduct(null);
                  setFormData({
                    name: "",
                    price: "",
                    description: "",
                    stock: "",
                  });
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                style={{
                  background: "#f5f5f5",
                  color: "#000",
                  border: "none",
                  borderRadius: "8px",
                  padding: "12px 24px",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div style={{ padding: 0, width: "100%", boxSizing: "border-box" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "16px",
            width: "100%",
          }}
        >
          {products.map((product) => (
            <div
              key={product.id}
              style={{
                background: "#fff",
                borderRadius: "8px",
                padding: "12px",
                boxShadow: "0px 2px 8px 0px rgba(0,0,0,0.08)",
                display: "flex",
                flexDirection: "column",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {product.image_url && (
                <img
                  src={product.image_url.startsWith("http") ? product.image_url : `${API_BASE}${product.image_url}`}
                  alt={product.name}
                  style={{
                    width: "100%",
                    height: "120px",
                    objectFit: "cover",
                    borderRadius: "6px",
                    marginBottom: "10px",
                  }}
                />
              )}
              <h3
                style={{
                  fontSize: "14px",
                  fontWeight: 800,
                  margin: "0 0 6px 0",
                  lineHeight: "1.3",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {product.name}
              </h3>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 800,
                  color: "#0038ff",
                  margin: "0 0 6px 0",
                }}
              >
                {formatRupiah(product.price)}
              </p>
              <p
                style={{
                  fontSize: "12px",
                  color: product.stock > 0 ? "#10b981" : "#ef4444",
                  fontWeight: 600,
                  margin: "0 0 6px 0",
                }}
              >
                Stock: {product.stock || 0}
              </p>
              {product.description && (
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "0 0 10px 0",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                    lineHeight: "1.4",
                  }}
                >
                  {product.description}
                </p>
              )}
              <div style={{ display: "flex", gap: "6px", marginTop: "auto" }}>
                <button
                  onClick={() => handleEdit(product)}
                  style={{
                    flex: 1,
                    background: "#0038ff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(product.id)}
                  style={{
                    flex: 1,
                    background: "#dc2626",
                    color: "#fff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
        {products.length === 0 && (
          <p style={{ textAlign: "center", color: "#9e9e9e", marginTop: "40px" }}>
            No products yet. Click "Add Product" to create one.
          </p>
        )}
      </div>
    </div>
  );
}

export default Product;

