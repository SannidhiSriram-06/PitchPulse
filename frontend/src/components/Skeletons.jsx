export function BriefCardSkeleton() {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
      <div style={{ animation: 'pulse 2s infinite' }}>
        <div style={{ background: 'var(--surface-2)', height: '24px', width: '60%', borderRadius: '4px', marginBottom: '1rem' }} />
        <div style={{ background: 'var(--surface-2)', height: '14px', width: '100%', borderRadius: '4px', marginBottom: '0.5rem' }} />
        <div style={{ background: 'var(--surface-2)', height: '14px', width: '90%', borderRadius: '4px', marginBottom: '1.5rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <div style={{ background: 'var(--surface-2)', height: '20px', width: '60px', borderRadius: '99px' }} />
          <div style={{ background: 'var(--surface-2)', height: '20px', width: '80px', borderRadius: '99px' }} />
        </div>
      </div>
    </div>
  );
}

export function WatchlistItemSkeleton() {
  return (
    <div style={{ padding: '0.6rem 0.75rem', animation: 'pulse 2s infinite' }}>
      <div style={{ background: 'var(--surface-2)', height: '14px', width: '70%', borderRadius: '4px', marginBottom: '0.4rem' }} />
      <div style={{ background: 'var(--surface-2)', height: '10px', width: '40%', borderRadius: '4px' }} />
    </div>
  );
}
