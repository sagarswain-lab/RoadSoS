import { useState, useRef } from 'react'
import { Flag, Camera, MapPin, CheckCircle, Search, Loader2, X, AlertCircle } from 'lucide-react'
import { reportAPI } from '../services/api'

const CONDITIONS = [
  { value:'pothole',  label:'🕳️ Pothole',         desc:'Hole in road surface' },
  { value:'flooding', label:'🌊 Flooding',         desc:'Water logging on road' },
  { value:'signage',  label:'🚧 Missing Signage',  desc:'Signs missing or damaged' },
  { value:'lighting', label:'💡 Street Light',     desc:'Light not working' },
  { value:'barrier',  label:'🛡️ Broken Barrier',   desc:'Safety barrier damaged' },
  { value:'debris',   label:'🪨 Road Debris',      desc:'Obstruction on road' },
  { value:'erosion',  label:'⛰️ Erosion',          desc:'Road erosion or landslide' },
  { value:'other',    label:'❓ Other',             desc:'Other road issue' },
]

const STATUS_META = {
  'Submitted':    { color:'#f4842d', bg:'rgba(244,132,45,0.12)' },
  'Under Review': { color:'#3a86ff', bg:'rgba(58,134,255,0.12)' },
  'In Progress':  { color:'#8338ec', bg:'rgba(131,56,236,0.12)' },
  'Resolved':     { color:'#06d6a0', bg:'rgba(6,214,160,0.12)' },
}
const STATUSES = ['Submitted','Under Review','In Progress','Resolved']

