import { useState, useEffect } from 'react'
import ProviderNavbar from '../../components/ProviderNavbar'
import ProviderSidebar from '../../components/ProviderSidebar'

import { getProviderPlanDistributionAPI,getProviderSummaryAPI, getProviderSubscriptionGrowthAPI } from '../../services/providerService' 
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts'

const PIE_COLORS = ['#0f4c3a', '#1d9e75', '#6ee7b7', '#f59e0b', '#ef4444']

function ProviderDashboard() {
  const [summary, setSummary]               = useState(null)
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [fromDate, setFromDate]             = useState('')
  const [toDate, setToDate]                 = useState('')
  const [dateError, setDateError]           = useState('')
  const [growthData, setGrowthData]         = useState([])
  const [distributionData, setDistribution] = useState([])

  const fetchDashboard = async (from = '', to = '') => {
    setLoading(true)
    setError('')
    try {
      const [summaryData, growthRes, distRes] = await Promise.all([
        getProviderSummaryAPI(from, to),
        getProviderSubscriptionGrowthAPI(),
        getProviderPlanDistributionAPI(),
      ])
      setSummary(summaryData)
      setGrowthData(growthRes)
      setDistribution(
        distRes.map(d => ({ name: d.planName, value: d.count, percentage: d.percentage }))
      )
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDashboard() }, [])

  const handleFilter = () => {
    setDateError('')
    if (fromDate && toDate && fromDate > toDate) {
      setDateError('"From" date cannot be after "To" date.')
      return
    }
    fetchDashboard(fromDate, toDate)
  }

  const handleClear = () => {
    setFromDate('')
    setToDate('')
    setDateError('')
    fetchDashboard()
  }

  const kpiCards = summary ? [
    {
      icon: '💳', label: 'Active Subscriptions',
      value: summary.totalActiveSubscriptions ?? '—',
      sub: `+${summary.newSubscriptionsThisMonth ?? 0} this month`,
      color: 'var(--brand)',
    },
    {
      icon: '💰', label: 'Monthly Revenue (MRR)',
      value: summary.monthlyRecurringRevenue != null
        ? `₹${Number(summary.monthlyRecurringRevenue).toLocaleString('en-IN')}`
        : '—',
      sub: 'Recurring revenue',
      color: '#10b981',
    },
    {
      icon: '🔔', label: 'Renewals (Next 30 Days)',
      value: summary.upcomingRenewalsNext30Days ?? '—',
      sub: 'Action needed',
      color: '#f59e0b',
    },
    {
      icon: '📉', label: 'Churn Rate',
      value: summary.churnRate != null ? `${summary.churnRate}%` : '—',
      sub: 'Current period',
      color: '#ef4444',
    },
    {
      icon: '🆕', label: 'New This Month',
      value: summary.newSubscriptionsThisMonth ?? '—',
      sub: 'New subscriptions',
      color: '#8b5cf6',
    },
  ] : []

  return (
    <div>
      <ProviderNavbar />
      <div className="admin-shell">
        <ProviderSidebar />
        <main className="admin-content">

          {/* Page header */}
          <div className="admin-page-header">
            <h1 className="admin-page-title">Analytics Dashboard</h1>
            <p className="admin-page-subtitle">
              Track your subscriptions, revenue, and growth trends.
            </p>
          </div>

          {/* ── Date range filter ── */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            border: '1px solid var(--border)',
            padding: '16px 24px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '16px',
            flexWrap: 'wrap',
          }}>
            {/* From date */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{
                fontSize: '12px', fontWeight: '600',
                color: 'var(--text-light)', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: '6px',
              }}>
                From date
              </div>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setDateError('') }}
                style={{
                  padding: '9px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--text-dark)',
                  background: 'var(--bg)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* To date */}
            <div style={{ flex: '0 0 auto' }}>
              <div style={{
                fontSize: '12px', fontWeight: '600',
                color: 'var(--text-light)', textTransform: 'uppercase',
                letterSpacing: '0.06em', marginBottom: '6px',
              }}>
                To date
              </div>
              <input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setDateError('') }}
                style={{
                  padding: '9px 14px',
                  border: '1.5px solid var(--border)',
                  borderRadius: '8px',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                  color: 'var(--text-dark)',
                  background: 'var(--bg)',
                  outline: 'none',
                  cursor: 'pointer',
                }}
                onFocus={e => (e.target.style.borderColor = 'var(--brand)')}
                onBlur={e => (e.target.style.borderColor = 'var(--border)')}
              />
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className="btn-admin-primary"
                onClick={handleFilter}
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                {loading ? 'Loading...' : 'Apply filter'}
              </button>
              {(fromDate || toDate) && (
                <button className="btn-modal-cancel" onClick={handleClear} disabled={loading}>
                  Clear
                </button>
              )}
            </div>

            {/* Active filter badge */}
            {(fromDate || toDate) && !loading && (
              <div style={{
                background: 'var(--brand-light)', color: 'var(--brand)',
                fontSize: '12px', fontWeight: '600',
                padding: '6px 12px', borderRadius: '20px',
                border: '1px solid var(--brand-muted)',
              }}>
                📅 Showing: {fromDate || 'start'} → {toDate || 'today'}
              </div>
            )}

            {dateError && (
              <div style={{
                width: '100%',
                background: '#fef2f2', border: '1px solid #fecaca',
                borderRadius: '8px', padding: '8px 14px',
                fontSize: '13px', color: 'var(--error)',
              }}>
                {dateError}
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="smp-error-msg" style={{ marginBottom: '20px' }}>{error}</div>
          )}

          {/* KPI cards */}
          {loading ? (
            <div style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid var(--border)',
              padding: '40px', textAlign: 'center',
              color: 'var(--text-light)', fontSize: '14px',
              marginBottom: '24px',
            }}>
              Loading dashboard...
            </div>
          ) : (
            <div className="kpi-grid" style={{ marginBottom: '28px' }}>
              {kpiCards.map(k => (
                <div className="kpi-card" key={k.label}>
                  <div className="kpi-card-icon">{k.icon}</div>
                  <div className="kpi-card-label">{k.label}</div>
                  <div className="kpi-card-value" style={{ color: k.color }}>{k.value}</div>
                  <div className="kpi-card-sub">{k.sub}</div>
                </div>
              ))}
            </div>
          )}

          {/* Charts */}
          <div className="charts-grid" style={{ marginBottom: '28px' }}>

            {/* Subscription growth */}
            <div className="chart-card">
              <h3 style={{
                fontFamily: "'Sora', sans-serif", fontSize: '15px',
                fontWeight: '600', marginBottom: '20px', color: 'var(--text-dark)',
              }}>
                Subscription growth
              </h3>
              {growthData.length === 0 ? (
                <div style={{
                  height: 220, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--text-light)', fontSize: '14px',
                }}>
                  No growth data available yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={growthData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={v => [v, 'Subscriptions']} />
                    <Line
                      type="monotone" dataKey="count"
                      stroke="var(--brand)" strokeWidth={2.5}
                      dot={{ fill: 'var(--brand)', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Plan distribution */}
            <div className="chart-card">
              <h3 style={{
                fontFamily: "'Sora', sans-serif", fontSize: '15px',
                fontWeight: '600', marginBottom: '20px', color: 'var(--text-dark)',
              }}>
                Plan distribution
              </h3>
              {distributionData.length === 0 ? (
                <div style={{
                  height: 220, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: 'var(--text-light)', fontSize: '14px',
                }}>
                  No subscriptions yet
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%" cy="45%"
                      innerRadius={60} outerRadius={90}
                      paddingAngle={3} dataKey="value"
                    >
                      {distributionData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => {
                        const item = distributionData.find(d => d.name === name)
                        return [`${value} subscribers (${item?.percentage ?? 0}%)`, name]
                      }}
                    />
                    <Legend
                      layout="horizontal" verticalAlign="bottom"
                      align="center" iconType="circle" iconSize={8}
                      formatter={value => {
                        const item = distributionData.find(d => d.name === value)
                        return (
                          <span style={{ fontSize: '12px', color: 'var(--text-mid)' }}>
                            {value}{' '}
                            <span style={{ fontWeight: 700, color: 'var(--text-dark)' }}>
                              {item?.percentage ?? 0}%
                            </span>
                          </span>
                        )
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </main>
      </div>
    </div>
  )
}

export default ProviderDashboard