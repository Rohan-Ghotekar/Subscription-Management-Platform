import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useSidebar } from "../context/SidebarContext";
import { getAllNotificationsAPI } from "../services/notificationService";

function AdminSidebar({ unreadCount: propCount }) {
  const { isOpen, setIsOpen } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(propCount || 0);

  useEffect(() => {
    if (propCount !== undefined) {
      setUnreadCount(propCount);
      return;
    }
    const fetchCount = async () => {
      try {
        const data = await getAllNotificationsAPI();
        const count = data.filter((n) => !n.read).length;
        setUnreadCount(count);
      } catch {
        // Silently fail
      }
    };
    fetchCount();
  }, [propCount]);
  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar${isOpen ? " sidebar--open" : ""}`}>
        {/* Management */}
        <div className="sidebar-section-label">Overview</div>
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            "sidebar-item" + (isActive ? " active" : "")
          }
        >
          <span className="sidebar-item-icon">🧭</span>
          Admin Control Center
        </NavLink>

        <div className="sidebar-section-label">Management</div>
        <NavLink
          to="/admin/providers"
          className={({ isActive }) =>
            "sidebar-item" + (isActive ? " active" : "")
          }
        >
          <span className="sidebar-item-icon">🏢</span>
          Manage Providers
        </NavLink>
        <NavLink
          to="/admin/notifications"
          className={({ isActive }) =>
            "sidebar-item" + (isActive ? " active" : "")
          }
        >
          <span className="sidebar-item-icon">🔔</span>
          <span style={{ flex: 1 }}>Notifications</span>

          {unreadCount > 0 && (
            <span
              style={{
                background: "var(--brand)",
                color: "white",
                fontSize: "10px",
                fontWeight: "700",
                minWidth: "18px",
                height: "18px",
                borderRadius: "9px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 5px",
                marginLeft: "4px",
              }}
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </NavLink>
      </aside>
    </>
  );
}

export default AdminSidebar;