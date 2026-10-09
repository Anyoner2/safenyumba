import { useEffect, useState } from 'react'
import { Megaphone } from 'lucide-react'
import { createAnnouncement, getAnnouncements, getEstates } from '../api.js'
import { useAuth } from '../auth.jsx'

function Announcements() {
  const { user } = useAuth()
  const isManager = user?.role === 'estate_manager'
  const [announcements, setAnnouncements] = useState([])
  const [estates, setEstates] = useState([])
  const [estateFilter, setEstateFilter] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([getAnnouncements(estateFilter), getEstates()])
      .then(([items, estateItems]) => {
        if (!active) return
        setAnnouncements(items)
        setEstates(estateItems)
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
    setAnnouncements([])
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
      const created = await createAnnouncement({
        title: form.get('title'),
        body: form.get('body'),
      })
      setEstateFilter(created.estate_slug)
      if (estateFilter === created.estate_slug) {
        setAnnouncements((current) => [created, ...current.filter((item) => item.id !== created.id)])
      } else {
        setLoading(true)
        setAnnouncements([created])
      }
      setNotice('Announcement published for your assigned estate.')
      formElement.reset()
    } catch (requestError) {
      setError(requestError.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="listing-page service-page">
      <div className="container">
        <header className="listing-header">
          <div>
            <span className="eyebrow">Estate noticeboard</span>
            <h1 className="page-title">Estate announcements</h1>
            <p>Stay up to date with notices and important information from estate management.</p>
          </div>
          <label className="announcement-filter">
            <span>Filter by estate</span>
            <select value={estateFilter} onChange={handleEstateFilterChange}>
              <option value="">All estates</option>
              {estates.map((estate) => <option value={estate.slug} key={estate.slug}>{estate.name}</option>)}
            </select>
          </label>
        </header>

        {error && <p className="form-message" role="alert">{error}</p>}
        {notice && <p className="submission-success" role="status">{notice}</p>}

        {isManager && (
          <form className="rent-form announcement-form" onSubmit={handleSubmit}>
            <h2>Post an announcement</h2>
            <p className="submission-help">This will be published publicly under {estates.find((estate) => estate.slug === user.managed_estate)?.name || 'your assigned estate'}.</p>
            <div className="property-field-grid">
              <label className="property-field property-field-wide">
                <span>Title</span>
                <input name="title" maxLength="120" required />
              </label>
              <label className="property-field property-field-wide">
                <span>Announcement</span>
                <textarea name="body" rows="5" maxLength="3000" required />
              </label>
            </div>
            <button className="button rent-form-submit" type="submit" disabled={submitting}>
              <Megaphone size={17} aria-hidden="true" />
              {submitting ? 'Publishing...' : 'Publish announcement'}
            </button>
          </form>
        )}

        <section className="announcement-board" aria-label="Published announcements">
          <div className="rent-ledger-heading">
            <div>
              <h2>{estateFilter ? `${estates.find((estate) => estate.slug === estateFilter)?.name || 'Estate'} notices` : 'All estate notices'}</h2>
              <p>{announcements.length} {announcements.length === 1 ? 'announcement' : 'announcements'}</p>
            </div>
          </div>
          {loading && <p className="empty-state" role="status">Loading announcements...</p>}
          {!loading && announcements.length === 0 && (
            <p className="empty-state">No announcements have been posted yet.</p>
          )}
          {!loading && announcements.length > 0 && (
            <div className="announcement-list">
              {announcements.map((announcement) => (
                <article className="announcement-item" key={announcement.id}>
                  <span className="announcement-icon"><Megaphone size={19} aria-hidden="true" /></span>
                  <div className="announcement-copy">
                    <div className="announcement-meta">
                      <span>{announcement.estate_name}</span>
                      <time dateTime={announcement.created_at}>{new Date(announcement.created_at).toLocaleDateString()}</time>
                    </div>
                    <h3>{announcement.title}</h3>
                    <p>{announcement.body}</p>
                    <span className="announcement-author">Posted by {announcement.author_name}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </section>
  )
}

export default Announcements
