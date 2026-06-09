import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowUpRight, ArrowDown } from "lucide-react"
import { Link } from "react-router-dom"
import ThemeToggleButton from "./ThemeToggleButton"

const cn = (...classes) => classes.filter(Boolean).join(' ')

const DEFAULT_NAV = [
  { label: "Features", href: "#features" },
  { label: "Metrics", href: "#metrics" },
  { label: "Product", href: "#product" },
]

export default function Hero1({
  brand = (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
        <span className="text-white font-display font-bold text-sm">P</span>
      </div>
      <span className="font-display font-bold text-lg text-tx-primary-light dark:text-tx-primary">PitchPulse</span>
    </div>
  ),
  navLinks = DEFAULT_NAV,
  headline = (
    <>
      Know your prospect
      <br />
      <span className="text-accent">before</span> the meeting.
    </>
  ),
  ctaLabel = "Start free — no card needed",
  ctaHref = "/sign-up",
  description = "PitchPulse generates a comprehensive AI company brief in 60 seconds — news, financials, sentiment, and talking points — so you walk into every meeting prepared to win.",
  signInLabel = "Sign in",
  signInHref = "/sign-in",
}) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleNavLinkClick = (href, e) => {
    e.preventDefault()
    const targetElement = document.querySelector(href)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' })
    }
    setIsMobileMenuOpen(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] },
    },
  }

  const backgroundVariants = {
    hidden: { opacity: 0, scale: 1.05 },
    visible: {
      opacity: 0.9,
      scale: 1,
      transition: { duration: 1.2, ease: "easeOut" },
    },
  }

  return (
    <section
      className={cn(
        "relative w-full min-h-screen flex flex-col justify-between overflow-hidden transition-colors duration-300",
        "bg-bg-light dark:bg-[#06060c]"
      )}
    >
      {/* Background Graphic */}
      <motion.div
        initial="hidden"
        animate="visible"
        variants={backgroundVariants}
        className="absolute bottom-0 left-0 w-full sm:w-[85%] md:w-[65%] h-[80%] md:h-[75%] pointer-events-none select-none z-0 overflow-hidden opacity-50 dark:opacity-90"
      >
        <img
          src="https://assets.watermelon.sh/hero-1.avif"
          alt="Grid structure background"
          className="absolute inset-0 h-full w-full object-cover object-bottom-left"
        />
        <div
          className="absolute inset-0 transition-colors duration-300"
          style={{
            background: "radial-gradient(ellipse 80% 70% at 20% 80%, transparent 40%, var(--bg-radial-fade, #06060c) 85%)",
          }}
        />
      </motion.div>

      {/* Styled variables for light/dark mode radial fade */}
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --bg-radial-fade: #fafafa;
        }
        .dark {
          --bg-radial-fade: #06060c;
        }
      `}} />

      {/* Header / Navbar */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="relative z-50 flex items-center justify-between px-6 py-6 md:px-12 lg:px-20"
      >
        <Link to="/" className="flex items-center gap-1 group">
          {brand}
        </Link>

        <nav className="hidden md:block">
          <ul className="flex items-center gap-12 lg:gap-16">
            {navLinks.map((link) => (
              <li key={link.label} className="relative py-1">
                <a
                  href={link.href}
                  onClick={(e) => handleNavLinkClick(link.href, e)}
                  className="text-sm font-medium transition-colors duration-300 relative px-0.5 tracking-wide text-tx-secondary-light dark:text-white/60 hover:text-tx-primary-light dark:hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden md:flex items-center gap-4 ml-4">
          <ThemeToggleButton />
          <Link
            to={signInHref}
            className="inline-flex items-center justify-center px-5 py-2 rounded-xl border border-border dark:border-white/20 text-tx-primary-light dark:text-white text-sm font-medium bg-transparent hover:bg-black/5 dark:hover:bg-white/5 transition-all duration-300"
          >
            {signInLabel}
          </Link>
          <Link
            to={ctaHref}
            className="inline-flex items-center justify-center px-5 py-2 rounded-xl bg-accent text-white text-sm font-medium hover:bg-accent-light transition-all duration-300"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggleButton />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="flex flex-col justify-center items-center w-9 h-9 rounded-full border border-border dark:border-white/15 bg-white/5 hover:bg-black/5 dark:hover:bg-white/10 transition-colors z-50 relative"
            aria-label="Toggle navigation menu"
          >
            <div className="w-4 h-4 flex flex-col justify-between items-center relative">
              <span
                className={cn(
                  "w-full h-[1.5px] bg-tx-primary-light dark:bg-white transition-all duration-300 absolute left-0",
                  isMobileMenuOpen ? "rotate-45 top-[7px]" : "top-[2px]"
                )}
              />
              <span
                className={cn(
                  "w-full h-[1.5px] bg-tx-primary-light dark:bg-white transition-all duration-300 absolute left-0 top-[7px]",
                  isMobileMenuOpen && "opacity-0"
                )}
              />
              <span
                className={cn(
                  "w-full h-[1.5px] bg-tx-primary-light dark:bg-white transition-all duration-300 absolute left-0",
                  isMobileMenuOpen ? "-rotate-45 top-[7px]" : "top-[12px]"
                )}
              />
            </div>
          </button>
        </div>
      </motion.header>

      {/* Mobile Nav Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 bg-bg-light/98 dark:bg-[#06060c]/98 backdrop-blur-md z-40 flex flex-col justify-between px-6 py-24 md:hidden"
          >
            <nav className="flex flex-col gap-6 mt-8">
              {navLinks.map((link, idx) => (
                <motion.div
                  key={link.label}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <a
                    href={link.href}
                    onClick={(e) => handleNavLinkClick(link.href, e)}
                    className="text-2xl font-semibold transition-colors duration-200 block text-tx-secondary-light dark:text-white/60"
                  >
                    {link.label}
                  </a>
                </motion.div>
              ))}
            </nav>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="flex flex-col gap-4"
            >
              <Link
                to={signInHref}
                className="w-full py-3 rounded-xl border border-border dark:border-white/20 text-tx-primary-light dark:text-white text-center text-base font-medium bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
              >
                {signInLabel}
              </Link>
              <Link
                to={ctaHref}
                className="w-full py-3 rounded-xl bg-accent text-white text-center text-base font-medium hover:bg-accent-light transition-colors"
              >
                Get Started
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Hero Content */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 flex-1 flex flex-col justify-between px-6 pt-12 pb-10 md:px-12 lg:px-20 md:pt-16 md:pb-12"
      >
        <div className="flex flex-col gap-8 md:gap-10 max-w-[850px] mt-[5vh]">
          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-semibold leading-[1.08] tracking-[-0.04em] text-tx-primary-light dark:text-white text-left"
          >
            {headline}
          </motion.h1>

          <motion.div variants={itemVariants} className="w-fit">
            <Link
              to={ctaHref}
              className="inline-flex w-fit items-center gap-4 bg-tx-primary-light dark:bg-white text-white dark:text-black font-medium text-sm p-1 pl-4 rounded-lg hover:brightness-110 dark:hover:bg-white/90 transition-all duration-300 shadow-lg group"
            >
              <span>{ctaLabel}</span>
              <span className="w-8 h-8 rounded-md bg-accent flex items-center justify-center shrink-0 overflow-hidden relative">
                <ArrowUpRight className="w-4 h-4 text-white transition-transform duration-300 ease-out group-hover:translate-x-[2px] group-hover:translate-y-[-2px]" />
              </span>
            </Link>
          </motion.div>
        </div>

        <motion.div
          variants={itemVariants}
          className="flex flex-col lg:flex-row lg:items-end justify-between gap-12 lg:gap-10 mt-auto pt-16 w-full relative"
        >
          <div className="md:max-w-2xl">
            <p className="text-tx-secondary-light dark:text-white/80 text-base md:text-lg lg:text-xl leading-relaxed font-normal whitespace-pre-line text-left">
              {description}
            </p>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between lg:justify-end gap-10 pb-1 w-full lg:w-auto">
            {/* Scroll Indicator */}
            <div className="hidden md:flex items-center gap-3 text-tx-secondary-light dark:text-white text-sm lg:text-base tracking-wide lg:absolute lg:left-1/2 lg:-translate-x-1/2 lg:bottom-1">
              <span>Scroll to Discover</span>
              <motion.span
                animate={{ y: [0, 4, 0] }}
                transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              >
                <ArrowDown className="w-4 h-4 text-tx-secondary-light dark:text-white" strokeWidth={1.5} />
              </motion.span>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}
