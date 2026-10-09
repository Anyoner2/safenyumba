import { useEffect, useState } from 'react'
import { Building2, CircleDollarSign, Home, Percent, Wallet } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { getEstateDashboard, updatePropertyVacancy } from '../api.js'
import { useAuth } from '../auth.jsx'
import PropertyMap from '../components/PropertyMap.jsx'

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })

function EstateDashboard() {
  const { user } = useAuth()
  const location = useLocation()
  const [dashboard, setDashboard] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingPropertyId, setUpdatingPropertyId] = useState('')
  const [notice, setNotice] = useState('')

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

  async function handleVacancyChange(property) {
    setError('')
    setNotice('')
    setUpdatingPropertyId(property.id)
    try {
      const result = await updatePropertyVacancy(property.id, !property.vacant)
      const refreshed = await getEstateDashboard()
      setDashboard(refreshed)
      setNotice(result.notificationsCreated
        ? `${result.notificationsCreated} saved-home alert${result.notificationsCreated === 1 ? '' : 's'} sent.`
        : `Availability updated for ${property.title}.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingPropertyId('')
    }
  }

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
        {notice && <p className="submission-success" role="status">{notice}</p>}
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
              {dashboard.properties.some((property) =>
                Number.isFinite(property.latitude) && Number.isFinite(property.longitude),
              ) && (
                <PropertyMap
                  className="estate-dashboard-map"
                  properties={dashboard.properties}
                />
              )}
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
                      <button
                        className="availability-toggle"
                        type="button"
                        disabled={updatingPropertyId === property.id}
                        onClick={() => handleVacancyChange(property)}
                      >
                        {updatingPropertyId === property.id
                          ? 'Saving...'
                          : property.vacant ? 'Mark occupied' : 'Mark available'}
                      </button>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No listed properties are available for this estate yet.</p>
              )}
            </section>
            <section className="dashboard-panel estate-inquiries-panel" aria-labelledby="estate-inquiries-title">
              <div className="dashboard-panel-heading">
                <div>
                  <h2 id="estate-inquiries-title">Viewing requests & enquiries</h2>
                  <p>Contact prospective tenants directly to confirm a viewing or answer their questions.</p>
                </div>
              </div>
              {dashboard.viewingRequests?.length ? (
                <div className="estate-inquiry-list">
                  {dashboard.viewingRequests.map((request) => (
                    <article className="estate-inquiry" key={request.id}>
                      <div className="estate-inquiry-heading">
                        <div>
                          <h3>{request.requester_name}</h3>
                          <p>{request.property_title}</p>
                        </div>
                        <span className="rent-status rent-status-due">
                          {request.request_type === 'viewing' ? 'Viewing request' : 'Contact request'}
                        </span>
                      </div>
                      <div className="estate-inquiry-contact">
                        <a href={`mailto:${request.email}`}>{request.email}</a>
                        <a href={`tel:${request.phone}`}>{request.phone}</a>
                      </div>
                      {request.preferred_date && (
                        <p className="estate-inquiry-date">
                          Preferred viewing: {new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(
                            new Date(`${String(request.preferred_date).slice(0, 10)}T00:00:00`),
                          )}
                        </p>
                      )}
                      {request.message && <p className="estate-inquiry-message">{request.message}</p>}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No viewing requests or enquiries yet.</p>
              )}
            </section>
          </>
        )}
      </div>
    </section>
  )
}

export default EstateDashboard
