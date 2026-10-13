import { useEffect, useState } from 'react'
import { ArrowLeft, ArrowRight, BusFront, HeartPulse, MapPin, PhoneCall, School, Store, TriangleAlert } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { getEstateNearbyPlaces, getEstateOverview } from '../api.js'

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })
const nearbyCategories = [
  { key: 'shops', title: 'Nearby shops', Icon: Store },
  { key: 'hospitals', title: 'Hospitals and clinics', Icon: HeartPulse },
  { key: 'schools', title: 'Schools', Icon: School },
  { key: 'transport', title: 'Transport points', Icon: BusFront },
]

function formatDistance(distanceMeters) {
  return distanceMeters < 1000
    ? `${distanceMeters} m`
    : `${(distanceMeters / 1000).toFixed(1)} km`
}

function EstateOverview() {
  const { slug = '' } = useParams()
  const [overviewState, setOverviewState] = useState({ slug: '', data: null, error: '' })
  const [placesState, setPlacesState] = useState({ slug: '', data: null, error: '' })
  const [placesAttempt, setPlacesAttempt] = useState(0)
  const overviewLoading = overviewState.slug !== slug
  const placesLoading = placesState.slug !== slug
  const overview = overviewLoading ? null : overviewState.data
  const places = placesLoading ? null : placesState.data
  const overviewError = overviewLoading ? '' : overviewState.error
  const placesError = placesLoading ? '' : placesState.error

  useEffect(() => {
    let active = true
    getEstateOverview(slug)
      .then((data) => {
        if (active) setOverviewState({ slug, data, error: '' })
      })
      .catch((requestError) => {
        if (active) setOverviewState({ slug, data: null, error: requestError.message })
      })
    return () => { active = false }
  }, [slug])

  useEffect(() => {
    let active = true
    getEstateNearbyPlaces(slug)
      .then((data) => {
        if (active) setPlacesState({ slug, data, error: '' })
      })
      .catch((requestError) => {
        if (active) setPlacesState({ slug, data: null, error: requestError.message })
      })
    return () => { active = false }
  }, [slug, placesAttempt])

  if (overviewError) {
    return (
      <section className="container listing-page">
        <Link className="text-link estate-back-link" to="/estates/"><ArrowLeft size={16} /> All estates</Link>
        <p className="empty-state" role="alert">{overviewError}</p>
      </section>
    )
  }

  if (overviewLoading || !overview) {
    return <section className="container listing-page"><p className="empty-state" role="status">Loading estate overview...</p></section>
  }

  const { estate, homes, availableHomes, residentCount, openIssues, emergencyContacts, announcements } = overview
  const categories = places?.categories || {}
  const summaryCards = [
    { label: 'Available homes', value: availableHomes.length },
    { label: 'Registered residents', value: residentCount, note: 'Distinct tenant records for occupied units' },
    { label: 'Nearby shops', value: places?.counts?.shops ?? '—' },
    { label: 'Nearby hospitals', value: places?.counts?.hospitals ?? '—' },
    { label: 'Nearby schools', value: places?.counts?.schools ?? '—' },
    { label: 'Transport points', value: places?.counts?.transport ?? '—' },
    { label: 'Emergency contacts', value: emergencyContacts.length },
    { label: 'Reported issues', value: openIssues, note: 'Unresolved reports; details remain private' },
  ]

  return (
    <section className="container listing-page estate-overview-page">
      <Link className="text-link estate-back-link" to="/estates/"><ArrowLeft size={16} /> All estates</Link>
      <header className="estate-overview-hero">
        <img src={estate.image} alt="" />
        <div className="estate-overview-hero-copy">
          <span className="eyebrow">Estate overview</span>
          <h1>{estate.name} <span>— {estate.area}</span></h1>
          <p>{estate.description}</p>
          <Link className="button" to={`/houses/?location=${encodeURIComponent(estate.name)}`}>
            Browse available homes <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="estate-summary-grid" aria-label="Estate summary">
        {summaryCards.map(({ label, value, note }) => (
          <article className="estate-summary-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            {note && <small>{note}</small>}
          </article>
        ))}
      </section>

      <section className="estate-overview-section" aria-labelledby="estate-homes-title">
        <div className="estate-section-heading">
          <div>
            <span className="eyebrow">Estate inventory</span>
            <h2 id="estate-homes-title">Homes and units</h2>
            <p>{availableHomes.length} verified {availableHomes.length === 1 ? 'home is' : 'homes are'} currently vacant. Occupied and reserved units are listed for availability context; private tenant details are never shown.</p>
          </div>
          <Link className="text-link" to={`/houses/?location=${encodeURIComponent(estate.name)}`}>View all search results <ArrowRight size={16} /></Link>
        </div>
        {homes.length ? (
          <div className="estate-homes-table-wrap">
            <table className="estate-homes-table">
              <thead>
                <tr><th scope="col">House</th><th scope="col">Type</th><th scope="col">Bedrooms</th><th scope="col">Rent / month</th><th scope="col">Status</th></tr>
              </thead>
              <tbody>
                {homes.map((home) => (
                  <tr key={home.id}>
                    <td>
                      <Link to={`/houses/?location=${encodeURIComponent(home.location)}`}>{home.title}</Link>
                      <small>{home.location}, {home.city}</small>
                    </td>
                    <td>{home.kind}</td>
                    <td>{home.bedrooms}</td>
                    <td>{currency.format(home.rent)}</td>
                    <td>
                      <span className={`estate-home-status estate-home-status-${home.status}`}>
                        {home.status === 'unavailable'
                          ? 'Unavailable'
                          : home.status.charAt(0).toUpperCase() + home.status.slice(1)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="empty-state">No verified homes or units are listed in this estate yet.</p>
        )}
      </section>

      <section className="estate-overview-section" aria-labelledby="estate-nearby-title">
        <div className="estate-section-heading">
          <div>
            <span className="eyebrow">OpenStreetMap data</span>
            <h2 id="estate-nearby-title">Nearby places</h2>
            <p>Places are approximate and based on OpenStreetMap coverage within 2 km of the estate search centre.</p>
          </div>
        </div>
        {placesError && (
          <div className="estate-places-error" role="alert">
            <TriangleAlert size={17} aria-hidden="true" />
            <span>{placesError}</span>
            <button className="filter-reset" type="button" onClick={() => {
              setPlacesState({ slug: '', data: null, error: '' })
              setPlacesAttempt((attempt) => attempt + 1)
            }}>Try again</button>
          </div>
        )}
        {placesLoading && <p className="empty-state" role="status">Finding nearby places from OpenStreetMap...</p>}
        {!placesLoading && places && (
          <>
            {places.center ? (
              <p className="estate-map-note">
                <MapPin size={15} aria-hidden="true" />
                Approximate search centre: {places.center.latitude.toFixed(4)}, {places.center.longitude.toFixed(4)} · within {places.center.radiusMeters / 1000} km
              </p>
            ) : (
              <p className="empty-state">OpenStreetMap could not find a mapped centre for this estate.</p>
            )}
            <div className="estate-nearby-grid">
              {nearbyCategories.map(({ key, title, Icon }) => (
                <article className="estate-nearby-card" key={key}>
                  <h3><Icon size={18} aria-hidden="true" /> {title}</h3>
                  {categories[key]?.length ? (
                    <ul>
                      {categories[key].map((place) => (
                        <li key={place.id}>
                          <span>{place.name}<small>{place.type}</small></span>
                          <span className="estate-place-distance">{formatDistance(place.distanceMeters)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <p>No named places found in the mapped area.</p>}
                  {(places.counts?.[key] || 0) > (categories[key]?.length || 0) && (
                    <p className="estate-nearby-more">Showing the 6 closest places.</p>
                  )}
                </article>
              ))}
            </div>
            <p className="estate-osm-attribution">
              Nearby-place data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap contributors</a>. Results may be incomplete or out of date; verify locations independently.
            </p>
          </>
        )}
      </section>

      <div className="estate-overview-bottom-grid">
        <section className="estate-overview-section" aria-labelledby="estate-contacts-title">
          <div className="estate-section-heading">
            <div><span className="eyebrow">Estate management</span><h2 id="estate-contacts-title">Emergency contacts</h2></div>
            <Link className="text-link" to="/emergency-contacts/">All contacts <ArrowRight size={16} /></Link>
          </div>
          {emergencyContacts.length ? (
            <div className="estate-overview-list">
              {emergencyContacts.map((contact) => (
                <article className="estate-overview-list-item" key={contact.id}>
                  <div><h3>{contact.name}</h3><p>{contact.service}{contact.notes ? ` · ${contact.notes}` : ''}</p></div>
                  <a href={`tel:${contact.phone}`} aria-label={`Call ${contact.name}`}><PhoneCall size={15} /> {contact.phone}</a>
                </article>
              ))}
            </div>
          ) : <p className="empty-state">No estate-specific contacts have been added yet. For immediate emergencies, call 999 or 112.</p>}
          <p className="estate-national-emergency">For immediate emergencies in Kenya, call <a href="tel:999">999</a> or <a href="tel:112">112</a>.</p>
        </section>

        <section className="estate-overview-section" aria-labelledby="estate-announcements-title">
          <div className="estate-section-heading">
            <div><span className="eyebrow">Noticeboard</span><h2 id="estate-announcements-title">Announcements</h2></div>
            <Link className="text-link" to={`/announcements/?estate=${encodeURIComponent(estate.slug)}`}>All notices <ArrowRight size={16} /></Link>
          </div>
          {announcements.length ? (
            <div className="estate-overview-list">
              {announcements.slice(0, 3).map((announcement) => (
                <article className="estate-overview-list-item estate-overview-announcement" key={announcement.id}>
                  <div>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.body}</p>
                    <small>{new Date(announcement.created_at).toLocaleDateString('en-KE')}</small>
                  </div>
                </article>
              ))}
            </div>
          ) : <p className="empty-state">No announcements have been posted for this estate.</p>}
        </section>
      </div>

      <section className="estate-issues-note">
        <TriangleAlert size={18} aria-hidden="true" />
        <div>
          <h2>Reported issues</h2>
          <p>{openIssues ? `${openIssues} unresolved maintenance ${openIssues === 1 ? 'report' : 'reports'} are recorded.` : 'There are no unresolved maintenance reports recorded.'} Issue titles, descriptions, unit details, and reporter identities are private to residents and estate management.</p>
          <Link className="text-link" to="/maintenance/">Report or follow a maintenance issue <ArrowRight size={16} /></Link>
        </div>
      </section>
    </section>
  )
}

export default EstateOverview
