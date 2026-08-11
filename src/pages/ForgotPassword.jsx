import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  sendOtpAPI,
  verifyOtpAPI,
  resetPasswordAPI,
} from "../services/authService";

// Steps: 'email' → 'otp' → 'reset' → 'done'
function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState("email");

  // Step 1 — email
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);

  // Step 2 — OTP
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Step 3 — new password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Define steps for the visual indicator
  const stepsConfig = [
    { key: "email", label: "Verify Email" },
    { key: "otp", label: "Enter OTP" },
    { key: "reset", label: "New Password" },
    { key: "done", label: "Success" },
  ];

  // ── STEP 1: check email exists ──────────────────────────────────────
  const handleSendOtp = async () => {
    setEmailError("");
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    if (email === "admin@gmail.com") {
      setEmailError("Admin credentials cannot be reset from this page.");
      return;
    }

    setEmailLoading(true);
    try {
      await sendOtpAPI(email);
      setStep("otp");
    } catch (err) {
      const msg =
        err.response?.data?.message || "No account found with this email.";
      setEmailError(msg);
    } finally {
      setEmailLoading(false);
    }
  };

  // ── STEP 2: verify OTP ───────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    setOtpError("");
    if (!enteredOtp) {
      setOtpError("Please enter the OTP.");
      return;
    }
    setOtpLoading(true);
    try {
      await verifyOtpAPI(email, enteredOtp);
      setStep("reset");
    } catch (err) {
      const msg = err.response?.data?.message || "Incorrect OTP.";
      setOtpError(msg);
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    setOtpError("");
    setResendLoading(true);
    try {
      await sendOtpAPI(email);
      setEnteredOtp("");
    } catch {
      setOtpError("Failed to resend OTP.");
    } finally {
      setResendLoading(false);
    }
  };

  // ── STEP 3: set new password ─────────────────────────────────────────
  const handleResetPassword = async () => {
    setPasswordError("");
    if (!newPassword || !confirmPassword) {
      setPasswordError("Please fill in both fields.");
      return;
    }
    
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setPasswordError(
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
      );
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    setResetLoading(true);
    try {
      await resetPasswordAPI(email, newPassword);
      setStep("done");
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to reset password.";
      setPasswordError(msg);
    } finally {
      setResetLoading(false);
    }
  };

  const getStrength = (pwd) => {
    if (pwd.length === 0)
      return { label: "", color: "transparent", width: "0%" };
    if (pwd.length < 6)
      return { label: "Weak", color: "#ef4444", width: "33%" };
    if (pwd.length < 10)
      return { label: "Fair", color: "#f59e0b", width: "66%" };
    return { label: "Strong", color: "#10b981", width: "100%" };
  };
  const strength = getStrength(newPassword);

  return (
    <div
      className="forgot-password-container smp-auth-layout"
    >
      {/* ── LEFT PANEL: Stepper ── */}
      <div
        className="smp-left-panel"
        style={{ background: "linear-gradient(145deg, #0a2e22 0%, #0f4c3a 50%, #1d9e75 100%)", padding: "40px" }}
      >
        <div className="smp-stepper">
          {stepsConfig.map((s, i) => {
            const isActive = step === s.key;
            const currentIndex = stepsConfig.findIndex(
              (item) => item.key === step,
            );
            const isDone = i < currentIndex || step === "done";

            return (
              <div
                key={s.key}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "12px",
                }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: isDone
                      ? "#10b981"
                      : isActive
                        ? "white"
                        : "rgba(255,255,255,0.15)",
                    color: isDone
                      ? "white"
                      : isActive
                        ? "#0f4c3a"
                        : "rgba(255,255,255,0.5)",
                    fontWeight: "700",
                    fontSize: "13px",
                    border: isActive ? "2px solid white" : "none",
                  }}
                >
                  {isDone ? "✓" : i + 1}
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    color: isActive
                      ? "white"
                      : isDone
                        ? "#6ee7b7"
                        : "rgba(255,255,255,0.45)",
                    fontWeight: isActive ? "600" : "400",
                  }}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANEL: Forms ── */}
      <div
        className="smp-right-panel"
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          className="smp-form-box"
          style={{ maxWidth: "400px", width: "100%", padding: "20px" }}
        >
          {/* STEP 1: Email */}
          {step === "email" && (
            <>
              <h2 className="smp-form-title">Reset password</h2>
              <p className="smp-form-subtitle">
                Enter the email address linked to your account
              </p>
              <div className="smp-field">
                <label>Email address</label>
                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                />
                {emailError && (
                  <p style={{ color: "red", fontSize: "12px" }}>{emailError}</p>
                )}
              </div>
              <button
                className="smp-btn-primary"
                onClick={handleSendOtp}
                disabled={emailLoading}
              >
                {emailLoading ? "Sending..." : "Send OTP"}
              </button>
              <div className="smp-link-row">
                <Link to="/login">← Back to login</Link>
              </div>
            </>
          )}

          {/* STEP 2: OTP */}
          {step === "otp" && (
            <>
              <h2 className="smp-form-title">Check your email</h2>
              <p className="smp-form-subtitle">
                We sent a code to <strong>{email}</strong>
              </p>
              <div className="smp-field">
                <label>Enter OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => {
                    setEnteredOtp(e.target.value);
                    setOtpError("");
                  }}
                  style={{ letterSpacing: "0.25em", fontWeight: "700" }}
                />
                {otpError && <p style={{ color: "red" }}>{otpError}</p>}
              </div>
              <button
                className="smp-btn-primary"
                onClick={handleVerifyOtp}
                disabled={otpLoading || enteredOtp.length < 4}
              >
                {otpLoading ? "Verifying..." : "Verify OTP"}
              </button>
              <div className="smp-link-row">
                <a
                  onClick={!resendLoading ? handleResend : undefined}
                  style={{ cursor: "pointer" }}
                >
                  {resendLoading ? "Resending..." : "Resend OTP"}
                </a>
                {" · "}
                <a
                  onClick={() => setStep("email")}
                  style={{ cursor: "pointer" }}
                >
                  Change email
                </a>
              </div>
            </>
          )}

          {/* STEP 3: Reset */}
          {step === "reset" && (
            <>
              <h2 className="smp-form-title">Set new password</h2>
              {passwordError && (
                <div style={{ color: "red" }}>{passwordError}</div>
              )}
              <div className="smp-field">
                <label>New password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPasswordError("");
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "10px",
                      border: "none",
                      background: "none",
                    }}
                  >
                    {showNew ? (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </svg>
                    ) : (
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                  </button>
                </div>
                {newPassword && (
                  <div
                    style={{
                      height: "4px",
                      background: "#eee",
                      marginTop: "8px",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        width: strength.width,
                        background: strength.color,
                      }}
                    />
                  </div>
                )}
              </div>
              <div className="smp-field">
                <label>Confirm password</label>
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <button
                className="smp-btn-primary"
                onClick={handleResetPassword}
                disabled={resetLoading || newPassword !== confirmPassword}
              >
                {resetLoading ? "Resetting..." : "Reset password"}
              </button>
            </>
          )}

          {/* STEP 4: Done */}
          {step === "done" && (
            <div style={{ textAlign: "center" }}>
              <h2>Success!</h2>
              <p>Your password has been updated.</p>
              <button
                className="smp-btn-primary"
                onClick={() => navigate("/login")}
              >
                Go to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;