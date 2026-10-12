import { useEffect, useState } from 'react'
import { PhoneCall, Plus, Trash2 } from 'lucide-react'
import { createEmergencyContact, deleteEmergencyContact, getEmergencyContacts, getEstates } from '../api.js'
import { useAuth } from '../auth.jsx'

const nationalContacts = [
  { name: 'National emergency services', service: 'Emergency response', phone: '999' },
  { name: 'National emergency services', service: 'Emergency response', phone: '112' },
]

function EmergencyContacts() {
  const { user } = useAuth()
  const isManager = user?.role === 'estate_manager'
  const [contacts, setContacts] = useState([])
  const [estates, setEstates] = useState([])
  const [estateFilter, setEstateFilter] = useState(user?.managed_estate || '')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getEmergencyContacts(estateFilter), getEstates()])
      .then(([items, estateItems]) => {
        if (!active) return
        setContacts(items)
        setEstates(estateItems)
        setError('')
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [estateFilter])

  function handleEstateFilterChange(event) {
    setLoading(true)
    setError('')
    setContacts([])
    setEstateFilter(event.target.value)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    setError('')
    setNotice('')
    setSubmitting(true)
    try {
      const contact = await createEmergencyContact({
        name: form.get('name'),
        service: form.get('service'),
        phone: form.get('phone'),
        notes: form.get('notes'),
      })
      setContacts((current) => [...current, contact].sort((first, second) => first.name.localeCompare(second.name)))
      setEstateFilter(contact.estate_slug)
      setNotice('Emergency contact added for your assigned estate.')
      formElement.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(contact) {
    setError('')
    setNotice('')
    try {
      await deleteEmergencyContact(contact.id)
      setContacts((current) => current.filter((item) => item.id !== contact.id))
      setNotice('Emergency contact removed.')
    } catch (requestError) {
      setError(requestError.message)
    }
  }

  const estateNames = new Map(estates.map((estate) => [estate.slug, estate.name]))

  return (
    <section className="container listing-page service-page">
      <header className="listing-header">
        <div>
          <span className="eyebrow">Help when it matters</span>
          <h1 className="page-title">Emergency contacts</h1>
          <p>Call local emergency services for immediate danger. Estate contacts are supplied by estate management.</p>
        </div>
        <label className="announcement-filter">
          <span>Estate contacts</span>
          <select value={estateFilter} onChange={handleEstateFilterChange}>
            <option value="">All estates</option>
            {estates.map((estate) => <option value={estate.slug} key={estate.slug}>{estate.name}</option>)}
          </select>
        </label>
      </header>

      {error && <p className="form-message" role="alert">{error}</p>}
      {notice && <p className="submission-success" role="status">{notice}</p>}

      <section className="emergency-section" aria-labelledby="national-emergency-title">
        <h2 id="national-emergency-title">National emergency services</h2>
        <p className="submission-help">For an immediate emergency in Kenya, call one of these national numbers.</p>
        <div className="emergency-contact-grid">
          {nationalContacts.map((contact) => (
            <article className="emergency-contact-card emergency-national" key={contact.phone}>
              <span className="emergency-contact-icon"><PhoneCall size={19} aria-hidden="true" /></span>
              <div>
                <h3>{contact.name}</h3>
                <p>{contact.service}</p>
                <a className="emergency-phone" href={`tel:${contact.phone}`}>{contact.phone}</a>
              </div>
            </article>
          ))}
        </div>
      </section>

      {isManager && (
        <form className="rent-form emergency-form" onSubmit={handleSubmit}>
          <h2>Add an estate contact</h2>
          <p className="submission-help">
            Contacts are visible to residents. Only add numbers that your estate has verified.
          </p>
          <div className="property-field-grid">
            <label className="property-field">
              <span>Contact name</span>
              <input name="name" maxLength="100" required />
            </label>
            <label className="property-field">
              <span>Service or role</span>
              <input name="service" maxLength="80" placeholder="e.g. Estate security" required />
            </label>
            <label className="property-field">
              <span>Phone number</span>
              <input name="phone" type="tel" maxLength="40" required />
            </label>
            <label className="property-field">
              <span>Helpful details (optional)</span>
              <input name="notes" maxLength="240" placeholder="e.g. Available at the gatehouse" />
            </label>
          </div>
          <button className="button rent-form-submit" type="submit" disabled={submitting}>
            <Plus size={17} aria-hidden="true" />
            {submitting ? 'Adding contact...' : 'Add contact'}
          </button>
        </form>
      )}

      <section className="emergency-section" aria-labelledby="estate-emergency-title">
        <div className="rent-ledger-heading">
          <div>
            <h2 id="estate-emergency-title">Estate contacts</h2>
            <p>{contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'} listed</p>
          </div>
        </div>
        {loading && <p className="empty-state" role="status">Loading estate contacts...</p>}
        {!loading && contacts.length === 0 && (
          <p className="empty-state">No estate-specific emergency contacts have been added. Use the national emergency numbers above if you need immediate help.</p>
        )}
        {!loading && contacts.length > 0 && (
          <div className="emergency-contact-grid">
            {contacts.map((contact) => (
              <article className="emergency-contact-card" key={contact.id}>
                <span className="emergency-contact-icon"><PhoneCall size={19} aria-hidden="true" /></span>
                <div className="emergency-contact-copy">
                  <p className="emergency-contact-estate">{estateNames.get(contact.estate_slug) || contact.estate_slug}</p>
                  <h3>{contact.name}</h3>
                  <p>{contact.service}</p>
                  {contact.notes && <p className="emergency-contact-notes">{contact.notes}</p>}
                  <a className="emergency-phone" href={`tel:${contact.phone}`}>{contact.phone}</a>
                </div>
                {isManager && contact.estate_slug === user.managed_estate && (
                  <button
                    className="emergency-delete"
                    type="button"
                    aria-label={`Remove ${contact.name}`}
                    onClick={() => handleDelete(contact)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  )
}

export default EmergencyContacts
