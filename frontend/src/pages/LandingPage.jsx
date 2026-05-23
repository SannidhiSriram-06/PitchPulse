import { useNavigate } from 'react-router-dom'

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

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg)cc',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        padding: '0 clamp(1rem, 5vw, 3rem)',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px' }}>
          <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '-0.5px', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            PitchPulse
          </span>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => navigate('/sign-in')}
              style={{ background: 'none', border: '1px solid var(--border-2)', color: 'var(--text-sec)', padding: '0.45rem 1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500' }}>
              Log in
            </button>
            <button onClick={() => navigate('/sign-up')}
              style={{ background: 'var(--gradient)', border: 'none', color: '#fff', padding: '0.45rem 1.1rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '0.875rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: '700', boxShadow: 'var(--glow)' }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(4rem, 10vw, 8rem) clamp(1rem, 5vw, 3rem) 4rem' }}>
        
        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'var(--accent-soft)', border: '1px solid var(--accent-border)', borderRadius: '99px', padding: '0.3rem 0.9rem', fontSize: '0.75rem', color: 'var(--accent)', fontWeight: '600', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '2rem' }}>
          <span style={{ width: '6px', height: '6px', background: 'var(--accent)', borderRadius: '50%', display: 'inline-block' }} />
          AI-Powered Sales Intelligence
        </div>

        {/* Headline */}
        <h1 style={{ fontSize: 'clamp(2.5rem, 7vw, 5rem)', fontWeight: '800', lineHeight: '1.05', letterSpacing: '-3px', marginBottom: '1.5rem', maxWidth: '800px' }}>
          Know your prospect
          <br />
          <span style={{ background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            before you walk in.
          </span>
        </h1>

        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: 'var(--text-sec)', lineHeight: '1.7', marginBottom: '2.5rem', maxWidth: '540px' }}>
          PitchPulse generates a complete AI sales brief for any company in under 60 seconds — news, financials, talking points, and risks.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '4rem' }}>
          <button onClick={() => navigate('/sign-up')}
            style={{ background: 'var(--gradient)', border: 'none', color: '#fff', padding: '0.9rem 2rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif', boxShadow: 'var(--glow)', letterSpacing: '-0.3px' }}>
            Get your free brief →
          </button>
          <button onClick={() => navigate('/sign-in')}
            style={{ background: 'none', border: '1px solid var(--border-2)', color: 'var(--text)', padding: '0.9rem 2rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '1rem', fontFamily: 'Space Grotesk, sans-serif', fontWeight: '500' }}>
            Sign in
          </button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: '2.5rem', flexWrap: 'wrap', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
          {stats.map((s, i) => (
            <div key={i}>
              <div style={{ fontSize: '1.75rem', fontWeight: '800', letterSpacing: '-1px', background: 'var(--gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem clamp(1rem, 5vw, 3rem) 6rem' }}>
        <p style={{ fontSize: '0.75rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '2rem' }}>
          What you get in every brief
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {features.map((f, i) => (
            <div key={i} style={{ background: 'var(--bg)', padding: '1.75rem', transition: 'background 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--bg)'}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.75rem' }}>{f.icon}</div>
              <h3 style={{ fontWeight: '700', fontSize: '0.95rem', marginBottom: '0.4rem', letterSpacing: '-0.3px' }}>{f.title}</h3>
              <p style={{ color: 'var(--text-sec)', fontSize: '0.85rem', lineHeight: '1.6' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 clamp(1rem, 5vw, 3rem) 6rem' }}>
        <div style={{ background: 'var(--gradient-soft)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-xl)', padding: 'clamp(2rem, 5vw, 4rem)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '400px', height: '400px', background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)', pointerEvents: 'none' }} />
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.5rem)', fontWeight: '800', letterSpacing: '-1.5px', marginBottom: '1rem', position: 'relative' }}>
            Ready to walk in prepared?
          </h2>
          <p style={{ color: 'var(--text-sec)', marginBottom: '2rem', fontSize: '1rem', position: 'relative' }}>
            Free to use. No credit card. Takes 30 seconds to set up.
          </p>
          <button onClick={() => navigate('/sign-up')}
            style={{ background: 'var(--gradient)', border: 'none', color: '#fff', padding: '0.9rem 2.5rem', borderRadius: 'var(--radius)', cursor: 'pointer', fontSize: '1rem', fontWeight: '700', fontFamily: 'Space Grotesk, sans-serif', boxShadow: 'var(--glow)', position: 'relative' }}>
            Get Started — it's free →
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', padding: '1.5rem clamp(1rem, 5vw, 3rem)', textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          PitchPulse — Built for sales reps who prep.
        </p>
      </footer>
    </div>
  )
}