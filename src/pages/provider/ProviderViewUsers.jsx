import { useState, useEffect } from 'react'
import ProviderNavbar from '../../components/ProviderNavbar'
import ProviderSidebar from '../../components/ProviderSidebar'
import { getProviderUsersAPI } from '../../services/authService'
import { getProviderUserActivePlanAPI } from '../../services/providerService'

const USERS_PER_PAGE = 6

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)

const roleBadgeStyle = (role = '') => {
  switch (role.toUpperCase()) {
    case 'ADMIN':    return { bg: '#fce7f3', color: '#9d174d' }
    case 'PROVIDER': return { bg: 'var(--brand-light)', color: 'var(--brand)' }
    default:         return { bg: '#e0e7ff', color: '#3730a3' }
  }
}

// ── Subscription detail modal ─────────────────────────────────
function SubscriptionModal({ user, onClose }) {
  const [sub, setSub]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const fetchSub = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getProviderUserActivePlanAPI(user.userId)
        setSub(data)
      } catch (err) {
        if (err.response?.status === 404) {
          setSub(null)
        } else {
          setError(err.response?.data?.message || 'Failed to load subscription details.')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchSub()
  }, [user])

  const displayBilling = (val = '') =>
    val.charAt(0) + val.slice(1).toLowerCase()

  return (
    <div className="modal-overlay subscription-detail-overlay" onClick={onClose}>
      <div className="modal-box subscription-detail-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <h3 className="modal-title" style={{ marginBottom: '2px', fontSize: '18px' }}>Subscription details</h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {user.fullName} · {user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-light)', lineHeight: 1 }}
          >
            ✕
          </button>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '13px' }}>
            Loading subscription...
          </div>
        )}

        {/* Error */}
        {!loading && error && <div className="smp-error-msg">{error}</div>}

        {/* No subscription */}
        {!loading && !error && !sub && (
          <div style={{ textAlign: 'center', padding: '24px 14px', background: 'var(--bg-subtle)', borderRadius: '12px' }}>
            <div style={{ fontSize: '28px', marginBottom: '8px' }}>📭</div>
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '4px' }}>
              No active subscription
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              This user has not subscribed to any plan yet.
            </div>
          </div>
        )}

        {/* Subscription details */}
        {!loading && !error && sub && (
          <>
            {/* Plan banner */}
            <div className="subscription-plan-banner" style={{
              background: sub.tier === 'ENTERPRISE'
                ? 'linear-gradient(135deg, #0a2e22, #0f4c3a)'
                : sub.tier === 'PRO'
                  ? 'linear-gradient(135deg, #0f4c3a, #1d9e75)'
                  : 'linear-gradient(135deg, #1d9e75, #6ee7b7)',
              borderRadius: '12px', padding: '14px 16px', marginBottom: '12px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontSize: '10px', fontWeight: '700', color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
                  Active plan
                </div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '19px', fontWeight: '700', color: 'white' }}>
                  {sub.planName}
                </div>
                {sub.planDescription && (
                  <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', marginTop: '2px' }}>
                    {sub.planDescription}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: '700', color: '#6ee7b7' }}>
                  ₹{sub.Price}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                  /{displayBilling(sub.billing)}
                </div>
              </div>
            </div>

            {/* Detail grid */}
            <div className="subscription-detail-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
              {[
                { label: 'Status', value: sub.status, valueStyle: { color: sub.status === 'ACTIVE' ? 'var(--success)' : 'var(--error)' } },
                { label: 'Tier',   value: sub.tier },
                { label: 'Billing cycle', value: displayBilling(sub.billing) },
                { label: 'Auto renew',   value: sub.autoRenew ? '✓ Enabled' : '✗ Disabled',
                  valueStyle: { color: sub.autoRenew ? 'var(--success)' : 'var(--text-muted)' } },
                { label: 'Start date',   value: sub.startDate  || '—' },
                { label: 'Renewal date', value: sub.endDate    || '—' },
                { label: 'Days remaining', value: sub.daysRemaining != null ? `${sub.daysRemaining} days` : '—',
                  valueStyle: { color: sub.daysRemaining <= 7 ? 'var(--error)' : sub.daysRemaining <= 30 ? 'var(--warning)' : 'var(--text-dark)' } },
              ].map(item => (
                <div className="subscription-detail-item" key={item.label} style={{ background: 'var(--bg-subtle)', borderRadius: '10px', padding: '10px 12px', border: '1px solid var(--border)' }}>
                  <div className="subscription-detail-item-label" style={{ fontSize: '10px', fontWeight: '700', color: 'var(--text-light)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                    {item.label}
                  </div>
                  <div className="subscription-detail-item-value" style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-dark)', ...item.valueStyle }}>
                    {item.value}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn-modal-cancel" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
// PROVIDER VIEW USERS PAGE
// ══════════════════════════════════════════════════════════════
function ProviderViewUsers() {
  const [users, setUsers]           = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [search, setSearch]         = useState('')
  const [roleFilter] = useState('ALL')
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentPage, setCurrentPage]   = useState(1)

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true)
      try {
        const data = await getProviderUsersAPI()
        setUsers(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load users. Please try again.')
      } finally {
        setLoading(false)
      }
    }
    fetchUsers()
  }, [])

  // Reset to page 1 when search or filter changes
  useEffect(() => { setCurrentPage(1) }, [search, roleFilter])

  // ── Filtering ──────────────────────────────────────────────
  const filtered = users.filter(u => {
    const matchSearch =
      u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'ALL' || u.role?.toUpperCase() === roleFilter
    return matchSearch && matchRole
  })

  const totalPages = Math.max(1, Math.ceil(filtered.length / USERS_PER_PAGE))
  const safePage   = Math.min(currentPage, totalPages)
  const startIndex = (safePage - 1) * USERS_PER_PAGE
  const pageUsers  = filtered.slice(startIndex, startIndex + USERS_PER_PAGE)

  const totalUsers    = users.length

  // ── Page number builder ────────────────────────────────────
  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1)
    const pages = []
    if (safePage <= 4) {
      pages.push(1, 2, 3, 4, 5, '...', totalPages)
    } else if (safePage >= totalPages - 3) {
      pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
    } else {
      pages.push(1, '...', safePage - 1, safePage, safePage + 1, '...', totalPages)
    }
    return pages
  }

  return (
    <div>
      <ProviderNavbar />
      <div className="admin-shell provider-view-users-shell">
        <ProviderSidebar />
        <main className="admin-content provider-view-users-page" style={{ padding: '16px 28px' }}>

          {/* ── Header row: title + stat pills + search + filter ── */}
          <div className="provider-view-users-toolbar" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>

            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700, color: 'var(--text-dark)', margin: 0, marginRight: '4px' }}>
              Users
            </h1>

            {/* Stat pills */}
            {[
              { icon: '👥', label: 'Total',    value: loading ? '…' : totalUsers,    color: 'var(--brand)' },
              
            ].map(k => (
              <div key={k.label} style={{
                display: 'flex', alignItems: 'center', gap: '5px',
                background: 'white', border: '1.5px solid var(--border)',
                borderRadius: '20px', padding: '3px 11px',
                fontSize: '12px', fontWeight: '600', whiteSpace: 'nowrap',
              }}>
                <span>{k.icon}</span>
                <span style={{ color: 'var(--text-muted)' }}>{k.label}:</span>
                <span style={{ color: k.color }}>{k.value}</span>
              </div>
            ))}

            {/* Search */}
            <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--text-light)' }}>
                🔍
              </span>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%', padding: '7px 12px 7px 30px',
                  border: '1.5px solid var(--border)', borderRadius: '8px',
                  fontFamily: 'var(--font-body)', fontSize: '13px',
                  color: 'var(--text-dark)', background: 'white', outline: 'none',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e  => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            
          </div>

          {error && <div className="smp-error-msg" style={{ marginBottom: '10px' }}>{error}</div>}

          {/* ── Table card ── */}
          <div className="data-table-card provider-view-users-table-card">
            <div className="data-table-header" style={{ padding: '10px 18px' }}>
              <h3 style={{ fontSize: '13px' }}>
                {filtered.length} user{filtered.length !== 1 ? 's' : ''}
                {search || roleFilter !== 'ALL' ? ' (filtered)' : ''}
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--text-light)' }}>
                {loading
                  ? 'Loading...'
                  : filtered.length > 0
                    ? `Showing ${startIndex + 1}–${Math.min(startIndex + USERS_PER_PAGE, filtered.length)} of ${filtered.length}`
                    : `${totalUsers} total`}
              </span>
            </div>

            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
                Loading users...
              </div>
            ) : filtered.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>👤</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: '600', color: 'var(--text-dark)', marginBottom: '4px' }}>
                  {search ? 'No users match your search' : 'No users found'}
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-mid)' }}>
                  {search ? 'Try a different name or email.' : 'No users have registered yet.'}
                </div>
              </div>
            ) : (
              <>
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>User</th>
                      <th>Email</th>
                      <th>Mobile</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th>Subscription</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageUsers.map((u, i) => {
                      const badge = roleBadgeStyle(u.role)
                      return (
                        <tr key={u.userId}>
                          <td style={{ color: 'var(--text-light)', fontWeight: '600', fontSize: '13px' }}>
                            {startIndex + i + 1}
                          </td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
                              {u.avatarUrl ? (
                                <img
                                  src={u.avatarUrl}
                                  alt={u.fullName}
                                  style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border)' }}
                                />
                              ) : (
                                <div style={{
                                  width: '30px', height: '30px', borderRadius: '50%',
                                  background: 'var(--brand-light)', display: 'flex',
                                  alignItems: 'center', justifyContent: 'center',
                                  fontFamily: 'var(--font-heading)', fontSize: '11px',
                                  fontWeight: '700', color: 'var(--brand)', flexShrink: 0,
                                }}>
                                  {getInitials(u.fullName)}
                                </div>
                              )}
                              <span style={{ fontWeight: '500', fontSize: '13px' }}>{u.fullName || '—'}</span>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-mid)', fontSize: '13px' }}>{u.email}</td>
                          <td style={{ color: 'var(--text-mid)', fontSize: '13px' }}>{u.mobile || '—'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block', padding: '3px 10px',
                              borderRadius: '20px', fontSize: '11px', fontWeight: '700',
                              background: badge.bg, color: badge.color,
                            }}>
                              {u.role?.toUpperCase() || '—'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-mid)', fontSize: '13px' }}>{formatDate(u.createdAt)}</td>
                          <td>
                            <button
                              className="btn-admin-secondary"
                              style={{ padding: '5px 11px', fontSize: '12px' }}
                              onClick={() => setSelectedUser(u)}
                            >
                              📋 View plan
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="provider-view-users-pagination" style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 16px', borderTop: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Page {safePage} of {totalPages}
                    </span>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        style={{
                          padding: '5px 10px', borderRadius: '7px',
                          border: '1.5px solid var(--border)',
                          background: safePage === 1 ? 'var(--bg-subtle)' : 'white',
                          color: safePage === 1 ? 'var(--text-light)' : 'var(--text-mid)',
                          cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '12px', fontWeight: '600',
                        }}
                      >
                        ← Prev
                      </button>

                      {getPageNumbers().map((page, idx) =>
                        page === '...' ? (
                          <span key={`e-${idx}`} style={{ padding: '4px', fontSize: '12px', color: 'var(--text-light)' }}>…</span>
                        ) : (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            style={{
                              width: '30px', height: '30px', borderRadius: '7px',
                              border: safePage === page ? 'none' : '1.5px solid var(--border)',
                              background: safePage === page ? 'var(--brand)' : 'white',
                              color: safePage === page ? 'white' : 'var(--text-mid)',
                              cursor: 'pointer', fontSize: '12px', fontWeight: '600',
                            }}
                          >
                            {page}
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        style={{
                          padding: '5px 10px', borderRadius: '7px',
                          border: '1.5px solid var(--border)',
                          background: safePage === totalPages ? 'var(--bg-subtle)' : 'white',
                          color: safePage === totalPages ? 'var(--text-light)' : 'var(--text-mid)',
                          cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                          fontSize: '12px', fontWeight: '600',
                        }}
                      >
                        Next →
                      </button>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {USERS_PER_PAGE} per page
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

        </main>
      </div>

      {/* Subscription modal */}
      {selectedUser && (
        <SubscriptionModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}
    </div>
  )
}

export default ProviderViewUsers