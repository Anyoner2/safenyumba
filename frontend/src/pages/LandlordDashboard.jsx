import { useEffect, useState } from 'react'
import { ArrowRight, CircleDollarSign, Clock3, Home, Wallet } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { getLandlordDashboard } from '../api.js'

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })

function today() {
  return new Date().toISOString().slice(0, 10)
}

function LandlordDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todayDate] = useState(today)

  useEffect(() => {
    let active = true
    getLandlordDashboard()
      .then((result) => {
        if (active) setDashboard(result)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  if (!user) return <Navigate to="/login/" replace state={{ from: location.pathname }} />
  if (user.role === 'estate_manager') return <Navigate to="/estate-dashboard/" replace />

  const summary = dashboard?.summary
  const metrics = [
    { label: 'Outstanding rent', value: currency.format(summary?.outstanding || 0), Icon: Wallet },
    { label: 'Overdue rent', value: currency.format(summary?.overdue || 0), Icon: Clock3 },
    { label: 'Received', value: currency.format(summary?.received || 0), Icon: CircleDollarSign },
    { label: 'Units tracked this month', value: summary?.trackedUnits || 0, Icon: Home },
  ]

  return (
    <section className="dashboard-page">
      <div className="container">
        <header className="listing-header">
          <div>
            <span className="eyebrow">Landlord workspace</span>
            <h1 className="page-title">Your dashboard</h1>
            <p>See how rent is tracking across the units you manage.</p>
          </div>
          <div className="dashboard-header-actions">
            <Link className="button button-light" to="/tenancy-documents/">Prepare tenancy document</Link>
            <Link className="button" to="/rent-payments/">Manage rent <ArrowRight size={16} /></Link>
          </div>
        </header>

        {loading && <p className="empty-state" role="status">Loading your dashboard...</p>}
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="dashboard-metrics">
          {metrics.map(({ label, value, Icon }) => (
            <article className="dashboard-metric" key={label}>
              <div className="dashboard-metric-icon"><Icon size={19} aria-hidden="true" /></div>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        <section className="dashboard-panel" aria-labelledby="landlord-recent-title">
          <div className="dashboard-panel-heading">
            <div>
              <h2 id="landlord-recent-title">Recent rent records</h2>
              <p>{summary?.rentRecords || 0} records in your ledger</p>
            </div>
            <Link className="text-link" to="/rent-payments/">Open rent ledger <ArrowRight size={16} /></Link>
          </div>
          {dashboard?.recentPayments?.length ? (
            <div className="dashboard-record-list">
              {dashboard.recentPayments.map((payment) => (
                <article className="dashboard-record" key={payment.id}>
                  <div>
                    <strong>{payment.tenant_name}</strong>
                    <span>{payment.unit_name}{payment.estate_slug ? ` · ${payment.estate_slug}` : ''}</span>
                  </div>
                  <span>{payment.period}</span>
                  <strong>{currency.format(payment.amount)}</strong>
                  <span className={`rent-status ${payment.paid_at ? 'rent-status-paid' : payment.due_date < todayDate ? 'rent-status-overdue' : 'rent-status-due'}`}>
                    {payment.paid_at ? 'Paid' : payment.due_date < todayDate ? 'Overdue' : 'Due'}
                  </span>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">{loading ? 'Loading rent records...' : 'No rent records yet. Add a rent record to start tracking collections.'}</p>
          )}
        </section>
      </div>
    </section>
  )
}

export default LandlordDashboard