export default function ReportPage({ location }) {
  const [condition,    setCond]    = useState('')
  const [description,  setDesc]   = useState('')
  const [photo,        setPhoto]   = useState(null)
  const [photoPreview, setPreview] = useState(null)
  const [submitting,   setSub]     = useState(false)
  const [submitted,    setResult]  = useState(null)
  const [trackId,      setTrackId] = useState('')
  const [trackResult,  setTrack]   = useState(null)
  const [tracking,     setTrk]     = useState(false)
  const [tab,          setTab]     = useState('report')
  const fileRef = useRef(null)

  const handlePhoto = (e) => {
    const file = e.target.files[0]; if(!file) return
    const r = new FileReader()
    r.onload = ev => { setPhoto(ev.target.result.split(',')[1]); setPreview(ev.target.result) }
    r.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!condition) return alert('Please select a road condition')
    if (!location)  return alert('Location not available. Please allow GPS access.')
    setSub(true)
    try {
      const data = await reportAPI.submit({ lat:location.lat, lng:location.lng, condition, description, photo_base64:photo })
      setResult(data); setCond(''); setDesc(''); setPhoto(null); setPreview(null)
    } catch { alert('Failed to submit. Check your connection.') }
    finally { setSub(false) }
  }

  const handleTrack = async () => {
    if (!trackId.trim()) return
    setTrk(true); setTrack(null)
    try { setTrack(await reportAPI.getStatus(trackId.trim().toUpperCase())) }
    catch { setTrack({ error:'Report not found. Please check the ID.' }) }
    finally { setTrk(false) }
  }

  const S = {
    container: { flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'var(--bg-base)' },
    header: { background:'var(--bg-surface)', borderBottom:'1px solid var(--border)', padding:'12px 16px', flexShrink:0 },
    headerTitle: { display:'flex', alignItems:'center', gap:'8px', marginBottom:'12px' },
    tabRow: { display:'flex' },
    tab: (active) => ({ flex:1, padding:'8px', fontSize:'13px', fontWeight:600, background:'none', border:'none', borderBottom:`2px solid ${active?'#06d6a0':'transparent'}`, color: active?'#06d6a0':'var(--text-muted)', cursor:'pointer', transition:'all 0.15s', fontFamily:'var(--font-head)', letterSpacing:'0.04em' }),
    content: { flex:1, overflowY:'auto', padding:'16px' },
    locationBar: { display:'flex', alignItems:'center', gap:'8px', background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'12px', padding:'10px 14px', marginBottom:'14px' },
    condGrid: { display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px', marginBottom:'14px' },
    condCard: (active) => ({ textAlign:'left', padding:'12px', borderRadius:'12px', border:`1px solid ${active?'#06d6a0':'var(--border)'}`, background: active?'rgba(6,214,160,0.08)':'var(--bg-surface)', cursor:'pointer', transition:'all 0.15s' }),
    successBox: { background:'rgba(6,214,160,0.1)', border:'1px solid rgba(6,214,160,0.3)', borderRadius:'16px', padding:'16px', marginBottom:'14px' },
    trackBox: { background:'var(--bg-surface)', border:'1px solid var(--border)', borderRadius:'16px', padding:'16px', marginBottom:'12px' },
  }

  return (
    <div style={S.container}>
      <div style={S.header}>
        <div style={S.headerTitle}>
          <Flag size={18} style={{color:'#06d6a0'}}/>
          <span style={{fontFamily:'var(--font-head)',fontSize:'18px',fontWeight:700,letterSpacing:'0.04em',color:'var(--text-primary)'}}>ROADWATCH</span>
          <span style={{fontSize:'11px',color:'var(--text-muted)',background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'20px',padding:'2px 8px'}}>Road Reporting</span>
        </div>
        <div style={S.tabRow}>
          <button style={S.tab(tab==='report')} onClick={()=>setTab('report')}>📝 SUBMIT REPORT</button>
          <button style={S.tab(tab==='track')}  onClick={()=>setTab('track')}>🔍 TRACK REPORT</button>
        </div>
      </div>

      <div style={S.content}>

        {tab === 'report' && (
          <>
            {/* Success */}
            {submitted && (
              <div style={S.successBox}>
                <div style={{display:'flex',alignItems:'center',gap:'8px',marginBottom:'6px'}}>
                  <CheckCircle size={18} style={{color:'#06d6a0'}}/>
                  <span style={{fontFamily:'var(--font-head)',fontSize:'16px',fontWeight:700,color:'#06d6a0'}}>REPORT SUBMITTED</span>
                </div>
                <p style={{fontSize:'13px',color:'var(--text-secondary)',margin:'0 0 4px'}}>
                  ID: <span style={{fontFamily:'monospace',fontWeight:700,color:'var(--text-primary)'}}>{submitted.report_id}</span>
                </p>
                <p style={{fontSize:'12px',color:'var(--text-muted)',margin:0}}>{submitted.message}</p>
                <button onClick={()=>{setResult(null);setTab('track');setTrackId(submitted.report_id)}}
                  style={{marginTop:'10px',fontSize:'12px',color:'#06d6a0',background:'none',border:'none',cursor:'pointer',textDecoration:'underline'}}>
                  Track this report →
                </button>
              </div>
            )}

            {/* Location */}
            <div style={S.locationBar}>
              <MapPin size={14} style={{color:'var(--accent-red)',flexShrink:0}}/>
              <span style={{fontSize:'13px',color:'var(--text-secondary)',flex:1}}>
                {location ? `GPS: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}` : 'Waiting for GPS...'}
              </span>
              {location && <span style={{fontSize:'11px',color:'#06d6a0',fontWeight:600}}>✓ LOCATED</span>}
            </div>

            {/* Condition */}
            <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-head)',letterSpacing:'0.1em',marginBottom:'8px'}}>SELECT ROAD CONDITION *</div>
            <div style={S.condGrid}>
              {CONDITIONS.map(c => (
                <button key={c.value} onClick={()=>setCond(c.value)} style={S.condCard(condition===c.value)}>
                  <div style={{fontSize:'15px',marginBottom:'2px'}}>{c.label}</div>
                  <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{c.desc}</div>
                </button>
              ))}
            </div>

            {/* Description */}
            <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-head)',letterSpacing:'0.1em',marginBottom:'8px'}}>DESCRIPTION (OPTIONAL)</div>
            <textarea value={description} onChange={e=>setDesc(e.target.value)}
              placeholder="Describe the issue — severity, lane affected, landmarks nearby..."
              rows={3} className="field"
              style={{width:'100%',padding:'10px 14px',fontSize:'14px',resize:'none',marginBottom:'14px'}}
            />

            {/* Photo */}
            <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-head)',letterSpacing:'0.1em',marginBottom:'8px'}}>PHOTO (OPTIONAL)</div>
            {photoPreview ? (
              <div style={{position:'relative',marginBottom:'14px'}}>
                <img src={photoPreview} alt="Road issue" style={{width:'100%',height:'160px',objectFit:'cover',borderRadius:'12px',border:'1px solid var(--border)'}}/>
                <button onClick={()=>{setPhoto(null);setPreview(null)}}
                  style={{position:'absolute',top:'8px',right:'8px',background:'var(--bg-surface)',border:'1px solid var(--border)',borderRadius:'50%',padding:'4px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <X size={13} style={{color:'var(--text-primary)'}}/>
                </button>
              </div>
            ) : (
              <button onClick={()=>fileRef.current?.click()}
                style={{width:'100%',border:'2px dashed var(--border)',borderRadius:'12px',padding:'24px',display:'flex',flexDirection:'column',alignItems:'center',gap:'8px',cursor:'pointer',background:'transparent',marginBottom:'14px',transition:'border-color 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.borderColor='#06d6a0'}
                onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}
              >
                <Camera size={24} style={{color:'var(--text-muted)'}}/>
                <span style={{fontSize:'13px',color:'var(--text-muted)'}}>Tap to add photo</span>
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{display:'none'}}/>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={!condition||!location||submitting}
              style={{width:'100%',padding:'14px',background:'linear-gradient(135deg,#06d6a0,#05a87d)',color:'white',border:'none',borderRadius:'12px',fontFamily:'var(--font-head)',fontSize:'16px',fontWeight:700,letterSpacing:'0.06em',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:'8px',opacity:(!condition||!location||submitting)?0.4:1,boxShadow:'0 4px 16px rgba(6,214,160,0.3)'}}>
              {submitting ? <><Loader2 size={18} className="animate-spin"/>SUBMITTING...</> : <><Flag size={18}/>SUBMIT ROAD REPORT</>}
            </button>
          </>
        )}

        {tab === 'track' && (
          <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
            <div style={S.trackBox}>
              <p style={{fontSize:'13px',color:'var(--text-secondary)',margin:'0 0 12px'}}>Enter your report ID to check its status</p>
              <div style={{display:'flex',gap:'8px'}}>
                <input value={trackId} onChange={e=>setTrackId(e.target.value)}
                  onKeyDown={e=>e.key==='Enter'&&handleTrack()}
                  placeholder="e.g. RSR-A1B2C3D4"
                  className="field" style={{flex:1,padding:'10px 14px',fontSize:'14px',fontFamily:'monospace'}}
                />
                <button onClick={handleTrack} disabled={!trackId.trim()||tracking}
                  style={{padding:'10px 14px',background:'linear-gradient(135deg,#06d6a0,#05a87d)',color:'white',border:'none',borderRadius:'12px',cursor:'pointer',opacity:(!trackId.trim()||tracking)?0.4:1}}>
                  {tracking ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                </button>
              </div>
            </div>

            {trackResult && (
              <div style={S.trackBox}>
                {trackResult.error ? (
                  <div style={{display:'flex',alignItems:'center',gap:'8px',color:'var(--accent-red)'}}>
                    <AlertCircle size={16}/><span style={{fontSize:'14px'}}>{trackResult.error}</span>
                  </div>
                ) : (
                  <>
                    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'12px'}}>
                      <span style={{fontFamily:'monospace',fontSize:'15px',fontWeight:700,color:'var(--text-primary)'}}>{trackResult.report_id}</span>
                      <span style={{
                        fontSize:'11px',fontWeight:700,padding:'4px 10px',borderRadius:'20px',fontFamily:'var(--font-head)',letterSpacing:'0.06em',
                        background: STATUS_META[trackResult.status]?.bg || 'var(--bg-elevated)',
                        color: STATUS_META[trackResult.status]?.color || 'var(--text-muted)',
                        border:`1px solid ${STATUS_META[trackResult.status]?.color || 'var(--border)'}40`
                      }}>
                        {trackResult.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:'6px',fontSize:'13px',color:'var(--text-secondary)',marginBottom:'16px'}}>
                      <p style={{margin:0}}><span style={{color:'var(--text-muted)'}}>Condition: </span>{trackResult.condition}</p>
                      <p style={{margin:0}}><span style={{color:'var(--text-muted)'}}>Submitted: </span>{new Date(trackResult.created_at).toLocaleString()}</p>
                      <p style={{margin:0}}><span style={{color:'var(--text-muted)'}}>Updated: </span>{new Date(trackResult.updated_at).toLocaleString()}</p>
                    </div>

                    {/* Status timeline */}
                    <div style={{fontSize:'11px',color:'var(--text-muted)',fontFamily:'var(--font-head)',letterSpacing:'0.1em',marginBottom:'10px'}}>STATUS TIMELINE</div>
                    <div style={{display:'flex',flexDirection:'column',gap:'0'}}>
                      {STATUSES.map((s,i) => {
                        const currIdx = STATUSES.indexOf(trackResult.status)
                        const done = i <= currIdx
                        const meta = STATUS_META[s]
                        return (
                          <div key={s} style={{display:'flex',alignItems:'center',gap:'12px',padding:'6px 0',position:'relative'}}>
                            <div style={{width:'24px',height:'24px',borderRadius:'50%',background:done?meta.color:'var(--bg-elevated)',border:`2px solid ${done?meta.color:'var(--border)'}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,zIndex:1}}>
                              {done && <span style={{color:'white',fontSize:'12px',fontWeight:700}}>✓</span>}
                            </div>
                            {i < STATUSES.length-1 && (
                              <div style={{position:'absolute',left:'11px',top:'28px',width:'2px',height:'20px',background:done&&i<currIdx?meta.color:'var(--border)',zIndex:0}}/>
                            )}
                            <span style={{fontSize:'13px',fontWeight:done?600:400,color:done?'var(--text-primary)':'var(--text-muted)'}}>{s}</span>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
