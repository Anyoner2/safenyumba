import { useEffect, useState } from 'react'
import { Building2, CircleDollarSign, Home, Percent, Wallet } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { getEstateDashboard } from '../api.js'
import { useAuth } from '../auth.jsx'

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })

function EstateDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getEstateDashboard()
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
  if (user.role !== 'estate_manager') return <Navigate to="/dashboard/" replace />

  const summary = dashboard?.summary
  const metrics = [
    { label: 'Estate properties', value: summary?.properties || 0, Icon: Building2 },
    { label: 'Available listings', value: summary?.availableProperties || 0, Icon: Home },
    { label: 'Tracked occupancy', value: `${summary?.occupancyRate || 0}%`, Icon: Percent },
    { label: 'Rent received', value: currency.format(summary?.received || 0), Icon: CircleDollarSign },
    { label: 'Rent outstanding', value: currency.format(summary?.outstanding || 0), Icon: Wallet },
  ]

  return (
    <section className="dashboard-page">
      <div className="container">
        <header className="listing-header">
          <div>
            <span className="eyebrow">Estate management</span>
            <h1 className="page-title">{dashboard?.estate?.name || 'Estate dashboard'}</h1>
            <p>{dashboard ? `${dashboard.estate.area} · Portfolio overview for your assigned estate.` : 'Review properties, occupancy, and rent collection across your estate.'}</p>
          </div>
        </header>

        {loading && <p className="empty-state" role="status">Loading estate dashboard...</p>}
        {error && <p className="form-message" role="alert">{error}</p>}
        <div className="dashboard-metrics estate-dashboard-metrics">
          {metrics.map(({ label, value, Icon }) => (
            <article className="dashboard-metric" key={label}>
              <div className="dashboard-metric-icon"><Icon size={19} aria-hidden="true" /></div>
              <span>{label}</span>
              <strong>{value}</strong>
            </article>
          ))}
        </div>

        {dashboard && (
          <>
            <p className="dashboard-note">
              Occupancy is an estimate based on unique units with current-month rent records and verified vacant listings. Only rent entries linked to this estate are included.
            </p>
            <section className="dashboard-panel" aria-labelledby="estate-properties-title">
              <div className="dashboard-panel-heading">
                <div>
                  <h2 id="estate-properties-title">Estate properties</h2>
                  <p>{dashboard.properties.length} listed {dashboard.properties.length === 1 ? 'property' : 'properties'}</p>
                </div>
              </div>
              {dashboard.properties.length ? (
                <div className="estate-dashboard-properties">
                  {dashboard.properties.map((property) => (
                    <article className="estate-dashboard-property" key={property.id}>
                      <div>
                        <h3>{property.title}</h3>
                        <p>{property.location}, {property.city} · {property.bedrooms} bedrooms · {property.kind}</p>
                      </div>
                      <strong>{currency.format(property.rent)}<span> / month</span></strong>
                      <span className={`rent-status ${property.vacant ? 'rent-status-due' : 'rent-status-paid'}`}>
                        {property.vacant ? 'Available' : 'Occupied'}
                      </span>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No listed properties are available for this estate yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  )
}

export default EstateDashboard
