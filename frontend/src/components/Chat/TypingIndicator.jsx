import { Bot } from 'lucide-react'

export default function TypingIndicator() {
  return (
    <div className="flex gap-2 chat-bubble">
      <div style={{
        width:'30px', height:'30px', borderRadius:'50%', flexShrink:0,
        background:'var(--bg-elevated)', border:'1px solid var(--border)',
        display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)'
      }}>
        <Bot size={13}/>
      </div>
      <div className="bubble-ai" style={{ padding:'12px 16px' }}>
        <div style={{ display:'flex', gap:'5px', alignItems:'center', height:'16px' }}>
          {[0,1,2].map(i => (
            <div key={i} style={{
              width:'6px', height:'6px', borderRadius:'50%', background:'var(--text-muted)',
              animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite`
            }}/>
          ))}
        </div>
      </div>
      <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}`}</style>
    </div>
  )
}
