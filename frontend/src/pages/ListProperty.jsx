import { useState } from 'react'
import { LocateFixed, Plus, Trash2 } from 'lucide-react'
import { submitProperty } from '../api.js'
import PropertyMap from '../components/PropertyMap.jsx'

const unitTypes = [
  { name: 'bedsitters', label: 'Bedsitters' },
  { name: 'single_rooms', label: 'Single rooms' },
  { name: 'one_bedroom', label: '1-bedroom units' },
  { name: 'two_bedrooms', label: '2-bedroom units' },
  { name: 'three_bedrooms', label: '3-bedroom units' },
  { name: 'four_plus_bedrooms', label: '4+ bedroom units' },
]

const legalDocumentTypes = [
  { name: 'ownership_proof', label: 'Title deed, registered lease, or other proof of ownership' },
  { name: 'land_rates_clearance', label: 'Current county land-rates clearance certificate' },
  { name: 'land_rent_clearance', label: 'Land-rent clearance certificate, where leasehold applies' },
  { name: 'approved_building_plans', label: 'Approved building plans and relevant county approvals' },
  { name: 'occupation_certificate', label: 'Occupation certificate, where required' },
  { name: 'environmental_approval', label: 'NEMA/environmental approval, where required' },
  { name: 'management_authority', label: 'Written authority or management agreement, if an agent is submitting' },
  { name: 'tax_compliance', label: 'KRA PIN and applicable rental-income tax records' },
]

let nextPersonId = 1

function newPerson(role = '') {
  return { key: nextPersonId++, full_name: '', id_number: '', phone: '', role }
}

function updatePerson(people, setPeople, key, field, value) {
  setPeople(people.map((person) => person.key === key ? { ...person, [field]: value } : person))
}

function PeopleFields({ label, people, setPeople, manager = false }) {
  return (
    <div className="people-section">
      <div className="people-section-heading">
        <div>
          <h3>{label} <span>({people.length})</span></h3>
          <p>Provide each person's legal name and national ID or passport number.</p>
        </div>
        <button className="button button-light add-person-button" type="button" onClick={() => setPeople([...people, newPerson(manager ? 'property_manager' : '')])}>
          <Plus size={16} aria-hidden="true" /> Add {manager ? 'manager/caretaker' : 'owner'}
        </button>
      </div>
      <div className="people-list">
        {people.map((person, index) => (
          <fieldset className="people-entry" key={person.key}>
            <legend>{manager ? `Manager or caretaker ${index + 1}` : `Property owner ${index + 1}`}</legend>
            <div className="property-field-grid people-grid">
              <label className="property-field">
                <span>Full legal name</span>
                <input
                  autoComplete="name"
                  maxLength="120"
                  required
                  value={person.full_name}
                  onChange={(event) => updatePerson(people, setPeople, person.key, 'full_name', event.target.value)}
                />
              </label>
              <label className="property-field">
                <span>National ID or passport number</span>
                <input
                  autoComplete="off"
                  maxLength="40"
                  required
                  value={person.id_number}
                  onChange={(event) => updatePerson(people, setPeople, person.key, 'id_number', event.target.value)}
                />
              </label>
              {manager && (
                <>
                  <label className="property-field">
                    <span>Role</span>
                    <select value={person.role} onChange={(event) => updatePerson(people, setPeople, person.key, 'role', event.target.value)}>
                      <option value="property_manager">Property manager</option>
                      <option value="caretaker">Caretaker</option>
                    </select>
                  </label>
                  <label className="property-field">
                    <span>Phone number</span>
                    <input
                      autoComplete="tel"
                      maxLength="40"
                      required
                      type="tel"
                      value={person.phone}
                      onChange={(event) => updatePerson(people, setPeople, person.key, 'phone', event.target.value)}
                    />
                  </label>
                </>
              )}
            </div>
            {people.length > 1 && (
              <button
                className="remove-person-button"
                type="button"
                aria-label={`Remove ${manager ? 'manager or caretaker' : 'owner'} ${index + 1}`}
                onClick={() => setPeople(people.filter((entry) => entry.key !== person.key))}
              >
                <Trash2 size={16} aria-hidden="true" /> Remove
              </button>
            )}
          </fieldset>
        ))}
      </div>
    </div>
  )
}

