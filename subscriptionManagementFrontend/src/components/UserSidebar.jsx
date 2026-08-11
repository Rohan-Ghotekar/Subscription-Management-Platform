import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { getAllNotificationsAPI } from '../services/notificationService'
import { useSidebar } from '../context/SidebarContext'

function UserSidebar({ unreadCount: propCount }) {
  const [unreadCount, setUnreadCount] = useState(propCount || 0)
  const { isOpen, setIsOpen } = useSidebar()

  useEffect(() => {
    if (propCount !== undefined) {
      setUnreadCount(propCount)
      return
    }
    const fetchCount = async () => {
      try {
        const data = await getAllNotificationsAPI()
        const count = data.filter(n => !n.read).length
        setUnreadCount(count)
      } catch {
        // Silently fail
      }
    }
    fetchCount()
  }, [propCount])

  const navItems = [
    { to: '/dashboard',       icon: '🏠', label: 'Dashboard'       },
    { to: '/plans',           icon: '📋', label: 'Browse Plans'     },
    { to: '/subscription',    icon: '💳', label: 'My Subscriptions'  },
    { to: '/billing',         icon: '🧾', label: 'Billing History'   },
    { to: '/profile',         icon: '👤', label: 'My Profile'       },
    { to: '/notifications',   icon: '🔔', label: 'Notifications',
      badge: unreadCount > 0 ? unreadCount : null },
    { to: '/change-password', icon: '🔑', label: 'Change Password'  },
  ]

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

      <aside className={`user-sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <div className="sidebar-section-label">Menu</div>
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              'sidebar-item' + (isActive ? ' active' : '')
            }
          >
            <span className="sidebar-item-icon">{item.icon}</span>
            <span style={{ flex: 1 }}>{item.label}</span>

            {item.badge && (
              <span style={{
                background: 'var(--brand)',
                color: 'white',
                fontSize: '10px',
                fontWeight: '700',
                minWidth: '18px',
                height: '18px',
                borderRadius: '9px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 5px',
                marginLeft: '4px',
              }}>
                {item.badge > 99 ? '99+' : item.badge}
              </span>
            )}
          </NavLink>
        ))}
      </aside>
    </>
  )
}

export default UserSidebar
