import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { createMaintenanceRequest, getEstates, getMaintenanceRequests, updateMaintenanceRequestStatus } from '../api.js'
import { useAuth } from '../auth.jsx'

const statuses = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'resolved', label: 'Resolved' },
]

function MaintenanceRequests() {
  const { user } = useAuth()
  const location = useLocation()
  const isManager = user?.role === 'estate_manager'
  const [requests, setRequests] = useState([])
  const [estates, setEstates] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getMaintenanceRequests(), getEstates()])
      .then(([items, estateItems]) => {
        if (!active) return
        setRequests(items)
        setEstates(estateItems)
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

  async function handleSubmit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const created = await createMaintenanceRequest({
        estate_slug: form.get('estate_slug'),
        unit_name: form.get('unit_name'),
        title: form.get('title'),
        description: form.get('description'),
        priority: form.get('priority'),
      })
      setRequests((current) => [created, ...current])
      setNotice('Your maintenance request has been sent to the estate manager.')
      formElement.reset()
      if (isManager) formElement.elements.estate_slug.value = user.managed_estate || ''
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleStatusChange(request, status) {
    setError('')
    setNotice('')
    setUpdatingId(request.id)
    try {
      const updated = await updateMaintenanceRequestStatus(request.id, status)
      setRequests((current) => current.map((item) => item.id === updated.id ? updated : item))
      setNotice(`Request status changed to ${statuses.find((item) => item.value === status)?.label}.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <section className="rent-page service-page">
      <div className="container">
        <header className="listing-header">
          <div>
            <span className="eyebrow">{isManager ? 'Estate management' : 'Resident support'}</span>
            <h1 className="page-title">Maintenance requests</h1>
            <p>{isManager
              ? 'Review requests for your assigned estate and keep residents updated.'
              : 'Report a repair or property issue and follow its progress.'}</p>
          </div>
          <span className="result-count">{requests.length} {requests.length === 1 ? 'request' : 'requests'}</span>
        </header>

        {error && <p className="form-message" role="alert">{error}</p>}
        {notice && <p className="submission-success" role="status">{notice}</p>}

        <div className="service-content">
          <form className="rent-form" onSubmit={handleSubmit}>
            <h2>Report an issue</h2>
            <p className="submission-help">Include enough detail for the property team to understand what needs attention.</p>
            <div className="property-field-grid">
              <label className="property-field">
                <span>Estate</span>
                <select
                  name="estate_slug"
                  defaultValue={isManager ? user.managed_estate || '' : ''}
                  required
                >
                  {!isManager && <option value="">Choose an estate</option>}
                  {estates
                    .filter((estate) => !isManager || estate.slug === user.managed_estate)
                    .map((estate) => <option value={estate.slug} key={estate.slug}>{estate.name}</option>)}
                </select>
              </label>
              <label className="property-field">
                <span>Unit or property</span>
                <input name="unit_name" maxLength="120" placeholder="e.g. Block A, Unit 4" required />
              </label>
              <label className="property-field property-field-wide">
                <span>Issue</span>
                <input name="title" maxLength="120" placeholder="e.g. Leaking kitchen tap" required />
              </label>
              <label className="property-field property-field-wide">
                <span>Details</span>
                <textarea name="description" rows="5" maxLength="2000" required />
              </label>
              <label className="property-field property-field-wide">
                <span>Priority</span>
                <select name="priority" defaultValue="normal">
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
            </div>
            <button className="button rent-form-submit" type="submit" disabled={submitting}>
              {submitting ? 'Sending request...' : 'Send maintenance request'}
            </button>
          </form>

          <section className="rent-ledger" aria-labelledby="maintenance-list-title">
            <div className="rent-ledger-heading">
              <div>
                <h2 id="maintenance-list-title">{isManager ? 'Estate requests' : 'Your requests'}</h2>
                <p>{isManager ? 'Requests are visible only to your assigned estate team and their reporters.' : 'Only you and the assigned estate team can view your requests.'}</p>
              </div>
            </div>
            {loading && <p className="empty-state" role="status">Loading maintenance requests...</p>}
            {!loading && requests.length === 0 && (
              <p className="empty-state">No maintenance requests yet.</p>
            )}
            {!loading && requests.length > 0 && (
              <div className="service-list">
                {requests.map((request) => (
                  <article className="service-item" key={request.id}>
                    <div className="service-item-heading">
                      <div>
                        <h3>{request.title}</h3>
                        <p>{request.unit_name} · {request.estate_slug.replaceAll('-', ' ')}</p>
                      </div>
                      <span className={`service-priority priority-${request.priority}`}>{request.priority}</span>
                    </div>
                    <p className="service-description">{request.description}</p>
                    <div className="service-item-meta">
                      <span>{isManager ? `Reported by ${request.requester_name}` : 'Submitted'} · {new Date(request.created_at).toLocaleDateString()}</span>
                      {isManager ? (
                        <label className="service-status-control">
                          <span>Status</span>
                          <select
                            value={request.status}
                            disabled={updatingId === request.id}
                            onChange={(event) => handleStatusChange(request, event.target.value)}
                            aria-label={`Status for ${request.title}`}
                          >
                            {statuses.map((status) => <option value={status.value} key={status.value}>{status.label}</option>)}
                          </select>
                        </label>
                      ) : (
                        <span className={`service-status status-${request.status}`}>{statuses.find((status) => status.value === request.status)?.label || request.status}</span>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  )
}

export default MaintenanceRequests
