import { MODULES, getLessonInfo } from '../curriculum';

export default function CurriculumMap({ gameState, onOpenLesson }) {
  const { completedDays, currentDay } = gameState;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h2 style={{ fontFamily: 'var(--font-head)', fontSize: '1.4rem', color: 'var(--khaki)', letterSpacing: '0.1em', marginBottom: 6 }}>
          🗺 CURRICULUM MAP
        </h2>
        <p style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
          365 lessons across 10 modules. Click any unlocked day to open that lesson.
        </p>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 20, fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>
        <span style={{ color: 'var(--green-xp)' }}>■ Completed</span>
        <span style={{ color: 'var(--red-lt)' }}>■ Today's Lesson</span>
        <span style={{ color: 'var(--muted)' }}>■ Upcoming</span>
      </div>

      {MODULES.map(mod => {
        const [start, end] = mod.days.split('-').map(Number);
        const days = Array.from({ length: end - start + 1 }, (_, i) => start + i);
        const done = days.filter(d => completedDays.includes(d)).length;

        return (
          <div key={mod.id} className="module-section">
            <div className="module-header">
              <span className="module-icon">{mod.icon}</span>
              <span className="module-name">{mod.name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--muted)', marginLeft: 'auto' }}>
                Days {mod.days} · {done}/{days.length}
              </span>
            </div>

            <div className="day-grid">
              {days.map(day => {
                const isCompleted = completedDays.includes(day);
                const isCurrent = day === currentDay;
                const isLocked = day > currentDay && !isCompleted;

                return (
                  <button
                    key={day}
                    className={`day-cell ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''} ${isLocked ? 'locked' : ''}`}
                    onClick={() => !isLocked && onOpenLesson(day)}
                    title={getLessonInfo(day).title}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
