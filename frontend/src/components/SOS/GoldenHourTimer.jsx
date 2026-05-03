import { useState, useEffect } from 'react'
import { Timer } from 'lucide-react'

export default function GoldenHourTimer({ active }) {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    if (!active) return
    const stored = sessionStorage.getItem('sos_start_time')
    if (!stored) sessionStorage.setItem('sos_start_time', Date.now().toString())
    const iv = setInterval(() => {
      const start = parseInt(sessionStorage.getItem('sos_start_time') || Date.now())
      setSeconds(Math.floor((Date.now() - start) / 1000))
    }, 1000)
    return () => clearInterval(iv)
  }, [active])

  if (!active) return null

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const cls  = mins >= 45 ? 'timer-critical' : mins >= 20 ? 'timer-warn' : 'timer-safe'
  const label = mins >= 45 ? 'CRITICAL' : mins >= 20 ? 'URGENT' : 'GOLDEN HOUR'

  return (
    <div className={`flex items-center gap-2 ${cls}`} style={{ fontFamily:'var(--font-head)', letterSpacing:'0.06em' }}>
      <Timer size={15}/>
      <span style={{ fontSize:'16px', fontWeight:700 }}>
        {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
      </span>
      <span style={{ fontSize:'10px', opacity:0.8 }}>{label}</span>
    </div>
  )
}
