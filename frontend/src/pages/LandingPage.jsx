import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { motion, useInView, useScroll, useTransform, AnimatePresence } from 'framer-motion'

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
      <div style={{ fontSize: '3rem', fontWeight: '900', color: '#0a0a0a', letterSpacing: '-2px' }}>{displayValue}</div>
      <div style={{ fontSize: '0.75rem', color: '#a3a3a3', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.1em' }}>{label}</div>
    </div>
  )
}

export default function LandingPage() {
  const navigate = useNavigate()
  const featuresRef = useRef(null)
  const isFeaturesInView = useInView(featuresRef, { once: true, margin: "-100px" })

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
    <div style={{ background: '#f8f8f6', minHeight: '100vh', color: '#0a0a0a', overflowX: 'hidden' }}>
      
      <style>
        {`
          @keyframes marquee {
            from { transform: translateX(0) }
            to { transform: translateX(-50%) }
          }
          @media (max-width: 768px) {
            .desktop-only { display: none !important; }
            .how-it-works-line { display: none !important; }
          }
        `}
      </style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(248,248,246,0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid #e5e5e5',
        height: '64px',
        boxShadow: '0 1px 0 #e5e5e5'
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 clamp(1rem, 5vw, 3rem)' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: '800', letterSpacing: '-1px' }}>
            <span style={{ color: '#0a0a0a' }}>Pitch</span><span style={{ color: '#84cc16' }}>Pulse</span>
          </div>
          
          <div className="desktop-only" style={{ display: 'flex', gap: '2rem' }}>
            <span style={{ color: '#525252', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}>Product</span>
            <span style={{ color: '#525252', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}>Pricing</span>
            <span style={{ color: '#525252', fontSize: '0.875rem', cursor: 'pointer', fontWeight: '500' }}>About</span>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button onClick={() => navigate('/sign-in')}
              style={{ background: 'transparent', border: 'none', color: '#0a0a0a', padding: '0.5rem 1.25rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '600' }}>
              Log in
            </button>
            <button onClick={() => navigate('/sign-up')}
              style={{ background: '#84cc16', border: 'none', color: '#000', padding: '0.5rem 1.25rem', borderRadius: '99px', cursor: 'pointer', fontSize: '0.875rem', fontWeight: '700' }}>
              Get Started
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ 
        width: '100%', minHeight: '100vh', 
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        position: 'relative', overflow: 'hidden'
      }}>
        {/* Decorative circle */}
        <div style={{ 
          position: 'absolute', right: '-200px', top: '-100px', width: '700px', height: '700px', 
          borderRadius: '50%', background: 'radial-gradient(circle, rgba(132,204,22,0.08) 0%, transparent 70%)', zIndex: 0 
        }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: '1100px', width: '100%', margin: '0 auto', padding: '0 clamp(1rem, 5vw, 3rem)' }}>
          <motion.p 
            initial={{opacity:0, y:20}} animate={{opacity:1,y:0}} transition={{duration:0.6, ease:[0.16,1,0.3,1]}}
            style={{ fontSize: '0.8rem', fontWeight: '700', letterSpacing: '0.15em', textTransform: 'uppercase', color: '#84cc16', marginBottom: '1.5rem' }}
          >
            AI-Powered Sales Intelligence
          </motion.p>

          <h1 style={{ fontSize: 'clamp(4.5rem, 9vw, 8rem)', fontWeight: '900', letterSpacing: '-5px', lineHeight: 0.92, marginBottom: '3rem' }}>
            <motion.span style={{ display: 'block', color: '#0a0a0a' }} initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} transition={{delay:0}}>Know your</motion.span>
            <motion.span style={{ display: 'block', color: '#0a0a0a' }} initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} transition={{delay:0.05}}>prospect.</motion.span>
            <motion.span style={{ display: 'block', color: '#84cc16' }} initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} transition={{delay:0.1}}>Before you</motion.span>
            <motion.span style={{ display: 'block', color: '#84cc16' }} initial={{opacity:0,y:60}} animate={{opacity:1,y:0}} transition={{delay:0.15}}>walk in.</motion.span>
          </h1>

          <motion.p 
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}
            style={{ fontSize: '1.15rem', color: '#525252', lineHeight: 1.65, maxWidth: '480px', marginBottom: '3rem', fontWeight: '400' }}
          >
            PitchPulse generates a complete AI sales brief for any company in under 60 seconds — news, financials, talking points, and risks.
          </motion.p>

          <motion.div 
            initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}
          >
            <motion.button 
              onClick={() => navigate('/sign-up')}
              whileHover={{ scale: 1.02, backgroundColor: '#a3e635' }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              style={{ background: '#84cc16', color: '#000', padding: '1rem 2.5rem', borderRadius: '99px', fontWeight: '800', fontSize: '1rem', border: 'none', cursor: 'pointer' }}
            >
              Get your free brief →
            </motion.button>

            <motion.button 
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
              }}
              whileHover={{ scale: 1.01, borderColor: '#0a0a0a' }}
              whileTap={{ scale: 0.99 }}
              style={{ background: 'transparent', color: '#0a0a0a', padding: '1rem 2.5rem', border: '1px solid #e5e5e5', borderRadius: '99px', fontWeight: '600', fontSize: '1rem', cursor: 'pointer' }}
            >
              See how it works
            </motion.button>
          </motion.div>
          <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}} style={{ color: '#a3a3a3', fontSize: '0.8rem', marginTop: '0.75rem' }}>
            Free forever · No credit card · 30-second setup
          </motion.div>

          {/* Stats row */}
          <motion.div 
            initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.6}}
            style={{ display: 'flex', gap: '0', marginTop: '5rem', paddingTop: '3rem', borderTop: '1px solid #e5e5e5' }}
          >
            {stats.map((s, i) => (
              <div key={i} style={{ flex: 1, paddingRight: '2rem', borderRight: i < stats.length - 1 ? '1px solid #e5e5e5' : 'none' }}>
                <CountUpStat targetValue={s.value} label={s.label} />
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* SOCIAL PROOF TICKER */}
      <section style={{ overflow: 'hidden', borderTop: '1px solid #e5e5e5', borderBottom: '1px solid #e5e5e5', padding: '1.25rem 0', background: '#ffffff' }}>
        <div style={{ display: 'flex', width: '200%', animation: 'marquee 25s linear infinite' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ display: 'flex', flex: 1, justifyContent: 'space-around' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 3rem' }}>Salesforce</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 3rem' }}>HubSpot</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 3rem' }}>Pipedrive</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 3rem' }}>Outreach</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 3rem' }}>Gong</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 3rem' }}>LinkedIn Sales</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#a3a3a3', letterSpacing: '0.05em', whiteSpace: 'nowrap', padding: '0 3rem' }}>Apollo</span>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" style={{ background: '#ffffff', padding: '8rem clamp(1rem,5vw,3rem)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <motion.div ref={featuresRef} initial={{opacity:0,y:30}} animate={isFeaturesInView ? {opacity:1,y:0} : {}}>
            <p style={{ fontSize: '0.75rem', letterSpacing: '0.2em', color: '#84cc16', fontWeight: '700', textTransform: 'uppercase', marginBottom: '1rem' }}>WHAT YOU GET</p>
            <h2 style={{ fontSize: 'clamp(2rem,5vw,3.5rem)', fontWeight: '800', letterSpacing: '-2px', color: '#0a0a0a', lineHeight: 1 }}>
              Everything you need<br />
              <span style={{ color: '#84cc16' }}>before every meeting.</span>
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px,1fr))', gap: '1.5rem', marginTop: '4rem' }}>
            {features.map((f, i) => (
              <motion.div 
                key={i}
                initial={{opacity:0,y:30}}
                whileInView={{opacity:1,y:0}}
                viewport={{once:true, margin:"-50px"}}
                transition={{delay: i * 0.1, type: 'spring', stiffness: 300, damping: 30}}
                whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
                style={{ background: '#ffffff', border: '1px solid #e5e5e5', borderRadius: '20px', padding: '2.5rem' }}
              >
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'rgba(132,204,22,0.1)', border: '1px solid rgba(132,204,22,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.75rem' }}>
                  {f.icon}
                </div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#0a0a0a', marginBottom: '0.75rem', letterSpacing: '-0.3px' }}>{f.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#525252', lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section style={{ background: '#f8f8f6', padding: '8rem clamp(1rem,5vw,3rem)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem', position: 'relative' }}>
            <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: '3rem', position: 'relative', zIndex: 1 }}>
              <div className="how-it-works-line" style={{ position: 'absolute', top: '24px', left: '50%', transform: 'translateX(-50%)', width: '100%', height: '1px', background: 'linear-gradient(90deg, #e5e5e5, #84cc16, #e5e5e5)', borderTop: '1px dashed #d4d4d4', zIndex: -1 }} />
              {[
                { step: '1', title: 'Enter a company name', desc: 'Just type the name or domain. PitchPulse handles the rest.', icon: '🔍' },
                { step: '2', title: 'AI agents research in real time', desc: 'We scour financial reports, recent news, and market data instantly.', icon: '⚡' },
                { step: '3', title: 'Get your full brief', desc: 'Review your personalized talking points, risks, and insights.', icon: '📋' },
              ].map((s, i) => (
                <div key={i} style={{ flex: '1 1 250px', position: 'relative', padding: '2rem 1rem' }}>
                  <div style={{ fontSize: '8rem', fontWeight: '900', color: 'rgba(0,0,0,0.04)', position: 'absolute', top: '-2rem', left: '-1rem', lineHeight: 1, zIndex: -1 }}>{s.step}</div>
                  <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#0a0a0a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: '1.5rem', position: 'relative', zIndex: 2 }}>{s.icon}</div>
                  <h3 style={{ fontWeight: '700', fontSize: '1.1rem', marginBottom: '0.5rem', color: '#0a0a0a' }}>{s.title}</h3>
                  <p style={{ color: '#525252', fontSize: '0.9rem', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section style={{ background: '#0a0a0a', padding: '8rem clamp(1rem,5vw,3rem)', textAlign: 'center' }}>
        <h2 style={{ fontSize: 'clamp(3rem,7vw,6rem)', fontWeight: '900', letterSpacing: '-4px', color: '#ffffff', lineHeight: 0.95, margin: 0 }}>
          Ready to walk in<br />
          <span style={{ color: '#84cc16' }}>prepared?</span>
        </h2>
        
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '1rem', marginTop: '1.5rem', marginBottom: '3rem' }}>
          Free to use. No credit card. Takes 30 seconds to set up.
        </p>
        
        <motion.button 
          onClick={() => navigate('/sign-up')}
          whileHover={{ scale: 1.03 }} 
          whileTap={{ scale: 0.97 }}
          style={{ background: '#84cc16', color: '#000', padding: '1.25rem 3.5rem', borderRadius: '99px', fontWeight: '800', fontSize: '1.1rem', border: 'none', cursor: 'pointer' }}
        >
          Get Started — it's free
        </motion.button>
        
        <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '1rem' }}>
          Free forever · No credit card · 30-second setup
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#f8f8f6', borderTop: '1px solid #e5e5e5', padding: '2.5rem clamp(1rem,5vw,3rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: '800', letterSpacing: '-1px' }}>
            <span style={{ color: '#0a0a0a' }}>Pitch</span><span style={{ color: '#84cc16' }}>Pulse</span>
          </div>
          <span style={{ color: '#525252', fontSize: '0.9rem', fontWeight: '500' }}>Built for sales reps who prep.</span>
        </div>
        <div style={{ color: '#a3a3a3', fontSize: '0.9rem' }}>
          © 2026 PitchPulse
        </div>
      </footer>
    </div>
  )
}
