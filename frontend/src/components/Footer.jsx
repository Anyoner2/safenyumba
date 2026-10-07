import { House } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

function Footer() {
  const isListPropertyPage = useLocation().pathname.replace(/\/+$/, '') === '/list-property'

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-main">
          <div>
            <Link className="brand" to="/">
              <span className="brand-mark"><House size={19} /></span>
              <span className="brand-name">Safe Nyumba</span>
            </Link>
            <p className="footer-intro">A clearer, safer way to find your next home in Kenya.</p>
          </div>
          <nav className="footer-nav" aria-label="Footer navigation">
            <Link to="/houses/">Find houses</Link>
            <Link to="/estates/">Explore estates</Link>
            <Link to="/list-property/">List a property</Link>
            {!isListPropertyPage && <Link to="/login/">Login</Link>}
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© Safe Nyumba</span>
          <span>Verified homes. Better moves.</span>
        </div>
      </div>
    </footer>
  )
}

export default Footer