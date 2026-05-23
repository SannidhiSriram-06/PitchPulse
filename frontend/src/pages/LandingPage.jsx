import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'

function CountUpStat({ targetValue, label }) {
  const [count, setCount] = useState(0)
  const isPercent = targetValue.includes('%')
  const isSeconds = targetValue.includes('s')
  const numTarget = parseInt(targetValue)
  
  useEffect(() => {
    let startTime
    const duration = 1500
    const animate = (time) => {
      if (!startTime) startTime = time
      const progress = Math.min((time - startTime) / duration, 1)
      setCount(Math.floor(progress * numTarget))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [numTarget])
  
  const displayValue = count + (isPercent ? '%' : isSeconds ? 's' : '')
  
  return (
    <div>
      <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text)', letterSpacing: '-1.5px' }}>{displayValue}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.05em' }}>{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()

  const features = [
    { icon: '⚡', title: 'Brief in 60 seconds', desc: 'Three AI agents research, analyze, and format your brief before you even finish your coffee.' },
    { icon: '📊', title: 'Live financial signals', desc: 'Revenue trends, funding rounds, market position — sourced in real time, not from stale databases.' },
    { icon: '🎯', title: 'Tailored talking points', desc: 'Not summaries. Actual conversation angles that connect your pitch to what\'s happening in their world.' },
    { icon: '⚠️', title: 'Watch out for', desc: 'Risks, sensitivities, and objections you\'ll likely face — before you walk in the door.' },
    { icon: '🔗', title: 'Share with your team', desc: 'One link, no login. Share briefs with your whole team before a group pitch.' },
    { icon: '📱', title: 'Works everywhere', desc: 'Install as an app on your phone. Pull up a brief in the parking lot before you walk in.' },
  ]

  const stats = [
    { value: '60s', label: 'Average brief time' },
    { value: '6', label: 'Sections per brief' },
    { value: '100%', label: 'AI-powered' },
  ]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', overflowX: 'hidden' }}>
      
      {/* Dot Grid Background */}
      <div style={{
        position: 'fixed', inset: 0, 
        backgroundImage: 'radial-gradient(circle, #ffffff08 1px, transparent 1px)',
        backgroundSize: '24px 24px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'var(--bg)f2',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border)',
        padding: '0 clamp(1rem, 5vw, 3rem)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-1px' }}>
            <span style={{ color: '#fff' }}>Pitch</span>
            <span style={{ color: 'var(--accent)' }}>Pulse</span>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => navigate('/sign-in')}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600', transition: 'all 0.2s' }}>
              Log in
            </button>
            <button onClick={() => navigate('/sign-up')}
              style={{ background: 'var(--accent)', border: 'none', color: '#000', padding: '0.5rem 1.25rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '700', transition: 'all 0.2s' }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 3rem) 4rem', position: 'relative' }}>
          
          <div style={{ position: 'absolute', top: '-100px', left: '-200px', width: '600px', height: '600px', background: 'radial-gradient(circle, #a3e63508 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: '200px', right: '-300px', width: '500px', height: '500px', background: 'radial-gradient(circle, #a3e63505 0%, transparent 60%)', pointerEvents: 'none', zIndex: 0 }} />
          
          <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Badge */}
          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: '0.6rem', 
            background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', 
            borderRadius: '99px', padding: '0.4rem 1rem', fontSize: '0.7rem', 
            color: 'var(--accent)', fontWeight: '700', letterSpacing: '0.1em', 
            textTransform: 'uppercase', marginBottom: '2.5rem' 
          }}>
            <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
            AI-Powered Sales Intelligence
          </div>

          <h1 style={{ fontSize: 'clamp(2.8rem, 6vw, 5rem)', fontWeight: '800', lineHeight: '1', letterSpacing: '-3px', marginBottom: '2rem' }}>
            Know your prospect.
            <br />
            <span style={{ color: 'var(--accent)' }}>Before you walk in.</span>
          </h1>

          <p style={{ fontSize: '1.1rem', color: 'var(--text-sec)', lineHeight: '1.6', marginBottom: '3rem', maxWidth: '520px' }}>
            PitchPulse generates a complete AI sales brief for any company in under 60 seconds — news, financials, talking points, and risks.
          </p>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '5rem' }}>
            <button onClick={() => navigate('/sign-up')}
              style={{ background: 'var(--accent)', border: 'none', color: '#000', padding: '1rem 2.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '1rem', fontWeight: '800', boxShadow: 'var(--accent-glow)' }}>
              Get your free brief →
            </button>
            <button onClick={() => navigate('/sign-in')}
              style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)', padding: '1rem 2.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '1rem', fontWeight: '600' }}>
              Sign in
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '0', borderTop: '1px solid var(--border)', paddingTop: '3rem' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ flex: 1, borderRight: i < stats.length - 1 ? '1px solid var(--border)' : 'none', paddingLeft: i === 0 ? 0 : '2rem', paddingRight: '2rem' }}>
                <CountUpStat targetValue={s.value} label={s.label} />
              </div>
            ))}
          </div>
          </div>
        </section>

        {/* Features Grid */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '4rem clamp(1rem, 5vw, 3rem) 8rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            {features.map((f, i) => (
              <div key={i} style={{ background: 'var(--surface)', padding: '2.5rem', transition: 'all 0.2s ease', opacity: 0, animation: `slideUp 0.4s ease forwards`, animationDelay: `${i * 0.06}s` }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-accent)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'transparent'; }}>
                <div style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', borderRadius: 'var(--radius-sm)', fontSize: '1.5rem', marginBottom: '1.5rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontWeight: '700', fontSize: '0.9rem', marginBottom: '0.75rem', color: '#fff' }}>{f.title}</h3>
                <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', lineHeight: '1.6' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA Banner */}
        <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 clamp(1rem, 5vw, 3rem) 8rem' }}>
          <div style={{ 
            background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', 
            borderRadius: 'var(--radius-lg)', padding: '5rem 2rem', textAlign: 'center', 
            position: 'relative', overflow: 'hidden' 
          }}>
            <div style={{ 
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
              width: '600px', height: '600px', 
              background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', 
              pointerEvents: 'none', opacity: 0.5 
            }} />
            <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 3rem)', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '1.5rem', position: 'relative' }}>
              Ready to walk in prepared?
            </h2>
            <p style={{ color: 'var(--text-sec)', marginBottom: '2.5rem', fontSize: '1.1rem', position: 'relative', maxWidth: '500px', margin: '0 auto 2.5rem' }}>
              Free to use. No credit card. Takes 30 seconds to set up.
            </p>
            <button onClick={() => navigate('/sign-up')}
              style={{ background: 'var(--accent)', border: 'none', color: '#000', padding: '1rem 3rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '1rem', fontWeight: '800', position: 'relative', boxShadow: 'var(--accent-glow)' }}>
              Get Started — it's free
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '2.5rem clamp(1rem, 5vw, 3rem)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '500' }}>
          PitchPulse — Built for sales reps who prep.
        </p>
      </footer>
    </div>
  )
}
