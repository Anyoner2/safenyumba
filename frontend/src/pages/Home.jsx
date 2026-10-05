import { ArrowRight, CalendarDays, Handshake, House, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import Hero from '../components/Hero.jsx'
import PropertyCard from '../components/PropertyCard.jsx'
import properties from '../propertyData.js'

const steps = [
  { title: 'Find a house', copy: 'Search available, verified homes by neighbourhood and budget.', Icon: Search },
  { title: 'View the property', copy: 'See clear details, amenities, and current availability.', Icon: House },
  { title: 'Request a viewing', copy: 'Choose a time that works and meet the local property contact.', Icon: CalendarDays },
  { title: 'Connect with the owner', copy: 'Ask questions directly and take the next step with confidence.', Icon: Handshake },
]

function Home() {
  return (
    <>
      <Hero />
      <section className="featured-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Places worth seeing</span>
              <h2>Featured homes</h2>
              <p>Fresh listings, checked for availability and ready for your next move.</p>
            </div>
            <Link className="text-link" to="/houses/">Browse all houses <ArrowRight size={16} /></Link>
          </div>
          <div className="property-grid">
            {properties.slice(0, 3).map((property) => <PropertyCard key={property.id} property={property} />)}
          </div>
        </div>
      </section>
      <section className="how-section">
        <div className="container">
          <div className="section-heading">
            <div>
              <span className="eyebrow">From search to keys</span>
              <h2>How Safe Nyumba works</h2>
            </div>
          </div>
          <div className="steps">
            {steps.map(({ title, copy, Icon }, index) => (
              <article className="step" key={title}>
                <div className="step-icon"><Icon size={22} /><span className="step-number">{index + 1}</span></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
          <div className="estate-strip">
            <div className="estate-strip-copy">
              <span className="eyebrow">Neighbourhood first</span>
              <h2>Find the right place to put down roots.</h2>
              <p>Explore established estates, learn what each area offers, and find homes that fit the way you live.</p>
              <Link className="button button-light" to="/estates/">Explore estates <ArrowRight size={16} /></Link>
            </div>
            <img
              className="estate-strip-image"
              src="https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=85"
              alt="Modern home framed by a leafy garden"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </>
  )
}

export default Home