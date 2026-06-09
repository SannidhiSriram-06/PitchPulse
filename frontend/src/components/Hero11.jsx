import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowRight, X, Menu } from "lucide-react"
import { Link } from "react-router-dom"
import ThemeToggleButton from "./ThemeToggleButton"

const cn = (...classes) => classes.filter(Boolean).join(' ')

const defaultNavItems = [
  { label: 'Features', href: '#features' },
  { label: 'Metrics', href: '#metrics' },
  { label: 'Product', href: '#product' },
]

const defaultBackground = 'https://assets.watermelon.sh/hero-11-bg.avif'

const headerVariants = {
  hidden: { opacity: 0, y: -16, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.68, bounce: 0 },
  },
}

const contentContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.12,
      staggerChildren: 0.1,
    },
  },
}

const contentItem = {
  hidden: { opacity: 0, y: 18, filter: 'blur(8px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 0.72, bounce: 0 },
  },
}

const backgroundVariants = {
  hidden: { opacity: 0, scale: 1.035, filter: 'blur(10px)' },
  visible: {
    opacity: 1,
    scale: 1,
    filter: 'blur(0px)',
    transition: { type: 'spring', duration: 1.15, bounce: 0 },
  },
}

export function Hero11({
  brandName = 'PitchPulse',
  navItems = defaultNavItems,
  ctaText = 'Get Started Free',
  ctaHref = '/sign-up',
  title = 'Know your prospect\nbefore the meeting.',
  description = 'PitchPulse generates a comprehensive AI company brief in 60 seconds — news, financials, sentiment, and talking points — so you walk into every meeting prepared to win.',
  primaryText = 'Generate Free Brief',
  primaryHref = '/sign-up',
  backgroundImage = defaultBackground,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleNavLinkClick = (href, e) => {
    e.preventDefault()
    const targetElement = document.querySelector(href)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' })
    }
    setMobileOpen(false)
  }

  return (
    <section className="relative isolate w-full overflow-hidden bg-stone-100 dark:bg-[#06060c] font-sans antialiased min-h-screen text-stone-900 dark:text-stone-100 transition-colors duration-300">
      {/* Background Graphic */}
      <motion.div
        variants={backgroundVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.35 }}
        className="absolute inset-0 will-change-transform z-0 opacity-80 dark:opacity-90"
        aria-hidden="true"
      >
        <img
          src={backgroundImage}
          alt=""
          className="h-full w-full object-cover object-center outline-1 outline-black/10"
        />
      </motion.div>

      {/* Gradients to fade grid background */}
      <div
        className="absolute inset-0 z-0 bg-[linear-gradient(90deg,rgba(250,246,236,0.96)_0%,rgba(250,246,236,0.85)_34%,rgba(250,246,236,0.3)_66%,rgba(250,246,236,0.05)_100%)] dark:bg-[linear-gradient(90deg,rgba(10,10,12,0.96)_0%,rgba(10,10,12,0.85)_34%,rgba(10,10,12,0.2)_66%,rgba(10,10,12,0.03)_100%)] transition-all duration-300"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 z-0 bg-[linear-gradient(180deg,rgba(250,246,236,0.8)_0%,rgba(250,246,236,0.05)_42%,rgba(250,246,236,0.15)_100%)] dark:bg-[linear-gradient(180deg,rgba(10,10,12,0.8)_0%,rgba(10,10,12,0.05)_42%,rgba(10,10,12,0.12)_100%)] transition-all duration-300"
        aria-hidden="true"
      />

      <div className="relative z-10 mx-auto flex min-h-[690px] w-full max-w-[1440px] flex-col px-6 py-5 sm:min-h-screen sm:px-10 lg:px-[72px]">
        {/* Header / Nav */}
        <motion.header
          variants={headerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.8 }}
          className="flex h-12 items-center justify-between"
        >
          <Link
            to="/"
            className="inline-flex min-h-10 items-center text-[22px] leading-none font-semibold tracking-tight text-stone-900 dark:text-white transition-[opacity,transform] duration-200 ease-out hover:opacity-75 active:scale-[0.96]"
          >
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center mr-2">
              <span className="text-white font-display font-bold text-sm">P</span>
            </div>
            {brandName}
          </Link>

          <nav className="hidden items-center gap-[44px] lg:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={(e) => handleNavLinkClick(item.href, e)}
                className="inline-flex min-h-10 items-center text-sm leading-none font-medium text-stone-800/80 dark:text-stone-300/80 transition-colors duration-200 ease-out hover:text-accent dark:hover:text-accent"
              >
                {item.label}
              </a>
            ))}
          </nav>
          <div className="flex gap-3 items-center">
            <ThemeToggleButton />
            <Link
              to="/sign-in"
              className="hidden min-h-10 items-center justify-center px-5 text-sm leading-none font-medium text-stone-800 dark:text-stone-200 border border-border dark:border-white/10 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors sm:inline-flex"
            >
              Sign in
            </Link>
            <motion.a
              href={ctaHref}
              whileTap={{ scale: 0.96 }}
              className="hidden min-h-10 items-center justify-center bg-accent px-6 text-sm leading-none font-semibold text-white rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.14)] hover:bg-accent-light transition-colors sm:inline-flex"
            >
              {ctaText}
            </motion.a>

            <button
              type="button"
              aria-label="Open navigation menu"
              onClick={() => setMobileOpen(true)}
              className="inline-flex size-10 items-center justify-center bg-accent text-white rounded-xl shadow-[0_1px_2px_rgba(15,23,42,0.14)] active:scale-[0.96] lg:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </motion.header>

        {/* Mobile Navigation Drawer */}
        <AnimatePresence initial={false}>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -10, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -6, filter: 'blur(5px)' }}
              transition={{ type: 'spring', duration: 0.3, bounce: 0 }}
              className="fixed inset-x-4 top-4 z-50 bg-white/90 dark:bg-stone-900/90 p-4 text-stone-900 dark:text-stone-100 shadow-2xl rounded-2xl outline outline-1 outline-white/70 dark:outline-white/10 backdrop-blur-xl lg:hidden"
            >
              <div className="flex items-center justify-between pl-3">
                <Link
                  to="/"
                  className="text-xl font-semibold tracking-[-0.025em]"
                >
                  {brandName}
                </Link>
                <button
                  type="button"
                  aria-label="Close navigation menu"
                  onClick={() => setMobileOpen(false)}
                  className="inline-flex size-10 items-center justify-center text-stone-900 dark:text-stone-100 transition-[background-color,transform] duration-200 ease-out hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.96]"
                >
                  <X className="size-4" />
                </button>
              </div>

              <nav className="mt-5 grid gap-1">
                {navItems.map((item) => (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={(e) => handleNavLinkClick(item.href, e)}
                    className="inline-flex min-h-11 items-center px-3 text-sm font-medium text-stone-800 dark:text-stone-200 transition-colors duration-200 ease-out hover:bg-black/5 dark:hover:bg-white/5 rounded-lg"
                  >
                    {item.label}
                  </a>
                ))}
              </nav>

              <div className="flex flex-col gap-2 mt-4">
                <Link
                  to="/sign-in"
                  className="inline-flex min-h-11 items-center justify-center border border-border dark:border-white/15 px-5 text-sm font-semibold text-stone-800 dark:text-stone-200 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  Sign in
                </Link>
                <motion.a
                  href={ctaHref}
                  whileTap={{ scale: 0.96 }}
                  className="inline-flex min-h-11 w-full items-center justify-center bg-accent px-5 text-sm font-semibold text-white rounded-lg hover:bg-accent-light transition-colors"
                >
                  {ctaText}
                </motion.a>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>

        {/* Hero Content Area */}
        <motion.div
          variants={contentContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.42 }}
          className="flex flex-1 items-center pt-[76px] sm:pt-[105px] lg:pt-[76px] z-10"
        >
          <div className="max-w-[700px] text-left">
            <motion.h1
              variants={contentItem}
              className="text-[clamp(2.5rem,5vw,4.5rem)] leading-[1.05] font-extrabold tracking-[-0.045em] text-balance whitespace-pre-line text-stone-900 dark:text-white"
            >
              {title}
            </motion.h1>

            <motion.p
              variants={contentItem}
              className="mt-6 max-w-[480px] text-[clamp(1rem,1.2vw,1.15rem)] leading-[1.5] font-medium text-pretty text-stone-800/90 dark:text-stone-300/90"
            >
              {description}
            </motion.p>

            <motion.a
              href={primaryHref}
              variants={contentItem}
              whileTap={{ scale: 0.96 }}
              className="mt-8 inline-flex min-h-12 items-center gap-2.5 bg-accent px-6 text-sm leading-none font-semibold text-white rounded-xl shadow-[0_4px_14px_rgba(255,107,44,0.3)] transition-all duration-200 ease-out hover:bg-accent-light hover:shadow-[0_6px_20px_rgba(255,107,44,0.4)]"
            >
              <span>{primaryText}</span>
              <ArrowRight className="size-4" />
            </motion.a>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero11
