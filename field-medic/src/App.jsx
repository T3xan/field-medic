import { useState } from 'react';
import { useGameState } from './useGameState';
import Dashboard from './components/Dashboard';
import LessonView from './components/LessonView';
import CurriculumMap from './components/CurriculumMap';
import BadgesView from './components/BadgesView';
import './app.css';

export default function App() {
  const gameState = useGameState();
  const [view, setView] = useState('dashboard');
  const [selectedDay, setSelectedDay] = useState(null);

  const openLesson = (day) => {
    setSelectedDay(day);
    setView('lesson');
  };

  const closeLesson = () => {
    setView('dashboard');
    setSelectedDay(null);
  };

  return (
    <div className="app">
      {view === 'lesson' && selectedDay ? (
        <LessonView day={selectedDay} gameState={gameState} onClose={closeLesson} />
      ) : (
        <>
          <AppHeader gameState={gameState} activeView={view} setView={setView} />
          <main className="main-content">
            {view === 'dashboard' && <Dashboard gameState={gameState} onOpenLesson={openLesson} />}
            {view === 'map' && <CurriculumMap gameState={gameState} onOpenLesson={openLesson} />}
            {view === 'badges' && <BadgesView gameState={gameState} />}
          </main>
        </>
      )}
    </div>
  );
}

function AppHeader({ gameState, activeView, setView }) {
  const { levelInfo, xp, streak } = gameState;
  const pct = levelInfo.next
    ? Math.min(100, Math.round(((xp - levelInfo.minXp) / (levelInfo.next.minXp - levelInfo.minXp)) * 100))
    : 100;

  return (
    <header className="app-header">
      <div className="header-brand">
        <span className="header-icon">⛑</span>
        <div>
          <h1 className="header-title">FIELD MEDIC</h1>
          <p className="header-sub">365-Day Wilderness Medicine Course</p>
        </div>
      </div>

      <div className="header-stats">
        <div className="stat-chip">
          <span className="stat-icon">🔥</span>
          <span className="stat-val">{streak}</span>
          <span className="stat-label">streak</span>
        </div>
        <div className="stat-chip">
          <span className="stat-icon">⚡</span>
          <span className="stat-val">{xp.toLocaleString()}</span>
          <span className="stat-label">XP</span>
        </div>
        <div className="level-chip">
          <span className="level-name">{levelInfo.name}</span>
          <div className="level-bar"><div className="level-fill" style={{ width: `${pct}%` }} /></div>
          <span className="level-num">Lv {levelInfo.level}</span>
        </div>
      </div>

      <nav className="header-nav">
        {[['dashboard','🏠','Home'],['map','🗺','Map'],['badges','🏅','Badges']].map(([v,icon,label]) => (
          <button key={v} className={`nav-btn ${activeView === v ? 'active' : ''}`} onClick={() => setView(v)}>
            <span>{icon}</span> {label}
          </button>
        ))}
      </nav>
    </header>
  );
}
