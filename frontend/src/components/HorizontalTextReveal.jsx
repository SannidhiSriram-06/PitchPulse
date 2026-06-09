/**
 * HorizontalTextReveal
 *
 * Sticky section. Text animates in word-by-word. Fires the instant the
 * outer wrapper enters the viewport (amount: 0) so no words get skipped.
 * Stagger is fast (12ms/word) so the full sentence is revealed in ~0.7s.
 *
 * Light mode: stone-100 bg (matches Hero11), stone-900 text.
 * Dark mode: #06060c bg, white text.
 */
import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

const POWER_WORDS = new Set([
  'live', 'real', 'tailored', 'talking', 'financials', 'under', 'minute',
  'selling', 'Stop', 'LinkedIn.', 'PitchPulse', 'news,', 'pitch-specific',
])

const wordVariants = {
  hidden:  { opacity: 0, y: 12, filter: 'blur(5px)' },
  visible: (i) => ({
    opacity: 1, y: 0, filter: 'blur(0px)',
    transition: { delay: i * 0.012, duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function HorizontalTextReveal({ children }) {
  const text  = typeof children === 'string' ? children : ''
  const words = text.split(/\s+/).filter(Boolean)

  const ref    = useRef(null)
  // Fire as soon as the outer wrapper enters (amount:0), only once
  const inView = useInView(ref, { once: true, amount: 0 })

  return (
    <div ref={ref} className="relative h-[140vh] w-full">
      <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-stone-100 dark:bg-[#06060c]">

        {/* Dot grid — matches hero-11 background texture */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.35] dark:opacity-[0.18]"
          aria-hidden
          style={{
            backgroundImage: 'radial-gradient(circle, #a8a29e 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Soft accent glow */}
        <div
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[300px] pointer-events-none"
          aria-hidden
          style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(255,107,44,0.07) 0%, transparent 70%)' }}
        />

        <div className="relative z-10 max-w-5xl px-8 md:px-16 flex flex-wrap gap-x-[0.45em] gap-y-[0.25em] justify-center text-center">
          {words.map((word, i) => {
            const isAccent = POWER_WORDS.has(word) || i % 5 === 0
            return (
              <motion.span
                key={i}
                custom={i}
                variants={wordVariants}
                initial="hidden"
                animate={inView ? 'visible' : 'hidden'}
                className={`inline-block text-3xl sm:text-4xl md:text-5xl lg:text-[3.2rem] font-display font-bold leading-tight ${
                  isAccent ? 'text-accent' : 'text-stone-900 dark:text-white'
                }`}
              >
                {word}
              </motion.span>
            )
          })}
        </div>
      </div>
    </div>
  )
}
