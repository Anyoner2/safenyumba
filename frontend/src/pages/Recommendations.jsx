import { useEffect, useState } from 'react'
import { Lightbulb, Search } from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { getRecommendations } from '../api.js'
import PropertyCard from '../components/PropertyCard.jsx'

function Recommendations() {
  const [searchParams, setSearchParams] = useSearchParams()
  const queryString = searchParams.toString()
  const [response, setResponse] = useState({ query: null, items: [], error: '' })
  const loading = response.query !== queryString
  const recommendations = loading ? [] : response.items
  const error = loading ? '' : response.error

  useEffect(() => {
    let active = true
    getRecommendations(new URLSearchParams(queryString))
      .then((items) => {
        if (active) setResponse({ query: queryString, items, error: '' })
      })
      .catch((requestError) => {
        if (active) setResponse({ query: queryString, items: [], error: requestError.message })
      })
    return () => { active = false }
  }, [queryString])

  function submitPreferences(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    new FormData(event.currentTarget).forEach((value, key) => {
      if (typeof value === 'string' && value.trim()) params.set(key, value.trim())
    })
    setSearchParams(params)
  }

  return (
    <section className="container listing-page service-page">
      <header className="listing-header">
        <div>
          <span className="eyebrow">A better-fit shortlist</span>
          <h1 className="page-title">Smart home recommendations</h1>
          <p>Share what matters to you to rank verified, available homes. Matching happens from listing details only; no external AI service is used.</p>
        </div>
      </header>

      <form key={queryString} className="listing-filters recommendation-filters" onSubmit={submitPreferences} aria-label="Set home preferences">
        <label className="listing-filter-field">
          <span>Preferred area</span>
          <input name="location" defaultValue={searchParams.get('location') ?? ''} placeholder="e.g. Kilimani" />
        </label>
        <label className="listing-filter-field">
          <span>Monthly budget (KSh)</span>
          <input name="budget" type="number" min="0" step="1000" defaultValue={searchParams.get('budget') ?? ''} placeholder="Any budget" />
        </label>
        <label className="listing-filter-field">
          <span>Bedrooms</span>
          <select name="bedrooms" defaultValue={searchParams.get('bedrooms') ?? ''}>
            <option value="">Any</option>
            <option value="1">1 bedroom</option>
            <option value="2">2 bedrooms</option>
            <option value="3">3 bedrooms</option>
            <option value="4">4+ bedrooms</option>
          </select>
        </label>
        <label className="listing-filter-field">
          <span>Important amenity</span>
          <input name="amenity" defaultValue={searchParams.get('amenity') ?? ''} placeholder="e.g. parking" />
        </label>
        <div className="listing-filter-actions">
          <button className="button" type="submit"><Search size={16} aria-hidden="true" /> Find matches</button>
          <button className="filter-reset" type="button" onClick={() => setSearchParams({})}>Clear preferences</button>
        </div>
      </form>

      <div className="recommendation-intro">
        <Lightbulb size={18} aria-hidden="true" />
        <p>Results rank higher when they match your area, budget, bedroom count, and amenity. Reasons are shown with every suggestion.</p>
      </div>
      <div className="property-grid">
        {error && <p className="empty-state" role="alert">Recommendations are unavailable: {error}</p>}
        {loading && <p className="empty-state" role="status">Finding homes that fit...</p>}
        {!loading && !error && recommendations.length === 0 && (
          <p className="empty-state">No verified, available homes are listed right now. Try again later or adjust your preferences.</p>
        )}
        {!loading && !error && recommendations.map((property) => (
          <article className="recommendation-card" key={property.id}>
            <div className="recommendation-score">Match score <strong>{property.score}</strong></div>
            <PropertyCard property={property} />
            <ul className="recommendation-reasons" aria-label={`Why ${property.title} was recommended`}>
              {property.reasons.map((reason) => <li key={reason}>{reason}</li>)}
            </ul>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Recommendations
