import { useRef } from 'react'
import { Brain, Paperclip, X, FileText, ChevronDown } from 'lucide-react'
import { MODELS } from '../utils/constants'

export default function AIChatInput({
  value,
  onChange,
  onSubmit,
  generating = false,
  selectedModel,
  onModelPickerToggle,
  showModelPicker = false,
  deepMindMode,
  setDeepMindMode,
  pdfFile,
  onPdfSelect,
  onPdfClear,
  userTier = 'free'
}) {
  const fileRef = useRef(null)
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0]

  return (
    <div className="bg-surface-light dark:bg-[#141414] border border-border dark:border-[rgba(255,255,255,0.08)] rounded-2xl shadow-lg overflow-visible squircle">
      {/* PDF context banner */}
      {pdfFile && (
        <div className="flex items-center gap-2 px-4 pt-3 pb-0">
          <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-xl px-3 py-1.5 text-xs flex-1 min-w-0">
            <FileText className="w-3.5 h-3.5 text-accent shrink-0" />
            <span className="text-accent font-medium truncate">{pdfFile.name}</span>
            <span className="text-accent/60 shrink-0">· context loaded</span>
          </div>
          <button
            onClick={onPdfClear}
            className="p-1 text-tx-tertiary hover:text-red-400 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main textarea */}
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Describe what you want to research and why — e.g. 'Research Nvidia, I'm pitching AI software that detects manufacturing flaws in chip production in real time'"
        rows={4}
        className="w-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed px-4 pt-4 pb-3 placeholder:text-tx-tertiary/50"
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            e.preventDefault()
            onSubmit(e)
          }
        }}
      />

      {/* Controls bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-border dark:border-[rgba(255,255,255,0.04)]">
        {/* PDF upload */}
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="sr-only"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) onPdfSelect(file)
            e.target.value = ''
          }}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          title="Upload product PDF (< 5MB) for richer AI context"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.97] ${
            pdfFile
              ? 'bg-accent/10 border-accent/30 text-accent'
              : 'bg-surface-raised-light dark:bg-[#1c1c1c] border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:text-tx-primary'
          }`}
        >
          <Paperclip className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{pdfFile ? 'PDF added' : 'Add PDF'}</span>
        </button>

        {/* Deep Mind */}
        <button
          type="button"
          onClick={() => setDeepMindMode(!deepMindMode)}
          title="Deep analysis mode — more thorough, slower"
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.97] ${
            deepMindMode
              ? 'bg-accent text-white border-accent'
              : 'bg-surface-raised-light dark:bg-[#1c1c1c] border-border dark:border-[rgba(255,255,255,0.06)] text-tx-secondary hover:text-tx-primary'
          }`}
        >
          <Brain className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Deep Mind</span>
        </button>

        {/* Model trigger */}
        <button
          type="button"
          onClick={onModelPickerToggle}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all active:scale-[0.97] ml-auto ${
            showModelPicker
              ? 'bg-accent/10 border-accent/40 text-accent'
              : 'bg-surface-raised-light dark:bg-[#1c1c1c] border-border dark:border-[rgba(255,255,255,0.06)] text-tx-primary-light dark:text-tx-primary hover:border-border-strong'
          }`}
        >
          <span className="max-w-[100px] truncate">{currentModel.name}</span>
          <ChevronDown className={`w-3 h-3 text-tx-tertiary transition-transform ${showModelPicker ? 'rotate-180' : ''}`} />
        </button>

        {/* Send */}
        <button
          type="button"
          onClick={onSubmit}
          disabled={generating || !value.trim()}
          className="px-4 py-1.5 bg-accent hover:bg-accent-light text-white text-xs font-bold rounded-lg transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed glow-accent-sm"
        >
          {generating ? 'Generating…' : 'Generate →'}
        </button>
      </div>
    </div>
  )
}
