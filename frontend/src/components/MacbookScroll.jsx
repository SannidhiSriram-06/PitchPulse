import React from 'react'
/**
 * MacbookScroll — Aceternity-style scroll-driven MacBook opening animation.
 *
 * Scroll physics:
 *   - Section is 350vh tall, inner content is sticky.
 *   - scrollYProgress 0→0.45: lid opens (rotateX -68deg → 0deg)
 *   - scrollYProgress 0.15→0.55: hero text + badge fade in
 *   - scrollYProgress 0.45→0.7: screen content fades/scales in
 *   - scrollYProgress 0.7→1.0: MacBook floats up, CTA appears
 */
import { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ArrowRight, Zap, FileText, Search } from 'lucide-react'
import { Link } from 'react-router-dom'

// ── Tiny screen mock ─────────────────────────────────────────────────────────
function ScreenContent() {
  return (
    <div className="w-full h-full bg-[#0a0a0f] rounded-[6px] overflow-hidden flex flex-col text-white font-sans select-none">
      {/* Fake browser bar */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#111116] border-b border-white/5 shrink-0">
        <div className="w-2 h-2 rounded-full bg-red-500/70" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/70" />
        <div className="w-2 h-2 rounded-full bg-green-500/70" />
        <div className="flex-1 mx-3 bg-[#1c1c24] rounded-sm text-[6px] text-white/25 px-2 py-0.5 text-center">
          pitchpulse.app
        </div>
      </div>

      {/* App layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-[20%] bg-[#0d0d12] border-r border-white/5 p-2 flex flex-col gap-1.5 shrink-0">
          <div className="flex items-center gap-1 mb-2">
            <div className="w-3 h-3 bg-orange-500 rounded-[3px]" />
            <span className="text-[5px] font-bold text-white">PitchPulse</span>
          </div>
          {['Dashboard', 'Briefs', 'Settings'].map((item, i) => (
            <div key={item} className={`text-[5px] px-1.5 py-1 rounded-[3px] ${i === 1 ? 'bg-orange-500/20 text-orange-400' : 'text-white/30'}`}>
              {item}
            </div>
          ))}
        </div>

        {/* Main */}
        <div className="flex-1 p-2.5 overflow-hidden flex flex-col gap-2">
          {/* Query input */}
          <div className="bg-[#111116] border border-white/8 rounded-[5px] p-1.5">
            <div className="text-[5px] text-white/40 mb-1">Research query</div>
            <div className="text-[5.5px] text-white/80 font-mono">
              Nvidia — pitching AI wafer inspection for GPU fabs
              <span className="inline-block w-0.5 h-[6px] bg-orange-400 ml-0.5 animate-pulse align-middle" />
            </div>
          </div>

          {/* Brief sections */}
          <div className="space-y-1.5 flex-1">
            {/* Summary */}
            <div className="bg-[#111116] border border-white/6 rounded-[5px] p-1.5">
              <div className="text-[4.5px] font-bold text-orange-400 mb-1 uppercase tracking-wide">📋 Executive Summary</div>
              <div className="space-y-0.5">
                <div className="h-[3.5px] bg-white/15 rounded-full w-full" />
                <div className="h-[3.5px] bg-white/12 rounded-full w-4/5" />
                <div className="h-[3.5px] bg-white/10 rounded-full w-3/5" />
              </div>
            </div>

            {/* Talking point */}
            <div className="bg-orange-500/8 border border-orange-500/20 rounded-[5px] p-1.5">
              <div className="text-[4.5px] font-bold text-orange-400 mb-1 uppercase tracking-wide">🎯 Talking Points</div>
              <div className="space-y-0.5">
                <div className="h-[3px] bg-orange-300/20 rounded-full w-full" />
                <div className="h-[3px] bg-orange-300/15 rounded-full w-4/5" />
                <div className="h-[3px] bg-white/8 rounded-full w-3/5" />
              </div>
            </div>

            {/* Watch out */}
            <div className="border-l-2 border-red-500/50 bg-red-500/5 rounded-r-[5px] p-1.5">
              <div className="text-[4.5px] font-bold text-red-400 mb-1 uppercase tracking-wide">⚠️ Watch Out For</div>
              <div className="space-y-0.5">
                <div className="h-[3px] bg-red-300/15 rounded-full w-4/5" />
                <div className="h-[3px] bg-red-300/10 rounded-full w-3/5" />
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-1">
              {[
                { l: 'Revenue', v: '$81.6B', c: 'text-emerald-400' },
                { l: 'Growth', v: '+85%', c: 'text-blue-400' },
                { l: 'Score', v: '9.2/10', c: 'text-orange-400' },
              ].map(s => (
                <div key={s.l} className="bg-[#111116] border border-white/6 rounded-[4px] p-1 text-center">
                  <div className={`text-[6px] font-bold ${s.c}`}>{s.v}</div>
                  <div className="text-[4px] text-white/30">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── MacBook SVG shell ─────────────────────────────────────────────────────────
function MacbookShell({ lidProgress }) {
  // lidProgress: 0 = lid nearly closed, 1 = fully open flat
  // rotateX: -68deg (closed) → 0deg (open flat) in perspective
  const lidAngle = useTransform(lidProgress, [0, 1], [-68, -2])

  return (
    <div className="relative w-full flex flex-col items-center" style={{ perspective: '1200px' }}>
      {/* Lid + screen */}
      <motion.div
        style={{ rotateX: lidAngle, transformOrigin: 'bottom center', transformStyle: 'preserve-3d' }}
        className="relative w-full"
      >
        {/* Lid outer frame */}
        <div className="relative w-full bg-gradient-to-b from-[#2a2a2a] to-[#1a1a1a] rounded-t-[18px] rounded-b-[4px]"
          style={{ paddingTop: '62%', boxShadow: '0 -2px 0 rgba(255,255,255,0.08) inset, 0 2px 20px rgba(0,0,0,0.6)' }}>

          {/* Inner bezel */}
          <div className="absolute inset-[3.5%] rounded-[12px] bg-[#111] overflow-hidden"
            style={{ boxShadow: '0 0 0 1.5px rgba(255,255,255,0.04) inset' }}>
            {/* Screen content */}
            <ScreenContent />
          </div>

          {/* Apple logo hint */}
          <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 opacity-10">
            <div className="w-full h-full rounded-full bg-white/30" />
          </div>

          {/* Camera dot */}
          <div className="absolute top-[3%] left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#333]" />
        </div>

        {/* Lid bottom edge (hinge gap) */}
        <div className="h-[3px] w-full bg-[#111] rounded-b-sm" />
      </motion.div>

      {/* Base / keyboard */}
      <div className="relative w-full bg-gradient-to-b from-[#2c2c2c] to-[#222] rounded-b-[16px]"
        style={{
          height: '6.5%',
          minHeight: 18,
          boxShadow: '0 4px 30px rgba(0,0,0,0.5), 0 1px 0 rgba(255,255,255,0.06) inset',
          transformStyle: 'preserve-3d',
          transform: 'rotateX(8deg)',
          transformOrigin: 'top center',
        }}>
        {/* Keyboard grid hint */}
        <div className="absolute inset-x-[8%] inset-y-[18%] grid grid-cols-12 gap-[2px] opacity-20 pointer-events-none">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="bg-white/40 rounded-[1px]" style={{ height: 3 }} />
          ))}
        </div>
        {/* Trackpad */}
        <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[22%] h-[40%] bg-white/5 rounded-[3px] border border-white/5" />
      </div>

      {/* Bottom reflection / foot */}
      <div className="w-[90%] h-[2px] bg-gradient-to-r from-transparent via-white/8 to-transparent mt-0.5 rounded-full" />
    </div>
  )
}

// ── Hero nav (no Japanese image, just clean dark) ─────────────────────────────
function HeroNav() {
  const [mobileOpen, setMobileOpen] = React.useState(false)
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="fixed top-0 left-0 right-0 z-50 flex h-14 items-center justify-between px-6 sm:px-10 lg:px-16"
      style={{ backdropFilter: 'blur(16px)', background: 'rgba(6,6,12,0.7)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}
    >
      <Link to="/" className="flex items-center gap-2 font-semibold text-white text-[15px]">
        <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
          <span className="text-white font-bold text-xs">P</span>
        </div>
        PitchPulse
      </Link>

      <nav className="hidden lg:flex items-center gap-10">
        {[{ label: 'Features', href: '#features' }, { label: 'Compare', href: '#compare' }].map(item => (
          <a key={item.label} href={item.href}
            onClick={e => { e.preventDefault(); document.querySelector(item.href)?.scrollIntoView({ behavior: 'smooth' }) }}
            className="text-sm text-stone-400 hover:text-white transition-colors">
            {item.label}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <Link to="/sign-in" className="hidden sm:inline-flex text-sm text-stone-400 hover:text-white transition-colors px-4 py-2 rounded-lg border border-white/10 hover:border-white/20">
          Sign in
        </Link>
        <Link to="/sign-up" className="inline-flex items-center gap-1.5 bg-accent hover:bg-accent-light text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
          Get started free
        </Link>
      </div>
    </motion.header>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function MacbookScroll() {
  const containerRef = useRef(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end'],
  })

  // Lid opens during first 50% of scroll
  const lidProgress = useTransform(scrollYProgress, [0, 0.5], [0, 1])

  // Hero text
  const heroOpacity = useTransform(scrollYProgress, [0, 0.18], [1, 1])
  const heroY       = useTransform(scrollYProgress, [0, 0.25], [0, -30])

  // MacBook scale: starts small, grows as it opens
  const macbookScale = useTransform(scrollYProgress, [0, 0.5], [0.62, 0.9])
  const macbookY     = useTransform(scrollYProgress, [0, 0.5, 0.85, 1], [80, 20, -20, -60])
  const macbookOpacity = useTransform(scrollYProgress, [0.75, 0.95], [1, 0])

  // Glow under MacBook
  const glowOpacity  = useTransform(scrollYProgress, [0.1, 0.5], [0, 0.6])

  // Bottom CTA
  const ctaOpacity   = useTransform(scrollYProgress, [0.7, 0.85], [0, 1])
  const ctaY         = useTransform(scrollYProgress, [0.7, 0.85], [20, 0])

  // Dot background
  const bgOpacity    = useTransform(scrollYProgress, [0, 0.1], [0.3, 0.5])

  return (
    <>
      <HeroNav />

      {/* Tall scroll container */}
      <div ref={containerRef} className="relative h-[350vh]">

        {/* Sticky viewport */}
        <div className="sticky top-0 h-screen w-full overflow-hidden bg-[#06060c] flex flex-col items-center justify-center">

          {/* Dot grid bg */}
          <motion.div
            style={{ opacity: bgOpacity, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '28px 28px' }}
            className="absolute inset-0 pointer-events-none"
            aria-hidden
          />

          {/* Radial gradient vignette */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(6,6,12,0.85) 100%)' }}
          />

          {/* Glow beneath laptop */}
          <motion.div
            style={{ opacity: glowOpacity, background: 'radial-gradient(ellipse, rgba(255,107,44,0.15) 0%, transparent 70%)', filter: 'blur(40px)' }}
            className="absolute bottom-[28%] left-1/2 -translate-x-1/2 w-[600px] h-[200px] pointer-events-none"
            aria-hidden
          />

          {/* Hero text block */}
          <motion.div
            style={{ opacity: heroOpacity, y: heroY }}
            className="relative z-10 text-center px-6 mb-10 max-w-2xl mx-auto"
          >
            <motion.div
              initial={{ opacity: 0, y: 12, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-accent/25 bg-accent/8 text-accent text-xs font-semibold uppercase tracking-wider mb-6"
            >
              <Zap className="w-3 h-3" />
              <span>3 free briefs/hour · no card needed</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.32, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold tracking-[-0.045em] text-white text-balance mb-5 leading-[1.05]"
            >
              Know your prospect<br />before the meeting.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.44, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="text-base sm:text-lg text-stone-400 leading-relaxed max-w-md mx-auto mb-7"
            >
              Type your pitch in one sentence. Get a brief with live news, real financials, and talking points — in under 60 seconds.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.56, duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <Link
                to="/sign-up"
                className="group inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white font-semibold px-7 py-3.5 rounded-xl text-sm transition-all shadow-[0_4px_20px_rgba(255,107,44,0.3)] hover:shadow-[0_6px_28px_rgba(255,107,44,0.4)]"
              >
                Generate free brief
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <div className="flex items-center gap-3 text-xs text-stone-500">
                {[<><FileText className="w-3 h-3" /> PDF upload</>, <><Search className="w-3 h-3" /> Live search</>, <><Zap className="w-3 h-3" /> Free to start</>].map((item, i) => (
                  <span key={i} className="flex items-center gap-1">{item}</span>
                ))}
              </div>
            </motion.div>
          </motion.div>

          {/* MacBook */}
          <motion.div
            style={{ scale: macbookScale, y: macbookY, opacity: macbookOpacity }}
            className="relative z-10 w-full max-w-[700px] px-4"
          >
            <MacbookShell lidProgress={lidProgress} />
          </motion.div>

          {/* Bottom CTA (appears near end of scroll) */}
          <motion.div
            style={{ opacity: ctaOpacity, y: ctaY }}
            className="absolute bottom-12 inset-x-0 flex justify-center z-20"
          >
            <Link
              to="#features"
              onClick={e => { e.preventDefault(); document.querySelector('#features')?.scrollIntoView({ behavior: 'smooth' }) }}
              className="text-xs text-stone-500 hover:text-stone-300 transition-colors flex flex-col items-center gap-1.5"
            >
              <span>See how it works</span>
              <motion.div
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
                className="w-4 h-4 text-stone-500"
              >↓</motion.div>
            </Link>
          </motion.div>

        </div>
      </div>
    </>
  )
}
