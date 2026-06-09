import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  ArrowRight, Zap, FileText, Search, Target,
  BarChart3, Eye, Brain, Shield, Globe, RefreshCw,
} from 'lucide-react'
import Hero11 from '../components/Hero11'
import HorizontalTextReveal from '../components/HorizontalTextReveal'
import SideScrollFeatures from '../components/SideScrollFeatures'

// ─── Animation helpers ────────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.5, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
}
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.07 } } }

// Dot-grid background — same texture as hero-11
const dotGrid = {
  backgroundImage: 'radial-gradient(circle, #a8a29e 1px, transparent 1px)',
  backgroundSize: '28px 28px',
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function Chip({ accent = false, children }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${
      accent
        ? 'bg-accent/10 border-accent/25 text-accent'
        : 'bg-stone-200/70 dark:bg-white/5 border-stone-300/60 dark:border-white/10 text-stone-600 dark:text-stone-400'
    }`}>
      {children}
    </span>
  )
}

function Card({ icon, title, desc, color = 'orange' }) {
  const colors = {
    orange: 'bg-orange-500/8 border-orange-400/15 text-orange-400',
    blue:   'bg-blue-500/8 border-blue-400/15 text-blue-400',
    green:  'bg-emerald-500/8 border-emerald-400/15 text-emerald-400',
    purple: 'bg-purple-500/8 border-purple-400/15 text-purple-400',
    amber:  'bg-amber-500/8 border-amber-400/15 text-amber-400',
  }
  return (
    <div className={`flex items-start gap-3 p-3.5 rounded-xl border ${colors[color]}`}>
      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${colors[color]}`}>{icon}</div>
      <div>
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-0.5">{title}</p>
        <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed">{desc}</p>
      </div>
    </div>
  )
}

function MockInput({ value, hint }) {
  return (
    <div className="bg-stone-800 dark:bg-[#0f0f0f] border border-stone-700/50 dark:border-white/8 rounded-xl overflow-hidden shadow-sm">
      <p className="p-4 text-sm text-stone-200 leading-relaxed font-mono">
        {value}
        <span className="inline-block w-0.5 h-4 bg-accent ml-0.5 animate-pulse align-middle" />
      </p>
      {hint && <p className="border-t border-stone-700/40 dark:border-white/5 px-4 py-2 text-[11px] text-stone-400">{hint}</p>}
    </div>
  )
}

function TalkingPointCard({ hook, bridge, opener }) {
  return (
    <div className="bg-accent/5 border border-accent/15 rounded-xl p-4 space-y-2">
      <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 leading-snug">{hook}</p>
      <p className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed italic border-l-2 border-accent/30 pl-3">{bridge}</p>
      <p className="text-xs font-medium text-accent">💬 {opener}</p>
    </div>
  )
}

// ─── Feature sections ─────────────────────────────────────────────────────────

