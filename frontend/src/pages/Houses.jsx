import { useSearchParams } from 'react-router-dom'
import PropertyCard from '../components/PropertyCard.jsx'
import properties from '../propertyData.js'

function Houses() {
  const [searchParams] = useSearchParams()
  const location = searchParams.get('location') ?? ''
  const budget = Number(searchParams.get('budget')) || Infinity
  const bedrooms = Number(searchParams.get('bedrooms')) || 0
  const results = properties.filter((property) => {
    const locationMatches = !location || property.location.toLowerCase() === location.toLowerCase()
    const budgetMatches = property.rent <= budget
    const bedroomsMatch = !bedrooms || (bedrooms === 3 ? property.bedrooms >= 3 : property.bedrooms === bedrooms)
    return locationMatches && budgetMatches && bedroomsMatch
  })

  return (
    <section className="container listing-page">
      <div className="listing-header">
        <div>
          <span className="eyebrow">Verified and available</span>
          <h1 className="page-title">{location ? `Homes in ${location}` : 'Find your next home'}</h1>
          <p>Browse vacant homes with clear prices, useful details, and local verification.</p>
        </div>
        <span className="result-count">{results.length} {results.length === 1 ? 'home' : 'homes'} found</span>
      </div>
      <div className="property-grid">
        {results.length ? results.map((property) => <PropertyCard key={property.id} property={property} />) : (
          <p className="empty-state">No homes match those filters yet. Try another neighbourhood or budget.</p>
        )}
      </div>
    </section>
  )
}

export default Houses