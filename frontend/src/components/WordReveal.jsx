import { motion } from 'framer-motion'

/**
 * WordReveal — renders text with a word-by-word blur-fade-up animation.
 *
 * Props:
 *   text      {string}   Text to animate
 *   delay     {number}   Seconds before the first word starts appearing (default 0)
 *   speed     {number}   Seconds between each word (default 0.018)
 *   className {string}   Applied to every word span
 *   as        {string}   Wrapper element tag (default 'p')
 *   wrapperClass {string} Class on the wrapper element
 */
export default function WordReveal({
  text = '',
  delay = 0,
  speed = 0.018,
  className = '',
  as: Tag = 'p',
  wrapperClass = '',
}) {
  if (!text) return null
  if (speed === 0) {
    return (
      <Tag className={wrapperClass}>
        {text}
      </Tag>
    )
  }

  // Split on whitespace but keep newlines as explicit break markers
  const segments = text.split('\n')

  let wordIndex = 0

  return (
    <Tag className={wrapperClass}>
      {segments.map((line, lineIdx) => {
        const words = line.split(/\s+/).filter(Boolean)
        const lineElements = words.map((word) => {
          const idx = wordIndex++
          return (
            <motion.span
              key={`${lineIdx}-${idx}`}
              initial={{ opacity: 0, filter: 'blur(6px)', y: 5 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              transition={{
                delay: delay + idx * speed,
                duration: 0.38,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`inline ${className}`}
            >
              {word}{' '}
            </motion.span>
          )
        })
        return (
          <span key={lineIdx}>
            {lineElements}
            {lineIdx < segments.length - 1 && <br />}
          </span>
        )
      })}
    </Tag>
  )
}
