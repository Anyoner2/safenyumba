import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getEstates } from '../api.js'

function Estates() {
  const [estates, setEstates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getEstates()
      .then((items) => {
        if (active) setEstates(items)
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  return (
    <section className="container listing-page">
      <div className="listing-header">
        <div>
          <span className="eyebrow">Explore by neighbourhood</span>
          <h1 className="page-title">Find your kind of place.</h1>
          <p>Get to know the neighbourhoods behind the listings, then explore verified homes in each one.</p>
        </div>
      </div>
      <div className="estate-grid">
        {loading ? <p className="empty-state" role="status">Loading estates...</p> : null}
        {error ? <p className="empty-state" role="alert">Estates are unavailable: {error}</p> : null}
        {estates.map((estate) => (
          <article className="estate-card" key={estate.name}>
            <img src={estate.image} alt={`${estate.name} residential area`} loading="lazy" />
            <div className="estate-card-body">
              <h2>{estate.name}, {estate.area}</h2>
              <p>{estate.description}</p>
              <div className="estate-card-meta">
                <span>{estate.homes} verified {estate.homes === 1 ? 'home' : 'homes'}</span>
                <Link to={`/houses/?location=${encodeURIComponent(estate.name)}`}>View area →</Link>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

export default Estates