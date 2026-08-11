import { useState, useEffect } from 'react'
import UserNavbar from '../../components/UserNavbar'
import UserSidebar from '../../components/UserSidebar'
import { getPaymentHistoryAPI } from '../../services/paymentService'

const formatDate = (iso) => {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

const statusStyle = (status) => {
  switch (status) {
    case 'SUCCESS':  return { bg: 'var(--success-bg)',  color: '#065f46', border: 'var(--success-border)' }
    case 'PENDING':  return { bg: 'var(--warning-bg)',  color: '#92400e', border: 'var(--warning-border)' }
    case 'FAILED':   return { bg: 'var(--error-bg)',    color: '#991b1b', border: 'var(--error-border)'   }
    case 'REFUNDED': return { bg: 'var(--info-bg)',     color: '#1e40af', border: 'var(--info-border)'    }
    default:         return { bg: 'var(--bg-subtle)',   color: 'var(--text-muted)', border: 'var(--border)' }
  }
}

function BillingHistory() {
  const TX_PER_PAGE = 3
  const [history, setHistory]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetch = async () => {
      setLoading(true)
      try {
        const data = await getPaymentHistoryAPI()
        setHistory(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load billing history.')
      } finally {
        setLoading(false)
      }
    }
    fetch()
  }, [])

  const totalPaid = history
    .filter(h => h.status === 'SUCCESS')
    .reduce((sum, h) => sum + Number(h.amount), 0)

  const totalPages = Math.max(1, Math.ceil(history.length / TX_PER_PAGE))
  const safePage = Math.min(currentPage, totalPages)
  const pagedHistory = history.slice(
    (safePage - 1) * TX_PER_PAGE,
    safePage * TX_PER_PAGE
  )

  useEffect(() => {
    setCurrentPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const getPageNumbers = () => {
    const pages = []
    for (let p = 1; p <= totalPages; p += 1) {
      const isEdge = p === 1 || p === totalPages
      const isNear = Math.abs(p - safePage) <= 1
      if (isEdge || isNear) {
        pages.push(p)
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...')
      }
    }
    return pages
  }

  return (
    <div>
      <UserNavbar />
      <div className="user-shell billing-history-shell">
        <UserSidebar />
        <main className="user-content billing-history-page">

          <div className="admin-page-header">
            <h1 className="admin-page-title">Billing history</h1>
            <p className="admin-page-subtitle">
              All your payment transactions on SubManage.
            </p>
          </div>

          {/* Summary cards */}
          {!loading && !error && (
            <div
              className="billing-summary-grid"
              style={{
              display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px', marginBottom: '24px',
            }}>
              {[
                {
                  icon: '💳', label: 'Transactions',
                  value: history.length, color: 'var(--brand)',
                },
                {
                  icon: '✅', label: 'Successful',
                  value: history.filter(h => h.status === 'SUCCESS').length,
                  color: 'var(--success)',
                },
                {
                  icon: '💰', label: 'Total paid',
                  value: `₹${totalPaid.toFixed(2)}`,
                  color: 'var(--brand)',
                },
              ].map(k => (
                <div className="kpi-card billing-kpi-card" key={k.label}>
                  <div className="kpi-card-icon">{k.icon}</div>
                  <div className="kpi-card-label">{k.label}</div>
                  <div className="kpi-card-value" style={{ color: k.color }}>
                    {k.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="smp-error-msg" style={{ marginBottom: '16px' }}>
              {error}
            </div>
          )}

          {/* Table */}
          <div className="data-table-card billing-history-table-card">
            <div className="data-table-header">
              <h3>Transactions</h3>
              <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                {loading ? 'Loading...' : `${history.length} total`}
              </span>
            </div>

            {loading ? (
              <div style={{
                padding: '60px', textAlign: 'center',
                color: 'var(--text-muted)', fontSize: '14px',
              }}>
                Loading billing history...
              </div>
            ) : history.length === 0 ? (
              <div style={{ padding: '60px', textAlign: 'center' }}>
                <div style={{ fontSize: '40px', marginBottom: '12px' }}>💳</div>
                <div style={{
                  fontFamily: 'var(--font-heading)', fontSize: '16px',
                  fontWeight: '600', color: 'var(--text-dark)', marginBottom: '6px',
                }}>
                  No transactions yet
                </div>
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  Your payment history will appear here after your first subscription.
                </div>
              </div>
            ) : (
              <>
                <table className="billing-history-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Currency</th>
                    <th>Status</th>
                    <th>Date</th>
                   
                  </tr>
                </thead>
                <tbody>
                  {pagedHistory.map((tx, i) => {
                    const s = statusStyle(tx.status)
                    return (
                      <tr key={tx.id}>
                        <td style={{ color: 'var(--text-light)', fontWeight: '600' }}>
                          {(safePage - 1) * TX_PER_PAGE + i + 1}
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: 'var(--text-dark)' }}>
                            {tx.planName || '—'}
                          </div>
                          <div className="billing-plan-id" style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            ID: {tx.planId}
                          </div>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--brand)' }}>
                          ₹{Number(tx.amount).toFixed(2)}
                        </td>
                        <td style={{ color: 'var(--text-muted)' }}>
                          {tx.currency}
                        </td>
                        <td>
                          <span style={{
                            display: 'inline-block',
                            background: s.bg, color: s.color,
                            border: `1px solid ${s.border}`,
                            fontSize: '11px', fontWeight: '700',
                            padding: '3px 10px', borderRadius: '20px',
                          }}>
                            {tx.status}
                          </span>
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                          {formatDate(tx.createdAt)}
                        </td>
                        
                      </tr>
                    )
                  })}
                </tbody>
                </table>

                <div className="billing-mobile-list">
                  {pagedHistory.map((tx, i) => {
                    const s = statusStyle(tx.status)
                    return (
                      <div className="billing-mobile-item" key={`m-${tx.id}`}>
                        <div className="billing-mobile-top">
                          <span className="billing-mobile-idx">
                            #{(safePage - 1) * TX_PER_PAGE + i + 1}
                          </span>
                          <span
                            style={{
                              display: 'inline-block',
                              background: s.bg,
                              color: s.color,
                              border: `1px solid ${s.border}`,
                              fontSize: '10px',
                              fontWeight: '700',
                              padding: '3px 9px',
                              borderRadius: '20px',
                            }}
                          >
                            {tx.status}
                          </span>
                        </div>

                        <div className="billing-mobile-plan">{tx.planName || '—'}</div>

                        <div className="billing-mobile-row">
                          <span>Amount</span>
                          <strong>₹{Number(tx.amount).toFixed(2)}</strong>
                        </div>
                        <div className="billing-mobile-row">
                          <span>Date</span>
                          <span>{formatDate(tx.createdAt)}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {history.length > TX_PER_PAGE && (
                  <div className="billing-history-pagination" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '10px',
                    padding: '10px 16px',
                    borderTop: '1px solid var(--border)',
                    background: 'var(--bg-subtle)',
                  }}>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Showing {(safePage - 1) * TX_PER_PAGE + 1}–{Math.min(safePage * TX_PER_PAGE, history.length)} of {history.length}
                    </span>

                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                        disabled={safePage === 1}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '7px',
                          border: '1.5px solid var(--border)',
                          background: safePage === 1 ? 'var(--bg-subtle)' : 'var(--bg-card)',
                          color: safePage === 1 ? 'var(--text-light)' : 'var(--text-mid)',
                          cursor: safePage === 1 ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        ← Prev
                      </button>

                      {getPageNumbers().map((page, idx) => (
                        page === '...'
                          ? (
                            <span key={`e-${idx}`} style={{ padding: '4px', fontSize: '12px', color: 'var(--text-light)' }}>
                              ...
                            </span>
                          )
                          : (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              style={{
                                width: '30px',
                                height: '30px',
                                borderRadius: '7px',
                                border: safePage === page ? 'none' : '1.5px solid var(--border)',
                                background: safePage === page ? 'var(--brand)' : 'var(--bg-card)',
                                color: safePage === page ? 'white' : 'var(--text-mid)',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: '600',
                                boxShadow: safePage === page ? 'var(--shadow-sm)' : 'none',
                              }}
                            >
                              {page}
                            </button>
                          )
                      ))}

                      <button
                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                        disabled={safePage === totalPages}
                        style={{
                          padding: '5px 10px',
                          borderRadius: '7px',
                          border: '1.5px solid var(--border)',
                          background: safePage === totalPages ? 'var(--bg-subtle)' : 'var(--bg-card)',
                          color: safePage === totalPages ? 'var(--text-light)' : 'var(--text-mid)',
                          cursor: safePage === totalPages ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: '600',
                        }}
                      >
                        Next →
                      </button>
                    </div>

                    <span style={{ fontSize: '11px', color: 'var(--text-light)' }}>
                      {TX_PER_PAGE} per page
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

        </main>
      </div>
    </div>
  )
}

export default BillingHistory