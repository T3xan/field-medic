import { useState, useEffect, useRef } from 'react';
import { getLessonInfo } from '../curriculum';

const QUIZ_COUNT = 3;

function buildSystemPrompt(lessonInfo) {
  return `You are an experienced wilderness medicine instructor writing a field medicine lesson for a parent who wants to be prepared for camping and hiking trips with their child in Texas and the Southwest US.

Your lessons should be:
- Practical and immediately applicable in the backcountry
- Written in a clear, direct field-manual style (not clinical)
- Engaging without being overly casual
- Include real scenarios relevant to hiking/camping with kids
- Appropriately detailed — enough to actually use the skill

Lesson Day: ${lessonInfo.day} of 365
Module: ${lessonInfo.module.name}
Title: ${lessonInfo.title}
Core Topic: ${lessonInfo.topic}

Write the lesson content followed by exactly ${QUIZ_COUNT} quiz questions. Use this exact format:

---LESSON---
[Write the lesson here using markdown. Use ## for section headers, **bold** for key terms, and include:
1. A brief intro/why this matters on trail
2. The core knowledge/skill (this is the main section, be thorough)  
3. A "Field Application" section with a concrete trail scenario
4. A "Kid-Specific Note" if relevant to hiking with children
5. A "Remember:" callout with 1-3 key takeaways

Keep the lesson 400-600 words.]

---QUIZ---
Q1: [Question text]
A) [option]
B) [option]  
C) [option]
D) [option]
CORRECT: [letter]
EXPLAIN: [brief explanation of why]

Q2: [Question text]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [letter]
EXPLAIN: [brief explanation]

Q3: [Question text]
A) [option]
B) [option]
C) [option]
D) [option]
CORRECT: [letter]
EXPLAIN: [brief explanation]`;
}

function parseResponse(text) {
  const lessonMatch = text.match(/---LESSON---([\s\S]*?)---QUIZ---/);
  const quizMatch = text.match(/---QUIZ---([\s\S]*?)$/);

  const lessonText = lessonMatch ? lessonMatch[1].trim() : text;

  const questions = [];
  if (quizMatch) {
    const quizText = quizMatch[1];
    const qBlocks = quizText.split(/Q\d+:/).filter(b => b.trim());
    qBlocks.forEach(block => {
      const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
      const qText = lines[0];
      const options = {};
      let correct = '';
      let explain = '';
      lines.slice(1).forEach(line => {
        if (/^A\)/.test(line)) options.A = line.replace('A)', '').trim();
        else if (/^B\)/.test(line)) options.B = line.replace('B)', '').trim();
        else if (/^C\)/.test(line)) options.C = line.replace('C)', '').trim();
        else if (/^D\)/.test(line)) options.D = line.replace('D)', '').trim();
        else if (/^CORRECT:/.test(line)) correct = line.replace('CORRECT:', '').trim();
        else if (/^EXPLAIN:/.test(line)) explain = line.replace('EXPLAIN:', '').trim();
      });
      if (qText && Object.keys(options).length >= 2) {
        questions.push({ question: qText, options, correct, explain });
      }
    });
  }

  return { lessonText, questions };
}

// Simple markdown to HTML
function mdToHtml(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^> (.+)$/gm, '<div class="field-note">$1</div>')
    .replace(/^⚠️ (.+)$/gm, '<div class="warning">⚠️ $1</div>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/^(?!<[hul]|<div|<\/p>|<p>)(.+)$/gm, '<p>$1</p>')
    .replace(/<p><\/p>/g, '');
}

