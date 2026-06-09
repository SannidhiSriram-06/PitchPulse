import * as React from "react"
import { AnimatePresence, motion } from "framer-motion"

const cn = (...classes) => classes.filter(Boolean).join(' ')

const ShiftCard = React.forwardRef(
  (
    {
      className,
      topContent,
      topAnimateContent,
      middleContent,
      bottomContent,
      ...props
    },
    ref
  ) => {
    const [isHovered, setHovered] = React.useState(false)

    return (
      <motion.div
        ref={ref}
        className={cn(
          "min-h-[260px] w-full flex flex-col justify-between overflow-hidden rounded-2xl text-sm transition-all duration-300",
          "hover:cursor-pointer relative",
          "bg-white dark:bg-[#121214] border border-border dark:border-[rgba(255,255,255,0.06)]",
          "shadow-sm hover:shadow-xl hover:border-accent/40",
          className
        )}
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ y: -6 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        {...props}
      >
        {/* Glow effect background */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-b from-accent/5 to-transparent opacity-0 pointer-events-none transition-opacity duration-300"
          animate={{ opacity: isHovered ? 1 : 0 }}
        />

        {/* Top Header */}
        <div className="flex h-[46px] w-full flex-col relative text-tx-primary-light dark:text-tx-primary z-20 p-4 pb-0">
          <div className="w-full relative">
            {topContent}
            <AnimatePresence>
              {isHovered && topAnimateContent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: 10 }}
                  className="absolute right-0 top-0"
                >
                  {topAnimateContent}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Middle Content Summary */}
        <div className="w-full flex items-center justify-center flex-1 py-4 px-4 z-10">
          <motion.div
            animate={{
              y: isHovered ? -2 : 0,
              scale: isHovered ? 1.01 : 1,
            }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="w-full h-full flex items-center justify-center"
          >
            {middleContent}
          </motion.div>
        </div>

        {/* Bottom content / Footer */}
        <div className="w-full z-20 mt-auto">
          {bottomContent}
        </div>
      </motion.div>
    )
  }
)

ShiftCard.displayName = "ShiftCard"

export { ShiftCard }
export default ShiftCard
