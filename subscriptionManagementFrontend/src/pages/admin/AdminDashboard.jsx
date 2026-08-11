import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminNavbar from "../../components/AdminNavbar";
import AdminSidebar from "../../components/AdminSidebar";
import { getAllNotificationsAPI } from "../../services/notificationService";

function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProviders: 0,
    activeProviders: 0,
    pendingProviders: 0,
    totalNotifications: 0,
    unreadNotifications: 0,
    recentNotifications: [],
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch notifications
        const notifications = await getAllNotificationsAPI();
        const unread = notifications.filter((n) => !n.read).length;
        const recent = notifications.slice(0, 5);

        // In a real app, you'd fetch provider stats from an API
        // For now, using placeholder data
        setStats({
          totalProviders: 12,
          activeProviders: 10,
          pendingProviders: 2,
          totalNotifications: notifications.length,
          unreadNotifications: unread,
          recentNotifications: recent,
        });
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const quickActions = [
    {
      icon: "🏢",
      title: "Manage Providers",
      description: "View and manage all service providers",
      action: () => navigate("/admin/providers"),
      color: "#4f46e5",
    },
    {
      icon: "🔔",
      title: "View Notifications",
      description: "Check all system notifications",
      action: () => navigate("/admin/notifications"),
      color: "#10b981",
      badge: stats.unreadNotifications > 0 ? stats.unreadNotifications : null,
    },
  ];

  return (
    <div>
      <AdminNavbar />
      <div className="admin-shell" style={{ overflow: "hidden" }}>
        <AdminSidebar />
        <main className="admin-content" style={{ overflow: "hidden" }}>
          {/* Page header */}
          <div className="admin-page-header">
            <h1 className="admin-page-title">Admin Control Center</h1>
            <p className="admin-page-subtitle">
              Manage providers and stay updated with notifications
            </p>
          </div>

          {loading ? (
            <div
              style={{
                background: "white",
                borderRadius: "12px",
                border: "1px solid var(--border)",
                padding: "40px",
                textAlign: "center",
                color: "var(--text-light)",
                fontSize: "14px",
              }}
            >
              Loading dashboard...
            </div>
          ) : (
            <>
              

              {/* Quick Actions */}
              <div style={{ marginBottom: "16px" }}>
                <h2
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "10px",
                    color: "var(--text-dark)",
                  }}
                >
                  Quick Actions
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                    gap: "12px",
                  }}
                >
                  {quickActions.map((action, idx) => (
                    <div
                      key={idx}
                      onClick={action.action}
                      style={{
                        background: "white",
                        border: "2px solid var(--border)",
                        borderRadius: "12px",
                        padding: "16px",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        position: "relative",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = action.color;
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = `0 10px 30px ${action.color}20`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = "var(--border)";
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {action.badge && (
                        <div
                          style={{
                            position: "absolute",
                            top: "16px",
                            right: "16px",
                            background: "#ef4444",
                            color: "white",
                            fontSize: "11px",
                            fontWeight: "700",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            minWidth: "24px",
                            textAlign: "center",
                          }}
                        >
                          {action.badge}
                        </div>
                      )}
                      <div style={{ fontSize: "32px", marginBottom: "8px" }}>{action.icon}</div>
                      <h3
                        style={{
                          fontFamily: "'Sora', sans-serif",
                          fontSize: "14px",
                          fontWeight: "600",
                          marginBottom: "4px",
                          color: "var(--text-dark)",
                        }}
                      >
                        {action.title}
                      </h3>
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-light)",
                          lineHeight: "1.4",
                        }}
                      >
                        {action.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Notifications */}
              {stats.recentNotifications.length > 0 && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "10px",
                    }}
                  >
                    <h2
                      style={{
                        fontFamily: "'Sora', sans-serif",
                        fontSize: "16px",
                        fontWeight: "600",
                        color: "var(--text-dark)",
                      }}
                    >
                      Recent Notifications
                    </h2>
                    <button
                      onClick={() => navigate("/admin/notifications")}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#4f46e5",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: "pointer",
                        padding: "8px 16px",
                        borderRadius: "8px",
                        transition: "background 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f3f4f6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                    >
                      View All →
                    </button>
                  </div>
                  <div
                    style={{
                      background: "white",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      overflow: "hidden",
                    }}
                  >
                    {stats.recentNotifications.map((notif, idx) => (
                      <div
                        key={idx}
                        style={{
                          padding: "16px 20px",
                          borderBottom:
                            idx < stats.recentNotifications.length - 1
                              ? "1px solid var(--border)"
                              : "none",
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                          background: notif.read ? "white" : "#fef3c7",
                          transition: "background 0.2s",
                          cursor: "pointer",
                        }}
                        onClick={() => navigate("/admin/notifications")}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = notif.read ? "white" : "#fef3c7")
                        }
                      >
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: notif.read ? "#d1d5db" : "#f59e0b",
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div
                            style={{
                              fontSize: "14px",
                              fontWeight: "500",
                              color: "var(--text-dark)",
                              marginBottom: "4px",
                            }}
                          >
                            {notif.title}
                          </div>
                          <div
                            style={{
                              fontSize: "13px",
                              color: "var(--text-light)",
                            }}
                          >
                            {notif.message?.substring(0, 80)}
                            {notif.message?.length > 80 ? "..." : ""}
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-light)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {new Date(notif.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* System Status
              <div style={{ marginTop: "16px" }}>
                <h2
                  style={{
                    fontFamily: "'Sora', sans-serif",
                    fontSize: "16px",
                    fontWeight: "600",
                    marginBottom: "10px",
                    color: "var(--text-dark)",
                  }}
                >
                  System Status
                </h2>
                <div
                  style={{
                    background: "white",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "20px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div
                      style={{
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#10b981",
                        animation: "pulse 2s infinite",
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: "600",
                          color: "var(--text-dark)",
                        }}
                      >
                        All Systems Operational
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-light)" }}>
                        Platform is running smoothly
                      </div>
                    </div>
                  </div>
                </div>
              </div> */}
            </>
          )}
        </main>
      </div>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default AdminDashboard;