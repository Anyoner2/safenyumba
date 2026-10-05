import { useState } from 'react'
import { ArrowUpRight, BedDouble, Heart, MapPin, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

function PropertyCard({ property }) {
  const [saved, setSaved] = useState(false)

  return (
    <article className="property-card">
      <div className="property-image-wrap">
        <img className="property-image" src={property.image} alt={property.imageAlt} loading="lazy" />
        {property.verified && <span className="verified-badge"><ShieldCheck size={14} /> Verified</span>}
        <button
          className={`save-button${saved ? ' saved' : ''}`}
          type="button"
          aria-label={saved ? `Remove ${property.title} from saved homes` : `Save ${property.title}`}
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
        >
          <Heart size={17} fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>
      <div className="property-body">
        <div className="property-location"><MapPin size={14} /> {property.location}, {property.city}</div>
        <h3 className="property-title">{property.title}</h3>
        <div className="property-price">KSh {property.rent.toLocaleString('en-KE')} <span>/ month</span></div>
        <div className="property-meta">
          <span><BedDouble size={14} /> {property.bedrooms} {property.bedrooms === 1 ? 'bedroom' : 'bedrooms'}</span>
          <span>{property.amenity}</span>
        </div>
        <div className="property-bottom">
          <span className="vacancy">{property.vacant ? 'Vacant now' : 'Currently occupied'}</span>
          <span className="property-type">{property.kind}</span>
        </div>
        <Link className="property-card-link" to="/houses/" aria-label={`Browse homes like ${property.title}`}><ArrowUpRight size={17} /></Link>
      </div>
    </article>
  )
}

export default PropertyCard