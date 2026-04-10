import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  cancelSubscriptionAPI,
  getMyActivePlansAPI,
  toggleAutoRenewAPI,
} from "../../services/subscriptionService";
import UserNavbar from "../../components/UserNavbar";
import UserSidebar from "../../components/UserSidebar";

const SERVICE_TYPE_COLORS = {
  SaaS: { bg: "#eef2ff", color: "#3730a3", border: "#c7d2fe" },
  Streaming: { bg: "#fdf4ff", color: "#7e22ce", border: "#e9d5ff" },
  "Cloud Storage": { bg: "#eff6ff", color: "#1d4ed8", border: "#bfdbfe" },
  Education: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0" },
  Healthcare: { bg: "#ecfdf5", color: "#065f46", border: "#a7f3d0" },
  Finance: { bg: "#fffbeb", color: "#92400e", border: "#fde68a" },
  "E-commerce": { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa" },
  Communication: { bg: "#f0f9ff", color: "#0369a1", border: "#bae6fd" },
  Gaming: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca" },
  Other: { bg: "#f8fafc", color: "#475569", border: "#e2e8f0" },
};

const TIER_CONFIG = {
  BASIC: { bg: "#eef2ff", color: "#3730a3" },
  PRO: { bg: "#fdf4ff", color: "#7e22ce" },
  ENTERPRISE: { bg: "#0f172a", color: "#e2e8f0" },
};

const displayBilling = (b = "") => b.charAt(0) + b.slice(1).toLowerCase();

const getRemainingDays = (subscription) => {
  const value = Number(subscription?.daysRemaining ?? subscription?.daysLeft ?? 0);
  return Number.isFinite(value) ? value : 0;
};

const canSwitchPlan = (subscription) => getRemainingDays(subscription) > 2;

const buildPlansRoute = (subscription) => {
  const params = new URLSearchParams();

  if (subscription?.serviceType) {
    params.set("serviceType", subscription.serviceType);
  }

  if (subscription?.providerId !== undefined && subscription?.providerId !== null) {
    params.set("providerId", String(subscription.providerId));
  }

  const queryString = params.toString();
  return queryString ? `/plans?${queryString}` : "/plans";
};

function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const SUBS_PER_PAGE = 4;
  const [subs, setSubs] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "" });
  const [currentPage, setCurrentPage] = useState(1);

  // Cancel modal state
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // Toggle auto-renew state
  const [togglingSubId, setTogglingSubId] = useState(null);
  const [toggleError, setToggleError] = useState("");

  useEffect(() => {
    const fetchAll = async () => {
      setFetching(true);
      try {
        const data = await getMyActivePlansAPI();
        // Filter only ACTIVE ones just in case
        setSubs(
          Array.isArray(data) ? data.filter((s) => s.status === "ACTIVE") : [],
        );
      } catch (err) {
        if (err.response?.status === 404) {
          setSubs([]);
        } else {
          setFetchError("Failed to load subscriptions. Please try again.");
          // Fallback to session cache
          const cached = sessionStorage.getItem(
            `smp_subscription_${user?.email}`,
          );
          if (cached) {
            const c = JSON.parse(cached);
            setSubs(Array.isArray(c) ? c : [c]);
          }
        }
      } finally {
        setFetching(false);
      }
    };
    fetchAll();
  }, [user]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "" }), 3500);
  };

  const handleCancel = async () => {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      await cancelSubscriptionAPI(cancelTarget.subId);
      setSubs((prev) => prev.filter((s) => s.subId !== cancelTarget.subId));
      setCancelTarget(null);
      showToast(`${cancelTarget.planName} plan cancelled successfully.`);
      window.dispatchEvent(
        new CustomEvent("smp-subscription-updated", {
          detail: { action: "cancel", planId: cancelTarget.planId },
        }),
      );
    } catch (err) {
      setCancelError(
        err.response?.data?.message ||
          err.message ||
          "Failed to cancel. Please try again.",
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleToggleAutoRenew = async (sub) => {
    setTogglingSubId(sub.subId);
    setToggleError("");
    try {
      await toggleAutoRenewAPI(sub.subId);
      // Update the subscription in state with toggled autoRenew status
      setSubs((prev) =>
        prev.map((s) =>
          s.subId === sub.subId ? { ...s, autoRenew: !s.autoRenew } : s,
        ),
      );
      showToast(
        `Auto-renewal ${!sub.autoRenew ? "enabled" : "disabled"} successfully.`,
      );
      window.dispatchEvent(
        new CustomEvent("smp-subscription-updated", {
          detail: { action: "toggleRenew", subId: sub.subId, autoRenew: !sub.autoRenew },
        }),
      );
    } catch (err) {
      setToggleError(
        err.response?.data?.message ||
          err.message ||
          "Failed to update renewal status. Please try again.",
      );
      showToast(
        err.response?.data?.message ||
          err.message ||
          "Failed to update renewal status.",
        "error",
      );
    } finally {
      setTogglingSubId(null);
    }
  };

  const totalPages = Math.max(1, Math.ceil(subs.length / SUBS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedSubs = subs.slice(
    (safePage - 1) * SUBS_PER_PAGE,
    safePage * SUBS_PER_PAGE,
  );

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

  const getPageNumbers = () => {
    const pages = [];
    for (let p = 1; p <= totalPages; p += 1) {
      const isEdge = p === 1 || p === totalPages;
      const isNear = Math.abs(p - safePage) <= 1;
      if (isEdge || isNear) {
        pages.push(p);
      } else if (pages[pages.length - 1] !== "...") {
        pages.push("...");
      }
    }
    return pages;
  };

  // ── No subscriptions ─────────────────────────────────────────
  if (!fetching && subs.length === 0) {
    return (
      <div>
        <UserNavbar />
        <div className="user-shell">
          <UserSidebar />
          <main className="user-content">
            {fetchError && (
              <div className="smp-error-msg" style={{ marginBottom: "16px" }}>
                {fetchError}
              </div>
            )}
            <div
              style={{
                textAlign: "center",
                padding: "80px 20px",
                background: "var(--bg-card)",
                borderRadius: "16px",
                border: "1px solid var(--border)",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
              <h2
                style={{
                  fontFamily: "'Sora', sans-serif",
                  fontSize: "20px",
                  fontWeight: "700",
                  color: "var(--text-dark)",
                  marginBottom: "8px",
                }}
              >
                No active subscriptions
              </h2>
              <p
                style={{
                  fontSize: "14px",
                  color: "var(--text-muted)",
                  marginBottom: "24px",
                }}
              >
                You haven't subscribed to any plans yet. Browse available plans
                to get started.
              </p>
              <button
                className="btn-select-plan"
                style={{
                  width: "auto",
                  padding: "12px 28px",
                  margin: "0 auto",
                }}
                onClick={() => navigate("/plans")}
              >
                Browse plans →
              </button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div>
      <UserNavbar />
      <div className="user-shell">
        <UserSidebar />
        <main className="user-content">
          {/* Toast */}
          {toast.msg && (
            <div
              style={{
                position: "fixed",
                top: "76px",
                right: "28px",
                zIndex: 300,
                background:
                  toast.type === "success"
                    ? "var(--success-bg)"
                    : "var(--error-bg)",
                border: `1px solid ${toast.type === "success" ? "var(--success-border)" : "var(--error-border)"}`,
                color: toast.type === "success" ? "#065f46" : "#991b1b",
                borderRadius: "10px",
                padding: "12px 20px",
                fontSize: "14px",
                fontWeight: "500",
                boxShadow: "var(--shadow-md)",
              }}
            >
              {toast.type === "success" ? "✓" : "✗"} {toast.msg}
            </div>
          )}

          {/* Page header */}
          <div className="admin-page-header">
            <h1 className="admin-page-title">My Subscriptions</h1>
            <p className="admin-page-subtitle">
              {fetching
                ? "Loading your subscriptions..."
                : `You have ${subs.length} active subscription${subs.length !== 1 ? "s" : ""}.`}
            </p>
          </div>

          {fetchError && (
            <div className="smp-error-msg" style={{ marginBottom: "16px" }}>
              {fetchError}
            </div>
          )}

          {/* Loading */}
          {fetching && (
            <div
              style={{
                background: "var(--bg-card)",
                borderRadius: "16px",
                border: "1px solid var(--border)",
                padding: "80px",
                textAlign: "center",
                color: "var(--text-light)",
                fontSize: "14px",
              }}
            >
              Loading your subscriptions...
            </div>
          )}

          {/* Subscription cards grid */}
          {!fetching && subs.length > 0 && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                  gap: "16px",
                  marginBottom: "16px",
                }}
              >
                {pagedSubs.map((sub) => {
                const tierColor = TIER_CONFIG[sub.tier] || TIER_CONFIG.BASIC;
                const daysLeft = sub.daysRemaining ?? 0;
                const daysColor =
                  daysLeft <= 7
                    ? "var(--error)"
                    : daysLeft <= 30
                      ? "var(--warning)"
                      : "var(--success)";

                return (
                  <div
                    key={sub.subId}
                    style={{
                      background: "var(--bg-card)",
                      borderRadius: "16px",
                      border: "1px solid var(--border)",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-sm)",
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    {/* Card header band */}
                    <div
                      style={{
                        background:
                          sub.tier === "ENTERPRISE"
                            ? "linear-gradient(135deg, #0a2e22, #0f4c3a)"
                            : sub.tier === "PRO"
                              ? "linear-gradient(135deg, #0f4c3a, #1d9e75)"
                              : "linear-gradient(135deg, #0f4c3a, #1a7a5e)",
                              padding: "16px 18px",
                      }}
                    >
                      {/* Service type badge */}
                      {sub.serviceType && (
                        <span
                          style={{
                            display: "inline-block",
                            background: "rgba(255,255,255,0.15)",
                            color: "rgba(255,255,255,0.9)",
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 10px",
                            borderRadius: "20px",
                            marginBottom: "8px",
                            letterSpacing: "0.04em",
                            textTransform: "uppercase",
                          }}
                        >
                          {sub.serviceType}
                        </span>
                      )}

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontFamily: "'Sora', sans-serif",
                              fontSize: "18px",
                              fontWeight: "700",
                              color: "white",
                              marginBottom: "2px",
                            }}
                          >
                            {sub.planName}
                          </div>
                          {sub.planDescription && (
                            <div
                              style={{
                                fontSize: "11px",
                                color: "rgba(255,255,255,0.6)",
                              }}
                            >
                              {sub.planDescription}
                            </div>
                          )}
                        </div>
                        <div style={{ textAlign: "right", flexShrink: 0 }}>
                          <div
                            style={{
                              fontFamily: "'Sora', sans-serif",
                              fontSize: "20px",
                              fontWeight: "700",
                              color: "#6ee7b7",
                            }}
                          >
                            ₹{sub.Price}
                          </div>
                          <div
                            style={{
                              fontSize: "10px",
                              color: "rgba(255,255,255,0.5)",
                            }}
                          >
                            /{displayBilling(sub.billing)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card body */}
                    <div style={{ padding: "14px 18px", flex: 1 }}>
                      {/* Info grid */}
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "8px",
                          marginBottom: "12px",
                        }}
                      >
                        {[
                          {
                            label: "Plan tier",
                            value: sub.tier,
                            valueStyle: { color: tierColor.color },
                          },
                          {
                            label: "Billing",
                            value: displayBilling(sub.billing),
                          },
                          { label: "Start date", value: sub.startDate || "—" },
                          { label: "Renews on", value: sub.endDate || "—" },
                        ].map((item) => (
                          <div
                            key={item.label}
                            style={{
                              background: "var(--bg-subtle)",
                              borderRadius: "8px",
                              padding: "10px 12px",
                              border: "1px solid var(--border)",
                            }}
                          >
                            <div
                              style={{
                                  fontSize: "9px",
                                fontWeight: "700",
                                color: "var(--text-light)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                  marginBottom: "2px",
                              }}
                            >
                              {item.label}
                            </div>
                            <div
                              style={{
                                  fontSize: "12px",
                                fontWeight: "600",
                                color: "var(--text-dark)",
                                ...item.valueStyle,
                              }}
                            >
                              {item.value}
                            </div>
                          </div>
                        ))}

                        <div
                          style={{
                            gridColumn: "1 / -1",
                            background: "var(--bg-subtle)",
                            borderRadius: "8px",
                            padding: "9px 12px",
                            border: "1px solid var(--border)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            gap: "12px",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "9px",
                                fontWeight: "700",
                                color: "var(--text-light)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: "2px",
                              }}
                            >
                              Days left
                            </div>
                            <div
                              style={{
                                fontSize: "12px",
                                fontWeight: "700",
                                color: daysColor,
                              }}
                            >
                              {daysLeft} days
                            </div>
                          </div>

                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{
                                    fontSize: "9px",
                                  fontWeight: "700",
                                  color: "var(--text-light)",
                                  textTransform: "uppercase",
                                  letterSpacing: "0.06em",
                                    marginBottom: "2px",
                                }}
                              >
                                Auto-renew
                              </div>
                              <div
                                style={{
                                    fontSize: "11px",
                                  fontWeight: "600",
                                  color: sub.autoRenew ? "var(--success)" : "var(--text-muted)",
                                }}
                              >
                                {sub.autoRenew ? "✓ Enabled" : "✗ Disabled"}
                              </div>
                            </div>
                            <label
                              style={{
                                display: "flex",
                                alignItems: "center",
                                cursor: "pointer",
                                userSelect: "none",
                                flexShrink: 0,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={sub.autoRenew}
                                onChange={() => handleToggleAutoRenew(sub)}
                                disabled={togglingSubId === sub.subId}
                                style={{
                                  width: "18px",
                                  height: "18px",
                                  cursor: togglingSubId === sub.subId ? "not-allowed" : "pointer",
                                  opacity: togglingSubId === sub.subId ? 0.6 : 1,
                                }}
                              />
                            </label>
                          </div>
                        </div>
                      </div>

                      {/* Active badge */}
                      <div style={{ marginBottom: "14px" }}>
                        <span
                          style={{
                            display: "inline-block",
                            background: "var(--success-bg)",
                            color: "#065f46",
                            border: "1px solid var(--success-border)",
                            fontSize: "10px",
                            fontWeight: "700",
                            padding: "2px 10px",
                            borderRadius: "20px",
                          }}
                        >
                          ● Active
                        </span>
                      </div>

                      {/* Actions */}
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          className="btn-admin-primary"
                          style={{
                            flex: 1,
                            justifyContent: "center",
                            opacity: canSwitchPlan(sub) ? 1 : 0.6,
                            padding: "8px 12px",
                            fontSize: "12px",
                          }}
                          onClick={() => {
                            if (!canSwitchPlan(sub)) {
                              showToast(
                                "You cannot switch plan right now because 2 or less days are remaining for your current plan to end.",
                                "error",
                              );
                              return;
                            }
                            navigate(buildPlansRoute(sub));
                          }}
                        >
                          🔄 Switch plan
                        </button>
                        <button
                          className="btn-admin-danger"
                          style={{ padding: "8px 12px", fontSize: "12px" }}
                          onClick={() => {
                            setCancelTarget(sub);
                            setCancelError("");
                          }}
                        >
                          ✕ Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>

              {subs.length > SUBS_PER_PAGE && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "10px",
                    padding: "8px 14px",
                    borderTop: "1px solid var(--border)",
                    background: "var(--bg-subtle)",
                    borderRadius: "12px",
                  }}
                >
                  <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Showing {(safePage - 1) * SUBS_PER_PAGE + 1}-{Math.min(safePage * SUBS_PER_PAGE, subs.length)} of {subs.length}
                  </span>

                  <div
                    style={{
                      display: "flex",
                      gap: "4px",
                      alignItems: "center",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid var(--border)",
                        background: safePage === 1 ? "var(--bg-subtle)" : "var(--bg-card)",
                        color: safePage === 1 ? "var(--text-light)" : "var(--text-mid)",
                        cursor: safePage === 1 ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      ← Prev
                    </button>

                    {getPageNumbers().map((page, idx) =>
                      page === "..." ? (
                        <span key={`e-${idx}`} style={{ padding: "4px", fontSize: "12px", color: "var(--text-light)" }}>...</span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          style={{
                            width: "30px",
                            height: "30px",
                            borderRadius: "7px",
                            border: safePage === page ? "none" : "1.5px solid var(--border)",
                            background: safePage === page ? "var(--brand)" : "var(--bg-card)",
                            color: safePage === page ? "white" : "var(--text-mid)",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            boxShadow: safePage === page ? "var(--shadow-sm)" : "none",
                          }}
                        >
                          {page}
                        </button>
                      )
                    )}

                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      style={{
                        padding: "5px 10px",
                        borderRadius: "7px",
                        border: "1.5px solid var(--border)",
                        background: safePage === totalPages ? "var(--bg-subtle)" : "var(--bg-card)",
                        color: safePage === totalPages ? "var(--text-light)" : "var(--text-mid)",
                        cursor: safePage === totalPages ? "not-allowed" : "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      Next →
                    </button>
                  </div>

                  <span style={{ fontSize: "11px", color: "var(--text-light)" }}>
                    {SUBS_PER_PAGE} per page
                  </span>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Cancel confirmation modal */}
      {cancelTarget && (
        <div
          className="modal-overlay"
          onClick={() => {
            setCancelTarget(null);
            setCancelError("");
          }}
        >
          <div
            className="confirm-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="confirm-modal-icon">⚠️</div>
            <div className="confirm-modal-title">Cancel subscription?</div>
            <div className="confirm-modal-body">
              Are you sure you want to cancel your{" "}
              <strong>{cancelTarget.planName}</strong> plan
              {cancelTarget.serviceType && <> ({cancelTarget.serviceType})</>}?
              <br />
              <span style={{ color: "var(--error)", fontSize: "13px" }}>
                You will lose access to this plan immediately.
              </span>
            </div>
            {cancelError && (
              <div
                style={{
                  background: "var(--error-bg)",
                  border: "1px solid var(--error-border)",
                  borderRadius: "8px",
                  padding: "10px 14px",
                  fontSize: "13px",
                  color: "var(--error)",
                  marginBottom: "16px",
                }}
              >
                {cancelError}
              </div>
            )}
            <div className="confirm-modal-actions">
              <button
                className="btn-modal-cancel"
                disabled={cancelling}
                onClick={() => {
                  setCancelTarget(null);
                  setCancelError("");
                }}
              >
                Keep my plan
              </button>
              <button
                className="btn-admin-danger"
                style={{
                  padding: "9px 20px",
                  fontSize: "13px",
                  opacity: cancelling ? 0.7 : 1,
                }}
                disabled={cancelling}
                onClick={handleCancel}
              >
                {cancelling ? "Cancelling..." : "Yes, cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Subscription;
