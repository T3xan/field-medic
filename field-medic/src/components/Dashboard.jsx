import { getLessonInfo, MODULES, getLevel } from '../curriculum';

export default function Dashboard({ gameState, onOpenLesson }) {
  const { currentDay, completedDays, xp, streak, earnedBadges, levelInfo } = gameState;
  const todayLesson = getLessonInfo(currentDay);
  const totalCompleted = completedDays.length;
  const overallPct = Math.round((totalCompleted / 365) * 100);

  const pct = levelInfo.next
    ? Math.min(100, Math.round(((xp - levelInfo.minXp) / (levelInfo.next.minXp - levelInfo.minXp)) * 100))
    : 100;

  // Recent days to show in mini log
  const recentDays = completedDays.slice(-7).reverse();

  return (
    <div>
      {/* Today's Lesson */}
      <div className="today-card" style={{ marginBottom: 20 }}>
        <div className="corner-bracket tl" /><div className="corner-bracket tr" />
        <div className="corner-bracket bl" /><div className="corner-bracket br" />
        <div className="today-day-num">📋 Day {currentDay} of 365 — {todayLesson.module.name}</div>
        <div className="today-lesson-title">{todayLesson.title}</div>
        <div className="today-topic">{todayLesson.topic}</div>
        <button className="btn btn-primary" onClick={() => onOpenLesson(currentDay)}>
          <span>▶</span> Start Today's Lesson
        </button>
        {completedDays.includes(currentDay) && (
          <span style={{ marginLeft: 12, color: '#8fd46a', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
            ✓ Completed
          </span>
        )}
      </div>

      <div className="dashboard-grid">
        {/* Overall Progress */}
        <div className="card">
          <div className="card-title">🎯 Campaign Progress</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-head)', fontSize: '2.5rem', color: 'var(--khaki)' }}>
              {overallPct}%
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)' }}>
              {totalCompleted} / 365 days
            </span>
          </div>
          <div className="progress-bar" style={{ height: 12 }}>
            <div className="progress-fill" style={{ width: `${overallPct}%` }} />
          </div>
          <div className="tac-line" />

          {/* Module progress mini list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {MODULES.map(mod => {
              const [start, end] = mod.days.split('-').map(Number);
              const total = end - start + 1;
              const done = completedDays.filter(d => d >= start && d <= end).length;
              const p = Math.round((done / total) * 100);
              return (
                <div key={mod.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--tan)' }}>{mod.icon} {mod.name}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>{done}/{total}</span>
                  </div>
                  <div className="progress-bar" style={{ height: 4 }}>
                    <div className="progress-fill" style={{ width: `${p}%`, background: mod.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Level Card */}
          <div className="card">
            <div className="card-title">⚡ Rank & XP</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.8rem', color: 'var(--khaki)', marginBottom: 4 }}>
              {levelInfo.name}
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--muted)', marginBottom: 10 }}>
              Level {levelInfo.level} • {xp.toLocaleString()} XP total
            </div>
            {levelInfo.next && (
              <>
                <div className="level-bar" style={{ width: '100%', height: 8, marginBottom: 6 }}>
                  <div className="level-fill" style={{ width: `${pct}%` }} />
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)' }}>
                  {levelInfo.next.minXp - xp} XP to {levelInfo.next.name}
                </div>
              </>
            )}
          </div>

          {/* Streak */}
          <div className="card">
            <div className="card-title">🔥 Daily Streak</div>
            <div className="streak-display">
              {streak}
              <span className="streak-sub">day{streak !== 1 ? 's' : ''} in a row</span>
            </div>
            {streak >= 3 && (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--green-xp)' }}>
                +{25} bonus XP per lesson active!
              </div>
            )}
            {streak === 0 && (
              <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--muted)', fontStyle: 'italic' }}>
                Complete a lesson today to start your streak
              </div>
            )}
          </div>

          {/* Badges earned */}
          <div className="card">
            <div className="card-title">🏅 Badges Earned</div>
            <div style={{ fontFamily: 'var(--font-head)', fontSize: '2rem', color: 'var(--khaki)' }}>
              {earnedBadges.length}
              <span style={{ fontSize: '0.9rem', color: 'var(--muted)', marginLeft: 8 }}>/ 12</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentDays.length > 0 && (
        <div className="card" style={{ marginTop: 0 }}>
          <div className="card-title">📖 Recent Lessons</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recentDays.map(day => {
              const info = getLessonInfo(day);
              return (
                <div key={day}
                  onClick={() => onOpenLesson(day)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 12px', borderRadius: 4,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(160,144,96,0.15)',
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(200,184,122,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(160,144,96,0.15)'}
                >
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)', minWidth: 40 }}>
                    Day {day}
                  </span>
                  <span style={{ flex: 1, fontSize: '0.9rem', color: 'var(--tan)' }}>{info.title}</span>
                  <span style={{ color: 'var(--green-xp)', fontSize: '0.8rem' }}>✓</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
