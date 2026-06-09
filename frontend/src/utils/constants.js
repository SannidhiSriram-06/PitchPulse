// Shared section metadata — single source of truth used across
// BriefGeneratorPage, BriefDisplayPage, and SharePage.

export const SECTION_LABELS = {
  summary: 'Executive Summary',
  news: 'Recent News',
  financials: 'Financial Signals',
  social_sentiment: 'Social Sentiment',
  talking_points: 'Talking Points',
  watch_out_for: 'Watch Out For',
  leadership_changes: 'Leadership Changes',
  job_signals: 'Job Signals',
  recent_launches: 'Recent Launches',
  competitor_activity: 'Competitor Activity'
}

export const SECTION_ICONS = {
  summary: '📋',
  news: '📰',
  financials: '📊',
  social_sentiment: '💬',
  talking_points: '🎯',
  watch_out_for: '⚠️',
  leadership_changes: '👤',
  job_signals: '💼',
  recent_launches: '🚀',
  competitor_activity: '⚔️'
}

export const ALL_SECTIONS = [
  { id: 'summary',            label: 'Executive Summary',    icon: '📋' },
  { id: 'news',               label: 'Recent News',           icon: '📰' },
  { id: 'financials',         label: 'Financial Signals',     icon: '📊' },
  { id: 'social_sentiment',   label: 'Social Sentiment',      icon: '💬' },
  { id: 'talking_points',     label: 'Talking Points',        icon: '🎯' },
  { id: 'watch_out_for',      label: 'Watch Out For',         icon: '⚠️' },
  { id: 'leadership_changes', label: 'Leadership Changes',    icon: '👤' },
  { id: 'job_signals',        label: 'Job Signals',           icon: '💼' },
  { id: 'recent_launches',    label: 'Recent Launches',       icon: '🚀' },
  { id: 'competitor_activity',label: 'Competitor Activity',   icon: '⚔️' }
]

// Real Groq-hosted model IDs. Synced with backend VALID_FREE_MODELS / VALID_PRO_MODELS.
// Chosen from the Groq rate-limits table for best balance of TPM, RPD, and quality.
export const MODELS = [
  {
    id: 'meta-llama/llama-4-scout-17b-16e-instruct',
    name: 'LLaMA 4 Scout',
    desc: 'Default · 30K TPM · best for long briefs & PDFs',
    tier: 'free'
  },
  {
    id: 'llama-3.3-70b-versatile',
    name: 'LLaMA 3.3 (70B)',
    desc: 'Highly capable · 12K TPM · great all-rounder',
    tier: 'free'
  },
  {
    id: 'openai/gpt-oss-120b',
    name: 'GPT-OSS (120B)',
    desc: 'Largest model · deepest analysis · Pro',
    tier: 'pro'
  },
  {
    id: 'qwen/qwen3-32b',
    name: 'Qwen3 (32B)',
    desc: 'Fastest RPM (60/min) · chain-of-thought · Pro',
    tier: 'pro'
  },
  {
    id: 'groq/compound-mini',
    name: 'Compound Mini',
    desc: "Groq's fastest compound model · Pro",
    tier: 'pro'
  }
]

export const TIMEZONES = [
  { value: 'Asia/Kolkata',        label: 'Asia/Kolkata (IST, UTC+5:30)' },
  { value: 'Asia/Singapore',      label: 'Asia/Singapore (SGT, UTC+8)' },
  { value: 'Asia/Tokyo',          label: 'Asia/Tokyo (JST, UTC+9)' },
  { value: 'Asia/Dubai',          label: 'Asia/Dubai (GST, UTC+4)' },
  { value: 'Asia/Shanghai',       label: 'Asia/Shanghai (CST, UTC+8)' },
  { value: 'UTC',                 label: 'UTC (UTC+0)' },
  { value: 'Europe/London',       label: 'Europe/London (GMT/BST)' },
  { value: 'Europe/Paris',        label: 'Europe/Paris (CET, UTC+1)' },
  { value: 'Europe/Berlin',       label: 'Europe/Berlin (CET, UTC+1)' },
  { value: 'America/New_York',    label: 'America/New_York (ET)' },
  { value: 'America/Chicago',     label: 'America/Chicago (CT)' },
  { value: 'America/Denver',      label: 'America/Denver (MT)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PT)' },
  { value: 'America/Sao_Paulo',   label: 'America/Sao_Paulo (BRT, UTC-3)' },
  { value: 'Australia/Sydney',    label: 'Australia/Sydney (AEST, UTC+10)' },
]
