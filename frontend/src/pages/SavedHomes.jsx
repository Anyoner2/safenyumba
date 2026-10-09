import { useEffect, useState } from 'react'
import { HeartOff } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { getSavedProperties } from '../api.js'
import { useAuth } from '../auth.jsx'
import PropertyCard from '../components/PropertyCard.jsx'

function SavedHomes() {
  const { user, savedPropertyIds, accountDataError } = useAuth()
  const location = useLocation()
  const [properties, setProperties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getSavedProperties()
      .then((items) => {
        if (active) setProperties(items)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [savedPropertyIds])

  if (!user) return <Navigate to="/login/" replace state={{ from: location.pathname }} />

  return (
    <section className="container listing-page">
      <header className="listing-header">
        <div>
          <span className="eyebrow">Your shortlist</span>
          <h1 className="page-title">Saved homes</h1>
          <p>Save a home to get an in-app alert if it becomes available again.</p>
        </div>
        <span className="result-count">{loading ? 'Loading saved homes...' : `${properties.length} saved`}</span>
      </header>
      {accountDataError && <p className="form-message" role="alert">{accountDataError}</p>}
      {error && <p className="form-message" role="alert">{error}</p>}
      {loading && <p className="empty-state" role="status">Loading your saved homes...</p>}
      {!loading && !error && properties.length === 0 && (
        <p className="empty-state"><HeartOff size={20} /> You have no saved homes yet. Browse houses and tap the heart to save one.</p>
      )}
      {!loading && properties.length > 0 && (
        <div className="property-grid">
          {properties.map((property) => <PropertyCard key={property.id} property={property} />)}
        </div>
      )}
    </section>
  )
}

export default SavedHomes
