import { forwardRef } from 'react'

const cn = (...classes) => classes.filter(Boolean).join(' ')

const variantStyles = {
  default:     'bg-accent text-white hover:bg-accent-light active:scale-[0.97]',
  outline:     'bg-surface-raised-light dark:bg-[#1a1a1a] text-tx-primary-light dark:text-tx-primary border border-border dark:border-[rgba(255,255,255,0.08)] hover:bg-surface-light dark:hover:bg-[#222] active:scale-[0.97]',
  secondary:   'bg-surface-raised-light dark:bg-surface-raised text-tx-secondary-light dark:text-tx-secondary hover:text-tx-primary-light dark:hover:text-tx-primary active:scale-[0.97]',
  ghost:       'bg-transparent text-tx-secondary hover:bg-surface-raised-light dark:hover:bg-surface-raised active:scale-[0.97]',
  destructive: 'bg-red-600 text-white hover:bg-red-700 active:scale-[0.97]',
}

const sizeStyles = {
  default: 'px-5 py-2.5 rounded-xl text-sm font-semibold',
  sm:      'px-4 py-2 rounded-lg text-xs font-semibold',
  lg:      'px-8 py-3 rounded-2xl text-base font-bold',
  icon:    'p-2.5 rounded-xl flex items-center justify-center shrink-0',
}

export const MetalButton = forwardRef(function MetalButton(
  {
    children,
    variant = 'default',
    size = 'default',
    className = '',
    type = 'button',
    // Accept but ignore MetalFx-specific props so callers don't break
    metalFxClassName,
    metalFxStyle,
    preset,
    theme,
    strength,
    paused,
    borderRadius,
    disableGlow,
    reflectionTargets,
    shaderScale,
    ringCssPx,
    scale,
    metalVariant,
    normalizeHostStyles,
    ...buttonProps
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex items-center gap-2 select-none transition-all duration-150 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size]       || sizeStyles.default,
        className
      )}
      {...buttonProps}
    >
      {children}
    </button>
  )
})

MetalButton.displayName = 'MetalButton'

export const MetalIconButton = forwardRef(function MetalIconButton(
  { size = 'icon', metalVariant, className = '', ...props },
  ref
) {
  return (
    <MetalButton
      ref={ref}
      size={size}
      className={cn('[&_svg]:w-4 [&_svg]:h-4 [&_svg]:shrink-0', className)}
      {...props}
    />
  )
})

MetalIconButton.displayName = 'MetalIconButton'
