import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  sendOtpAPI,
  verifyOtpAPI,
  verifyEmailAPI,
  registerProviderAPI,
} from "../services/authService";

const SERVICE_TYPES = [
  "SaaS",
  "Streaming",
  "Cloud Storage",
  "Education",
  "Healthcare",
  "Finance",
  "E-commerce",
  "Communication",
  "Gaming",
  "Other",
];

const sectionLabel = {
  fontSize: "10px",
  fontWeight: "700",
  color: "var(--text-light)",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  marginBottom: "8px",
  marginTop: "10px",
  paddingTop: "10px",
  borderTop: "1px solid var(--border)",
  display: "block",
};

const row2 = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "10px",
};

function RegisterProvider() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [description, setDescription] = useState("");

  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState("");
  const [emailChecking, setEmailChecking] = useState(false);

  const navigate = useNavigate();

  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isLongEnough = password.length >= 8;
  const isPasswordValid = hasLetter && hasNumber && isLongEnough;

  useEffect(() => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailStatus("");
      return;
    }
    setEmailChecking(true);
    setEmailStatus("checking");
    const timer = setTimeout(async () => {
      try {
        const data = await verifyEmailAPI(email);
        setEmailStatus(data.success === true ? "available" : "taken");
      } catch {
        setEmailStatus("");
      } finally {
        setEmailChecking(false);
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [email]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    setOtpSent(false);
    setEmailVerified(false);
    setEnteredOtp("");
    setOtpError("");
    setEmailStatus("");
  };

  const handleSendOtp = async () => {
    setOtpError("");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setOtpError("Enter a valid email first.");
      return;
    }
    setOtpLoading(true);
    try {
      await sendOtpAPI(email);
      setOtpSent(true);
      setEnteredOtp("");
      setEmailVerified(false);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Failed to send OTP.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setOtpError("");
    if (!enteredOtp) {
      setOtpError("Enter the OTP.");
      return;
    }
    setVerifyLoading(true);
    try {
      await verifyOtpAPI(email, enteredOtp);
      setEmailVerified(true);
    } catch (err) {
      setOtpError(err.response?.data?.message || "Incorrect OTP.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (
      !fullName ||
      !email ||
      !mobile ||
      !password ||
      !businessName ||
      !serviceType ||
      !description
    )
      return setError("Please fill in all fields.");
    if (mobile.length !== 10)
      return setError("Please enter a valid 10-digit mobile number.");
    if (emailStatus === "taken")
      return setError("This email is already registered.");
    if (!emailVerified) return setError("Please verify your email first.");
    if (!isPasswordValid)
      return setError(
        "Password must be 8+ characters with letters and numbers.",
      );
    if (description.trim().length < 20)
      return setError("Description must be at least 20 characters.");

    setLoading(true);
    try {
      await registerProviderAPI({
        email,
        password,
        fullName,
        mobile,
        businessName,
        serviceType,
        description,
      });
      setSuccess("Provider account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1800);
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
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
          Offer plans,
          <br />
          <em>grow your business.</em>
        </h1>
        <p className="smp-subtext">
          Register as a service provider to create plans, manage subscribers,
          and track revenue — all in one place.
        </p>
        <div className="smp-float-cards">
          <div className="smp-fcard">
            <span className="smp-fcard-num">∞</span>Plans
          </div>
          <div className="smp-fcard">
            <span className="smp-fcard-num">JWT</span>Secured
          </div>
          <div className="smp-fcard">
            <span className="smp-fcard-num">AWS</span>Powered
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        className="smp-right-panel"
        style={{
          overflowY: "auto",
          alignItems: "flex-start",
          paddingTop: "24px",
          paddingBottom: "24px",
        }}
      >
        <div
          className="smp-form-box"
          style={{ maxWidth: "420px", width: "100%" }}
        >
          {/* Role badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              background: "var(--brand-light)",
              color: "var(--brand)",
              border: "1px solid var(--brand-muted)",
              borderRadius: "var(--radius-full)",
              padding: "3px 12px",
              fontSize: "11px",
              fontWeight: "600",
              marginBottom: "8px",
              letterSpacing: "0.03em",
              textTransform: "uppercase",
            }}
          >
            🏢 Service Provider
          </div>

          <h2 className="smp-form-title" style={{ marginBottom: "2px" }}>
            Create provider account
          </h2>
          <p className="smp-form-subtitle" style={{ marginBottom: "10px" }}>
            Fill in your business details to get started
          </p>

          {error && (
            <div
              className="smp-error-msg"
              style={{ marginBottom: "10px", padding: "8px 12px" }}
            >
              {error}
            </div>
          )}
          {success && (
            <div
              className="smp-success-msg"
              style={{ marginBottom: "10px", padding: "8px 12px" }}
            >
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* ── Section: Personal ── */}
            <span
              style={{
                ...sectionLabel,
                borderTop: "none",
                marginTop: 0,
                paddingTop: 0,
              }}
            >
              Personal details
            </span>

            {/* Row 1: Name + Mobile side by side */}
            <div style={row2}>
              <div className="smp-field" style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "12px" }}>Full name</label>
                <input
                  type="text"
                  placeholder="Jane Smith"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ padding: "9px 12px", fontSize: "13px" }}
                />
              </div>
              <div className="smp-field" style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "12px" }}>
                  Mobile
                  <span
                    style={{
                      color: "var(--text-light)",
                      fontWeight: 400,
                      fontSize: "10px",
                      marginLeft: "4px",
                    }}
                  >
                    {mobile.length}/10
                  </span>
                </label>
                <input
                  type="tel"
                  placeholder="10 digits"
                  value={mobile}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, "");
                    if (v.length <= 10) setMobile(v);
                  }}
                  style={{ padding: "9px 12px", fontSize: "13px" }}
                />
              </div>
            </div>

            {/* Email + Send OTP */}
            <div className="smp-field" style={{ marginBottom: "10px" }}>
              <label style={{ fontSize: "12px" }}>
                Email address
                {emailChecking && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "10px",
                      color: "var(--text-light)",
                    }}
                  >
                    Checking...
                  </span>
                )}
                {!emailChecking && emailStatus === "available" && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "10px",
                      color: "var(--success)",
                    }}
                  >
                    ✓ Available
                  </span>
                )}
                {!emailChecking && emailStatus === "taken" && (
                  <span
                    style={{
                      marginLeft: "6px",
                      fontSize: "10px",
                      color: "var(--error)",
                    }}
                  >
                    ✗ Already registered
                  </span>
                )}
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  type="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={handleEmailChange}
                  style={{ flex: 1, padding: "9px 12px", fontSize: "13px" }}
                />
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="smp-otp-send-btn"
                  disabled={
                    emailVerified || otpLoading || emailStatus !== "available"
                  }
                  style={{ padding: "9px 12px", fontSize: "12px" }}
                >
                  {otpLoading ? "..." : emailVerified ? "✓" : "Send OTP"}
                </button>
              </div>
            </div>

            {/* OTP entry — only shown when needed */}
            {otpSent && !emailVerified && (
              <div className="smp-field" style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "12px" }}>Enter OTP</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={enteredOtp}
                    onChange={(e) =>
                      setEnteredOtp(e.target.value.replace(/\D/g, ""))
                    }
                    style={{ flex: 1, padding: "9px 12px", fontSize: "13px" }}
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="smp-otp-verify-btn"
                    disabled={verifyLoading || enteredOtp.length < 4}
                    style={{ padding: "9px 12px", fontSize: "12px" }}
                  >
                    {verifyLoading ? "..." : "Verify"}
                  </button>
                </div>
                {otpError && (
                  <p
                    style={{
                      color: "var(--error)",
                      fontSize: "11px",
                      marginTop: "3px",
                    }}
                  >
                    {otpError}
                  </p>
                )}
              </div>
            )}

            {emailVerified && (
              <div
                className="smp-verified-badge"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  marginBottom: "10px",
                }}
              >
                ✓ Email verified
              </div>
            )}

            {/* Password */}
            <div className="smp-field" style={{ marginBottom: "6px" }}>
              <label style={{ fontSize: "12px" }}>Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    paddingRight: "44px",
                    padding: "9px 44px 9px 12px",
                    fontSize: "13px",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--text-light)",
                    fontSize: "14px",
                    padding: 0,
                    lineHeight: 1,
                  }}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              {password.length > 0 && (
                <div style={{ marginTop: "4px", display: "flex", gap: "10px" }}>
                  {[
                    [isLongEnough, "8+ chars"],
                    [hasLetter, "Letters"],
                    [hasNumber, "Numbers"],
                  ].map(([ok, label]) => (
                    <span
                      key={label}
                      style={{
                        fontSize: "10px",
                        color: ok ? "var(--success)" : "var(--text-light)",
                      }}
                    >
                      {ok ? "✓" : "○"} {label}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* ── Section: Business ── */}
            <span style={sectionLabel}>Business details</span>

            {/* Row 2: Business name + Service type side by side */}
            <div style={row2}>
              <div className="smp-field" style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "12px" }}>Business name</label>
                <input
                  type="text"
                  placeholder="Acme Corp"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  style={{ padding: "9px 12px", fontSize: "13px" }}
                />
              </div>
              <div className="smp-field" style={{ marginBottom: "10px" }}>
                <label style={{ fontSize: "12px" }}>Service type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "9px 30px 9px 12px",
                    border: "1.5px solid var(--border)",
                    borderRadius: "10px",
                    fontFamily: "var(--font-body)",
                    fontSize: "13px",
                    color: serviceType
                      ? "var(--text-dark)"
                      : "var(--text-light)",
                    background: "var(--bg)",
                    outline: "none",
                    cursor: "pointer",
                    appearance: "none",
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 10px center",
                  }}
                  onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                  onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
                >
                  <option value="" disabled>
                    Select type
                  </option>
                  {SERVICE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="smp-field" style={{ marginBottom: "12px" }}>
              <label style={{ fontSize: "12px" }}>
                Business description
                <span
                  style={{
                    color: "var(--text-light)",
                    fontWeight: 400,
                    fontSize: "10px",
                    marginLeft: "4px",
                  }}
                >
                  ({description.length}/20 min)
                </span>
              </label>
              <textarea
                rows={2}
                placeholder="Briefly describe what your service offers..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{
                  width: "100%",
                  padding: "9px 12px",
                  border: "1.5px solid var(--border)",
                  borderRadius: "10px",
                  fontFamily: "var(--font-body)",
                  fontSize: "13px",
                  color: "var(--text-dark)",
                  background: "var(--bg)",
                  outline: "none",
                  resize: "vertical",
                  minHeight: "60px",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.target.style.borderColor = "var(--brand)")}
                onBlur={(e) => (e.target.style.borderColor = "var(--border)")}
              />
            </div>

            <button
              type="submit"
              className="smp-btn-primary"
              disabled={!emailVerified || loading}
              style={{ padding: "11px", fontSize: "14px" }}
            >
              {loading ? "Creating account..." : "Register as provider"}
            </button>
          </form>

          <div
            style={{
              textAlign: "center",
              marginTop: "12px",
              fontSize: "12px",
              color: "var(--text-mid)",
              display: "flex",
              justifyContent: "center",
              gap: "16px",
            }}
          >
            <span>
              Already have an account?{" "}
              <Link
                to="/login"
                style={{ color: "var(--brand)", fontWeight: 600 }}
              >
                Log in
              </Link>
            </span>
            <span style={{ color: "var(--border)" }}>|</span>
            <span>
              Register as user?{" "}
              <Link
                to="/register"
                style={{ color: "var(--brand)", fontWeight: 600 }}
              >
                Here
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterProvider;
