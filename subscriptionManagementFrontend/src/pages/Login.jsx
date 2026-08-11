import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      const role = (result.role || "").toLowerCase();
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else if (role === "provider") {
        navigate("/provider/dashboard");
      } else {
        navigate("/dashboard");
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="smp-auth-layout">
      {/* ── LEFT PANEL ── */}
      <div className="smp-left-panel">
        <div className="smp-brand">
          <div className="smp-logo-icon">💳</div>
          <span className="smp-brand-name">
            Sub<span className="smp-brand-accent">Manage</span>
          </span>
        </div>
        <h1 className="smp-headline">
          Your subscriptions,
          <br />
          <em>fully in control.</em>
        </h1>
        <p className="smp-subtext">
          Manage plans, track renewals, and grow recurring revenue — all from
          one place.
        </p>
        <div className="smp-float-cards">
          <div className="smp-fcard">
            <span className="smp-fcard-num">∞</span>Subscribers
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="smp-right-panel">
        <div className="smp-form-box">
          <h2 className="smp-form-title">Welcome</h2>
          <p className="smp-form-subtitle">
            Enter your credentials to continue
          </p>

          {error && <div className="smp-error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="smp-field">
              <label>Email address</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="smp-field">
              <label>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: "44px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  style={{
                    position: "absolute",
                    right: "12px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-light)",
                    fontSize: "16px",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {showPassword ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)}
                </button>
              </div>
            </div>
            <button
              type="submit"
              className="smp-btn-primary"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </form>

          <div className="smp-divider">or</div>

          <Link to="/register" className="smp-btn-outline-link">
            Register User
          </Link>

          <Link
            to="/register-provider"
            className="smp-btn-outline-link"
            style={{ marginTop: "10px" }}
          >
            Register Service Provider
          </Link>

          <div className="smp-link-row">
            <Link to="/forgot-password">Forgot password?</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;