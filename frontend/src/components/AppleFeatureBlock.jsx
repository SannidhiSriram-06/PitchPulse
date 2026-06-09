import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Calendar, Shield, Cpu, ChevronLeft, ChevronRight, Zap, Target } from 'lucide-react'

// Device color presets representing different premium finishes
const COLOR_PRESETS = [
  { id: 'bronze-gold', name: 'Gold Edition', class: 'bg-[#C5A059]', accent: '#C5A059', gradient: 'from-[#C5A059]/20 to-transparent' },
  { id: 'titanium', name: 'Midnight Titanium', class: 'bg-[#1C1C1E]', accent: '#555555', gradient: 'from-tx-secondary/20 to-transparent' },
  { id: 'starlight', name: 'Starlight Silver', class: 'bg-[#E3E4E5]', accent: '#8E8E93', gradient: 'from-[#E3E4E5]/20 to-transparent' },
  { id: 'aurora', name: 'Deep Violet', class: 'bg-[#8F3FFF]', accent: '#8F3FFF', gradient: 'from-[#8F3FFF]/20 to-transparent' }
]

const FEATURE_DATA = [
  {
    id: 'agent',
    icon: <Cpu className="w-5 h-5" />,
    title: 'AI Consensus Engine',
    sub: '3 autonomous research agents',
    description: 'PitchPulse orchestrates three parallel AI agents to crawl, parse, and verify news, leadership logs, and financial signals in 60 seconds.',
    details: [
      { label: 'Tavily Search API Integration', val: 'Real-time validation' },
      { label: 'Multi-Agent Refinement', val: 'Consensus engine' },
      { label: 'Token Performance', val: 'Sub-minute compile' }
    ]
  },
  {
    id: 'calendar',
    icon: <Calendar className="w-5 h-5" />,
    title: 'Pre-Meeting Sync',
    sub: '5-minute automated delivery',
    description: 'Integrates directly with your Google or Outlook calendar to auto-schedule intelligence crawls. Receives briefs in your inbox 5 minutes prior to calls.',
    details: [
      { label: 'Calendar Webhooks', val: 'Instant scheduling' },
      { label: 'Channel Integrations', val: 'Slack & Email delivery' },
      { label: 'Hourly Reset Limit', val: '3 briefs/hr (free)' }
    ]
  },
  {
    id: 'battlecard',
    icon: <Target className="w-5 h-5" />,
    title: 'Targeted Battlecards',
    sub: 'Custom value alignments',
    description: 'Generates product-specific talking points by mapping your sales context against the target company\'s current risk alerts and strategic openings.',
    details: [
      { label: 'Risk Factor Analysis', val: 'Watch Out For indicators' },
      { label: 'Talking Points Generator', val: 'Tailored value props' },
      { label: 'Competitor Tracking', val: 'Real-time Battlecards' }
    ]
  }
]

