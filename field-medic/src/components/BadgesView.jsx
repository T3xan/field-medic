import { BADGES } from '../curriculum';

export default function BadgesView({ gameState }) {
  const { earnedBadges, completedDays, streak } = gameState;
  const earned = earnedBadges.length;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: 'var(--khaki)', letterSpacing: '0.1em', marginBottom: 6 }}>
          🏅 FIELD CITATIONS
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          {earned} of {BADGES.length} badges earned.
          {earned === BADGES.length && ' You\'re a certified Field Medic. Outstanding.'}
        </p>
      </div>

      <div className="badges-grid">
        {BADGES.map(badge => {
          const isEarned = earnedBadges.includes(badge.id);
          return (
            <div key={badge.id} className={`badge-card ${isEarned ? 'earned' : ''}`}>
              <span className="badge-icon">{badge.icon}</span>
              <div className="badge-name">{badge.name}</div>
              <div className="badge-desc">{badge.desc}</div>
              {isEarned && (
                <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green-xp)', letterSpacing: '0.05em' }}>
                  ✓ EARNED
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="tac-line" style={{ margin: '32px 0' }} />

      <div className="card">
        <div className="card-title">📊 Citation Record</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
          {[
            { label: 'Days Completed', value: completedDays.length, icon: '📅' },
            { label: 'Current Streak', value: `${streak} days`, icon: '🔥' },
            { label: 'XP Earned', value: gameState.xp.toLocaleString(), icon: '⚡' },
            { label: 'Badges Earned', value: earned, icon: '🏅' },
          ].map(s => (
            <div key={s.label} style={{ textAlign: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, border: '1px solid rgba(160,144,96,0.15)' }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 4 }}>{s.icon}</div>
              <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.5rem', color: 'var(--khaki)' }}>{s.value}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
