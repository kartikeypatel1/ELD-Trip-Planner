import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'

function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [30, 30] })
    }
  }, [positions, map])
  return null
}

export default function RouteMap({ geometry, stops = [], restStops = [] }) {
  // GeoJSON coordinates are [lon, lat]; Leaflet wants [lat, lon]
  const positions = geometry?.coordinates?.map(([lon, lat]) => [lat, lon]) || []
  const routeStops = stops
    .filter((stop) => Array.isArray(stop.coordinates) && stop.coordinates.length === 2)
    .map((stop) => ({
      ...stop,
      position: [stop.coordinates[1], stop.coordinates[0]],
    }))
  const positionAtProgress = (progress) => positions[Math.min(
    positions.length - 1,
    Math.max(0, Math.round(progress * (positions.length - 1))),
  )]
  const routeRestStops = restStops.map((stop, index) => ({
    ...stop,
    position: positionAtProgress(stop.progress ?? ((index + 1) / (restStops.length + 1))),
  })).filter((stop) => stop.position)

  return (
    <MapContainer
      style={{ height: '420px', width: '100%' }}
      center={positions[0] || [39.8, -98.6]}
      zoom={6}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Polyline positions={positions} color="#2563eb" weight={4} />
      {routeStops.map((stop) => (
        <Marker key={`${stop.type}-${stop.label}`} position={stop.position}>
          <Popup><strong>{stop.type === 'current' ? 'Current location' : stop.type === 'pickup' ? 'Pickup' : 'Dropoff'}</strong><br />{stop.label}</Popup>
        </Marker>
      ))}
      {routeRestStops.map((stop, index) => (
        <Marker key={`rest-${index}`} position={stop.position}>
          <Popup><strong>Planned rest stop</strong><br />{stop.label}</Popup>
        </Marker>
      ))}
      <FitBounds positions={positions} />
    </MapContainer>
  )
}