export default function LessonView({ day, gameState, onClose }) {
  const lessonInfo = getLessonInfo(day);
  const [lessonContent, setLessonContent] = useState('');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizRevealed, setQuizRevealed] = useState({});
  const [note, setNote] = useState(gameState.notes[day] || '');
  const [isCompleted, setIsCompleted] = useState(gameState.isCompleted(day));
  const [showCompletion, setShowCompletion] = useState(false);
  const [xpGained, setXpGained] = useState(0);
  const noteTimer = useRef(null);
  const alreadyLoaded = useRef(false);

  useEffect(() => {
    if (alreadyLoaded.current) return;
    alreadyLoaded.current = true;
    loadLesson();
  }, [day]);

  async function loadLesson() {
    setIsLoading(true);
    setError(null);
    try {
      const resp = await fetch('/api/lesson', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: buildSystemPrompt(lessonInfo),
          messages: [{ role: 'user', content: `Generate lesson content for Day ${day}: ${lessonInfo.title}` }]
        })
      });
      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || `API error ${resp.status}`);
      }
      const rawText = data.content?.map(b => b.text || '').join('') || '';
      const { lessonText, questions } = parseResponse(rawText);
      setLessonContent(lessonText);
      setQuizQuestions(questions);
    } catch (e) {
      setError('Could not load lesson. Make sure ANTHROPIC_API_KEY is set in your Vercel environment variables, then redeploy.');
    }
    setIsLoading(false);
  }

  function handleAnswer(qIdx, letter) {
    if (quizRevealed[qIdx]) return;
    setQuizAnswers(prev => ({ ...prev, [qIdx]: letter }));
    setQuizRevealed(prev => ({ ...prev, [qIdx]: true }));
  }

  function handleNoteChange(e) {
    const val = e.target.value;
    setNote(val);
    clearTimeout(noteTimer.current);
    noteTimer.current = setTimeout(() => gameState.saveNote(day, val), 800);
  }

  function handleComplete() {
    const correctCount = quizQuestions.reduce((acc, q, i) => {
      return acc + (quizAnswers[i] === q.correct ? 1 : 0);
    }, 0);
    const quizScore = quizQuestions.length > 0 ? correctCount : null;
    gameState.completeLesson(day, quizScore);
    setIsCompleted(true);
    setShowCompletion(true);
    const base = 100;
    const bonus = quizScore ? quizScore * 25 : 0;
    setXpGained(base + bonus);
  }

  const allQuizAnswered = quizQuestions.length === 0 || Object.keys(quizRevealed).length >= quizQuestions.length;
  const quizScore = quizQuestions.reduce((acc, q, i) => acc + (quizAnswers[i] === q.correct ? 1 : 0), 0);

  return (
    <div className="lesson-page">
      {/* Header */}
      <div className="lesson-header">
        <button className="btn btn-ghost" onClick={onClose} style={{ padding: '8px 14px' }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Day {day} · {lessonInfo.module.icon} {lessonInfo.module.name}
          </div>
          <div style={{ fontFamily: 'var(--font-head)', fontSize: '1.2rem', color: 'var(--khaki)', letterSpacing: '0.05em' }}>
            {lessonInfo.title}
          </div>
        </div>
        {isCompleted && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--green-xp)', border: '1px solid var(--green-xp)', padding: '6px 12px', borderRadius: 4 }}>
            ✓ COMPLETE
          </div>
        )}
      </div>

      {/* Body */}
      <div className="lesson-body">
        {/* Lesson Content */}
        <div className="lesson-content-box">
          {isLoading && (
            <div className="loading-state">
              <div className="loading-spinner" />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', letterSpacing: '0.1em' }}>
                LOADING FIELD MANUAL...
              </div>
            </div>
          )}
          {error && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <div style={{ color: '#e88', marginBottom: 16 }}>{error}</div>
              <button className="btn btn-ghost" onClick={loadLesson}>Try Again</button>
            </div>
          )}
          {!isLoading && !error && (
            <div dangerouslySetInnerHTML={{ __html: mdToHtml(lessonContent) }} />
          )}
        </div>

        {/* Quiz */}
        {!isLoading && !error && quizQuestions.length > 0 && (
          <div className="quiz-section">
            <div className="quiz-title">📋 Field Assessment — {quizQuestions.length} Questions</div>
            {quizQuestions.map((q, qIdx) => (
              <div key={qIdx} className="quiz-question">
                <div className="quiz-q-text">
                  <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--muted)', marginRight: 8 }}>Q{qIdx + 1}.</strong>
                  {q.question}
                </div>
                <div className="quiz-options">
                  {Object.entries(q.options).map(([letter, text]) => {
                    let cls = 'quiz-option';
                    if (quizRevealed[qIdx]) {
                      if (letter === q.correct) cls += ' correct';
                      else if (letter === quizAnswers[qIdx]) cls += ' wrong';
                    }
                    return (
                      <button
                        key={letter}
                        className={cls}
                        disabled={!!quizRevealed[qIdx]}
                        onClick={() => handleAnswer(qIdx, letter)}
                      >
                        <strong style={{ marginRight: 8, fontFamily: 'var(--font-mono)' }}>{letter})</strong>
                        {text}
                      </button>
                    );
                  })}
                </div>
                {quizRevealed[qIdx] && q.explain && (
                  <div className="quiz-feedback">💡 {q.explain}</div>
                )}
              </div>
            ))}
            {Object.keys(quizRevealed).length === quizQuestions.length && (
              <div style={{ marginTop: 16, fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--khaki)' }}>
                Score: {quizScore} / {quizQuestions.length} correct
                {quizScore === quizQuestions.length && ' 🎯 Perfect score! +75 bonus XP'}
              </div>
            )}
          </div>
        )}

        {/* Field Notes */}
        {!isLoading && !error && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="card-title">📝 Field Notes</div>
            <textarea
              className="notes-area"
              placeholder="Write your notes, things to remember, or practice steps here..."
              value={note}
              onChange={handleNoteChange}
            />
          </div>
        )}

        {/* Complete Button */}
        {!isLoading && !error && !isCompleted && (
          <div style={{ marginTop: 24, textAlign: 'center' }}>
            <button
              className="btn btn-primary"
              style={{ fontSize: '1rem', padding: '14px 32px' }}
              onClick={handleComplete}
            >
              ✓ Mark Lesson Complete
            </button>
            {quizQuestions.length > 0 && !allQuizAnswered && (
              <div style={{ marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--muted)' }}>
                Answer all quiz questions for bonus XP
              </div>
            )}
          </div>
        )}

        {/* Completion Banner */}
        {showCompletion && (
          <div className="completion-banner">
            <div className="corner-bracket tl" /><div className="corner-bracket tr" />
            <div className="corner-bracket bl" /><div className="corner-bracket br" />
            <h3>🎖 MISSION COMPLETE</h3>
            <div className="xp-gained">+{xpGained} XP Earned</div>
            {gameState._newBadges?.length > 0 && (
              <div style={{ marginTop: 12, color: 'var(--khaki)', fontFamily: 'var(--font-head)', letterSpacing: '0.1em' }}>
                🏅 New Badge Unlocked!
              </div>
            )}
            <button className="btn btn-secondary" style={{ marginTop: 16 }} onClick={onClose}>
              Continue →
            </button>
          </div>
        )}

        {isCompleted && !showCompletion && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <button className="btn btn-ghost" onClick={onClose}>← Back to Dashboard</button>
          </div>
        )}
      </div>
    </div>
  );
}
