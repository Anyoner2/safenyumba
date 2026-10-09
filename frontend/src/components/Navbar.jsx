import { useState } from 'react'
import { House, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/houses/', label: 'Find Houses' },
  { to: '/estates/', label: 'Estates' },
  { to: '/announcements/', label: 'Announcements' },
  { to: '/list-property/', label: 'List Property' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const isListPropertyPage = useLocation().pathname.replace(/\/+$/, '') === '/list-property'
  const { user, signOut, notifications } = useAuth()
  const dashboardLink = user?.role === 'estate_manager'
    ? { to: '/estate-dashboard/', label: 'Estate dashboard' }
    : user ? { to: '/dashboard/', label: 'Dashboard' } : null
  const unreadCount = notifications.filter((notification) => !notification.read_at).length
  const userHandle = user?.email?.split('@')[0]
    || user?.full_name?.trim().replace(/\s+/g, '').toLowerCase()
    || 'there'

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link className="brand" to="/" aria-label="Safe Nyumba home" onClick={closeMenu}>
          <span className="brand-mark"><House size={19} strokeWidth={2.2} /></span>
          <span className="brand-name">Safe Nyumba</span>
        </Link>
        <button
          className="menu-toggle"
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <nav className={`nav-links${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
          {[
            ...links,
            ...(dashboardLink ? [dashboardLink] : []),
            ...(user ? [{ to: '/maintenance/', label: 'Maintenance' }] : []),
            ...(user?.role === 'landlord' ? [
              { to: '/rent-payments/', label: 'Rent payments' },
              { to: '/tenancy-documents/', label: 'Tenancy documents' },
            ] : []),
            ...(user ? [
              { to: '/saved-homes/', label: 'Saved homes' },
              { to: '/notifications/', label: `Alerts${unreadCount ? ` (${unreadCount})` : ''}` },
            ] : []),
          ].map((link) => (
            <NavLink
              key={link.to}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              to={link.to}
              end={link.end}
              onClick={closeMenu}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="nav-mobile-actions">
            {user ? (
              <>
                <span className="welcome-user">Welcome @{userHandle}</span>
                <button className="login-link nav-logout" type="button" onClick={() => { closeMenu(); signOut() }}>Sign out</button>
              </>
            ) : (
              <>
                {!isListPropertyPage && <Link className="login-link" to="/login/" onClick={closeMenu}>Login</Link>}
                <Link className="button nav-signup" to="/register/" onClick={closeMenu}>Sign Up</Link>
              </>
            )}
          </div>
        </nav>
        <div className="nav-actions">
          {user ? (
            <>
              <span className="welcome-user">Welcome @{userHandle}</span>
              <button className="login-link nav-logout" type="button" onClick={signOut}>Sign out</button>
            </>
          ) : (
            <>
              {!isListPropertyPage && <Link className="login-link" to="/login/">Login</Link>}
              <Link className="button nav-signup" to="/register/">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar