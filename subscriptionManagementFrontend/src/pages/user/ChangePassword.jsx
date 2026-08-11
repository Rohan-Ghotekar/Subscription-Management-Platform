import { useState } from 'react'
import UserNavbar from '../../components/UserNavbar'
import UserSidebar from '../../components/UserSidebar'
import { changePasswordAPI } from '../../services/authService'

function ChangePassword() {
  const [oldPassword, setOldPassword]     = useState('')
  const [newPassword, setNewPassword]     = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showOld, setShowOld]         = useState(false)
  const [showNew, setShowNew]         = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [error, setError]     = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  // ── Password strength ───────────────────────────────────────
  const getStrength = (pwd) => {
    if (!pwd)          return { label: '',       color: 'transparent', width: '0%',   score: 0 }
    if (pwd.length < 6) return { label: 'Weak',  color: '#ef4444',     width: '25%',  score: 1 }
    if (pwd.length < 8) return { label: 'Fair',  color: '#f59e0b',     width: '50%',  score: 2 }
    if (pwd.length < 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd))
                        return { label: 'Good',  color: '#3b82f6',     width: '75%',  score: 3 }
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd) && /[^A-Za-z0-9]/.test(pwd))
                        return { label: 'Strong', color: '#10b981',    width: '100%', score: 4 }
    return               { label: 'Fair',  color: '#f59e0b',     width: '50%',  score: 2 }
  }

  const strength = getStrength(newPassword)

  // ── Validation ──────────────────────────────────────────────
  const validate = () => {
    if (!oldPassword) {
      setError('Please enter your current password.')
      return false
    }
    if (!newPassword) {
      setError('Please enter a new password.')
      return false
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character."
      );
      return false;
    }
    
    if (newPassword === oldPassword) {
      setError('New password must be different from your current password.')
      return false
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.')
      return false
    }
    return true
  }

  // ── Submit ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!validate()) return

    setLoading(true)
    try {
      const data = await changePasswordAPI(oldPassword, newPassword)
      const msg = data?.message || 'Password changed successfully!'
      const isOldPasswordError = /incorrect|invalid|wrong/i.test(msg) && /old|current/i.test(msg)

      if (isOldPasswordError) {
        setError(msg)
        setSuccess('')
        return
      }

      setSuccess(msg)
      // Clear all fields after success
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        'Failed to change password. Please check your current password.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  // ── Eye toggle button ────────────────────────────────────────
  const EyeBtn = ({ show, toggle }) => (
    <button
      type="button"
      onClick={toggle}
      style={{
        position: 'absolute', right: '12px', top: '50%',
        transform: 'translateY(-50%)',
        background: 'none', border: 'none',
        cursor: 'pointer', color: 'var(--text-light)',
        fontSize: '16px', padding: 0, lineHeight: 1,
      }}
    >
      {show ? (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
) : (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
)}
    </button>
  )

  return (
    <div>
      <UserNavbar />
      <div className="user-shell">
        <UserSidebar />
        <main className="user-content change-password-page">

          <div className="admin-page-header">
            <h1 className="admin-page-title">Change password</h1>
            <p className="admin-page-subtitle">
              Update your password regularly to keep your account secure.
            </p>
          </div>

          <div className="change-password-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '24px',
            alignItems: 'start',
          }}>

            {/* ── Left: Form ── */}
            <div className="change-password-form-card" style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '32px',
            }}>
              {error && (
                <div className="smp-error-msg" style={{ marginBottom: '20px' }}>
                  {error}
                </div>
              )}
              {success && (
                <div className="smp-success-msg" style={{ marginBottom: '20px' }}>
                  ✓ {success}
                </div>
              )}

              <form onSubmit={handleSubmit}>

                {/* Current password */}
                <div className="profile-field" style={{ marginBottom: '20px' }}>
                  <label>Current password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showOld ? 'text' : 'password'}
                      placeholder="Enter your current password"
                      value={oldPassword}
                      onChange={e => { setOldPassword(e.target.value); setError('') }}
                      style={{ paddingRight: '44px' }}
                    />
                    <EyeBtn show={showOld} toggle={() => setShowOld(p => !p)} />
                  </div>
                </div>

                {/* Divider */}
                <div style={{
                  borderTop: '1px solid var(--border)',
                  margin: '24px 0',
                }}/>

                {/* New password */}
                <div className="profile-field" style={{ marginBottom: '8px' }}>
                  <label>New password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNew ? 'text' : 'password'}
                      placeholder="Min. 8 characters"
                      value={newPassword}
                      onChange={e => { setNewPassword(e.target.value); setError('') }}
                      style={{
                        paddingRight: '44px',
                        borderColor: newPassword
                          ? strength.color
                          : undefined,
                      }}
                    />
                    <EyeBtn show={showNew} toggle={() => setShowNew(p => !p)} />
                  </div>

                  {/* Strength bar */}
                  {newPassword && (
                    <div style={{ marginTop: '10px' }}>
                      <div style={{
                        height: '5px', borderRadius: '3px',
                        background: 'var(--border)', overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: '3px',
                          width: strength.width,
                          background: strength.color,
                          transition: 'width 0.3s, background 0.3s',
                        }} />
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: '6px',
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: '600',
                          color: strength.color,
                        }}>
                          {strength.label}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                          {newPassword.length} characters
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Confirm new password */}
                <div className="profile-field" style={{ marginBottom: '28px', marginTop: '20px' }}>
                  <label>Confirm new password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your new password"
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setError('') }}
                      style={{
                        paddingRight: '44px',
                        borderColor: confirmPassword
                          ? confirmPassword === newPassword
                            ? '#10b981'
                            : '#ef4444'
                          : undefined,
                      }}
                    />
                    <EyeBtn show={showConfirm} toggle={() => setShowConfirm(p => !p)} />
                  </div>

                  {/* Match indicator */}
                  {confirmPassword && (
                    <p style={{
                      fontSize: '12px', marginTop: '6px',
                      color: confirmPassword === newPassword
                        ? '#10b981' : '#ef4444',
                      fontWeight: '500',
                    }}>
                      {confirmPassword === newPassword
                        ? '✓ Passwords match'
                        : '✗ Passwords do not match'}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="btn-profile-save"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '13px',
                    fontSize: '15px',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? 'Updating password...' : 'Update password'}
                </button>

              </form>
            </div>

            {/* ── Right: Tips card ── */}
            <div className="change-password-tips-card" style={{
              background: 'white',
              borderRadius: '16px',
              border: '1px solid var(--border)',
              padding: '32px',
            }}>
              <h3 style={{
                fontFamily: "'Sora', sans-serif",
                fontSize: '16px', fontWeight: '600',
                color: 'var(--text-dark)', marginBottom: '20px',
              }}>
                Password requirements
              </h3>

              {[
                { rule: 'At least 8 characters',              met: newPassword.length >= 8 },
                { rule: 'At least one uppercase letter (A-Z)', met: /[A-Z]/.test(newPassword) },
                { rule: 'At least one number (0-9)',           met: /[0-9]/.test(newPassword) },
                { rule: 'At least one special character',      met: /[^A-Za-z0-9]/.test(newPassword) },
                { rule: 'Different from current password',     met: newPassword.length > 0 && newPassword !== oldPassword },
              ].map((item, i) => (
                <div className="change-password-rule-row" key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 0',
                  borderBottom: i < 4 ? '1px solid var(--border)' : 'none',
                }}>
                  <div style={{
                    width: '20px', height: '20px', borderRadius: '50%',
                    flexShrink: 0, display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: item.met ? '#dcfce7' : '#f1f5f9',
                    color:      item.met ? '#16a34a' : 'var(--text-light)',
                    fontSize: '11px', fontWeight: '700',
                    transition: 'all 0.2s',
                  }}>
                    {item.met ? '✓' : '○'}
                  </div>
                  <span className="change-password-rule-text" style={{
                    fontSize: '13px',
                    color: item.met ? '#16a34a' : 'var(--text-mid)',
                    fontWeight: item.met ? '500' : '400',
                    transition: 'color 0.2s',
                  }}>
                    {item.rule}
                  </span>
                </div>
              ))}

              {/* Security tip */}
              <div style={{
                marginTop: '24px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '10px',
                padding: '14px 16px',
              }}>
                <div style={{
                  fontSize: '13px', fontWeight: '600',
                  color: '#1e40af', marginBottom: '6px',
                }}>
                  🔒 Security tip
                </div>
                <div style={{ fontSize: '12px', color: '#3b82f6', lineHeight: '1.6' }}>
                  Use a unique password you don't use on any other site.
                  Consider using a password manager to generate and store
                  strong passwords safely.
                </div>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default ChangePassword