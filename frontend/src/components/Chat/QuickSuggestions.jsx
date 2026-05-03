const SUGGESTIONS = [
  { label:'🏥 Nearest hospital',       text:'Find the nearest hospital to me' },
  { label:'🚑 Call ambulance',         text:'How do I call an ambulance?' },
  { label:'🩺 Bleeding first aid',     text:'First aid steps for severe bleeding' },
  { label:'🚔 Contact police',         text:'How do I contact police after an accident?' },
  { label:'⚖️ My legal rights',        text:'What are my legal rights after a road accident?' },
  { label:'🛣️ Report bad road',        text:'Help me report a dangerous road condition' },
]

export default function QuickSuggestions({ onSelect }) {
  return (
    <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-surface)' }}>
      <p style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.1em', marginBottom:'8px', fontFamily:'var(--font-head)' }}>
        QUICK QUESTIONS
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
        {SUGGESTIONS.map(s => (
          <button key={s.label} onClick={() => onSelect(s.text)} style={{
            fontSize:'12px', background:'var(--bg-elevated)', border:'1px solid var(--border)',
            borderRadius:'20px', padding:'5px 12px', color:'var(--text-secondary)',
            cursor:'pointer', transition:'all 0.15s ease', fontFamily:'var(--font-body)'
          }}
            onMouseEnter={e => { e.target.style.borderColor='var(--accent-red)'; e.target.style.color='var(--accent-red)' }}
            onMouseLeave={e => { e.target.style.borderColor='var(--border)'; e.target.style.color='var(--text-secondary)' }}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  )
}
