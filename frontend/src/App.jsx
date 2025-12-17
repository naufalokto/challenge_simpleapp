import React, { useState, useEffect } from "react";
import AdminPage from "./AdminPage";
import SalesPage from "./SalesPage";
import CustomerPage from "./CustomerPage";

const API_BASE = "http://127.0.0.1:8000";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUser] = useState(null);
  
  // Register state
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);

  // Cek apakah user sudah login
  useEffect(() => {
    if (token) {
      fetchUserInfo();
    }
  }, [token]);

  const fetchUserInfo = async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const userData = await res.json();
        setUser(userData);
      } else {
        // Token invalid, logout
        handleLogout();
      }
    } catch (err) {
      console.error(err);
      handleLogout();
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // OAuth2PasswordRequestForm expects form-data, not JSON
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Login failed");
      }

      const data = await res.json();
      setToken(data.access_token);
      setUser(data.user);
      localStorage.setItem("token", data.access_token);
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal login. Periksa username dan password.");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setToken("");
    setUser(null);
    localStorage.removeItem("token");
    setUsername("");
    setPassword("");
    setIsRegister(false);
    setFullName("");
    setEmail("");
    setRegisterPassword("");
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/auth/register/customer`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName,
          email: email,
          password: registerPassword,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.detail || "Registration failed");
      }

      // Registration successful, switch to login
      setIsRegister(false);
      setError("");
      alert("Registration successful! Please login.");
      setFullName("");
      setEmail("");
      setRegisterPassword("");
    } catch (err) {
      console.error(err);
      setError(err.message || "Gagal register. Periksa data yang diinput.");
    } finally {
      setRegisterLoading(false);
    }
  };

  // Jika sudah login, tampilkan page sesuai role
  if (token && user) {
    // Tampilkan AdminPage untuk role admin
    if (user.role_name === "admin") {
      return <AdminPage user={user} onLogout={handleLogout} />;
    }
    // Tampilkan SalesPage untuk role sales
    if (user.role_name === "sales") {
      return <SalesPage user={user} onLogout={handleLogout} />;
    }
    // Tampilkan CustomerPage untuk role customer
    if (user.role_name === "customer") {
      return <CustomerPage user={user} onLogout={handleLogout} />;
    }
    // Fallback jika role tidak dikenal
    return <div>Unknown role: {user.role_name}</div>;
  }

  // Assets dari Figma
  const imgVector = "https://www.figma.com/api/mcp/asset/6a6003e0-0344-4a45-a9ab-aa5572348f28";
  const imgUser = "https://www.figma.com/api/mcp/asset/9be47a9c-fa47-49b4-8ff8-a2d1b2e9da83";
  const imgLock = "https://www.figma.com/api/mcp/asset/07a40dd6-1dd0-4f05-b435-c426ed690bac";

  // Tampilkan login form sesuai design Figma
  return (
    <>
      <style>
        {`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            margin: 0;
            padding: 0;
            position: fixed;
            top: 0;
            left: 0;
          }
          #root {
            width: 100vw;
            height: 100vh;
            margin: 0;
            padding: 0;
            position: fixed;
            top: 0;
            left: 0;
            overflow: hidden;
          }
          input::placeholder {
            color: #fff;
            opacity: 1;
            text-align: center;
            letter-spacing: 0.5px;
          }
          input:focus::placeholder {
            opacity: 0;
          }
        `}
      </style>
      <div
        style={{
          fontFamily: "'Montserrat', sans-serif",
          position: "relative",
          width: "100vw",
          height: "100vh",
          background: "#2148C0",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
      {/* SVG Wave Pattern di pojok kanan */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "864px",
          height: "721.5px",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <svg
          width="864"
          height="720"
          viewBox="0 0 864 720"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <path
            d="M257 139C121.4 151.8 29.1667 51 0 -1L864 2.5V720.5H767.5C468.7 682.5 519 531 581.5 460C618 410.167 684 290.1 656 208.5C621 106.5 426.5 123 257 139Z"
            fill="#264ECA"
          />
        </svg>
      </div>

      {/* Form Login / Register */}
      <form
        onSubmit={isRegister ? handleRegister : handleLogin}
        style={{
          position: "relative",
          width: "300px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          zIndex: 1,
        }}
      >
        {/* Toggle Login/Register */}
        <div
          style={{
            width: "100%",
            display: "flex",
            marginBottom: "20px",
            background: "rgba(255, 255, 255, 0.1)",
            borderRadius: "4px",
            padding: "4px",
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError("");
            }}
            style={{
              flex: 1,
              padding: "8px",
              background: !isRegister ? "#fff" : "transparent",
              color: !isRegister ? "#2148C0" : "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError("");
            }}
            style={{
              flex: 1,
              padding: "8px",
              background: isRegister ? "#fff" : "transparent",
              color: isRegister ? "#2148C0" : "#fff",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            Register
          </button>
        </div>

        {/* Register Form Fields */}
        {isRegister && (
          <>
            {/* Full Name Input */}
            <div
              style={{
                position: "relative",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="off"
                required
                placeholder="NAMA LENGKAP"
                style={{
                  width: "100%",
                  height: "45px",
                  padding: fullName ? "0 12px" : "0 12px",
                  fontSize: "14px",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 300,
                  color: "#fff",
                  background: "transparent",
                  border: "1px solid #fff",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  letterSpacing: "0.5px",
                  textAlign: "left",
                }}
              />
            </div>

            {/* Email Input */}
            <div
              style={{
                position: "relative",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <img
                  alt="Email icon"
                  src={imgUser}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="off"
                required
                placeholder="EMAIL"
                style={{
                  width: "100%",
                  height: "45px",
                  padding: email ? "0 12px 0 40px" : "0 40px",
                  fontSize: "14px",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 300,
                  color: "#fff",
                  background: "transparent",
                  border: "1px solid #fff",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  letterSpacing: "0.5px",
                  textAlign: email ? "left" : "center",
                }}
                onFocus={(e) => {
                  e.target.style.outline = "none";
                  if (!e.target.value) {
                    e.target.style.padding = "0 12px 0 40px";
                    e.target.style.textAlign = "left";
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    e.target.style.padding = "0 40px";
                    e.target.style.textAlign = "center";
                  }
                }}
              />
            </div>

            {/* Password Input for Register */}
            <div
              style={{
                position: "relative",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <img
                  alt="Lock icon"
                  src={imgLock}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </div>
              <input
                type="password"
                value={registerPassword}
                onChange={(e) => setRegisterPassword(e.target.value)}
                autoComplete="off"
                required
                placeholder="PASSWORD"
                style={{
                  width: "100%",
                  height: "45px",
                  padding: registerPassword ? "0 12px 0 40px" : "0 40px",
                  fontSize: "14px",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 300,
                  color: "#fff",
                  background: "transparent",
                  border: "1px solid #fff",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  letterSpacing: "0.5px",
                  textAlign: registerPassword ? "left" : "center",
                }}
                onFocus={(e) => {
                  e.target.style.outline = "none";
                  if (!e.target.value) {
                    e.target.style.padding = "0 12px 0 40px";
                    e.target.style.textAlign = "left";
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    e.target.style.padding = "0 40px";
                    e.target.style.textAlign = "center";
                  }
                }}
              />
            </div>
          </>
        )}

        {/* Login Form Fields */}
        {!isRegister && (
          <>
            {/* Email/Username Input for Login */}
            <div
              style={{
                position: "relative",
                width: "100%",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "20px",
                  height: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                }}
              >
                <img
                  alt="User icon"
                  src={imgUser}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                  }}
                />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="off"
                required
                placeholder="EMAIL / USERNAME"
                style={{
                  width: "100%",
                  height: "45px",
                  padding: username ? "0 12px 0 40px" : "0 40px",
                  fontSize: "14px",
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 300,
                  color: "#fff",
                  background: "transparent",
                  border: "1px solid #fff",
                  borderRadius: "4px",
                  boxSizing: "border-box",
                  letterSpacing: "0.5px",
                  textAlign: username ? "left" : "center",
                }}
                onFocus={(e) => {
                  e.target.style.outline = "none";
                  if (!e.target.value) {
                    e.target.style.padding = "0 12px 0 40px";
                    e.target.style.textAlign = "left";
                  }
                }}
                onBlur={(e) => {
                  if (!e.target.value) {
                    e.target.style.padding = "0 40px";
                    e.target.style.textAlign = "center";
                  }
                }}
              />
        </div>

        {/* Password Input */}
        <div
          style={{
            position: "relative",
            width: "100%",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              width: "20px",
              height: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <img
              alt="Lock icon"
              src={imgLock}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                filter: "brightness(0) invert(1)",
              }}
            />
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="off"
            required
            placeholder="PASSWORD"
            style={{
              width: "100%",
              height: "45px",
              padding: password ? "0 12px 0 40px" : "0 40px",
              fontSize: "14px",
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 300,
              color: "#fff",
              background: "transparent",
              border: "1px solid #fff",
              borderRadius: "4px",
              boxSizing: "border-box",
              letterSpacing: "0.5px",
              textAlign: password ? "left" : "center",
            }}
            onFocus={(e) => {
              e.target.style.outline = "none";
              if (!e.target.value) {
                e.target.style.padding = "0 12px 0 40px";
                e.target.style.textAlign = "left";
              }
            }}
            onBlur={(e) => {
              if (!e.target.value) {
                e.target.style.padding = "0 40px";
                e.target.style.textAlign = "center";
              }
            }}
          />
        </div>
          </>
        )}

        {/* Error Message */}
        {error && (
          <div
            style={{
              width: "100%",
              marginBottom: "16px",
              padding: "12px",
              background: "rgba(255, 255, 255, 0.2)",
              border: "1px solid rgba(255, 255, 255, 0.5)",
              borderRadius: "4px",
              color: "#fff",
              fontSize: "14px",
              textAlign: "center",
            }}
          >
            {error}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || registerLoading}
          style={{
            width: "100%",
            height: "45px",
            fontSize: "16px",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 600,
            background: (loading || registerLoading) ? "#9ca3af" : "#fff",
            color: (loading || registerLoading) ? "#fff" : "#2148C0",
            border: "none",
            borderRadius: "4px",
            cursor: (loading || registerLoading) ? "not-allowed" : "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            boxShadow: "0px 4px 4px 0px rgba(0,0,0,0.3)",
            marginBottom: "11px",
          }}
        >
          {isRegister
            ? registerLoading
              ? "Registering..."
              : "REGISTER"
            : loading
            ? "Logging in..."
            : "LOGIN"}
        </button>

        {/* Forgot Password */}
        <p
          style={{
            margin: 0,
            fontSize: "16px",
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 500,
            color: "#fff",
            textAlign: "center",
            cursor: "pointer",
          }}
          onClick={() => {
            // TODO: Implement forgot password
            alert("Forgot password feature coming soon");
          }}
        >
          Forgot password?
        </p>
      </form>
      </div>
    </>
  );
}

export default App;
