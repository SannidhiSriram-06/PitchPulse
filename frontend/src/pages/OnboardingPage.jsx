import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X, ChevronRight, ChevronLeft, Zap } from 'lucide-react'
import useAuthStore from '../store/authStore'
import usePrefsStore from '../store/prefsStore'
import api from '../lib/api'

export default function OnboardingPage() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const setPrefs = usePrefsStore((s) => s.setPrefs)

    const [step, setStep] = useState(1)
    const [company, setCompany] = useState('')
    const [companies, setCompanies] = useState([])
    const [length, setLength] = useState('medium')
    const [view, setView] = useState('tabs')
    const [loading, setLoading] = useState(false)

    const addCompany = () => {
        const trimmed = company.trim()
        if (!trimmed || companies.includes(trimmed) || companies.length >= 5) return
        setCompanies([...companies, trimmed])
        setCompany('')
    }

    const removeCompany = (c) => setCompanies(companies.filter((x) => x !== c))

    const finish = async () => {
        setLoading(true)
        setPrefs({ defaultLength: length, defaultView: view })
        try {
            await api.patch('/api/user/preferences', { default_length: length, default_view: view })
            for (const c of companies) {
                await api.post('/api/watchlist', { company_name: c })
            }
        } catch (e) { /* non-fatal */ }
        localStorage.setItem('onboarded', 'true')
        navigate('/dashboard')
    }

    const stepLabel = ['Companies', 'Preferences', 'Ready']

    return (
        <div style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>

            {/* Logo */}
            <div style={{ fontSize: '1.25rem', fontWeight: '800', marginBottom: '4rem', letterSpacing: '-0.5px' }}>
                <span style={{ color: '#fff' }}>Pitch</span><span style={{ color: 'var(--accent)' }}>Pulse</span>
            </div>

            {/* Step indicators */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '3rem', alignItems: 'center' }}>
                {[1, 2, 3].map((s) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '0.8rem', fontWeight: '800',
                            background: step === s ? 'var(--accent)' : step > s ? 'var(--border-2)' : 'var(--surface-2)',
                            color: step === s ? '#000' : 'var(--text-sec)',
                            border: `1px solid ${step === s ? 'var(--accent)' : 'var(--border)'}`,
                            transition: 'all 0.3s'
                        }}>
                            {step > s ? '✓' : s}
                        </div>
                        {s < 3 && <div style={{ width: '3rem', height: '1px', background: 'var(--border)', opacity: 0.5 }} />}
                    </div>
                ))}
            </div>

            {/* Card */}
            <div style={{ 
                background: 'var(--surface)', border: '1px solid var(--border)', 
                borderRadius: 'var(--radius-lg)', padding: '2.5rem', 
                width: '100%', maxWidth: '480px',
                boxShadow: 'var(--shadow)',
                animation: 'slideUp 0.4s ease'
            }}>

                {/* Step 1 */}
                {step === 1 && (
                    <div style={{ animation: 'slideUp 0.3s ease' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>Track companies</h2>
                        <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>Add companies you meet with often. We'll keep them on your watchlist for one-click intelligence.</p>

                        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
                            <input
                                value={company} onChange={(e) => setCompany(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addCompany()}
                                placeholder="e.g. Zomato, Infosys..."
                                style={{ flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem 1rem', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' }}
                            />
                            <button onClick={addCompany} disabled={companies.length >= 5}
                                style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', padding: '0.8rem 1.25rem', color: '#000', fontWeight: '800', cursor: 'pointer' }}>
                                <Plus size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', minHeight: '3rem', marginBottom: '2.5rem' }}>
                            {companies.map((c) => (
                                <div key={c} style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '4px', padding: '0.4rem 0.75rem', fontSize: '0.8rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.6rem', color: 'var(--accent)' }}>
                                    {c}
                                    <X size={14} onClick={() => removeCompany(c)} style={{ cursor: 'pointer', color: 'var(--text-sec)' }} />
                                </div>
                            ))}
                            {companies.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Add up to 5 companies to start.</span>}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <button onClick={() => setStep(2)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer' }}>Skip for now</button>
                            <button onClick={() => setStep(2)}
                                style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', padding: '0.8rem 1.75rem', color: '#000', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Continue <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 2 */}
                {step === 2 && (
                    <div style={{ animation: 'slideUp 0.3s ease' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.75rem', letterSpacing: '-0.5px' }}>Set your defaults</h2>
                        <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>Choose how you want your intelligence delivered. You can always change this later.</p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', display: 'block', marginBottom: '0.75rem' }}>Intelligence Depth</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['short', 'medium', 'long'].map((l) => (
                                    <button key={l} onClick={() => setLength(l)}
                                        style={{ 
                                            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', 
                                            border: `1px solid ${length === l ? 'var(--border-accent)' : 'var(--border)'}`, 
                                            background: length === l ? 'var(--accent-soft)' : 'transparent', 
                                            color: length === l ? 'var(--accent)' : 'var(--text-sec)', 
                                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', textTransform: 'capitalize' 
                                        }}>
                                        {l}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ marginBottom: '2.5rem' }}>
                            <label style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: '700', display: 'block', marginBottom: '0.75rem' }}>Interface Style</label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['tabs', 'cards'].map((v) => (
                                    <button key={v} onClick={() => setView(v)}
                                        style={{ 
                                            flex: 1, padding: '0.75rem', borderRadius: 'var(--radius-sm)', 
                                            border: `1px solid ${view === v ? 'var(--border-accent)' : 'var(--border)'}`, 
                                            background: view === v ? 'var(--accent-soft)' : 'transparent', 
                                            color: view === v ? 'var(--accent)' : 'var(--text-sec)', 
                                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: '700', textTransform: 'capitalize' 
                                        }}>
                                        {v}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(1)}
                                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem 1.25rem', color: 'var(--text-sec)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                                <ChevronLeft size={18} /> Back
                            </button>
                            <button onClick={() => setStep(3)}
                                style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', padding: '0.8rem 1.75rem', color: '#000', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                Review <ChevronRight size={18} />
                            </button>
                        </div>
                    </div>
                )}

                {/* Step 3 */}
                {step === 3 && (
                    <div style={{ animation: 'slideUp 0.3s ease' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid var(--border-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                <Zap size={32} color="var(--accent)" fill="currentColor" />
                            </div>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.5rem', letterSpacing: '-0.5px' }}>Systems ready</h2>
                            <p style={{ color: 'var(--text-sec)', fontSize: '0.9rem' }}>Review your profile intelligence settings.</p>
                        </div>

                        <div style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem', marginBottom: '2.5rem' }}>
                            {[
                                { label: 'Watchlist', value: companies.length > 0 ? companies.join(', ') : 'None' },
                                { label: 'Intelligence Depth', value: length },
                                { label: 'Interface View', value: view },
                            ].map((item) => (
                                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-sec)', fontSize: '0.85rem', fontWeight: '500' }}>{item.label}</span>
                                    <span style={{ fontSize: '0.85rem', fontWeight: '700', textTransform: 'capitalize', color: 'var(--accent)' }}>{item.value}</span>
                                </div>
                            ))}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <button onClick={() => setStep(2)}
                                style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '0.8rem 1.25rem', color: 'var(--text-sec)', cursor: 'pointer', fontWeight: '600' }}>
                                Back
                            </button>
                            <button onClick={finish} disabled={loading}
                                style={{ background: 'var(--accent)', border: 'none', borderRadius: 'var(--radius)', padding: '0.8rem 2rem', color: '#000', fontWeight: '800', cursor: 'pointer', boxShadow: 'var(--accent-glow)' }}>
                                {loading ? 'Initializing...' : 'Launch Dashboard'}
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
