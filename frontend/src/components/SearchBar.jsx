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
            <option value="">Any neighbourhood</option>
            <optgroup label="Nairobi neighbourhoods">
              <option value="Buruburu">Buruburu</option>
              <option value="Donholm">Donholm</option>
              <option value="Eastleigh">Eastleigh</option>
              <option value="Embakasi">Embakasi</option>
              <option value="Hurlingham">Hurlingham</option>
              <option value="Kahawa West">Kahawa West</option>
              <option value="Karen">Karen</option>
              <option value="Kasarani">Kasarani</option>
              <option value="Kileleshwa">Kileleshwa</option>
              <option value="Kilimani">Kilimani</option>
              <option value="Lang'ata">Lang'ata</option>
              <option value="Lavington">Lavington</option>
              <option value="Muthaiga">Muthaiga</option>
              <option value="Nairobi CBD">Nairobi CBD</option>
              <option value="Ngara">Ngara</option>
              <option value="Pangani">Pangani</option>
              <option value="Parklands">Parklands</option>
              <option value="Roysambu">Roysambu</option>
              <option value="Ruai">Ruai</option>
              <option value="Runda">Runda</option>
              <option value="South B">South B</option>
              <option value="South C">South C</option>
              <option value="Umoja">Umoja</option>
              <option value="Upper Hill">Upper Hill</option>
              <option value="Westlands">Westlands</option>
              <option value="Zimmerman">Zimmerman</option>
            </optgroup>
          </select>
        </div>
        <div className="search-field">
          <label htmlFor="search-budget">Monthly budget</label>
          <select id="search-budget" value={budget} onChange={(event) => setBudget(event.target.value)}>
            <option value="">Any budget</option>
            <option value="20000">Up to KSh 20,000</option>
            <option value="30000">Up to KSh 30,000</option>
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