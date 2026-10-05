import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { getProperties } from '../api.js'
import PropertyCard from '../components/PropertyCard.jsx'

function Houses() {
  const [searchParams] = useSearchParams()
  const location = searchParams.get('location') ?? ''
  const queryString = searchParams.toString()
  const [response, setResponse] = useState({ query: null, items: [], error: '' })
  const loading = response.query !== queryString
  const results = loading ? [] : response.items
  const error = loading ? '' : response.error

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
          <p>Browse vacant homes with clear prices, useful details, and local verification.</p>
        </div>
        <span className="result-count">{loading ? 'Loading homes...' : error ? 'Could not load homes' : `${results.length} ${results.length === 1 ? 'home' : 'homes'} found`}</span>
      </div>
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