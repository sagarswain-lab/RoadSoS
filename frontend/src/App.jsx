import { useState, useEffect } from 'react'
import { MapPin, MessageCircle, Scale, Flag, Loader2, RefreshCw, Moon, Sun, Shield, Activity, ChevronRight } from 'lucide-react'
import MapView from './components/Map/MapView'
import ServiceCard from './components/Map/ServiceCard'
import GoldenHourTimer from './components/SOS/GoldenHourTimer'
import SOSButton from './components/SOS/SOSButton'
import ChatPage from './pages/ChatPage'
import LegalPage from './pages/LegalPage'
import ReportPage from './pages/ReportPage'
import { useGeolocation } from './hooks/useGeolocation'
import { emergencyAPI } from './services/api'

const TABS = [
  { id:'emergency', label:'Emergency', icon:MapPin,        color:'#e63946' },
  { id:'chat',      label:'AI Chat',   icon:MessageCircle, color:'#3a86ff' },
  { id:'legal',     label:'Legal',     icon:Scale,         color:'#8338ec' },
  { id:'report',    label:'Report',    icon:Flag,          color:'#06d6a0' },
]

function NavItem({ tab, activeTab, setActiveTab }) {
  const Icon = tab.icon
  const isActive = activeTab === tab.id
  return (
    <button
      onClick={() => setActiveTab(tab.id)}
      className={`nav-item flex items-center gap-3 w-full px-4 py-3 text-left ${isActive?'active':''}`}
      style={isActive ? { color:tab.color, background:`${tab.color}18` } : {}}
    >
      <Icon size={20} strokeWidth={isActive?2.5:1.8} style={isActive?{color:tab.color}:{}} />
      <span className="sidebar-label" style={{ fontFamily:'var(--font-head)', letterSpacing:'0.04em', fontSize:'15px', fontWeight:600 }}>
        {tab.label}
      </span>
      {isActive && <ChevronRight size={14} className="ml-auto sidebar-label" style={{color:tab.color,opacity:0.6}} />}
    </button>
  )
}

