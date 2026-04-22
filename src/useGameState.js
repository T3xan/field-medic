import { useState, useEffect, useCallback } from 'react';
import { BADGES, XP_PER_LESSON, STREAK_BONUS, getLevel } from './curriculum';

const STORAGE_KEY = 'fieldmedic_v1';

function getDefaultState() {
  return {
    completedDays: [],      // array of day numbers
    currentDay: 1,          // next lesson to do
    xp: 0,
    streak: 0,
    lastCompletedDate: null, // ISO date string
    earnedBadges: [],
    quizScores: {},         // day -> score (0-3)
    notes: {},              // day -> string
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultState();
    return { ...getDefaultState(), ...JSON.parse(raw) };
  } catch {
    return getDefaultState();
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function useGameState() {
  const [state, setState] = useState(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const completeLesson = useCallback((day, quizScore = null) => {
    setState(prev => {
      if (prev.completedDays.includes(day)) return prev;

      const today = new Date().toDateString();
      const lastDate = prev.lastCompletedDate;
      const yesterday = new Date(Date.now() - 86400000).toDateString();

      let newStreak = prev.streak;
      if (lastDate === yesterday || lastDate === today) {
        newStreak = lastDate === today ? prev.streak : prev.streak + 1;
      } else if (lastDate === null) {
        newStreak = 1;
      } else {
        newStreak = 1; // streak broken
      }

      const bonusXp = newStreak >= 3 ? STREAK_BONUS : 0;
      const quizBonus = quizScore ? quizScore * 25 : 0;
      const newXp = prev.xp + XP_PER_LESSON + bonusXp + quizBonus;
      const newCompleted = [...prev.completedDays, day];

      // Check badges
      const newBadges = BADGES.filter(b =>
        !prev.earnedBadges.includes(b.id) && b.req(newCompleted.length, newStreak)
      ).map(b => b.id);

      return {
        ...prev,
        completedDays: newCompleted,
        currentDay: Math.max(prev.currentDay, day + 1),
        xp: newXp,
        streak: newStreak,
        lastCompletedDate: today,
        earnedBadges: [...prev.earnedBadges, ...newBadges],
        quizScores: quizScore !== null ? { ...prev.quizScores, [day]: quizScore } : prev.quizScores,
        _newBadges: newBadges,
        _xpGained: XP_PER_LESSON + bonusXp + quizBonus,
      };
    });
  }, []);

  const saveNote = useCallback((day, note) => {
    setState(prev => ({ ...prev, notes: { ...prev.notes, [day]: note } }));
  }, []);

  const resetProgress = useCallback(() => {
    const fresh = getDefaultState();
    setState(fresh);
    saveState(fresh);
  }, []);

  const levelInfo = getLevel(state.xp);

  return {
    ...state,
    levelInfo,
    completeLesson,
    saveNote,
    resetProgress,
    isCompleted: (day) => state.completedDays.includes(day),
  };
}
