import { ArrowRight } from 'lucide-react'

function BackgroundGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl opacity-20 dark:opacity-30 pointer-events-none">
      <div className="grid h-full w-full grid-cols-12 grid-rows-6">
        {Array.from({ length: 72 }).map((_, index) => (
          <div
            key={index}
            className="border-border/30 dark:border-[rgba(255,255,255,0.03)] border transition-colors duration-300"
          />
        ))}
      </div>
    </div>
  )
}

function ErrorContent({ title, description, buttonLabel, onAction }) {
  return (
    <div className="relative z-10 flex max-w-md flex-col items-center justify-center gap-5 text-center sm:items-start sm:text-left">
      <div className="space-y-2">
        <h1 className="text-tx-primary-light dark:text-tx-primary text-3xl sm:text-4xl leading-tight font-bold tracking-tight">
          {title}
        </h1>
        <p className="text-tx-secondary-light dark:text-tx-secondary max-w-sm text-sm leading-normal">
          {description}
        </p>
      </div>

      {onAction && (
        <button
          onClick={onAction}
          className="group flex items-center gap-2 rounded-xl bg-accent hover:bg-accent-light text-white px-5 py-2.5 text-sm font-semibold shadow-md transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>{buttonLabel}</span>
          <span className="flex items-center justify-center transition-transform duration-200 group-hover:translate-x-1">
            <ArrowRight className="w-4 h-4" />
          </span>
        </button>
      )}
    </div>
  )
}

function ErrorCode({ code }) {
  return (
    <div className="relative z-10 flex items-center justify-center select-none pointer-events-none">
      <span className="text-accent/20 dark:text-accent/10 text-[6rem] sm:text-[8rem] md:text-[10rem] font-black leading-none tracking-tighter">
        {code}
      </span>
    </div>
  )
}

export default function ErrorScreen({
  code = "500",
  title = "Something went wrong.",
  description = "The database or API server could not be reached. Check your network or try again.",
  buttonLabel = "Retry Connection",
  onAction,
}) {
  return (
    <div className="p-4 w-full max-w-4xl mx-auto my-8">
      <div className="bg-surface-light dark:bg-surface border border-border dark:border-[rgba(255,255,255,0.06)] relative overflow-hidden rounded-[2rem] p-8 sm:p-12 lg:p-16 w-full shadow-xl">
        <BackgroundGrid />

        <div className="relative z-10 grid grid-cols-1 gap-8 sm:grid-cols-2 sm:items-center">
          <div className="order-2 sm:order-1">
            <ErrorContent
              title={title}
              description={description}
              buttonLabel={buttonLabel}
              onAction={onAction}
            />
          </div>

          <div className="order-1 sm:order-2">
            <ErrorCode code={code} />
          </div>
        </div>
      </div>
    </div>
  )
}
