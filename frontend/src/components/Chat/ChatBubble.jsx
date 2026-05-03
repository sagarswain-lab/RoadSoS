import { Bot, User } from 'lucide-react'
import ServiceCard from '../Map/ServiceCard'

export default function ChatBubble({ message, onServiceClick }) {
  const isUser = message.role === 'user'
  return (
    <div className={`flex gap-2 chat-bubble ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <div style={{
        width:'30px', height:'30px', borderRadius:'50%', flexShrink:0, marginTop:'4px',
        background: isUser ? 'linear-gradient(135deg,#e63946,#c1121f)' : 'var(--bg-elevated)',
        border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center',
        color: isUser ? 'white' : 'var(--text-muted)'
      }}>
        {isUser ? <User size={13}/> : <Bot size={13}/>}
      </div>

      <div style={{ maxWidth:'78%', display:'flex', flexDirection:'column', gap:'6px', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
        <div className={isUser ? 'bubble-user' : 'bubble-ai'} style={{ padding:'10px 14px', fontSize:'14px', lineHeight:'1.5' }}>
          {message.content.split('\n').map((line, i, arr) => (
            <span key={i}>{line}{i < arr.length - 1 && <br/>}</span>
          ))}
        </div>

        {message.services?.length > 0 && (
          <div style={{ width:'100%', display:'flex', flexDirection:'column', gap:'6px' }}>
            {message.services.map(s => (
              <ServiceCard key={s.id} service={s} onClick={onServiceClick}/>
            ))}
          </div>
        )}

        <span style={{ fontSize:'10px', color:'var(--text-muted)', padding:'0 4px' }}>
          {new Date(message.timestamp).toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
        </span>
      </div>
    </div>
  )
}
