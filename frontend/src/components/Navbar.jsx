import { useState } from 'react'
import { House, Menu, X } from 'lucide-react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../auth.jsx'

const links = [
  { to: '/', label: 'Home', end: true },
  { to: '/houses/', label: 'Find Houses' },
  { to: '/estates/', label: 'Estates' },
  { to: '/register/', label: 'List Property' },
]

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const isRegisterPage = useLocation().pathname.replace(/\/+$/, '') === '/register'
  const { user, signOut } = useAuth()
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
          {links.map((link) => (
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
                {!isRegisterPage && <Link className="login-link" to="/login/" onClick={closeMenu}>Login</Link>}
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
              {!isRegisterPage && <Link className="login-link" to="/login/">Login</Link>}
              <Link className="button nav-signup" to="/register/">Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}

export default Navbar