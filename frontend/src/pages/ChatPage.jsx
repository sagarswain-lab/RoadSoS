import { useState, useRef, useEffect, useCallback } from 'react'
import { Send, Mic, Volume2, VolumeX, Trash2 } from 'lucide-react'
import ChatBubble from '../components/Chat/ChatBubble'
import TypingIndicator from '../components/Chat/TypingIndicator'
import QuickSuggestions from '../components/Chat/QuickSuggestions'
import { chatAPI } from '../services/api'

const SESSION_ID = `session_${Date.now()}`

const WELCOME = {
  id:'welcome', role:'assistant', timestamp:Date.now(),
  content:`👋 Hi! I'm RoadSoS AI — your multilingual road safety companion.

I can help you with:
🏥 Find nearest hospitals, ambulances & police
⚖️ Know your legal rights after an accident  
🛣️ Report dangerous road conditions
🩺 Step-by-step first aid guidance

Type in any language — I'll reply in the same one.`
}

export default function ChatPage({ location }) {
  const [messages,  setMessages]  = useState([WELCOME])
  const [input,     setInput]     = useState('')
  const [typing,    setTyping]    = useState(false)
  const [voiceOn,   setVoiceOn]   = useState(false)
  const [listening, setListening] = useState(false)
  const bottomRef = useRef(null)
  const inputRef  = useRef(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }) }, [messages, typing])

  const speak = useCallback((text) => {
    if (!voiceOn || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = 0.95
    window.speechSynthesis.speak(u)
  }, [voiceOn])

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SR) return alert('Voice input not supported in this browser')
    const r = new SR()
    r.continuous = false; r.interimResults = false; r.lang = 'en-IN'
    r.onstart  = () => setListening(true)
    r.onend    = () => setListening(false)
    r.onresult = (e) => setInput(e.results[0][0].transcript)
    r.onerror  = () => setListening(false)
    r.start()
  }

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    inputRef.current?.focus()
    const userMsg = { id:Date.now(), role:'user', content:msg, timestamp:Date.now() }
    setMessages(prev => [...prev, userMsg])
    setTyping(true)
    try {
      const data = await chatAPI.send(msg, SESSION_ID, location?.lat, location?.lng)
      const aiMsg = { id:Date.now()+1, role:'assistant', content:data.reply, services:data.services||[], timestamp:Date.now() }
      setMessages(prev => [...prev, aiMsg])
      speak(data.reply)
    } catch {
      setMessages(prev => [...prev, {
        id:Date.now()+1, role:'assistant', timestamp:Date.now(),
        content:'⚠️ Connection error. For immediate help call 112 (India) or your local emergency number.'
      }])
    } finally { setTyping(false) }
  }

  const S = { // inline styles shorthand
    toolbar: { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg-surface)', flexShrink:0 },
    toolbarLabel: { fontSize:'11px', color:'var(--text-muted)', letterSpacing:'0.1em', fontFamily:'var(--font-head)' },
    toolbarBtns: { display:'flex', gap:'6px' },
    iconBtn: (active) => ({ padding:'6px', borderRadius:'8px', border:'1px solid var(--border)', background: active ? 'var(--accent-red-dim)' : 'var(--bg-elevated)', color: active ? 'var(--accent-red)' : 'var(--text-muted)', cursor:'pointer' }),
    messages: { flex:1, overflowY:'auto', padding:'16px', display:'flex', flexDirection:'column', gap:'16px', background:'var(--bg-base)' },
    inputArea: { padding:'12px 16px', borderTop:'1px solid var(--border)', background:'var(--bg-surface)', flexShrink:0 },
    inputRow: { display:'flex', gap:'8px', alignItems:'flex-end' },
    textarea: { flex:1, resize:'none', padding:'10px 14px', fontSize:'14px', maxHeight:'112px', lineHeight:'1.4', border:'1px solid var(--border)', borderRadius:'12px', background:'var(--bg-elevated)', color:'var(--text-primary)', fontFamily:'var(--font-body)', outline:'none' },
    micBtn: (on) => ({ padding:'10px', borderRadius:'12px', border:`1px solid ${on?'var(--accent-red)':'var(--border)'}`, background: on?'var(--accent-red)':'var(--bg-elevated)', color: on?'white':'var(--text-muted)', cursor:'pointer', flexShrink:0 }),
    sendBtn: { padding:'10px', borderRadius:'12px', background:'linear-gradient(135deg,#e63946,#c1121f)', color:'white', border:'none', cursor:'pointer', flexShrink:0 },
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Toolbar */}
      <div style={S.toolbar}>
        <span style={S.toolbarLabel}>AI · MULTILINGUAL · 8 LANGUAGES</span>
        <div style={S.toolbarBtns}>
          <button onClick={() => setVoiceOn(!voiceOn)} style={S.iconBtn(voiceOn)} title="Toggle voice output">
            {voiceOn ? <Volume2 size={15}/> : <VolumeX size={15}/>}
          </button>
          <button onClick={() => setMessages([WELCOME])} style={S.iconBtn(false)} title="Clear chat">
            <Trash2 size={15}/>
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={S.messages}>
        {messages.map(m => <ChatBubble key={m.id} message={m}/>)}
        {typing && <TypingIndicator/>}
        <div ref={bottomRef}/>
      </div>

      {/* Quick suggestions */}
      {messages.length <= 1 && <QuickSuggestions onSelect={sendMessage}/>}

      {/* Input */}
      <div style={S.inputArea}>
        <div style={S.inputRow}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if(e.key==='Enter' && !e.shiftKey){ e.preventDefault(); sendMessage() } }}
            placeholder="Type in any language..."
            rows={1}
            style={S.textarea}
            className="field"
          />
          <button onClick={startListening} style={S.micBtn(listening)} title="Voice input">
            <Mic size={18}/>
          </button>
          <button onClick={() => sendMessage()} disabled={!input.trim()||typing} style={{ ...S.sendBtn, opacity:(!input.trim()||typing)?0.4:1 }}>
            <Send size={18}/>
          </button>
        </div>
        {listening && (
          <div style={{ display:'flex', alignItems:'center', gap:'6px', marginTop:'8px', fontSize:'12px', color:'var(--accent-red)' }}>
            <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'var(--accent-red)', animation:'blink 1s ease infinite' }}/>
            Listening... speak now
          </div>
        )}
      </div>
    </div>
  )
}
