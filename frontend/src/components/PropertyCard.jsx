import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, ArrowRight, BedDouble, CalendarDays, Heart, MapPin, MessageCircle, ShieldCheck, X } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { createViewingRequest } from '../api.js'

const currentDate = new Date()
const minimumViewingDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`

function PropertyCard({ property }) {
  const { user, savedPropertyIds, toggleSavedProperty } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [requestType, setRequestType] = useState('')
  const [activeImage, setActiveImage] = useState(0)
  const [requestState, setRequestState] = useState({ submitting: false, error: '', sent: false })
  const saved = savedPropertyIds.includes(property.id)
  const images = property.images?.length ? property.images : [property.image]
  const availability = property.availableDate
    ? `Available ${new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(`${property.availableDate}T00:00:00`))}`
    : 'Available now'

  useEffect(() => {
    if (!requestType) return undefined
    function closeOnEscape(event) {
      if (event.key === 'Escape') setRequestType('')
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [requestType])

  function openRequest(type) {
    setRequestType(type)
    setActiveImage(0)
    setRequestState({ submitting: false, error: '', sent: false })
  }

  async function submitRequest(event) {
    event.preventDefault()
    setRequestState({ submitting: true, error: '', sent: false })
    const form = new FormData(event.currentTarget)
    try {
      await createViewingRequest({
        property_id: property.id,
        request_type: requestType,
        requester_name: form.get('requester_name'),
        email: form.get('email'),
        phone: form.get('phone'),
        preferred_date: form.get('preferred_date'),
        message: form.get('message'),
      })
      setRequestState({ submitting: false, error: '', sent: true })
    } catch (requestError) {
      setRequestState({ submitting: false, error: requestError.message, sent: false })
    }
  }

  async function handleToggleSaved() {
    setError('')
    if (!user) {
      navigate('/login/', { state: { from: `${location.pathname}${location.search}` } })
      return
    }

    setSaving(true)
    try {
      await toggleSavedProperty(property.id)
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <article className="property-card">
      <div className="property-image-wrap">
        <img className="property-image" src={property.image} alt={property.imageAlt} loading="lazy" />
        {property.verified && <span className="verified-badge"><ShieldCheck size={14} /> Verified</span>}
        <span className="photo-count">{images.length} photos</span>
        <button
          className={`save-button${saved ? ' saved' : ''}`}
          type="button"
          aria-label={saved ? `Remove ${property.title} from saved homes` : `Save ${property.title} for vacancy alerts`}
          aria-pressed={saved}
          aria-busy={saving}
          disabled={saving}
          onClick={handleToggleSaved}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="property-body">
        {error && <p className="save-error" role="alert">{error}</p>}
        <div className="property-location"><MapPin size={14} /> {property.location}, {property.city}</div>
        <h3 className="property-title">{property.title}</h3>
        <div className="property-price">KSh {property.rent.toLocaleString('en-KE')} <span>/ month</span></div>
        <div className="property-meta">
          <span><BedDouble size={14} /> {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
          <span>{property.amenity}</span>
        </div>
        <div className="property-bottom">
          <span className="vacancy">{availability}</span>
          <span className="property-type">{property.kind}</span>
        </div>
        <div className="property-actions">
          <button className="property-details-button" type="button" onClick={() => openRequest('details')}>View photos & details</button>
          <button className="property-card-link" type="button" aria-label={`Request a viewing for ${property.title}`} onClick={() => openRequest('viewing')}>
            <CalendarDays size={16} />
          </button>
        </div>
      </div>
      {requestType && createPortal(
        <div className="property-dialog-backdrop" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setRequestType('')
        }}>
          <section className="property-dialog" role="dialog" aria-modal="true" aria-labelledby={`dialog-title-${property.id}`}>
            <button className="property-dialog-close" type="button" aria-label="Close property details" onClick={() => setRequestType('')}>
              <X size={20} />
            </button>
            <div className="property-gallery">
              <img src={images[activeImage]} alt={`${property.title}, photo ${activeImage + 1}`} />
              {images.length > 1 && (
                <>
                  <button className="gallery-control gallery-previous" type="button" aria-label="Previous photo" onClick={() => setActiveImage((activeImage + images.length - 1) % images.length)}><ArrowLeft size={18} /></button>
                  <button className="gallery-control gallery-next" type="button" aria-label="Next photo" onClick={() => setActiveImage((activeImage + 1) % images.length)}><ArrowRight size={18} /></button>
                  <span className="gallery-position">{activeImage + 1} / {images.length}</span>
                </>
              )}
            </div>
            <div className="property-dialog-content">
              <div className="property-location"><MapPin size={14} /> {property.location}, {property.city}</div>
              <h2 id={`dialog-title-${property.id}`}>{property.title}</h2>
              <p className="property-dialog-price">KSh {property.rent.toLocaleString('en-KE')} <span>/ month</span></p>
              <div className="property-dialog-facts">
                <span><BedDouble size={16} /> {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
                <span>{property.kind}</span>
                <span>{property.amenity}</span>
                <span className="vacancy">{availability}</span>
              </div>
              {requestType === 'details' || requestState.sent ? (
                <div className="property-dialog-actions">
                  <button className="button" type="button" onClick={() => openRequest('viewing')}><CalendarDays size={17} /> Request a viewing</button>
                  <button className="button button-light" type="button" onClick={() => openRequest('contact')}><MessageCircle size={17} /> Contact agent</button>
                </div>
              ) : (
                <form className="property-request-form" onSubmit={submitRequest}>
                  <h3>{requestType === 'viewing' ? 'Request a viewing' : 'Contact the property agent'}</h3>
                  <p>Send your details to the estate manager for {property.location}.</p>
                  <div className="property-field-grid">
                    <label className="property-field">
                      <span>Your name</span>
                      <input name="requester_name" autoComplete="name" maxLength="120" required />
                    </label>
                    <label className="property-field">
                      <span>Email address</span>
                      <input name="email" type="email" autoComplete="email" maxLength="254" required />
                    </label>
                    <label className="property-field">
                      <span>Phone number</span>
                      <input name="phone" type="tel" autoComplete="tel" maxLength="40" required />
                    </label>
                    {requestType === 'viewing' && (
                      <label className="property-field">
                        <span>Preferred viewing date</span>
                        <input name="preferred_date" type="date" min={minimumViewingDate} required />
                      </label>
                    )}
                    <label className="property-field property-field-wide">
                      <span>Message (optional)</span>
                      <textarea name="message" maxLength="2000" rows="3" />
                    </label>
                  </div>
                  {requestState.error && <p className="form-message" role="alert">{requestState.error}</p>}
                  <div className="property-dialog-actions">
                    <button className="button" type="submit" disabled={requestState.submitting}>
                      {requestState.submitting ? 'Sending...' : requestType === 'viewing' ? 'Send viewing request' : 'Send message'}
                    </button>
                    <button className="button button-light" type="button" onClick={() => setRequestType('details')}>Back to details</button>
                  </div>
                </form>
              )}
              {requestState.sent && <p className="submission-success" role="status">Your request has been sent to the property manager. They can follow up using the contact details you provided.</p>}
            </div>
          </section>
        </div>,
        document.body,
      )}
    </article>
  )
}

export default PropertyCard