import { useEffect } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'

const nairobiCenter = [-1.2864, 36.8172]

function MapViewport({ location }) {
  const map = useMap()

  useEffect(() => {
    if (location) map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 15))
  }, [location, map])

  return null
}

function MapClickHandler({ onSelect }) {
  useMapEvents({
    click(event) {
      onSelect?.({
        latitude: Number(event.latlng.lat.toFixed(6)),
        longitude: Number(event.latlng.lng.toFixed(6)),
      })
    },
  })
  return null
}

function PropertyMap({ properties = [], location, onSelect, className = '' }) {
  const center = location
    ? [location.latitude, location.longitude]
    : nairobiCenter

  return (
    <div className={`property-map ${className}`}>
      <MapContainer
        center={center}
        zoom={location ? 15 : 11}
        scrollWheelZoom
        className={onSelect ? 'property-map-canvas is-selectable' : 'property-map-canvas'}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport location={location} />
        <MapClickHandler onSelect={onSelect} />
        {properties.filter((property) =>
          Number.isFinite(property.latitude) && Number.isFinite(property.longitude),
        ).map((property) => (
          <CircleMarker
            key={property.id}
            center={[property.latitude, property.longitude]}
            radius={9}
            pathOptions={{ color: '#fff', fillColor: '#174d3a', fillOpacity: 1, weight: 2 }}
          >
            <Popup>
              <strong>{property.title}</strong>
              <br />
              {property.locationAccuracy === 'area' ? 'Approximate area' : 'Property location'}
              {' · '}
              KSh {Number(property.rent).toLocaleString('en-KE')} / month
            </Popup>
          </CircleMarker>
        ))}
        {location && (
          <CircleMarker
            center={[location.latitude, location.longitude]}
            radius={10}
            pathOptions={{ color: '#fff', fillColor: '#c46646', fillOpacity: 1, weight: 3 }}
          >
            <Popup>Selected property location</Popup>
          </CircleMarker>
        )}
      </MapContainer>
      <div className="map-attribution-note">Map data &copy; OpenStreetMap contributors</div>
    </div>
  )
}

export default PropertyMap
