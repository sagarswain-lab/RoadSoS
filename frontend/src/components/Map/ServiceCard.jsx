import { Phone, Star } from 'lucide-react'

const TYPE_META = {
  hospital:  { emoji:'🏥', color:'#e63946', bg:'rgba(230,57,70,0.1)' },
  police:    { emoji:'🚔', color:'#3a86ff', bg:'rgba(58,134,255,0.1)' },
  ambulance: { emoji:'🚑', color:'#f4842d', bg:'rgba(244,132,45,0.1)' },
  fire:      { emoji:'🚒', color:'#dc2626', bg:'rgba(220,38,38,0.1)' },
  pharmacy:  { emoji:'💊', color:'#06d6a0', bg:'rgba(6,214,160,0.1)' },
  towing:    { emoji:'🔧', color:'#8338ec', bg:'rgba(131,56,236,0.1)' },
}

export default function ServiceCard({ service, onClick, highlighted }) {
  const meta = TYPE_META[service.type] || { emoji:'📍', color:'var(--text-muted)', bg:'var(--bg-elevated)' }

  return (
    <div
      onClick={() => onClick && onClick(service)}
      className={`service-card ${highlighted ? 'highlighted' : ''} cursor-pointer p-3`}
    >
      <div style={{ display:'flex', alignItems:'flex-start', gap:'10px' }}>
        {/* Icon */}
        <div style={{
          width:'38px', height:'38px', borderRadius:'10px', flexShrink:0,
          background: meta.bg, display:'flex', alignItems:'center', justifyContent:'center',
          fontSize:'18px', border:`1px solid ${meta.color}25`
        }}>
          {meta.emoji}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'2px' }}>
            <span style={{
              fontSize:'10px', fontWeight:600, padding:'2px 8px', borderRadius:'20px',
              background: meta.bg, color: meta.color,
              fontFamily:'var(--font-head)', letterSpacing:'0.08em'
            }}>
              {service.type.toUpperCase()}
            </span>
            {service.score > 80 && (
              <span style={{ fontSize:'10px', color:'#f4842d', display:'flex', alignItems:'center', gap:'2px' }}>
                <Star size={9} fill="currentColor"/> TOP
              </span>
            )}
          </div>
          <p style={{ fontSize:'14px', fontWeight:600, color:'var(--text-primary)', margin:'0 0 2px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:'var(--font-head)' }}>
            {service.name}
          </p>
          {service.reason && (
            <p style={{ fontSize:'11px', color:'var(--text-muted)', margin:0 }}>{service.reason}</p>
          )}
        </div>

        {/* Distance */}
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-head)', fontSize:'18px', fontWeight:700, color: meta.color, lineHeight:1 }}>
            {service.distance_km}
          </div>
          <div style={{ fontSize:'10px', color:'var(--text-muted)' }}>km</div>
        </div>
      </div>

      <div style={{ display:'flex', gap:'8px', marginTop:'10px' }}>
        {service.phone && (
          <a href={`tel:${service.phone}`} onClick={e => e.stopPropagation()}
            style={{
              display:'flex', alignItems:'center', gap:'6px',
              background: meta.color, color:'white', borderRadius:'8px',
              padding:'6px 12px', fontSize:'11px', fontWeight:700,
              fontFamily:'var(--font-head)', letterSpacing:'0.04em', textDecoration:'none',
              boxShadow:`0 4px 12px ${meta.color}40`
            }}>
            <Phone size={11}/> CALL
          </a>
        )}
        {service.map_url && (
          <a href={service.map_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
            style={{
              display:'flex', alignItems:'center', gap:'6px',
              background: 'var(--bg-elevated)', color: 'var(--text-primary)', borderRadius:'8px',
              border: '1px solid var(--border)',
              padding:'6px 12px', fontSize:'11px', fontWeight:700,
              fontFamily:'var(--font-head)', letterSpacing:'0.04em', textDecoration:'none'
            }}>
            📍 DIRECTIONS
          </a>
        )}
      </div>
    </div>
  )
}
