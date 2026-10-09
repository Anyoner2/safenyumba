import { useState } from 'react'
import { FileText, Printer } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-KE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function ordinal(value) {
  const remainder = value % 100
  if (remainder >= 11 && remainder <= 13) return `${value}th`
  const suffix = value % 10 === 1 ? 'st' : value % 10 === 2 ? 'nd' : value % 10 === 3 ? 'rd' : 'th'
  return `${value}${suffix}`
}

function TenancyDocuments() {
  const { user } = useAuth()
  const location = useLocation()
  const [agreement, setAgreement] = useState(null)
  const [error, setError] = useState('')

  if (!user) return <Navigate to="/login/" replace state={{ from: location.pathname }} />
  if (user.role !== 'landlord') return <Navigate to="/estate-dashboard/" replace />

  function handleSubmit(event) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const nextAgreement = {
      landlordName: user.full_name,
      landlordEmail: user.email,
      tenantName: String(form.get('tenant_name')).trim(),
      tenantId: String(form.get('tenant_id')).trim(),
      propertyName: String(form.get('property_name')).trim(),
      propertyAddress: String(form.get('property_address')).trim(),
      monthlyRent: Number(form.get('monthly_rent')),
      deposit: Number(form.get('deposit')),
      startDate: String(form.get('start_date')),
      endDate: String(form.get('end_date')),
      dueDay: Number(form.get('due_day')),
      utilities: String(form.get('utilities')).trim(),
      specialTerms: String(form.get('special_terms')).trim(),
      draftedOn: new Date().toISOString().slice(0, 10),
    }

    if (nextAgreement.endDate < nextAgreement.startDate) {
      setError('The tenancy end date must be on or after the start date.')
      return
    }

    setError('')
    setAgreement(nextAgreement)
  }

  return (
    <section className="tenancy-documents-page">
      <div className="container">
        <header className="listing-header document-page-header">
          <div>
            <span className="eyebrow">Landlord workspace</span>
            <h1 className="page-title">Digital tenancy documents</h1>
            <p>Prepare a print-ready tenancy agreement draft from your property and tenant details.</p>
          </div>
        </header>

        <form className="document-form" onSubmit={handleSubmit}>
          <div className="document-disclaimer">
            <FileText size={20} aria-hidden="true" />
            <p>This is a general draft for review, not legal advice or an electronic signature. Have the terms checked against current Kenyan law before signing. Download a PDF using your browser’s print dialog.</p>
          </div>
          <section className="submission-section">
            <h2>Parties and premises</h2>
            <div className="property-field-grid">
              <label className="property-field">
                <span>Tenant's full legal name</span>
                <input name="tenant_name" autoComplete="name" maxLength="120" required />
              </label>
              <label className="property-field">
                <span>Tenant's ID/passport number</span>
                <input name="tenant_id" maxLength="40" required />
              </label>
              <label className="property-field">
                <span>Property or unit name</span>
                <input name="property_name" maxLength="160" placeholder="e.g. Kilimani Court, Unit 4B" required />
              </label>
              <label className="property-field">
                <span>Full property address</span>
                <input name="property_address" maxLength="240" required />
              </label>
            </div>
          </section>

          <section className="submission-section">
            <h2>Rent and tenancy dates</h2>
            <div className="property-field-grid">
              <label className="property-field">
                <span>Monthly rent (KES)</span>
                <input name="monthly_rent" type="number" min="1" max="1000000000" step="1" required />
              </label>
              <label className="property-field">
                <span>Security deposit (KES)</span>
                <input name="deposit" type="number" min="0" max="1000000000" step="1" required />
              </label>
              <label className="property-field">
                <span>Tenancy start date</span>
                <input name="start_date" type="date" required />
              </label>
              <label className="property-field">
                <span>Tenancy end date</span>
                <input name="end_date" type="date" required />
              </label>
              <label className="property-field">
                <span>Monthly rent due day</span>
                <select name="due_day" defaultValue="1">
                  {Array.from({ length: 28 }, (_, index) => index + 1).map((day) => (
                    <option value={day} key={day}>{ordinal(day)} of each month</option>
                  ))}
                </select>
              </label>
              <label className="property-field property-field-wide">
                <span>Utility and service-charge arrangements</span>
                <textarea name="utilities" rows="3" maxLength="1000" placeholder="State which utilities or service charges are paid by each party." required />
              </label>
              <label className="property-field property-field-wide">
                <span>Additional agreed terms</span>
                <textarea name="special_terms" rows="4" maxLength="2000" placeholder="Enter any additional agreed terms, or leave blank." />
              </label>
            </div>
          </section>
          <div className="property-submit-actions">
            <button className="button form-submit" type="submit"><FileText size={17} /> Generate agreement draft</button>
            {error && <p className="form-message" role="alert">{error}</p>}
          </div>
        </form>

        {agreement && (
          <article className="tenancy-agreement" aria-labelledby="agreement-title">
            <div className="agreement-actions no-print">
              <p>Review every detail with the other party before printing or signing.</p>
              <button className="button" type="button" onClick={() => window.print()}>
                <Printer size={17} aria-hidden="true" /> Print / save as PDF
              </button>
            </div>
            <div className="agreement-paper">
              <p className="agreement-kicker">SAFE NYUMBA · TENANCY DOCUMENT</p>
              <h2 id="agreement-title">RESIDENTIAL TENANCY AGREEMENT</h2>
              <p className="agreement-intro">Drafted on {formatDate(agreement.draftedOn)}. The parties agree to review and complete this draft before signing.</p>

              <h3>1. Parties</h3>
              <p>This agreement is between <strong>{agreement.landlordName}</strong> ({agreement.landlordEmail}), referred to as the “Landlord”, and <strong>{agreement.tenantName}</strong>, ID/passport number <strong>{agreement.tenantId}</strong>, referred to as the “Tenant”.</p>

              <h3>2. Premises and term</h3>
              <p>The Landlord lets to the Tenant the residential premises known as <strong>{agreement.propertyName}</strong>, at <strong>{agreement.propertyAddress}</strong>. The fixed term begins on <strong>{formatDate(agreement.startDate)}</strong> and ends on <strong>{formatDate(agreement.endDate)}</strong>, subject to any written renewal or applicable law.</p>

              <h3>3. Rent and deposit</h3>
              <p>Monthly rent is <strong>{currency.format(agreement.monthlyRent)}</strong>, payable in advance on or before the <strong>{ordinal(agreement.dueDay)}</strong> day of each month using a payment method agreed by the parties. The security deposit is <strong>{currency.format(agreement.deposit)}</strong>. The Landlord will account for and return any refundable balance at the end of the tenancy, subject to lawful deductions and an itemized statement.</p>

              <h3>4. Utilities and service charges</h3>
              <p className="agreement-preserve-lines">{agreement.utilities}</p>

              <h3>5. Care, access, and use</h3>
              <p>The Tenant will use the premises as a residence, take reasonable care of it, promptly report material damage, and not make structural changes or sublet without the Landlord’s written consent. The Landlord will respect the Tenant’s quiet enjoyment and arrange access on reasonable prior notice, except in an emergency or as otherwise permitted by law.</p>

              <h3>6. Ending or renewing the tenancy</h3>
              <p>Any renewal, early termination, notice, rent review, or other change must be handled in writing and in accordance with the parties’ agreement and applicable Kenyan law. This draft does not override any mandatory legal requirement.</p>

              {agreement.specialTerms && (
                <>
                  <h3>7. Additional agreed terms</h3>
                  <p className="agreement-preserve-lines">{agreement.specialTerms}</p>
                </>
              )}

              <h3>{agreement.specialTerms ? '8' : '7'}. Signatures</h3>
              <p>By signing below, the parties confirm that they have read, understood, and agreed to the completed terms.</p>
              <div className="agreement-signatures">
                <div><span>Landlord: {agreement.landlordName}</span><span>Signature</span><span>Date</span></div>
                <div><span>Tenant: {agreement.tenantName}</span><span>Signature</span><span>Date</span></div>
                <div><span>Witness name</span><span>Signature</span><span>Date</span></div>
              </div>
              <p className="agreement-footer">Draft template only. The parties should seek independent advice and confirm that the final agreement reflects their intentions and current legal requirements.</p>
            </div>
          </article>
        )}
      </div>
    </section>
  )
}

export default TenancyDocuments
