import { useState } from 'react'
import { Scale, ChevronDown, ChevronUp, Phone, Send, Loader2 } from 'lucide-react'
import { legalAPI } from '../services/api'

const COUNTRIES = [
  { code:'IN', name:'🇮🇳 India',      emergency:'112' },
  { code:'BD', name:'🇧🇩 Bangladesh', emergency:'999' },
  { code:'LK', name:'🇱🇰 Sri Lanka',  emergency:'119' },
  { code:'TH', name:'🇹🇭 Thailand',   emergency:'191' },
  { code:'NP', name:'🇳🇵 Nepal',      emergency:'100' },
  { code:'MM', name:'🇲🇲 Myanmar',    emergency:'199' },
  { code:'BT', name:'🇧🇹 Bhutan',     emergency:'113' },
]

const QUICK_QS = [
  'What are my rights after a road accident?',
  'What should I tell the police?',
  'How do I claim insurance after an accident?',
  'What are the fines for drunk driving?',
  'What is the fine for not wearing a helmet?',
  'What to do if the other driver runs away?',
]

const CHECKLISTS = [
  { title:'🚨 Immediate steps (first 10 mins)', items:['Check for injuries — call emergency first','Move vehicles to safe position','Turn on hazard lights','Do NOT admit fault at scene','Photograph both vehicles and damage','Get contact details of all witnesses'] },
  { title:'📋 Information to collect at scene',  items:["Other driver's name, phone, address",'Vehicle registration of all vehicles','Insurance company and policy number','Licence plate photos','Names and contacts of witnesses'] },
  { title:'📸 Photos to take',                    items:['Both vehicles from multiple angles','Close-up of all damage','Skid marks or debris','Traffic signs and signals nearby','Wide shot of full accident scene'] },
  { title:'⚖️ Your legal rights',                items:['Right to remain silent until legal advice','Right to emergency medical treatment','Right to see police report / FIR','Right to legal representation','Right to compensation from at-fault party'] },
]

