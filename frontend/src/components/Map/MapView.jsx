import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix default marker icons in Vite
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const SERVICE_COLORS = {
  hospital:  '#ef4444',
  police:    '#3b82f6',
  ambulance: '#f97316',
  fire:      '#dc2626',
  pharmacy:  '#22c55e',
  towing:    '#a855f7',
}

const SERVICE_ICONS = {
  hospital:  '🏥',
  police:    '🚔',
  ambulance: '🚑',
  fire:      '🚒',
  pharmacy:  '💊',
  towing:    '🔧',
}

function createServiceIcon(type) {
  const color = SERVICE_COLORS[type] || '#6b7280'
  const emoji = SERVICE_ICONS[type] || '📍'
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: ${color};
        border: 2px solid white;
        border-radius: 50%;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
      ">${emoji}</div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  })
}

function createUserIcon() {
  return L.divIcon({
    className: '',
    html: `
      <div style="
        background: #3b82f6;
        border: 3px solid white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        box-shadow: 0 0 0 6px rgba(59,130,246,0.25);
      "></div>
    `,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export default function MapView({ location, services = [], onServiceClick }) {
  const mapRef     = useRef(null)
  const mapInstance = useRef(null)
  const markersRef = useRef([])

  // Init map
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return
    mapInstance.current = L.map(mapRef.current, {
      center: [20.2961, 85.8245],
      zoom: 14,
      zoomControl: true,
    })
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapInstance.current)
    return () => {
      mapInstance.current?.remove()
      mapInstance.current = null
    }
  }, [])

  // Update user location
  useEffect(() => {
    if (!mapInstance.current || !location) return
    mapInstance.current.setView([location.lat, location.lng], 15)
    L.marker([location.lat, location.lng], { icon: createUserIcon() })
      .addTo(mapInstance.current)
      .bindPopup('<b>Your location</b>')
  }, [location])

  // Update service markers
  useEffect(() => {
    if (!mapInstance.current) return
    markersRef.current.forEach(m => m.remove())
    markersRef.current = []

    services.forEach(service => {
      const marker = L.marker([service.lat, service.lng], {
        icon: createServiceIcon(service.type)
      })
        .addTo(mapInstance.current)
        .bindPopup(`
          <div style="min-width:180px">
            <b style="font-size:14px">${service.name}</b><br/>
            <span style="color:#6b7280;font-size:12px">${service.type.toUpperCase()}</span><br/>
            <span style="font-size:13px">📍 ${service.distance_km} km away</span><br/>
            ${service.phone ? `<span style="font-size:13px">📞 ${service.phone}</span><br/>` : ''}
            ${service.reason ? `<span style="font-size:12px;color:#6b7280">${service.reason}</span>` : ''}
            ${service.phone ? `<br/><a href="tel:${service.phone}" style="color:#ef4444;font-weight:bold">Call Now</a>` : ''}
          </div>
        `)

      marker.on('click', () => onServiceClick && onServiceClick(service))
      markersRef.current.push(marker)
    })
  }, [services])

  return (
    <div className="relative w-full h-full">
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-2 z-10 text-xs">
        {Object.entries(SERVICE_ICONS).map(([type, icon]) => (
          <div key={type} className="flex items-center gap-1 py-0.5">
            <span>{icon}</span>
            <span className="capitalize text-gray-600">{type}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