function ListProperty() {
  const [owners, setOwners] = useState([newPerson()])
  const [managers, setManagers] = useState([newPerson('property_manager')])
  const [error, setError] = useState('')
  const [receipt, setReceipt] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [location, setLocation] = useState(null)
  const [locating, setLocating] = useState(false)
  const [locationMessage, setLocationMessage] = useState('')

  function useCurrentLocation() {
    setLocationMessage('')
    if (!navigator.geolocation) {
      setLocationMessage('GPS location is not available in this browser.')
      return
    }

    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocation({
          latitude: Number(coords.latitude.toFixed(6)),
          longitude: Number(coords.longitude.toFixed(6)),
        })
        setLocationMessage('GPS location added. You can adjust the pin by selecting the map.')
        setLocating(false)
      },
      (geoError) => {
        const message = geoError.code === geoError.PERMISSION_DENIED
          ? 'Location permission was denied. Enable it in your browser to use GPS.'
          : geoError.code === geoError.POSITION_UNAVAILABLE
            ? 'Your current location could not be determined. Try again or choose a map point.'
            : 'GPS lookup timed out. Try again or choose a map point.'
        setLocationMessage(message)
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setReceipt('')
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const submission = {
      property_name: form.get('property_name'),
      property_type: form.get('property_type'),
      city: form.get('city'),
      area: form.get('area'),
      street_address: form.get('street_address'),
      ...(location ? { latitude: location.latitude, longitude: location.longitude } : {}),
      tenure: form.get('tenure'),
      unit_counts: Object.fromEntries(unitTypes.map(({ name }) => [name, Number(form.get(name) || 0)])),
      owners: owners.map(({ full_name, id_number }) => ({ full_name, id_number })),
      managers: managers.map(({ full_name, id_number, phone, role }) => ({ full_name, id_number, phone, role })),
      legal_documents: Object.fromEntries(legalDocumentTypes.map(({ name }) => [name, form.get(name) === 'on'])),
      ownership_authorized: form.get('ownership_authorized') === 'on',
      legal_acknowledgement: form.get('legal_acknowledgement') === 'on',
    }

    try {
      const result = await submitProperty(submission)
      setReceipt(`Submission ${result.id} received and queued for verification.`)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="property-submit-page">
      <header className="property-submit-header">
        <span className="eyebrow">Property owner submissions</span>
        <h1>List your property</h1>
        <p>Share the property details, unit mix, ownership, and management contacts for verification.</p>
      </header>

      <form className="property-submission-form" onSubmit={handleSubmit}>
        <section className="submission-section" aria-labelledby="property-details-heading">
          <h2 id="property-details-heading">Property details</h2>
          <div className="property-field-grid">
            <label className="property-field">
              <span>Property name</span>
              <input name="property_name" autoComplete="organization" maxLength="160" required />
            </label>
            <label className="property-field">
              <span>Property type</span>
              <select name="property_type" defaultValue="" required>
                <option value="" disabled>Select a type</option>
                <option value="apartment">Apartment</option>
                <option value="flat">Flat</option>
                <option value="townhouse">Townhouse</option>
                <option value="maisonette">Maisonette</option>
                <option value="bungalow">Bungalow</option>
                <option value="bedsitter_block">Bedsitter block</option>
                <option value="single_room_block">Single-room block</option>
                <option value="mixed_use">Mixed-use property</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="property-field">
              <span>City or county</span>
              <input name="city" maxLength="120" required />
            </label>
            <label className="property-field">
              <span>Neighbourhood or area</span>
              <input name="area" maxLength="120" required />
            </label>
            <label className="property-field property-field-wide">
              <span>Physical address or nearest road</span>
              <input name="street_address" maxLength="240" required />
            </label>
            <label className="property-field">
              <span>Land tenure</span>
              <select name="tenure" defaultValue="" required>
                <option value="" disabled>Select tenure</option>
                <option value="freehold">Freehold</option>
                <option value="leasehold">Leasehold</option>
                <option value="other">Other / not sure</option>
              </select>
            </label>
          </div>
        </section>

        <section className="submission-section" aria-labelledby="property-location-heading">
          <div className="submission-section-heading location-section-heading">
            <div>
              <h2 id="property-location-heading">Property GPS location</h2>
              <p>Use your device GPS or select the property location on the map. Coordinates are stored with your private submission for verification and are not shown on public listings. OpenStreetMap receives requests for the map area currently in view.</p>
            </div>
            <button className="button button-light gps-button" type="button" onClick={useCurrentLocation} disabled={locating}>
              <LocateFixed size={17} aria-hidden="true" />
              {locating ? 'Finding location...' : 'Use my GPS'}
            </button>
          </div>
          <PropertyMap location={location} onSelect={(point) => {
            setLocation(point)
            setLocationMessage('Map pin updated.')
          }} />
          <div className="selected-location">
            {location
              ? <span>Selected: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}</span>
              : <span>No GPS location selected. You can still submit without coordinates.</span>}
            {location && <button className="remove-person-button" type="button" onClick={() => {
              setLocation(null)
              setLocationMessage('GPS location removed.')
            }}>Remove location</button>}
          </div>
          {locationMessage && <p className="location-feedback" role="status">{locationMessage}</p>}
        </section>

        <section className="submission-section" aria-labelledby="unit-mix-heading">
          <div className="submission-section-heading">
            <div>
              <h2 id="unit-mix-heading">Number of units by type</h2>
              <p>Enter how many units of each type are on this property. Use 0 when there are none.</p>
            </div>
          </div>
          <div className="unit-count-grid">
            {unitTypes.map(({ name, label }) => (
              <label className="property-field" key={name}>
                <span>{label}</span>
                <input name={name} type="number" min="0" max="5000" step="1" defaultValue="0" required />
              </label>
            ))}
          </div>
        </section>

        <section className="submission-section" aria-labelledby="owners-heading">
          <h2 id="owners-heading">Ownership and management</h2>
          <p className="submission-help">Counts are based on the people entered below. Only submit identity details with each person's knowledge and authority.</p>
          <PeopleFields label="Property owners" people={owners} setPeople={setOwners} />
          <PeopleFields label="Property managers and caretakers" people={managers} setPeople={setManagers} manager />
        </section>

        <section className="submission-section" aria-labelledby="legal-heading">
          <h2 id="legal-heading">Legal and verification documents</h2>
          <p className="submission-help">Tick the documents currently available for review. Requirements depend on county, land tenure, building use, and the specific property.</p>
          <div className="legal-checklist">
            {legalDocumentTypes.map(({ name, label }) => (
              <label className="legal-check-item" key={name}>
                <input name={name} type="checkbox" required={name === 'ownership_proof'} />
                <span>{label}</span>
              </label>
            ))}
          </div>
          <p className="legal-note">This checklist supports property verification; it is not a complete legal opinion. Confirm current requirements with the relevant county offices, land registry, and a Kenyan conveyancing advocate. Original documents may be requested during review.</p>
        </section>

        <section className="submission-section submission-consent">
          <label className="legal-check-item">
            <input name="ownership_authorized" type="checkbox" required />
            <span>I am an owner or authorized representative, and I have permission to submit the listed owners' and managers' details.</span>
          </label>
          <label className="legal-check-item">
            <input name="legal_acknowledgement" type="checkbox" required />
            <span>The information is accurate, and I can provide the selected documents for verification.</span>
          </label>
        </section>

        <div className="property-submit-actions">
          <button className="button form-submit" type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit property for review'}
          </button>
          {error && <p className="form-message" role="alert">{error}</p>}
          {receipt && <p className="submission-success" role="status">{receipt}</p>}
        </div>
      </form>
    </section>
  )
}

export default ListProperty