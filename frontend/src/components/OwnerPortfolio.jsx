import { useState } from 'react'
import { Building2, ImagePlus, Mail, Phone, Plus, UserRound } from 'lucide-react'
import {
  createOwnerProperty,
  createOwnerUnit,
  updateOwnerUnit,
} from '../api.js'

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })
const statusLabels = { vacant: 'Vacant', occupied: 'Occupied', reserved: 'Reserved' }

function readPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`))
    reader.readAsDataURL(file)
  })
}

function OwnerPortfolio({ properties, viewingRequests, onRefresh }) {
  const [propertyError, setPropertyError] = useState('')
  const [propertyNotice, setPropertyNotice] = useState('')
  const [savingProperty, setSavingProperty] = useState(false)
  const [unitError, setUnitError] = useState('')
  const [unitNotice, setUnitNotice] = useState('')
  const [savingUnit, setSavingUnit] = useState(false)
  const [editingUnit, setEditingUnit] = useState('')

  async function submitProperty(event) {
    event.preventDefault()
    setPropertyError('')
    setPropertyNotice('')
    setSavingProperty(true)
    const form = event.currentTarget
    const values = new FormData(form)
    const files = values.getAll('photos').filter((file) => file instanceof File && file.size)
    try {
      if (files.length > 5) throw new Error('Choose up to 5 photos.')
      if (files.some((file) => file.size > 1024 * 1024)) throw new Error('Each photo must be smaller than 1 MB.')
      const photos = await Promise.all(files.map(readPhoto))
      await createOwnerProperty({
        name: values.get('name'),
        city: values.get('city'),
        location: values.get('location'),
        kind: values.get('kind'),
        amenity: values.get('amenity'),
        photos,
      })
      await onRefresh()
      form.reset()
      setPropertyNotice('Property registered and published. Add units to make them available for rent.')
    } catch (requestError) {
      setPropertyError(requestError.message)
    } finally {
      setSavingProperty(false)
    }
  }

  async function submitUnit(event, propertyId) {
    event.preventDefault()
    setUnitError('')
    setUnitNotice('')
    setSavingUnit(true)
    const formElement = event.currentTarget
    const form = new FormData(formElement)
    try {
      await createOwnerUnit(propertyId, {
        name: form.get('name'),
        bedrooms: Number(form.get('bedrooms')),
        rent: Number(form.get('rent')),
      })
      formElement.reset()
      await onRefresh()
      setUnitNotice('Unit added and marked vacant.')
    } catch (requestError) {
      setUnitError(requestError.message)
    } finally {
      setSavingUnit(false)
    }
  }

  async function submitUnitUpdate(event, propertyId, unitId) {
    event.preventDefault()
    setUnitError('')
    setUnitNotice('')
    setSavingUnit(true)
    const form = new FormData(event.currentTarget)
    try {
      await updateOwnerUnit(propertyId, unitId, {
        name: form.get('name'),
        bedrooms: Number(form.get('bedrooms')),
        rent: Number(form.get('rent')),
        status: form.get('status'),
        tenant_name: form.get('tenant_name'),
        tenant_email: form.get('tenant_email'),
        tenant_phone: form.get('tenant_phone'),
      })
      setEditingUnit('')
      await onRefresh()
      setUnitNotice('Unit details updated.')
    } catch (requestError) {
      setUnitError(requestError.message)
    } finally {
      setSavingUnit(false)
    }
  }

  return (
    <>
      <section className="dashboard-panel owner-register-panel" aria-labelledby="owner-register-title">
        <div className="dashboard-panel-heading">
          <div>
            <h2 id="owner-register-title">Register a property</h2>
            <p>Properties are published immediately. Add one or more rentable units after registration.</p>
          </div>
        </div>
        <form className="owner-property-form" onSubmit={submitProperty}>
          <div className="property-field-grid">
            <label className="property-field">
              <span>Property name</span>
              <input name="name" maxLength="160" required placeholder="e.g. Greenview Apartments" />
            </label>
            <label className="property-field">
              <span>Property type</span>
              <select name="kind" defaultValue="" required>
                <option value="" disabled>Select a type</option>
                <option>Apartment</option>
                <option>Flat</option>
                <option>Townhouse</option>
                <option>Maisonette</option>
                <option>Bungalow</option>
                <option>Bedsitter</option>
              </select>
            </label>
            <label className="property-field">
              <span>City or county</span>
              <input name="city" maxLength="120" required placeholder="e.g. Nairobi" />
            </label>
            <label className="property-field">
              <span>Location or estate</span>
              <input name="location" maxLength="120" required placeholder="e.g. Kilimani" />
            </label>
            <label className="property-field property-field-wide">
              <span>Amenities</span>
              <input name="amenity" maxLength="500" placeholder="e.g. Lift, parking, security" />
            </label>
            <label className="property-field property-field-wide">
              <span><ImagePlus size={15} aria-hidden="true" /> Property photos (up to 5, 1 MB each)</span>
              <input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            </label>
          </div>
          {propertyError && <p className="form-message" role="alert">{propertyError}</p>}
          {propertyNotice && <p className="submission-success" role="status">{propertyNotice}</p>}
          <button className="button owner-form-submit" type="submit" disabled={savingProperty}>
            <Building2 size={16} /> {savingProperty ? 'Registering...' : 'Register property'}
          </button>
        </form>
      </section>

      <section className="dashboard-panel owner-properties-panel" aria-labelledby="owner-properties-title">
        <div className="dashboard-panel-heading">
          <div>
            <h2 id="owner-properties-title">Your properties & units</h2>
            <p>{properties.length} {properties.length === 1 ? 'property' : 'properties'} in your portfolio</p>
          </div>
        </div>
        {unitError && <p className="form-message" role="alert">{unitError}</p>}
        {unitNotice && <p className="submission-success" role="status">{unitNotice}</p>}
        {properties.length ? (
          <div className="owner-property-list">
            {properties.map((property) => (
              <article className="owner-property" key={property.id}>
                <div className="owner-property-heading">
                  {property.photos?.[0]
                    ? <img src={property.photos[0]} alt="" />
                    : <div className="owner-property-placeholder"><Building2 size={23} /></div>}
                  <div>
                    <h3>{property.name}</h3>
                    <p>{property.location}, {property.city} · {property.kind}</p>
                    {property.amenity && <p>{property.amenity}</p>}
                  </div>
                </div>

                {property.units?.length ? (
                  <div className="owner-unit-list">
                    {property.units.map((unit) => (
                      <article className="owner-unit" key={unit.id}>
                        {editingUnit === unit.id ? (
                          <form className="owner-unit-edit" onSubmit={(event) => submitUnitUpdate(event, property.id, unit.id)}>
                            <div className="property-field-grid">
                              <label className="property-field"><span>Unit name</span><input name="name" defaultValue={unit.name} maxLength="120" required /></label>
                              <label className="property-field"><span>Bedrooms</span><input name="bedrooms" type="number" min="1" max="20" defaultValue={unit.bedrooms} required /></label>
                              <label className="property-field"><span>Monthly rent (KSh)</span><input name="rent" type="number" min="1" defaultValue={unit.rent} required /></label>
                              <label className="property-field">
                                <span>Availability</span>
                                <select name="status" defaultValue={unit.status}>
                                  <option value="vacant">Vacant</option>
                                  <option value="occupied">Occupied</option>
                                  <option value="reserved">Reserved</option>
                                </select>
                              </label>
                            </div>
                            <fieldset className="owner-tenant-fields">
                              <legend><UserRound size={14} /> Tenant details (required when occupied)</legend>
                              <div className="property-field-grid">
                                <label className="property-field"><span>Tenant name</span><input name="tenant_name" defaultValue={unit.tenant_name} maxLength="120" /></label>
                                <label className="property-field"><span>Tenant email</span><input name="tenant_email" type="email" defaultValue={unit.tenant_email} maxLength="254" /></label>
                                <label className="property-field"><span>Tenant phone</span><input name="tenant_phone" type="tel" defaultValue={unit.tenant_phone} maxLength="40" /></label>
                              </div>
                            </fieldset>
                            <div className="owner-unit-edit-actions">
                              <button className="button" type="submit" disabled={savingUnit}>{savingUnit ? 'Saving...' : 'Save unit'}</button>
                              <button className="button button-light" type="button" onClick={() => setEditingUnit('')}>Cancel</button>
                            </div>
                          </form>
                        ) : (
                          <div className="owner-unit-summary">
                            <div className="owner-unit-main">
                              <strong>{unit.name}</strong>
                              <span>{unit.bedrooms} {unit.bedrooms === 1 ? 'bedroom' : 'bedrooms'} · {currency.format(unit.rent)} / month</span>
                              {unit.status === 'occupied' && (
                                <span className="owner-tenant-summary">
                                  <UserRound size={13} /> {unit.tenant_name}
                                  {unit.tenant_email && <><Mail size={13} /> {unit.tenant_email}</>}
                                  {unit.tenant_phone && <><Phone size={13} /> {unit.tenant_phone}</>}
                                </span>
                              )}
                            </div>
                            <span className={`rent-status owner-unit-status owner-status-${unit.status}`}>{statusLabels[unit.status]}</span>
                            <button className="availability-toggle" type="button" onClick={() => setEditingUnit(unit.id)}>Manage unit & tenant</button>
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                ) : (
                  <p className="empty-state owner-empty-units">No units yet. Add your first house or unit below.</p>
                )}

                <form className="owner-add-unit" onSubmit={(event) => submitUnit(event, property.id)}>
                  <h4><Plus size={15} /> Add house or unit</h4>
                  <div className="owner-add-unit-fields">
                    <label className="property-field"><span>Unit name</span><input name="name" maxLength="120" required placeholder="e.g. Block A, Unit 4" /></label>
                    <label className="property-field"><span>Bedrooms</span><input name="bedrooms" type="number" min="1" max="20" required defaultValue="1" /></label>
                    <label className="property-field"><span>Monthly rent (KSh)</span><input name="rent" type="number" min="1" required placeholder="e.g. 25000" /></label>
                    <button className="button" type="submit" disabled={savingUnit}>{savingUnit ? 'Adding...' : 'Add vacant unit'}</button>
                  </div>
                </form>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">Register your first property above to start adding rentable units.</p>
        )}
      </section>

      <section className="dashboard-panel owner-inquiries-panel" aria-labelledby="owner-inquiries-title">
        <div className="dashboard-panel-heading">
          <div>
            <h2 id="owner-inquiries-title">Viewing requests & enquiries</h2>
            <p>Prospective tenants can contact you from your available listings.</p>
          </div>
        </div>
        {viewingRequests.length ? (
          <div className="estate-inquiry-list">
            {viewingRequests.map((request) => (
              <article className="estate-inquiry" key={request.id}>
                <div className="estate-inquiry-heading">
                  <div><h3>{request.requester_name}</h3><p>{request.property_title}</p></div>
                  <span className="rent-status rent-status-due">{request.request_type === 'viewing' ? 'Viewing request' : 'Contact request'}</span>
                </div>
                <div className="estate-inquiry-contact">
                  <a href={`mailto:${request.email}`}>{request.email}</a>
                  <a href={`tel:${request.phone}`}>{request.phone}</a>
                </div>
                {request.preferred_date && (
                  <p className="estate-inquiry-date">
                    Preferred viewing: {new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(
                      new Date(`${String(request.preferred_date).slice(0, 10)}T00:00:00`),
                    )}
                  </p>
                )}
                {request.message && <p className="estate-inquiry-message">{request.message}</p>}
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-state">No enquiries yet. New requests for your properties will appear here.</p>
        )}
      </section>
    </>
  )
}

export default OwnerPortfolio