export default function App() {
  const { location, loading:geoLoading } = useGeolocation()
  const [dark,          setDark]          = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [activeTab,     setActiveTab]     = useState('emergency')
  const [services,      setServices]      = useState([])
  const [loadingServices,setLS]           = useState(false)
  const [selectedService,setSS]           = useState(null)
  const [sosActive,     setSosActive]     = useState(false)
  const [locationInfo,  setLocationInfo]  = useState(null)

  useEffect(() => { document.documentElement.classList.toggle('dark', dark) }, [dark])
  useEffect(() => { if (!location) return; fetchServices(); fetchLocationInfo() }, [location])

  const fetchServices = async () => {
    if (!location) return
    setLS(true)
    try {
      const data = await emergencyAPI.getNearby(location.lat, location.lng)
      setServices(data.services || [])
    } catch(e) { console.error(e) }
    finally { setLS(false) }
  }

  const fetchLocationInfo = async () => {
    if (!location) return
    try { const info = await emergencyAPI.geocode(location.lat, location.lng); setLocationInfo(info) } catch {}
  }

  const activeTabData = TABS.find(t => t.id === activeTab)

  return (
    <div className="layout-shell">
      <div className="bg-grid" />

      {/* SIDEBAR */}
      <aside className="sidebar glass border-r relative z-10" style={{borderColor:'var(--border)'}}>
        <div style={{height:'3px',background:'linear-gradient(90deg,#e63946,#f4842d,#3a86ff)',flexShrink:0}} />

        <div className="sidebar-logo flex items-center gap-3 px-5 py-5 border-b" style={{borderColor:'var(--border)'}}>
          <div className="ring-pulse w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{background:'linear-gradient(135deg,#e63946,#c1121f)'}}>
            <Shield size={18} color="white" strokeWidth={2.5} />
          </div>
          <div className="sidebar-label">
            <div style={{fontFamily:'var(--font-head)',fontSize:'22px',fontWeight:700,lineHeight:1,letterSpacing:'0.04em',color:'var(--text-primary)'}}>
              ROAD<span style={{color:'#e63946'}}>SoS</span>
            </div>
            <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.12em',marginTop:'1px'}}>SAFETY COMPANION</div>
          </div>
        </div>

        {locationInfo && (
          <div className="sidebar-label px-5 py-3 border-b" style={{borderColor:'var(--border)'}}>
            <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',marginBottom:'2px'}}>CURRENT LOCATION</div>
            <div style={{fontSize:'13px',color:'var(--text-secondary)',fontWeight:500}}>{locationInfo.city || locationInfo.state || '—'}</div>
            <div style={{fontSize:'11px',color:'var(--text-muted)'}}>{locationInfo.country} {locationInfo.country_code && `· ${locationInfo.country_code}`}</div>
          </div>
        )}

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {TABS.map(tab => <NavItem key={tab.id} tab={tab} activeTab={activeTab} setActiveTab={setActiveTab} />)}
        </nav>

        <div className="sidebar-label border-t px-4 py-4" style={{borderColor:'var(--border)'}}>
          <div style={{fontSize:'10px',color:'var(--text-muted)',letterSpacing:'0.1em',marginBottom:'8px'}}>NEARBY SERVICES</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'6px'}}>
            {[
              {label:'Hospitals', count:services.filter(s=>s.type==='hospital').length,   color:'#e63946'},
              {label:'Police',    count:services.filter(s=>s.type==='police').length,     color:'#3a86ff'},
              {label:'Ambulance', count:services.filter(s=>s.type==='ambulance').length,  color:'#f4842d'},
              {label:'Pharmacy',  count:services.filter(s=>s.type==='pharmacy').length,   color:'#06d6a0'},
            ].map(s => (
              <div key={s.label} style={{background:'var(--bg-elevated)',borderRadius:'8px',padding:'6px 8px',border:'1px solid var(--border)'}}>
                <div style={{fontFamily:'var(--font-head)',fontSize:'22px',fontWeight:700,color:s.color,lineHeight:1}}>{loadingServices?'—':s.count}</div>
                <div style={{fontSize:'10px',color:'var(--text-muted)',marginTop:'1px'}}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t px-4 py-3" style={{borderColor:'var(--border)'}}>
          <button onClick={() => setDark(!dark)}
            className="sidebar-label flex items-center gap-3 w-full px-3 py-2 rounded-xl transition-all"
            style={{background:'var(--bg-glass-dark)',color:'var(--text-secondary)',border:'1px solid var(--border)',cursor:'pointer'}}>
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
            <span style={{fontSize:'13px',fontWeight:500}}>{dark?'Light mode':'Dark mode'}</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="main-content relative z-10">

        {/* Top bar */}
        <header className="glass border-b flex items-center justify-between px-4 py-3 gap-3 flex-shrink-0"
          style={{borderColor:'var(--border)',minHeight:'64px'}}>
          <div className="flex items-center gap-2 md:hidden">
            <div className="ring-pulse w-8 h-8 rounded-lg flex items-center justify-center"
              style={{background:'linear-gradient(135deg,#e63946,#c1121f)'}}>
              <Shield size={16} color="white" strokeWidth={2.5}/>
            </div>
            <span style={{fontFamily:'var(--font-head)',fontSize:'20px',fontWeight:700,color:'var(--text-primary)'}}>
              ROAD<span style={{color:'#e63946'}}>SoS</span>
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {activeTabData && <>
              <activeTabData.icon size={18} style={{color:activeTabData.color}} />
              <span style={{fontFamily:'var(--font-head)',fontSize:'20px',fontWeight:700,color:'var(--text-primary)',letterSpacing:'0.04em'}}>
                {activeTabData.label.toUpperCase()}
              </span>
            </>}
          </div>

          <div className="flex items-center gap-2">
            <GoldenHourTimer active={sosActive} />
            <button onClick={() => setDark(!dark)}
              className="md:hidden p-2 rounded-xl"
              style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',color:'var(--text-secondary)',cursor:'pointer'}}>
              {dark ? <Sun size={16}/> : <Moon size={16}/>}
            </button>
          </div>
        </header>

        {/* SOS Button */}
        <div className="flex-shrink-0 px-4 pt-3">
          <SOSButton location={location} nearestService={services[0]||null}
            onActivate={() => { setSosActive(true); setActiveTab('emergency') }} />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">

          {activeTab === 'emergency' && (
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              <div className="flex-1 p-3 min-h-0" style={{minHeight:'220px'}}>
                {geoLoading ? (
                  <div className="h-full rounded-2xl skeleton flex items-center justify-center" style={{minHeight:'220px'}}>
                    <div className="flex items-center gap-2" style={{color:'var(--text-muted)'}}>
                      <Loader2 size={18} className="animate-spin"/>
                      <span style={{fontSize:'14px'}}>Acquiring GPS signal...</span>
                    </div>
                  </div>
                ) : (
                  <MapView location={location} services={services} onServiceClick={setSS}/>
                )}
              </div>

              <div className="md:w-80 lg:w-96 flex flex-col overflow-hidden border-t md:border-t-0 md:border-l"
                style={{borderColor:'var(--border)'}}>
                <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
                  <div>
                    <div style={{fontFamily:'var(--font-head)',fontSize:'16px',fontWeight:700,color:'var(--text-primary)',letterSpacing:'0.04em'}}>NEARBY HELP</div>
                    <div style={{fontSize:'12px',color:'var(--text-muted)'}}>{loadingServices?'Scanning...':`${services.length} services found`}</div>
                  </div>
                  <button onClick={fetchServices} disabled={loadingServices}
                    style={{background:'var(--bg-elevated)',border:'1px solid var(--border)',borderRadius:'10px',padding:'6px 8px',color:'var(--text-muted)',cursor:'pointer'}}>
                    <RefreshCw size={14} className={loadingServices?'animate-spin':''}/>
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-2">
                  {loadingServices ? (
                    [1,2,3,4].map(i=><div key={i} className="skeleton" style={{height:'88px'}}/>)
                  ) : services.length > 0 ? (
                    services.map(s=>(
                      <ServiceCard key={s.id} service={s} highlighted={selectedService?.id===s.id} onClick={setSS}/>
                    ))
                  ) : (
                    <div style={{textAlign:'center',padding:'40px 0',color:'var(--text-muted)'}}>
                      <Activity size={32} style={{margin:'0 auto 8px',opacity:0.3}}/>
                      <p style={{fontSize:'14px'}}>No services found nearby</p>
                      <p style={{fontSize:'12px',marginTop:'4px'}}>Allow location access to scan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'chat'   && <ChatPage   location={location} />}
          {activeTab === 'legal'  && <LegalPage  />}
          {activeTab === 'report' && <ReportPage location={location} />}
        </div>

        {/* Bottom nav - mobile only */}
        <nav className="bottom-nav glass border-t flex-shrink-0" style={{borderColor:'var(--border)'}}>
          {TABS.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-3 flex flex-col items-center gap-1 transition-all"
                style={{color:isActive?tab.color:'var(--text-muted)'}}>
                <Icon size={20} strokeWidth={isActive?2.5:1.8}/>
                <span style={{fontSize:'9px',fontFamily:'var(--font-head)',letterSpacing:'0.08em',fontWeight:isActive?700:400}}>
                  {tab.label.toUpperCase()}
                </span>
                {isActive && <div style={{width:'4px',height:'4px',borderRadius:'50%',background:tab.color}}/>}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
