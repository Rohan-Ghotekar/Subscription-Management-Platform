import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import UserNavbar from "../../components/UserNavbar";
import UserSidebar from "../../components/UserSidebar";
import { getMyActivePlansAPI } from "../../services/subscriptionService";

const SERVICE_TYPE_COLORS = {
  SaaS:           { bg: "#eef2ff", color: "#3730a3" },
  Streaming:      { bg: "#fdf4ff", color: "#7e22ce" },
  "Cloud Storage":{ bg: "#eff6ff", color: "#1d4ed8" },
  Education:      { bg: "#f0fdf4", color: "#166534" },
  Healthcare:     { bg: "#ecfdf5", color: "#065f46" },
  Finance:        { bg: "#fffbeb", color: "#92400e" },
  "E-commerce":   { bg: "#fff7ed", color: "#9a3412" },
  Communication:  { bg: "#f0f9ff", color: "#0369a1" },
  Gaming:         { bg: "#fef2f2", color: "#991b1b" },
  Other:          { bg: "#f8fafc", color: "#475569" },
};

const displayBilling = (b = "") =>
  b.charAt(0) + b.slice(1).toLowerCase();

function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [subs, setSubs]       = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubs = async () => {
      try {
        const data = await getMyActivePlansAPI();
      
        setSubs(Array.isArray(data) ? data.filter(s => s.status === "ACTIVE") : []);
      } catch {
        setSubs([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSubs();
  }, [user]);

  const quickActions = [
    { icon: "📋", label: "Browse Plans",     path: "/plans",         color: "#4f46e5" },
    { icon: "💳", label: "My Subscriptions", path: "/subscription",  color: "#0f4c3a" },
    { icon: "👤", label: "My Profile",       path: "/profile",       color: "#06b6d4" },
    { icon: "🔔", label: "Notifications",    path: "/notifications", color: "#f59e0b" },
  ];

  const totalMonthly = subs.reduce((sum, s) => sum + Number(s.Price || 0), 0);

  return (
    <div>
      <UserNavbar />
      <div className="user-shell">
        <UserSidebar />
        <main className="user-content">

          {/* Welcome banner */}
          <div style={{
            background: "linear-gradient(135deg, #0f4c3a 0%, #1d9e75 60%, #06b6d4 100%)",
            borderRadius: "16px", padding: "24px 32px",
            marginBottom: "24px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: "16px",
          }}>
            <div>
              <h1 style={{
                fontFamily: "'Sora', sans-serif", fontSize: "22px",
                fontWeight: "700", color: "white", marginBottom: "4px",
              }}>
                Welcome back, {user?.name?.split(" ")[0]}! 👋
              </h1>
              <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.75)" }}>
                {loading
                  ? "Loading your subscriptions..."
                  : subs.length > 0
                  ? `You have ${subs.length} active subscription${subs.length !== 1 ? "s" : ""}.`
                  : "You don't have any active subscriptions yet."}
              </p>
            </div>

            {/* Summary pill */}
            {!loading && subs.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,0.15)",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "12px", padding: "14px 22px",
                textAlign: "center", flexShrink: 0,
              }}>
                <div style={{
                  fontFamily: "'Sora', sans-serif", fontSize: "22px",
                  fontWeight: "700", color: "#6ee7b7", marginBottom: "2px",
                }}>
                  ₹{totalMonthly.toFixed(0)}
                </div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.6)" }}>
                  total / month
                </div>
              </div>
            )}

            {!loading && subs.length === 0 && (
              <button
                className="btn-select-plan"
                style={{ width: "auto", padding: "10px 22px", flexShrink: 0 }}
                onClick={() => navigate("/plans")}
              >
                Browse Plans →
              </button>
            )}
          </div>

          {/* No subscription nudge */}
          {!loading && subs.length === 0 && (
            <div style={{
              background: "#fffbeb", border: "1px solid #fde68a",
              borderRadius: "12px", padding: "18px 24px",
              marginBottom: "24px", display: "flex",
              alignItems: "center", gap: "16px",
            }}>
              <span style={{ fontSize: "26px" }}>💡</span>
              <div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: "600", color: "#92400e", marginBottom: "3px" }}>
                  No active subscriptions
                </div>
                <div style={{ fontSize: "13px", color: "#78350f" }}>
                  Choose a plan to unlock features.{" "}
                  <span
                    onClick={() => navigate("/plans")}
                    style={{ color: "var(--brand)", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
                  >
                    Browse plans →
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Active subscriptions section */}
          {!loading && subs.length > 0 && (
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <h2 style={{
                  fontFamily: "'Sora', sans-serif", fontSize: "16px",
                  fontWeight: "600", color: "var(--text-dark)",
                }}>
                  Active subscriptions
                </h2>
                <button
                  className="btn-admin-secondary"
                  style={{ padding: "6px 14px", fontSize: "12px" }}
                  onClick={() => navigate("/subscription")}
                >
                  View all →
                </button>
              </div>

              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "14px",
              }}>
                {subs.map(sub => {
                  const stColor = SERVICE_TYPE_COLORS[sub.serviceType] || SERVICE_TYPE_COLORS.Other;
                  const daysLeft = sub.daysRemaining ?? 0;
                  const daysColor =
                    daysLeft <= 7  ? "var(--error)" :
                    daysLeft <= 30 ? "var(--warning)" :
                    "var(--success)";
                  const pct = Math.min(100, Math.max(0, (daysLeft / 30) * 100));

                  return (
                    <div
                      key={sub.subId}
                      style={{
                        background: "var(--bg-card)", borderRadius: "14px",
                        border: "1px solid var(--border)", padding: "18px 20px",
                        cursor: "pointer", transition: "all 0.2s",
                        boxShadow: "var(--shadow-xs)",
                      }}
                      onClick={() => navigate("/subscription")}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "var(--brand-muted)";
                        e.currentTarget.style.boxShadow = "var(--shadow-md)";
                        e.currentTarget.style.transform = "translateY(-2px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.boxShadow = "var(--shadow-xs)";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      {/* Top row: plan name + price */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px" }}>
                        <div>
                          {/* Service type badge */}
                          {sub.serviceType && (
                            <span style={{
                              display: "inline-block",
                              background: stColor.bg, color: stColor.color,
                              fontSize: "10px", fontWeight: "700",
                              padding: "2px 8px", borderRadius: "20px",
                              marginBottom: "5px", letterSpacing: "0.03em",
                            }}>
                              {sub.serviceType}
                            </span>
                          )}
                          <div style={{
                            fontFamily: "'Sora', sans-serif", fontSize: "16px",
                            fontWeight: "700", color: "var(--text-dark)",
                          }}>
                            {sub.planName}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{
                            fontFamily: "'Sora', sans-serif", fontSize: "17px",
                            fontWeight: "700", color: "var(--brand)",
                          }}>
                            ₹{sub.Price}
                          </div>
                          <div style={{ fontSize: "10px", color: "var(--text-light)" }}>
                            /{displayBilling(sub.billing)}
                          </div>
                        </div>
                      </div>

                      {/* Days remaining bar */}
                      <div style={{ marginBottom: "10px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Days remaining</span>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: daysColor }}>{daysLeft}d</span>
                        </div>
                        <div style={{ height: "4px", background: "var(--bg-subtle)", borderRadius: "4px", overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: "4px",
                            width: `${pct}%`,
                            background: daysLeft <= 7 ? "var(--error)" : daysLeft <= 30 ? "var(--warning)" : "var(--success)",
                            transition: "width 0.3s ease",
                          }}/>
                        </div>
                      </div>

                      {/* Renewal date */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                          Renews {sub.endDate || "—"}
                        </span>
                        <span style={{
                          display: "inline-block",
                          background: "var(--success-bg)", color: "#065f46",
                          border: "1px solid var(--success-border)",
                          fontSize: "10px", fontWeight: "700",
                          padding: "2px 8px", borderRadius: "20px",
                        }}>
                          ● Active
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick actions */}
          <div>
            <h2 style={{
              fontFamily: "'Sora', sans-serif", fontSize: "16px",
              fontWeight: "600", color: "var(--text-dark)", marginBottom: "14px",
            }}>
              Quick actions
            </h2>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: "12px",
            }}>
              {quickActions.map((a) => (
                <div
                  key={a.path}
                  onClick={() => navigate(a.path)}
                  style={{
                    background: "var(--bg-card)", border: "1px solid var(--border)",
                    borderRadius: "12px", padding: "20px 16px",
                    textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.borderColor = a.color;
                    e.currentTarget.style.transform = "translateY(-2px)";
                    e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div style={{ fontSize: "26px", marginBottom: "8px" }}>{a.icon}</div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "var(--text-dark)" }}>
                    {a.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}

export default UserDashboard;