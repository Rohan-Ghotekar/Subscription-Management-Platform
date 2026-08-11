import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { verifyPaymentAPI } from "../../services/paymentService";

function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [message, setMessage] = useState("");
  const hasRun = useRef(false);
  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;
    const finalize = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setStatus("error");
        setMessage("Missing session ID. Please contact support.");
        return;
      }

      // Verify token exists before making API calls
      const token = sessionStorage.getItem("smp_token");
      if (!token) {
        console.error(
          "❌ No authentication token found. User may need to log in again.",
        );
        setStatus("error");
        setMessage(
          "Session expired. Please log in again and restart the payment.",
        );
        setTimeout(() => (window.location.href = "/login"), 2000);
        return;
      }
      console.log("✅ Token found, proceeding with payment verification...");

      try {
        // Step 1: Verify payment with backend
        // verifyPayment already calls markAsSuccess → activateSubscription internally
        // so we do NOT need to call subscribeToPlanAPI or switchPlanAPI here
        console.log("📍 Verifying payment with session:", sessionId);
        const verification = await verifyPaymentAPI(sessionId);
        console.log("✅ Payment verified:", verification);

        if (verification.status !== "SUCCESS") {
          setStatus("error");
          setMessage(
            `Payment status: ${verification.status}. Please contact support.`,
          );
          return;
        }

        // Step 2: Clean up all localStorage payment keys
        localStorage.removeItem("smp_payment_isswitch");
        localStorage.removeItem("smp_payment_amount");
        localStorage.removeItem("smp_payment_preview_planid");
        localStorage.removeItem("smp_payment_preview_planname");
        localStorage.removeItem("smp_payment_planId");
        localStorage.removeItem("smp_payment_planName");
        console.log(
          "✅ Subscription activated by backend. localStorage cleaned up.",
        );

        // Step 3: Show success and redirect
        setStatus("success");
        setMessage(
          `Your ${verification.planName || ""} subscription is now active!`,
        );
        setTimeout(() => navigate("/subscription"), 3000);
      } catch (err) {
        console.error("❌ Error during payment verification:", {
          status: err.response?.status,
          statusText: err.response?.statusText,
          message: err.response?.data?.message,
          data: err.response?.data,
          error: err.message,
        });

        const errorMsg =
          err.response?.status === 403
            ? "Access denied. Please ensure you are logged in to the correct account."
            : err.response?.data?.message ||
              "Payment received but verification failed. Contact support with session: " +
                sessionId;

        setStatus("error");
        setMessage(errorMsg);
      }
    };

    finalize();
  }, [searchParams, navigate]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div
        style={{
          background: "var(--bg-card)",
          borderRadius: "20px",
          border: "1px solid var(--border)",
          padding: "48px",
          textAlign: "center",
          maxWidth: "440px",
          width: "100%",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Processing */}
        {status === "processing" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-dark)",
                marginBottom: "10px",
              }}
            >
              Verifying your payment...
            </h2>
            <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
              Please wait while we confirm your payment with Stripe.
            </p>
          </>
        )}

        {/* Success */}
        {status === "success" && (
          <>
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "var(--success-bg)",
                border: "2px solid var(--success-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "32px",
                margin: "0 auto 24px",
              }}
            >
              ✓
            </div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-dark)",
                marginBottom: "10px",
              }}
            >
              Payment successful!
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginBottom: "28px",
                lineHeight: "1.6",
              }}
            >
              {message}
            </p>
            <div
              style={{
                background: "var(--bg-subtle)",
                borderRadius: "10px",
                padding: "12px 16px",
                marginBottom: "20px",
              }}
            >
              <p style={{ fontSize: "12px", color: "var(--text-light)" }}>
                Redirecting to your subscription page in 3 seconds...
              </p>
            </div>
            <button
              onClick={() => navigate("/subscription")}
              style={{
                padding: "11px 28px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Go to subscription →
            </button>
          </>
        )}

        {/* Error */}
        {status === "error" && (
          <>
            <div style={{ fontSize: "48px", marginBottom: "20px" }}>⚠️</div>
            <h2
              style={{
                fontFamily: "var(--font-heading)",
                fontSize: "22px",
                fontWeight: "700",
                color: "var(--text-dark)",
                marginBottom: "10px",
              }}
            >
              Something went wrong
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "var(--text-muted)",
                marginBottom: "28px",
                lineHeight: "1.6",
              }}
            >
              {message}
            </p>
            <button
              onClick={() => navigate("/plans")}
              style={{
                padding: "11px 28px",
                background: "var(--brand)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontFamily: "var(--font-body)",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Back to plans
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default PaymentSuccess;
