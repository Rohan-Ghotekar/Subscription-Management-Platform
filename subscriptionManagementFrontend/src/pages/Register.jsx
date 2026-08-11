import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  sendOtpAPI,
  verifyOtpAPI,
  verifyEmailAPI,
} from "../services/authService";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // OTP states
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

  const { register } = useAuth();
  const navigate = useNavigate();

  // ── Password Strength Rules ──────────────────────────────────
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const isLongEnough = password.length >= 8;
  const isPasswordValid = hasLetter && hasNumber && isLongEnough;

  // ── Email Check with Debounce ────────────────────────────────
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
        if (data.success === true) {
          setEmailStatus("available");
        } else {
          setEmailStatus("taken");
        }
      } catch {
        setEmailStatus("");
      } finally {
        setEmailChecking(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email]);

  // ── Event Handlers ───────────────────────────────────────────
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
      setOtpError("Please enter a valid email address first.");
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
      setOtpError("Please enter the OTP.");
      return;
    }
    setVerifyLoading(true);
    try {
      const res = await verifyOtpAPI(email, enteredOtp);

if (res.status === "success") {
  setEmailVerified(true);
} else {
  setOtpError(res.message || "Invalid OTP");
}
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

    if (!name || !email || !mobile || !password) {
      setError("Please fill in all fields.");
      return;
    }
    
    // Mobile Validation
    if (mobile.length !== 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    if (emailStatus === "taken") {
      setError("This email is already registered.");
      return;
    }

    if (!emailVerified) {
      setError("Please verify your email first.");
      return;
    }

    // NEW: Password validation check on submit
    if (!isPasswordValid) {
      setError("Password must be at least 8 characters and contain both letters and numbers.");
      return;
    }

    setLoading(true);
    const result = await register(name, email, mobile, password);
    setLoading(false);

    if (result.success) {
      setSuccess("Account created! Redirecting...");
      setTimeout(() => navigate("/login"), 1500);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="smp-auth-layout">
      {/* LEFT PANEL */}
      <div className="smp-left-panel">
        <div className="smp-brand">
          <div className="smp-logo-icon">💳</div>
          <span className="smp-brand-name">
            Sub<span className="smp-brand-accent">Manage</span>
          </span>
        </div>
        <h1 className="smp-headline">Start managing <br /> <em>smarter today.</em></h1>
        <div className="smp-float-cards">
          <div className="smp-fcard"><span className="smp-fcard-num">Free</span>To join</div>
          <div className="smp-fcard"><span className="smp-fcard-num">JWT</span>Secured</div>
          <div className="smp-fcard"><span className="smp-fcard-num">AWS</span>Powered</div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="smp-right-panel">
        <div className="smp-form-box">
          <h2 className="smp-form-title">Create account</h2>
          {error && <div className="smp-error-msg">{error}</div>}
          {success && <div className="smp-success-msg">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="smp-field">
              <label>Full name</label>
              <input type="text" placeholder="Jane Smith" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="smp-field">
              <label>
                Email address
                {emailChecking && <span style={{ marginLeft: "8px", fontSize: "11px", color: "gray" }}>Checking...</span>}
                {!emailChecking && emailStatus === "available" && <span style={{ marginLeft: "8px", fontSize: "11px", color: "green" }}>✓ Available</span>}
                {!emailChecking && emailStatus === "taken" && <span style={{ marginLeft: "8px", fontSize: "11px", color: "red" }}>✗ Already registered</span>}
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input type="email" placeholder="you@example.com" value={email} onChange={handleEmailChange} style={{ flex: 1 }} />
                <button type="button" onClick={handleSendOtp} className="smp-otp-send-btn" disabled={emailVerified || otpLoading || emailStatus !== "available"}>
                  {otpLoading ? "Sending..." : emailVerified ? "✓ Sent" : "Send OTP"}
                </button>
              </div>
            </div>

            {otpSent && !emailVerified && (
              <div className="smp-field">
                <label>Enter OTP</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input type="text" maxLength={6} value={enteredOtp} onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ""))} style={{ flex: 1 }} />
                  <button type="button" onClick={handleVerifyOtp} className="smp-otp-verify-btn" disabled={verifyLoading || enteredOtp.length < 4}>
                    {verifyLoading ? "Verifying..." : "Verify"}
                  </button>
                </div>
                {otpError && <p style={{ color: "red", fontSize: "12px" }}>{otpError}</p>}
              </div>
            )}

            {emailVerified && <div className="smp-verified-badge">✓ Email verified</div>}

            <div className="smp-field">
              <label>Mobile number</label>
              <input 
                type="tel" 
                placeholder="10 digit number" 
                value={mobile} 
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  if (val.length <= 10) setMobile(val);
                }} 
              />
              <small style={{ color: "gray", fontSize: "11px" }}>{mobile.length}/10 digits</small>
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
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none" }}>
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              
              {/* NEW: Real-time UI Password Rules */}
              {password.length > 0 && (
                <div style={{ marginTop: "6px", display: "flex", flexWrap: "wrap", gap: "10px" }}>
                  <span style={{ fontSize: "11px", color: isLongEnough ? "green" : "gray" }}>
                    {isLongEnough ? "✓" : "○"} 8+ chars
                  </span>
                  <span style={{ fontSize: "11px", color: hasLetter ? "green" : "gray" }}>
                    {hasLetter ? "✓" : "○"} Letters
                  </span>
                  <span style={{ fontSize: "11px", color: hasNumber ? "green" : "gray" }}>
                    {hasNumber ? "✓" : "○"} Numbers
                  </span>
                </div>
              )}
            </div>

            <button type="submit" className="smp-btn-primary" disabled={!emailVerified || loading}>
              {loading ? "Creating..." : "Create account"}
            </button>
          </form>
          <div className="smp-link-row">Already have an account? <Link to="/login">Log in</Link></div>
        </div>
      </div>
    </div>
  );
}

export default Register;