const FEATURES = [
  {
    id: 'query',
    label: 'Natural language input',
    icon: <Zap className="w-3 h-3" />,
    title: 'One sentence. AI figures out the rest.',
    subtitle: 'Type company + pitch angle together. The AI extracts the name and routes every section through your specific product context.',
    content: (
      <div className="space-y-3">
        <MockInput
          value="Research Nvidia — pitching AI defect detection for GPU wafer fabs"
          hint="↵ company: Nvidia · pitch angle: wafer defect detection"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card icon={<Brain className="w-3.5 h-3.5"/>} title="No separate fields" desc="Company and pitch context in a single sentence." color="orange"/>
          <Card icon={<Target className="w-3.5 h-3.5"/>} title="Shapes every section" desc="News, risks, and talking points all filtered through your angle." color="blue"/>
        </div>
      </div>
    ),
  },
  {
    id: 'pdf',
    label: 'PDF product context',
    icon: <FileText className="w-3 h-3" />,
    title: 'Upload your one-pager. AI cites it.',
    subtitle: 'Attach your product PDF (up to 5MB). The AI quotes specific features, metrics, and ROI numbers from it in talking points and watch-outs.',
    content: (
      <div className="space-y-3">
        <div className="bg-stone-800 dark:bg-[#0f0f0f] border border-stone-700/50 dark:border-white/8 rounded-xl p-4 space-y-2 shadow-sm">
          <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-lg px-3 py-2 text-xs">
            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-accent font-medium">WaferSense_AI_Sales_Doc.pdf</span>
            <span className="text-accent/50 ml-auto">· 4 pages extracted</span>
          </div>
          <p className="text-xs text-stone-400">The AI references capabilities and metrics from this PDF in talking points and watch-outs.</p>
        </div>
        <TalkingPointCard
          hook="Nvidia's Blackwell GPU yield rate at TSMC fell below 60% in Q4, delaying H200 deliveries by ~3 months."
          bridge="WaferSense AI's inline defect classifier (23% yield improvement — from your PDF) addresses this directly."
          opener="'We saw the Blackwell yield reports — we've helped similar fabs cut that by 23%. Worth 20 minutes?'"
        />
      </div>
    ),
  },
  {
    id: 'intel',
    label: 'Live web intel',
    icon: <Search className="w-3 h-3" />,
    title: 'Live search. Real financials. Every run.',
    subtitle: '4 targeted web searches + live stock data on every generation. No cached database — the brief reflects what happened this week.',
    content: (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            ['📋', 'Executive Summary', true],
            ['📰', 'Recent News',       true],
            ['📊', 'Financial Signals', true],
            ['🎯', 'Talking Points',    true],
            ['⚠️', 'Watch Out For',     true],
            ['👤', 'Leadership',        false],
            ['🚀', 'Recent Launches',   false],
            ['⚔️', 'Competitors',       false],
          ].map(([icon, label, on]) => (
            <span key={label} className={`text-xs px-2.5 py-1 rounded-lg border ${
              on ? 'bg-accent/8 border-accent/20 text-accent'
                 : 'bg-stone-200/50 dark:bg-white/3 border-stone-300/50 dark:border-white/6 text-stone-500 dark:text-stone-500'
            }`}>
              {icon} {label}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card icon={<Globe className="w-3.5 h-3.5"/>} title="4 targeted searches" desc="News, earnings, leadership, and your specific pitch angle — all in one run." color="blue"/>
          <Card icon={<BarChart3 className="w-3.5 h-3.5"/>} title="Live stock chart" desc="30-day chart auto-resolved by name. 'Texas Instruments' → finds TXN." color="purple"/>
        </div>
      </div>
    ),
  },
  {
    id: 'talking',
    label: 'Talking points engine',
    icon: <Target className="w-3 h-3" />,
    title: 'HOOK + BRIDGE + OPENER. Not generic advice.',
    subtitle: 'Every talking point: a verifiable company fact, how your product addresses it, and the literal sentence to open with.',
    content: (
      <div className="space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {[
            { l: 'HOOK',   d: 'Specific fact — number, name, or date',  c: 'text-orange-400' },
            { l: 'BRIDGE', d: 'How your product addresses that fact',    c: 'text-blue-400'   },
            { l: 'OPENER', d: 'Exact words to open with in the meeting', c: 'text-emerald-400'},
          ].map(({ l, d, c }) => (
            <div key={l} className="bg-stone-800 dark:bg-[#111] rounded-xl p-3 border border-stone-700/40 dark:border-white/5 shadow-sm">
              <p className={`text-xs font-bold mb-1 ${c}`}>{l}</p>
              <p className="text-[11px] text-stone-500 leading-snug">{d}</p>
            </div>
          ))}
        </div>
        <TalkingPointCard
          hook="Nvidia's Factory Operations Blueprint (June 2025) describes an AI-native framework for autonomous fab management."
          bridge="WaferSense AI's API-native integration plugs into exactly that infrastructure layer — no custom middleware needed."
          opener="'We saw the FOX announcement — our platform integrates via API. We could have a demo running in days.'"
        />
      </div>
    ),
  },
  {
    id: 'reveal',
    label: 'Real-time brief reveal',
    icon: <Eye className="w-3 h-3" />,
    title: 'Watch it write itself. No redirect.',
    subtitle: 'When generation completes, the brief assembles inline — sections cascade in, text appears word by word. No blank loading screen.',
    content: (
      <div className="space-y-3">
        <div className="bg-stone-800 dark:bg-[#0f0f0f] border border-stone-700/50 dark:border-white/8 rounded-xl p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-accent">Brief ready</span>
          </div>
          <p className="text-base font-display font-bold text-white mb-3">Nvidia Corporation</p>
          <div className="space-y-1">
            {[
              { words: ['Nvidia', 'reported', '$81.6B', 'revenue', '(+85%', 'YoY)'], d: 0 },
              { words: ['with', 'Data', 'Center', 'at', '$75.2B', '(+92%).'], d: 0.15 },
              { words: ['For', 'a', 'wafer', 'inspection', 'pitch,', 'the'], d: 0.3 },
              { words: ['Blackwell', 'yield', 'ramp', 'is', 'the', 'entry', 'point.'], d: 0.45 },
            ].map((line, li) => (
              <div key={li} className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                {line.words.map((w, wi) => (
                  <motion.span
                    key={wi}
                    initial={{ opacity: 0, filter: 'blur(6px)', y: 4 }}
                    whileInView={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: line.d + wi * 0.06, duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
                    className="text-sm text-stone-400"
                  >{w}</motion.span>
                ))}
              </div>
            ))}
          </div>
        </div>
        <Card icon={<Eye className="w-3.5 h-3.5"/>} title="Word-by-word on the same page" desc="Sections cascade in sequentially at 16ms/word. No redirect." color="purple"/>
      </div>
    ),
  },
  {
    id: 'models',
    label: 'Model picker',
    icon: <Brain className="w-3 h-3" />,
    title: '3 free briefs/hour. Pick your model.',
    subtitle: 'LLaMA 4 Scout handles long briefs and PDFs best. LLaMA 3.3 70B for all-around quality. Live countdown resets automatically every hour.',
    content: (
      <div className="space-y-3">
        <div className="space-y-2">
          {[
            { n: 'LLaMA 4 Scout (17B)', b: 'Default · Free', d: '30K TPM · best for PDFs', hot: true,  dim: false },
            { n: 'LLaMA 3.3 (70B)',     b: 'Free',           d: '12K TPM · all-rounder',   hot: false, dim: false },
            { n: 'GPT-OSS (120B)',       b: 'Pro',            d: 'Largest model',            hot: false, dim: true  },
          ].map(m => (
            <div key={m.n} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-stone-800 dark:bg-[#111] border-stone-700/40 dark:border-white/6 shadow-sm ${m.dim ? 'opacity-45' : ''}`}>
              <span className="text-sm font-medium text-stone-200 flex-1">{m.n}</span>
              <span className="text-xs text-stone-500 hidden sm:block">{m.d}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.hot ? 'bg-accent text-white' : 'bg-stone-800 dark:bg-[#222] text-stone-400 border border-stone-700/40 dark:border-white/6'}`}>{m.b}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-full border border-accent/20 bg-accent/5 w-fit text-xs font-medium text-accent">
          <Zap className="w-3 h-3" />
          <span>2 of 3 briefs used</span>
          <span className="opacity-60">· resets in 34:17</span>
        </div>
      </div>
    ),
  },
  {
    id: 'share',
    label: 'Share & schedule',
    icon: <Globe className="w-3 h-3" />,
    title: 'Share a link. No login needed.',
    subtitle: 'One-click read-only share URL. Or schedule a brief to land in your inbox before every meeting.',
    content: (
      <div className="space-y-3">
        <div className="bg-stone-800 dark:bg-[#0f0f0f] border border-stone-700/50 dark:border-white/8 rounded-xl p-4 space-y-3 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-stone-700 dark:bg-[#1a1a1a] border border-stone-600/50 dark:border-white/6 rounded-lg px-3 py-2 text-xs font-mono text-stone-400 truncate">
              pitchpulse.app/brief/share/abc123xyz
            </div>
            <button className="px-3 py-2 bg-accent text-white text-xs font-semibold rounded-lg shrink-0">Copy</button>
          </div>
          <p className="text-xs text-stone-500">Anyone with this link can read the brief — no account needed.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Card icon={<Shield className="w-3.5 h-3.5"/>} title="Read-only share links" desc="Recipients see the brief, nothing else." color="blue"/>
          <Card icon={<RefreshCw className="w-3.5 h-3.5"/>} title="Scheduled delivery" desc="Get the brief emailed before the meeting. Set it once." color="amber"/>
        </div>
      </div>
    ),
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    /*
      overflow-x-hidden NOT overflow-hidden —
      overflow-hidden on an ancestor breaks position:sticky on descendants.
    */
    <div className="min-h-screen bg-stone-100 dark:bg-[#06060c] overflow-x-clip">

      {/* ── Hero (full hero-11 component) ────────────────────────────── */}
      <Hero11
        title={"Know your prospect\nbefore the meeting."}
        description="Type your pitch in one sentence. PitchPulse runs live web searches, pulls real financials, and builds a tailored brief in ~60 seconds — talking points, risks, and the words to open with."
        primaryText="Generate free brief"
        ctaText="Get started free"
        navItems={[
          { label: 'How it works', href: '#features' },
          { label: 'Compare',      href: '#compare'  },
        ]}
      />

      {/* ── Stats strip ──────────────────────────────────────────────── */}
      <section className="relative py-16 border-t border-stone-200 dark:border-white/5 bg-stone-100 dark:bg-[#06060c]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.3] dark:opacity-[0.12]" aria-hidden
          style={dotGrid} />
        <div className="max-w-4xl mx-auto px-6 relative">
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
            className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center"
          >
            {[
              { value: '~60s', label: 'Per brief'      },
              { value: '8',    label: 'Intel sections'  },
              { value: '4',    label: 'Live searches'   },
              { value: '$0',   label: 'To start'        },
            ].map((s, i) => (
              <motion.div key={i} variants={fadeUp} custom={i} className="space-y-1.5">
                <motion.div
                  initial={{ opacity: 0, scale: 0.65 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ type: 'spring', stiffness: 200, damping: 16, delay: i * 0.07 }}
                  className="text-4xl md:text-5xl font-display font-bold text-accent"
                >
                  {s.value}
                </motion.div>
                <p className="text-sm text-stone-500 dark:text-stone-400">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Horizontal text reveal ────────────────────────────────────── */}
      <HorizontalTextReveal>
        Stop copy-pasting from LinkedIn. PitchPulse pulls live news, real financials, and pitch-specific talking points in under a minute — tailored to what you're selling, not just the company.
      </HorizontalTextReveal>

      {/* ── Side-scroll features ──────────────────────────────────────── */}
      {/*
        NO wrapper div with style/overflow here — any background-image or
        transform on a wrapping div can implicitly create a stacking context
        that breaks position:sticky on the sidebar inside SideScrollFeatures.
        SideScrollFeatures renders its own <section> tag directly.
      */}
      <SideScrollFeatures
        sections={FEATURES}
        heading="Everything in one brief."
        subheading="Live data, PDF context, and pitch-specific talking points — assembled in ~60 seconds."
      />

      {/* ── Comparison ───────────────────────────────────────────────── */}
      <section id="compare" className="relative py-24 border-t border-stone-200 dark:border-white/5 bg-stone-100 dark:bg-[#06060c]">
        <div className="absolute inset-0 pointer-events-none opacity-[0.25] dark:opacity-[0.10]" aria-hidden style={dotGrid} />
        <div className="max-w-4xl mx-auto px-6 relative">
          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true, margin: '-80px' }}
            variants={stagger}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp}
              className="text-3xl md:text-4xl font-display font-bold mb-3 text-stone-900 dark:text-white"
            >
              What you get vs. what you had.
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="text-base text-stone-500 dark:text-stone-400 max-w-md mx-auto">
              No $40K ZoomInfo contract. No 3-month onboarding. Just open a tab.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden" whileInView="visible"
            viewport={{ once: true }}
            variants={stagger}
            className="grid grid-cols-1 md:grid-cols-2 gap-5"
          >
            {/* Before */}
            <motion.div variants={fadeUp}
              className="p-7 rounded-2xl border border-stone-200 dark:border-white/6 bg-stone-50 dark:bg-[#0d0d0d] opacity-60"
            >
              <h3 className="text-sm font-semibold mb-5 text-stone-500 uppercase tracking-wide">Before</h3>
              <ul className="space-y-3.5">
                {[
                  'Manual LinkedIn + Google copy-paste',
                  '$15–40K/year for stale databases',
                  'Generic overviews, no pitch angle',
                  'Data updated quarterly at best',
                  'IT approval and long onboarding',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-stone-500 dark:text-stone-400">
                    <span className="mt-0.5 w-4 h-4 rounded-full border border-red-400/30 flex items-center justify-center shrink-0 text-red-400 text-[10px]">✕</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* PitchPulse */}
            <motion.div variants={fadeUp} custom={1}
              className="p-7 rounded-2xl border border-accent/25 bg-accent/[0.025] relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-accent/8 blur-[70px] pointer-events-none" />
              <h3 className="text-sm font-semibold mb-5 text-accent uppercase tracking-wide relative z-10">PitchPulse</h3>
              <ul className="space-y-3.5 relative z-10">
                {[
                  'One sentence → brief in ~60 seconds',
                  'Free to start, no card required',
                  'Every section tailored to your pitch angle',
                  'Live web search + real financial data',
                  'Upload your PDF → AI quotes your own product',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-stone-800 dark:text-stone-200">
                    <span className="mt-0.5 w-4 h-4 rounded-full bg-accent/15 flex items-center justify-center shrink-0 text-accent text-[10px]">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ── Final CTA ─────────────────────────────────────────────────── */}
      <section className="relative py-28 bg-stone-100 dark:bg-[#06060c] overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.25] dark:opacity-[0.10]" aria-hidden style={dotGrid} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] h-[280px] bg-accent/[0.05] dark:bg-accent/[0.04] blur-[90px] rounded-full pointer-events-none" />
        <motion.div
          initial="hidden" whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="max-w-2xl mx-auto px-6 text-center relative z-10"
        >
          <motion.div variants={fadeUp}>
            <Chip accent><Zap className="w-3 h-3" /> 3 free briefs per hour · no card needed</Chip>
          </motion.div>
          <motion.h2 variants={fadeUp} custom={1}
            className="mt-6 text-3xl md:text-5xl font-display font-bold text-stone-900 dark:text-white"
          >
            Walk in prepared.
          </motion.h2>
          <motion.p variants={fadeUp} custom={2} className="mt-4 text-base text-stone-500 dark:text-stone-400 max-w-md mx-auto">
            Your next meeting is already on the calendar. Give yourself 60 seconds of prep.
          </motion.p>
          <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/sign-up"
              className="group inline-flex items-center gap-2 bg-accent hover:bg-accent-light text-white px-8 py-3.5 rounded-xl font-semibold transition-all active:scale-[0.97] shadow-[0_4px_14px_rgba(255,107,44,0.3)] hover:shadow-[0_6px_20px_rgba(255,107,44,0.4)]"
            >
              Get started — it's free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/sign-in" className="text-sm text-stone-500 hover:text-stone-900 dark:hover:text-white transition-colors">
              Already have an account →
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-stone-200 dark:border-white/5 bg-stone-100 dark:bg-[#06060c] py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-accent rounded-md flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">P</span>
            </div>
            <span className="font-semibold text-sm text-stone-900 dark:text-white">PitchPulse</span>
            <span className="text-stone-400 text-sm">© 2026</span>
          </div>
          <p className="text-xs text-stone-400 text-center">AI sales intelligence. Built for reps who do their homework.</p>
          <Link to="/sign-up" className="text-accent hover:underline font-medium text-xs">Get started free →</Link>
        </div>
      </footer>
    </div>
  )
}
