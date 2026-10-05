import { Search } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function SearchBar() {
  const navigate = useNavigate()
  const [location, setLocation] = useState('')
  const [budget, setBudget] = useState('')
  const [bedrooms, setBedrooms] = useState('')

  function submitSearch(event) {
    event.preventDefault()
    const params = new URLSearchParams()
    if (location) params.set('location', location)
    if (budget) params.set('budget', budget)
    if (bedrooms) params.set('bedrooms', bedrooms)
    navigate(`/houses/${params.size ? `?${params.toString()}` : ''}`)
  }

  return (
    <div className="container search-wrap">
      <form className="search-bar" onSubmit={submitSearch}>
        <div className="search-field">
          <label htmlFor="search-location">Where?</label>
          <select id="search-location" value={location} onChange={(event) => setLocation(event.target.value)}>
            <option value="">Any location</option>
            <option value="Kilimani">Kilimani</option>
            <option value="Westlands">Westlands</option>
            <option value="Kileleshwa">Kileleshwa</option>
            <option value="Karen">Karen</option>
            <option value="Ruiru">Ruiru</option>
            <option value="Mombasa">Mombasa</option>
          </select>
        </div>
        <div className="search-field">
          <label htmlFor="search-budget">Monthly budget</label>
          <select id="search-budget" value={budget} onChange={(event) => setBudget(event.target.value)}>
            <option value="">Any budget</option>
            <option value="50000">Up to KSh 50,000</option>
            <option value="80000">Up to KSh 80,000</option>
            <option value="120000">Up to KSh 120,000</option>
          </select>
        </div>
        <div className="search-field">
          <label htmlFor="search-bedrooms">Bedrooms</label>
          <select id="search-bedrooms" value={bedrooms} onChange={(event) => setBedrooms(event.target.value)}>
            <option value="">Any</option>
            <option value="1">1 bedroom</option>
            <option value="2">2 bedrooms</option>
            <option value="3">3+ bedrooms</option>
          </select>
        </div>
        <button className="button search-button" type="submit">
          <Search size={17} /> Search
        </button>
      </form>
    </div>
  )
}

export default SearchBar