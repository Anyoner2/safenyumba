import { useEffect, useMemo, useState } from 'react'
import { Check, CircleDollarSign } from 'lucide-react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'
import { createRentPayment, getEstates, getRentPayments, markRentPaymentPaid } from '../api.js'

const currency = new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 })

function today() {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function getPaymentStatus(payment) {
  if (payment.paid_at) return 'Paid'
  return payment.due_date < today() ? 'Overdue' : 'Due'
}

function sortPayments(payments) {
  return [...payments].sort((first, second) =>
    second.period.localeCompare(first.period)
    || first.due_date.localeCompare(second.due_date)
    || second.created_at.localeCompare(first.created_at),
  )
}

function RentPayments() {
  const { user } = useAuth()
  const location = useLocation()
  const [payments, setPayments] = useState([])
  const [estates, setEstates] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [updatingId, setUpdatingId] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [todayDate] = useState(today)
  const [currentPeriod] = useState(todayDate.slice(0, 7))

  useEffect(() => {
    let active = true
    Promise.all([getRentPayments(), getEstates()])
      .then(([items, estateItems]) => {
        if (active) {
          setPayments(sortPayments(items))
          setEstates(estateItems)
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [])

  const totals = useMemo(() => payments.reduce((summary, payment) => {
    if (payment.paid_at) summary.received += payment.amount
    else summary.outstanding += payment.amount
    if (!payment.paid_at && payment.due_date < todayDate) summary.overdue += payment.amount
    return summary
  }, { received: 0, outstanding: 0, overdue: 0 }), [payments, todayDate])

  if (!user) {
    return <Navigate to="/login/" replace state={{ from: location.pathname }} />
  }
  if (user.role !== 'landlord') return <Navigate to="/estate-dashboard/" replace />

  async function handleSubmit(event) {
    event.preventDefault()
    const formElement = event.currentTarget
    setError('')
    setNotice('')
    setSubmitting(true)
    const form = new FormData(event.currentTarget)
    const payment = {
      tenant_name: form.get('tenant_name'),
      unit_name: form.get('unit_name'),
      estate_slug: form.get('estate_slug') || null,
      amount: Number(form.get('amount')),
      period: form.get('period'),
      due_date: form.get('due_date'),
    }

    try {
      const created = await createRentPayment(payment)
      setPayments((current) => sortPayments([created, ...current]))
      setNotice('Rent due added to your ledger.')
      formElement.reset()
      formElement.elements.period.value = currentPeriod
      formElement.elements.due_date.value = todayDate
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleMarkPaid(id) {
    setError('')
    setNotice('')
    setUpdatingId(id)
    try {
      const updated = await markRentPaymentPaid(id)
      setPayments((current) => current.map((payment) => payment.id === id ? updated : payment))
      setNotice('Payment marked as received.')
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setUpdatingId('')
    }
  }

  return (
    <section className="rent-page">
      <div className="container">
        <header className="listing-header">
          <div>
            <span className="eyebrow">Property management</span>
            <h1 className="page-title">Rent payments</h1>
            <p>Keep track of rent due and record payments received from your tenants.</p>
          </div>
        </header>

        <div className="rent-summary" aria-label="Rent totals">
          <article className="rent-summary-card">
            <span>Outstanding</span>
            <strong>{currency.format(totals.outstanding)}</strong>
          </article>
          <article className="rent-summary-card">
            <span>Overdue</span>
            <strong>{currency.format(totals.overdue)}</strong>
          </article>
          <article className="rent-summary-card">
            <span>Received</span>
            <strong>{currency.format(totals.received)}</strong>
          </article>
        </div>

        <div className="rent-content">
          <form className="rent-form" onSubmit={handleSubmit}>
            <h2>Add rent due</h2>
            <p className="submission-help">Create a monthly record, then mark it received when the tenant pays.</p>
            <div className="property-field-grid">
              <label className="property-field">
                <span>Tenant name</span>
                <input name="tenant_name" autoComplete="name" maxLength="120" required />
              </label>
              <label className="property-field">
                <span>Unit or property</span>
                <input name="unit_name" maxLength="120" placeholder="e.g. Block A, Unit 4" required />
              </label>
              <label className="property-field">
                <span>Estate (optional)</span>
                <select name="estate_slug" defaultValue="">
                  <option value="">Not linked to an estate</option>
                  {estates.map((estate) => <option value={estate.slug} key={estate.slug}>{estate.name}</option>)}
                </select>
              </label>
              <label className="property-field">
                <span>Rent amount (KES)</span>
                <input name="amount" type="number" min="1" max="1000000000" step="1" required />
              </label>
              <label className="property-field">
                <span>Rent month</span>
                <input name="period" type="month" defaultValue={currentPeriod} required />
              </label>
              <label className="property-field property-field-wide">
                <span>Due date</span>
                <input name="due_date" type="date" defaultValue={todayDate} required />
              </label>
            </div>
            <button className="button rent-form-submit" type="submit" disabled={submitting}>
              <CircleDollarSign size={17} aria-hidden="true" />
              {submitting ? 'Adding rent...' : 'Add to ledger'}
            </button>
            {error && <p className="form-message" role="alert">{error}</p>}
            {notice && <p className="submission-success" role="status">{notice}</p>}
          </form>

          <section className="rent-ledger" aria-labelledby="rent-ledger-title">
            <div className="rent-ledger-heading">
              <div>
                <h2 id="rent-ledger-title">Payment ledger</h2>
                <p>Rent records for your properties, newest month first.</p>
              </div>
              <span className="result-count">{payments.length} {payments.length === 1 ? 'record' : 'records'}</span>
            </div>
            {loading ? <p className="empty-state" role="status">Loading rent records...</p> : null}
            {!loading && !error && payments.length === 0 ? (
              <p className="empty-state">No rent records yet. Add your first rent due above.</p>
            ) : null}
            {!loading && payments.length > 0 ? (
              <div className="rent-table-wrap">
                <table className="rent-table">
                  <thead>
                    <tr>
                      <th scope="col">Tenant / unit</th>
                      <th scope="col">Rent month</th>
                      <th scope="col">Due date</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Status</th>
                      <th scope="col"><span className="visually-hidden">Action</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => {
                      const status = getPaymentStatus(payment)
                      return (
                        <tr key={payment.id}>
                          <td data-label="Tenant / unit">
                            <strong>{payment.tenant_name}</strong>
                            <span>{payment.unit_name}</span>
                          </td>
                          <td data-label="Rent month">{payment.period}</td>
                          <td data-label="Due date">{payment.due_date}</td>
                          <td data-label="Amount">{currency.format(payment.amount)}</td>
                          <td data-label="Status"><span className={`rent-status rent-status-${status.toLowerCase()}`}>{status}</span></td>
                          <td data-label="Action">
                            {!payment.paid_at && (
                              <button
                                className="rent-paid-button"
                                type="button"
                                disabled={updatingId === payment.id}
                                onClick={() => handleMarkPaid(payment.id)}
                              >
                                <Check size={15} aria-hidden="true" />
                                {updatingId === payment.id ? 'Saving...' : 'Mark paid'}
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </section>
  )
}

export default RentPayments