export default function AppleFeatureBlock() {
  const [activePreset, setActivePreset] = useState(COLOR_PRESETS[0])
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0)
  const [expandedFeature, setExpandedFeature] = useState(null)

  const activeFeature = FEATURE_DATA[activeFeatureIndex]

  const nextFeature = () => {
    setActiveFeatureIndex((prev) => (prev + 1) % FEATURE_DATA.length)
  }

  const prevFeature = () => {
    setActiveFeatureIndex((prev) => (prev - 1 + FEATURE_DATA.length) % FEATURE_DATA.length)
  }

  return (
    <section className="relative py-28 border-t border-border dark:border-[rgba(255,255,255,0.04)] overflow-hidden">
      {/* Background elements */}
      <div className={`absolute inset-0 bg-gradient-to-b ${activePreset.gradient} opacity-20 transition-all duration-700 pointer-events-none`} />

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Header Block */}
        <div className="text-center mb-16">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-border dark:border-[rgba(255,255,255,0.06)] bg-surface-raised-light dark:bg-surface-raised mb-4 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span className="text-xs font-semibold uppercase tracking-wider text-tx-secondary">Showcase</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight mb-4 text-gradient">
            Meet the details.
          </h2>
          <p className="text-base text-tx-secondary max-w-xl mx-auto">
            Interactive visual breakdowns. Choose your style. Focus on outcomes.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Device Showcase Mockup */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center relative">
            {/* Color/Preset Picker Bar */}
            <div className="absolute -top-12 z-20 flex items-center gap-3 bg-surface-raised-light/80 dark:bg-surface-raised/80 backdrop-blur-xl border border-border dark:border-[rgba(255,255,255,0.05)] px-4 py-2 rounded-full shadow-sm">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePreset(p)}
                  className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                    activePreset.id === p.id ? 'scale-110 ring-2 ring-accent/30' : 'opacity-70 hover:opacity-100'
                  } ${p.class}`}
                  title={p.name}
                />
              ))}
            </div>

            {/* Premium iPhone-like glass screen frame */}
            <div className="relative w-full max-w-[320px] aspect-[9/18.5] bg-bg border-4 border-tx-secondary-light/40 dark:border-tx-secondary-light/20 rounded-[44px] shadow-2xl p-3.5 overflow-hidden ring-8 ring-tx-secondary-light/10">
              {/* Camera Island/Notch */}
              <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-30 flex items-center justify-between px-4">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="w-8 h-1 bg-white/10 rounded-full" />
              </div>

              {/* Dynamic device screen backdrop glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#121212] via-bg to-[#121212] z-0" />
              <div 
                className="absolute inset-0 opacity-15 blur-[60px] transition-all duration-700 z-0" 
                style={{ backgroundColor: activePreset.accent }}
              />

              {/* Device UI display */}
              <div className="relative z-10 w-full h-full flex flex-col pt-8 text-left text-white text-xs select-none">
                <div className="flex justify-between items-center px-2 mb-4">
                  <span className="font-semibold font-mono">PitchPulse</span>
                  <div className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-accent animate-pulse" />
                    <span className="text-[10px] font-mono opacity-80">PRO</span>
                  </div>
                </div>

                {/* Device Content Screen */}
                <div className="flex-1 bg-surface/50 border border-border dark:border-[rgba(255,255,255,0.06)] rounded-[28px] p-4 flex flex-col gap-4 overflow-hidden relative backdrop-blur-md">
                  {/* Dynamic mock widget based on selected feature */}
                  <AnimatePresence mode="wait">
                    {activeFeature.id === 'agent' && (
                      <motion.div
                        key="mock-agent"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Cpu className="w-4 h-4 text-accent" />
                          <span className="font-semibold text-[11px] tracking-wide uppercase text-white/90">Agent Analysis</span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                            <div className="text-[9px] text-white/40 uppercase">Research Agent</div>
                            <div className="font-medium text-white/80 mt-0.5">Crawling recent news sources...</div>
                            <div className="h-1 bg-accent/20 rounded-full mt-1.5 overflow-hidden">
                              <motion.div className="h-full bg-accent" animate={{ x: [-100, 200] }} transition={{ repeat: Infinity, duration: 1.5 }} />
                            </div>
                          </div>
                          <div className="bg-white/5 p-2 rounded-xl border border-white/5">
                            <div className="text-[9px] text-white/40 uppercase">Financial Agent</div>
                            <div className="font-medium text-white/80 mt-0.5">Parsing revenue metrics...</div>
                          </div>
                          <div className="bg-white/5 p-2 rounded-xl border border-white/5 opacity-55">
                            <div className="text-[9px] text-white/40 uppercase">Sentiment Agent</div>
                            <div className="font-medium text-white/80 mt-0.5">Analysing product chatter...</div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeFeature.id === 'calendar' && (
                      <motion.div
                        key="mock-calendar"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Calendar className="w-4 h-4 text-indigo-400" />
                          <span className="font-semibold text-[11px] tracking-wide uppercase text-white/90">Sync Scheduler</span>
                        </div>
                        <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl">
                          <div className="text-[10px] font-semibold text-indigo-400">Google Calendar Connected</div>
                          <div className="text-[9px] text-white/60 mt-1">Found 4 upcoming prospect calls today.</div>
                        </div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-[10px]">
                            <span>10:00 AM · Stripe Inc.</span>
                            <span className="text-[9px] text-accent font-semibold">Delivered</span>
                          </div>
                          <div className="flex justify-between items-center bg-white/5 p-2 rounded-lg text-[10px] opacity-80">
                            <span>02:30 PM · Figma</span>
                            <span className="text-[9px] text-indigo-400 font-semibold">Queued (2:25 PM)</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeFeature.id === 'battlecard' && (
                      <motion.div
                        key="mock-battlecard"
                        initial={{ opacity: 0, scale: 0.96 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.96 }}
                        className="space-y-3"
                      >
                        <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                          <Target className="w-4 h-4 text-emerald-400" />
                          <span className="font-semibold text-[11px] tracking-wide uppercase text-white/90">Battlecard Pitch</span>
                        </div>
                        <div className="space-y-2">
                          <div className="bg-white/5 p-2 rounded-xl">
                            <div className="text-[9px] text-white/40 uppercase">Strategic Opening</div>
                            <div className="font-medium text-emerald-400 mt-0.5">Prospect plans core infrastructure migration.</div>
                          </div>
                          <div className="bg-white/5 p-2 rounded-xl">
                            <div className="text-[9px] text-white/40 uppercase">Talking Point</div>
                            <div className="font-medium text-white/90 mt-0.5">"Align PitchPulse speed with migrations to save $..."</div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Carousel Navigation & Details */}
          <div className="lg:col-span-6 flex flex-col justify-center gap-6 text-left">
            <div className="flex items-center gap-4 mb-4">
              <button 
                onClick={prevFeature} 
                className="p-2 border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl hover:bg-surface-raised-light dark:hover:bg-surface-raised transition shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-mono text-xs text-tx-tertiary">
                {String(activeFeatureIndex + 1).padStart(2, '0')} / {String(FEATURE_DATA.length).padStart(2, '0')}
              </span>
              <button 
                onClick={nextFeature} 
                className="p-2 border border-border dark:border-[rgba(255,255,255,0.06)] rounded-xl hover:bg-surface-raised-light dark:hover:bg-surface-raised transition shadow-sm"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="space-y-6"
              >
                <div>
                  <div className="flex items-center gap-3 text-accent mb-2">
                    {activeFeature.icon}
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">{activeFeature.sub}</span>
                  </div>
                  <h3 className="text-3xl font-display font-bold leading-tight text-tx-primary-light dark:text-tx-primary">
                    {activeFeature.title}
                  </h3>
                </div>

                <p className="text-base text-tx-secondary leading-relaxed">
                  {activeFeature.description}
                </p>

                {/* Details list inside the features */}
                <div className="space-y-2 border-t border-border dark:border-[rgba(255,255,255,0.06)] pt-6">
                  {activeFeature.details.map((detail, i) => (
                    <div key={i} className="flex justify-between items-center text-xs py-1 border-b border-border/40 dark:border-[rgba(255,255,255,0.02)] last:border-0">
                      <span className="text-tx-secondary">{detail.label}</span>
                      <span className="font-semibold text-tx-primary-light dark:text-tx-primary">{detail.val}</span>
                    </div>
                  ))}
                </div>

                {/* Expandable details interaction */}
                <div>
                  <button
                    onClick={() => setExpandedFeature(expandedFeature === activeFeature.id ? null : activeFeature.id)}
                    className="text-xs text-accent hover:underline flex items-center gap-1 font-semibold uppercase tracking-wider"
                  >
                    {expandedFeature === activeFeature.id ? 'Collapse details' : 'Expand full specs &rarr;'}
                  </button>
                  
                  <AnimatePresence>
                    {expandedFeature === activeFeature.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-4 bg-surface-raised-light dark:bg-[#161616] border border-border dark:border-[rgba(255,255,255,0.05)] rounded-2xl p-4 text-xs leading-relaxed text-tx-secondary space-y-2"
                      >
                        <p className="font-medium text-tx-primary-light dark:text-tx-primary mb-1">Tech Stack & Details:</p>
                        <p>This layout operates asynchronously, connecting web crawlers to LLaMA models on Groq's low-latency execution layer.</p>
                        <p>Delivers clean, structured, and validated JSON payloads to avoid AI hallucinations and guarantee maximum confidence scores.</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}
