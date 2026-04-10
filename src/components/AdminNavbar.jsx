import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { useSidebar } from '../context/SidebarContext'

function AdminNavbar() {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { toggle } = useSidebar()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <nav className="admin-navbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Hamburger — mobile only */}
        <button
          className="navbar-hamburger"
          onClick={toggle}
          aria-label="Toggle navigation"
        >
          <span /><span /><span />
        </button>

        <div className="admin-navbar-brand">
          Sub<span>Manage</span>
        </div>
      </div>

      <div className="admin-navbar-right">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          style={{
            background: 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: '8px',
            padding: '6px 10px',
            cursor: 'pointer',
            fontSize: '16px',
            lineHeight: 1,
          }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
        <span className="admin-navbar-user admin-navbar-user--name">
          👤 <strong>{user?.name || 'Admin'}</strong>
        </span>
        <button className="admin-logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  )
}

export default AdminNavbar
