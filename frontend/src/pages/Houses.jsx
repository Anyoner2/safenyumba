import { useEffect, useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getProperties } from '../api.js'
import PropertyCard from '../components/PropertyCard.jsx'
import PropertyMap from '../components/PropertyMap.jsx'

function Houses() {
  const [searchParams, setSearchParams] = useSearchParams()
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

  function submitFilters(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim())
    })
    setSearchParams(params)
  }

  function clearFilters() {
    setSearchParams({})
  }

  return (
    <section className="container listing-page">
      <div className="listing-header">
        <div>
          <span className="eyebrow">Verified and available</span>
          <h1 className="page-title">{location ? `Homes in ${location}` : 'Find your next home'}</h1>
          <p>Browse available homes by rent, neighbourhood, size, home type, and amenities.</p>
        </div>
        <span className="result-count">{loading ? 'Loading homes...' : error ? 'Could not load homes' : `${results.length} ${results.length === 1 ? 'home' : 'homes'} found`}</span>
      </div>
      <form key={queryString} className="listing-filters" onSubmit={submitFilters} aria-label="Filter available homes">
        <label className="listing-filter-field">
          <span>Location or estate</span>
          <input name="location" defaultValue={searchParams.get('location') ?? ''} placeholder="e.g. Kilimani" />
        </label>
        <label className="listing-filter-field">
          <span>Minimum rent (KSh)</span>
          <input name="minRent" type="number" min="0" step="1000" defaultValue={searchParams.get('minRent') ?? ''} placeholder="Any" />
        </label>
        <label className="listing-filter-field">
          <span>Maximum rent (KSh)</span>
          <input name="maxRent" type="number" min="0" step="1000" defaultValue={searchParams.get('maxRent') ?? searchParams.get('budget') ?? ''} placeholder="Any" />
        </label>
        <label className="listing-filter-field">
          <span>Bedrooms</span>
          <select name="bedrooms" defaultValue={searchParams.get('bedrooms') ?? ''}>
            <option value="">Any</option>
            <option value="1">1 bedroom</option>
            <option value="2">2 bedrooms</option>
            <option value="3">3+ bedrooms</option>
            <option value="4">4 bedrooms</option>
          </select>
        </label>
        <label className="listing-filter-field">
          <span>House type</span>
          <select name="kind" defaultValue={searchParams.get('kind') ?? ''}>
            <option value="">Any type</option>
            <option value="Apartment">Apartment</option>
            <option value="Flat">Flat</option>
            <option value="Townhouse">Townhouse</option>
            <option value="Bungalow">Bungalow</option>
          </select>
        </label>
        <label className="listing-filter-field">
          <span>Amenity</span>
          <input name="amenity" defaultValue={searchParams.get('amenity') ?? ''} placeholder="e.g. parking" />
        </label>
        <div className="listing-filter-actions">
          <button className="button" type="submit"><Search size={16} /> Apply filters</button>
          <button className="filter-reset" type="button" onClick={clearFilters}><RotateCcw size={15} /> Clear</button>
        </div>
      </form>
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