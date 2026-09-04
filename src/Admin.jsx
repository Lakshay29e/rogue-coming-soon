import { useEffect, useState } from "react";
import "./Admin.css";

function Admin() {
  const [password, setPassword] = useState("");
  const [token, setToken] = useState(
    localStorage.getItem("rogue_admin_token") || ""
  );

  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [error, setError] = useState("");

  const API_URL =
    import.meta.env.VITE_API_URL ||
    "http://127.0.0.1:5002";

  /* =========================
     FETCH SUBSCRIBERS
  ========================= */

  const fetchSubscribers = async () => {
    if (!token) return;

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/subscribers`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        localStorage.removeItem("rogue_admin_token");
        setToken("");
        return;
      }

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to fetch subscribers"
        );
      }

      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  /* =========================
     LOAD DATA AFTER LOGIN
  ========================= */

  useEffect(() => {
    if (token) {
      fetchSubscribers();
    }
  }, [token]);

  /* =========================
     ADMIN LOGIN
  ========================= */

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!password.trim()) {
      setError("ENTER ADMIN PASSWORD");
      return;
    }

    try {
      setLoginLoading(true);
      setError("");

      const response = await fetch(
        `${API_URL}/api/admin/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        setError(
          data.message?.toUpperCase() ||
            "ACCESS DENIED"
        );
        return;
      }

      localStorage.setItem(
        "rogue_admin_token",
        data.token
      );

      setToken(data.token);
      setPassword("");

    } catch (error) {
      console.error("Login Error:", error);

      setError(
        "SERVER ERROR. TRY AGAIN."
      );
    } finally {
      setLoginLoading(false);
    }
  };

  /* =========================
     LOGOUT
  ========================= */

  const handleLogout = () => {
    localStorage.removeItem(
      "rogue_admin_token"
    );

    setToken("");
    setSubscribers([]);
    setPassword("");
    setError("");
  };

  /* =========================
     LOGIN SCREEN
  ========================= */

  if (!token) {
    return (
      <div className="admin-page">
        <div className="admin-login-container">

          <div className="admin-header">
            <h1>ROGUE</h1>
            <p>RESTRICTED ACCESS</p>
          </div>

          <form
            className="admin-login-form"
            onSubmit={handleLogin}
          >
            <p className="login-label">
              ADMIN AUTHENTICATION
            </p>

            <input
              type="password"
              placeholder="ENTER PASSWORD"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError("");
              }}
              disabled={loginLoading}
            />

            {error && (
              <p className="login-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loginLoading}
            >
              {loginLoading
                ? "VERIFYING..."
                : "ENTER ROGUE ↗"}
            </button>
          </form>

          <p className="admin-login-footer">
            ROGUE © 2026
          </p>

        </div>
      </div>
    );
  }

  /* =========================
     ADMIN DASHBOARD
  ========================= */

  return (
    <div className="admin-page">

      <div className="admin-container">

        <div className="admin-topbar">

          <div className="admin-header">
            <h1>ROGUE</h1>
            <p>WAITLIST ADMIN</p>
          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            LOGOUT ↗
          </button>

        </div>

        <div className="stats-card">
          <span>TOTAL MEMBERS</span>

          <strong>
            {loading ? "—" : subscribers.length}
          </strong>
        </div>

        <div className="table-container">

          <div className="table-header">
            <span>EMAIL</span>
            <span>JOINED</span>
          </div>

          {loading ? (
            <p className="loading">
              Loading subscribers...
            </p>

          ) : subscribers.length === 0 ? (

            <p className="loading">
              No subscribers yet.
            </p>

          ) : (

            subscribers.map((subscriber) => (

              <div
                className="subscriber-row"
                key={subscriber._id}
              >

                <span>
                  {subscriber.email}
                </span>

                <span>
                  {new Date(
                    subscriber.subscribedAt
                  ).toLocaleString()}
                </span>

              </div>

            ))
          )}

        </div>

        <div className="admin-bottom">
          <span>
            SYSTEM STATUS
          </span>

          <span className="system-active">
            ● SECURE CONNECTION
          </span>
        </div>

      </div>

    </div>
  );
}

export default Admin;