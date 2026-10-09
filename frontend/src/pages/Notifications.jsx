import { useEffect, useState } from 'react'
import { Bell, BellRing, MapPin } from 'lucide-react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

function Notifications() {
  const { user, notifications, markNotificationsRead, accountDataError } = useAuth()
  const location = useLocation()
  const [error, setError] = useState('')

  useEffect(() => {
    if (!notifications.some((notification) => !notification.read_at)) return
    markNotificationsRead().catch((requestError) => setError(requestError.message))
  }, [notifications, markNotificationsRead])

  if (!user) return <Navigate to="/login/" replace state={{ from: location.pathname }} />

  return (
    <section className="container listing-page notifications-page">
      <header className="listing-header">
        <div>
          <span className="eyebrow">Saved-home updates</span>
          <h1 className="page-title">Notifications</h1>
          <p>Get an alert here when a saved home becomes available again.</p>
        </div>
        <span className="result-count">{notifications.length} {notifications.length === 1 ? 'alert' : 'alerts'}</span>
      </header>
      {(error || accountDataError) && <p className="form-message" role="alert">{error || accountDataError}</p>}
      {notifications.length === 0 ? (
        <p className="empty-state"><Bell size={20} /> No vacancy alerts yet. Save a home to be notified when it becomes available.</p>
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <article className={`notification-item${notification.read_at ? '' : ' is-unread'}`} key={notification.id}>
              <span className="notification-icon">
                {notification.read_at ? <Bell size={18} /> : <BellRing size={18} />}
              </span>
              <div className="notification-copy">
                <strong>{notification.title}</strong>
                <p>{notification.message}</p>
                {notification.property && (
                  <span className="notification-location"><MapPin size={13} /> {notification.property.location}, {notification.property.city}</span>
                )}
                <time dateTime={notification.created_at}>{new Date(notification.created_at).toLocaleString()}</time>
              </div>
              <Link className="text-link" to={`/houses/?location=${encodeURIComponent(notification.property?.location || '')}`}>Browse homes</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

export default Notifications
