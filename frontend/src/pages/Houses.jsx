import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProperties } from '../api.js'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyMap from '../components/PropertyMap.jsx'

function Houses() {
  const [searchParams] = useSearchParams()
  const location = searchParams.get('location') ?? ''
  const queryString = searchParams.toString()
  const [response, setResponse] = useState({ query: null, items: [], error: '' })
  const loading = response.query !== queryString
  const results = loading ? [] : response.items
  const error = loading ? '' : response.error
  const mappedProperties = results.filter((property) =>
    Number.isFinite(property.latitude) && Number.isFinite(property.longitude),
  )

  useEffect(() => {
    let active = true
    getProperties(new URLSearchParams(queryString))
      .then((items) => {
        if (active) setResponse({ query: queryString, items, error: '' })
      })
      .catch((requestError) => {
        if (active) setResponse({ query: queryString, items: [], error: requestError.message })
      })
    return () => { active = false }
  }, [queryString])

  return (
    <section className="container listing-page">
      <div className="listing-header">
        <div>
          <span className="eyebrow">Verified and available</span>
          <h1 className="page-title">{location ? `Homes in ${location}` : 'Find your next home'}</h1>
          <p>Browse vacant homes across Nairobi neighbourhoods. Rent varies by area, size, and amenities; confirm the final price with the property manager.</p>
        </div>
        <span className="result-count">{loading ? 'Loading homes...' : error ? 'Could not load homes' : `${results.length} ${results.length === 1 ? 'home' : 'homes'} found`}</span>
      </div>
      {!loading && !error && mappedProperties.length > 0 && (
        <section className="houses-map-section" aria-label="Map of homes with available locations">
          <div className="houses-map-heading">
            <h2>Explore on the map</h2>
            <p>Map pins show the approximate neighbourhood, not an exact property address.</p>
          </div>
          <PropertyMap properties={mappedProperties} />
        </section>
      )}
      <div className="property-grid">
        {error ? <p className="empty-state" role="alert">Homes are unavailable: {error}</p> : null}
        {loading && !error ? <p className="empty-state" role="status">Loading homes...</p> : null}
        {!loading && !error && results.length === 0 ? <p className="empty-state">No homes match those filters yet. Try another neighbourhood or budget.</p> : null}
        {!loading && !error ? results.map((property) => <PropertyCard key={property.id} property={property} />) : null}
      </div>
    </section>
  )
}

export default Houses