function Accordion({ title, items }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border:'1px solid var(--border)', borderRadius:'12px', overflow:'hidden', marginBottom:'8px' }}>
      <button onClick={() => setOpen(!open)} style={{
        width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'12px 16px', background:'var(--bg-surface)', cursor:'pointer', textAlign:'left',
        color:'var(--text-primary)', border:'none'
      }}>
        <span style={{ fontSize:'14px', fontWeight:600, fontFamily:'var(--font-head)', letterSpacing:'0.02em' }}>{title}</span>
        {open ? <ChevronUp size={15} style={{color:'var(--text-muted)',flexShrink:0}}/> : <ChevronDown size={15} style={{color:'var(--text-muted)',flexShrink:0}}/>}
      </button>
      {open && (
        <div style={{ padding:'12px 16px', background:'var(--bg-elevated)', borderTop:'1px solid var(--border)' }}>
          <ul style={{ margin:0, paddingLeft:'16px', display:'flex', flexDirection:'column', gap:'6px' }}>
            {items.map((item,i) => (
              <li key={i} style={{ fontSize:'13px', color:'var(--text-secondary)', lineHeight:'1.5' }}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function LegalPage() {
  const [country,  setCountry]  = useState('IN')
  const [question, setQuestion] = useState('')
  const [answer,   setAnswer]   = useState(null)
  const [loading,  setLoading]  = useState(false)
  const selected = COUNTRIES.find(c => c.code === country)

  const ask = async (q) => {
    const query = (q || question).trim()
    if (!query) return
    setQuestion(''); setLoading(true); setAnswer(null)
    try { const data = await legalAPI.ask(query, country); setAnswer(data) }
    catch { setAnswer({ answer:'⚠️ Connection error. Please try again.', country:'' }) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg-base)' }}>

      {/* Header */}
      <div style={{ background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', padding:'12px 16px', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' }}>
          <Scale size={18} style={{ color:'#8338ec' }}/>
          <span style={{ fontFamily:'var(--font-head)', fontSize:'18px', fontWeight:700, letterSpacing:'0.04em', color:'var(--text-primary)' }}>
            DRIVELEGAL
          </span>
          <span style={{ fontSize:'11px', color:'var(--text-muted)', background:'var(--bg-elevated)', border:'1px solid var(--border)', borderRadius:'20px', padding:'2px 8px' }}>
            Know Your Rights
          </span>
        </div>
        <div style={{ display:'flex', gap:'6px', overflowX:'auto', paddingBottom:'4px' }}>
          {COUNTRIES.map(c => (
            <button key={c.code} onClick={() => setCountry(c.code)} style={{
              whiteSpace:'nowrap', fontSize:'12px', padding:'5px 12px', borderRadius:'20px',
              border:`1px solid ${country===c.code ? '#8338ec' : 'var(--border)'}`,
              background: country===c.code ? 'rgba(131,56,236,0.12)' : 'var(--bg-elevated)',
              color: country===c.code ? '#8338ec' : 'var(--text-secondary)',
              cursor:'pointer', fontWeight: country===c.code ? 600 : 400, flexShrink:0
            }}>
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'12px' }}>

        {/* Emergency call banner */}
        <a href={`tel:${selected?.emergency}`} style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          background:'linear-gradient(135deg,rgba(230,57,70,0.1),rgba(193,18,31,0.05))',
          border:'1px solid rgba(230,57,70,0.2)', borderRadius:'16px', padding:'14px 16px', textDecoration:'none'
        }}>
          <div>
            <div style={{ fontSize:'11px', color:'var(--accent-red)', fontFamily:'var(--font-head)', letterSpacing:'0.1em', marginBottom:'2px' }}>EMERGENCY NUMBER</div>
            <div style={{ fontFamily:'var(--font-head)', fontSize:'32px', fontWeight:700, color:'var(--accent-red)', lineHeight:1 }}>{selected?.emergency}</div>
          </div>
          <div style={{ width:'48px', height:'48px', borderRadius:'50%', background:'var(--accent-red)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <Phone size={22} color="white"/>
          </div>
        </a>

        {/* AI Answer */}
        {(answer || loading) && (
          <div style={{ background:'var(--bg-surface)', border:'1px solid rgba(131,56,236,0.2)', borderRadius:'16px', padding:'16px', boxShadow:'var(--shadow-card)' }}>
            {loading ? (
              <div style={{ display:'flex', alignItems:'center', gap:'8px', color:'#8338ec' }}>
                <Loader2 size={16} className="animate-spin"/>
                <span style={{ fontSize:'14px' }}>Getting legal information...</span>
              </div>
            ) : (
              <>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'10px' }}>
                  <Scale size={13} style={{ color:'#8338ec' }}/>
                  <span style={{ fontSize:'11px', fontWeight:600, color:'#8338ec', fontFamily:'var(--font-head)', letterSpacing:'0.08em' }}>
                    {answer.country?.toUpperCase()} — LEGAL GUIDE
                  </span>
                </div>
                <p style={{ fontSize:'14px', color:'var(--text-primary)', lineHeight:'1.6', margin:0, whiteSpace:'pre-line' }}>
                  {answer.answer}
                </p>
                {answer.relevant_laws?.length > 0 && (
                  <div style={{ marginTop:'12px', paddingTop:'12px', borderTop:'1px solid var(--border)' }}>
                    <div style={{ fontSize:'10px', color:'var(--text-muted)', letterSpacing:'0.08em', marginBottom:'6px', fontFamily:'var(--font-head)' }}>RELEVANT LAWS</div>
                    {answer.relevant_laws.map((law,i) => (
                      <div key={i} style={{ fontSize:'12px', color:'var(--text-secondary)', padding:'2px 0' }}>• {law}</div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Quick questions */}
        <div>
          <div style={{ fontSize:'11px', color:'var(--text-muted)', fontFamily:'var(--font-head)', letterSpacing:'0.1em', marginBottom:'8px' }}>COMMON QUESTIONS</div>
          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {QUICK_QS.map(q => (
              <button key={q} onClick={() => ask(q)} style={{
                textAlign:'left', fontSize:'13px', background:'var(--bg-surface)',
                border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px',
                color:'var(--text-secondary)', cursor:'pointer', transition:'all 0.15s ease',
                fontFamily:'var(--font-body)'
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#8338ec'; e.currentTarget.style.color='var(--text-primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='var(--border)'; e.currentTarget.style.color='var(--text-secondary)' }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Static checklists */}
        <div>
          <div style={{ fontSize:'11px', color:'var(--text-muted)', fontFamily:'var(--font-head)', letterSpacing:'0.1em', marginBottom:'8px' }}>AFTER ACCIDENT — CHECKLISTS</div>
          {CHECKLISTS.map(c => <Accordion key={c.title} title={c.title} items={c.items}/>)}
        </div>
      </div>

      {/* Input */}
      <div style={{ padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-surface)', flexShrink:0 }}>
        <div style={{ display:'flex', gap:'8px' }}>
          <input value={question} onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key==='Enter' && ask()}
            placeholder="Ask any legal question..."
            className="field" style={{ flex:1, padding:'10px 14px', fontSize:'14px' }}
          />
          <button onClick={() => ask()} disabled={!question.trim()||loading}
            style={{ padding:'10px 14px', background:'linear-gradient(135deg,#8338ec,#6a0dad)', color:'white', border:'none', borderRadius:'12px', cursor:'pointer', opacity:(!question.trim()||loading)?0.4:1 }}>
            {loading ? <Loader2 size={16} className="animate-spin"/> : <Send size={16}/>}
          </button>
        </div>
      </div>
    </div>
  )
}
