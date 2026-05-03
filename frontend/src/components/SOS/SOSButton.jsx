import { useState } from 'react'
import { AlertTriangle, Check } from 'lucide-react'

export default function SOSButton({ location, nearestService, onActivate }) {
  const [shared, setShared] = useState(false)

  const handleSOS = async () => {
    onActivate && onActivate()
    const locationText = location ? `https://maps.google.com/?q=${location.lat},${location.lng}` : 'Location unavailable'
    const nearestText  = nearestService ? `Nearest: ${nearestService.name} (${nearestService.distance_km}km)` : 'Finding nearest help...'
    const message = `🚨 EMERGENCY — I need help!\n📍 My location: ${locationText}\n🏥 ${nearestText}\n\nSent via RoadSoS`
    try {
      if (navigator.share) { await navigator.share({ title:'Emergency SOS', text:message }) }
      else { window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank') }
      setShared(true)
      setTimeout(() => setShared(false), 3000)
    } catch {}
  }

  return (
    <button
      onClick={handleSOS}
      className={`sos-btn ${!shared ? 'ring-pulse' : ''} w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold`}
      style={{ fontFamily:'var(--font-head)', fontSize:'18px', letterSpacing:'0.08em' }}
    >
      {shared ? (
        <><Check size={22} strokeWidth={3}/> LOCATION SHARED</>
      ) : (
        <><AlertTriangle size={22} strokeWidth={2.5}/> SOS — SHARE LOCATION</>
      )}
    </button>
  )
}
