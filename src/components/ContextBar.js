import React, { useState, useEffect } from 'react';

function ContextBar({ onContextSave, initialContext }) {
  const [isOpen, setIsOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [context, setContext] = useState({
    name: '',
    age: '',
    lifestyle: 'student',
    weeklyGoals: '',
    notes: '',
  });
  {user && (
  <HabitTracker
    userId={user.id}
    onHabitsUpdate={(habits, completed) => {
      // Pass habit context to AI later
    }}
  />
)}

  // Pre-fill from saved profile when it loads
  useEffect(() => {
    if (initialContext) {
      setContext(initialContext);
    }
  }, [initialContext]);

  const handleSave = () => {
    onContextSave(context);
    setSaved(true);
    setIsOpen(false);
    setTimeout(() => setSaved(false), 4000);
  };

  const initials = context.name
    ? context.name.slice(0, 2).toUpperCase()
    : '—';

  return (
    <div className="context-bar fade-up fade-up-1">
      <button
        className="context-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="context-toggle-left">
          <div className="context-avatar">{initials}</div>
          <div>
            <div className="context-name">
              {context.name ? context.name : 'Set up your profile'}
            </div>
            <div className="context-sub">
              {context.name
                ? `${context.lifestyle} · tap to edit`
                : 'Personalize your AI plans'}
            </div>
          </div>
        </div>
        <div className="context-meta">
          {saved && <span className="context-saved">✓ Saved</span>}
          <span className="context-arrow">{isOpen ? '▲' : '▼'}</span>
        </div>
      </button>

      {isOpen && (
        <div className="context-form fade-in">
          <p className="context-hint">
            The more context you give, the smarter your plans become.
          </p>

          <div className="context-grid">
            <div className="form-group">
              <label className="form-label">Your name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Alex"
                value={context.name}
                onChange={(e) => setContext({ ...context, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Age</label>
              <input
                type="number"
                className="form-input"
                placeholder="e.g. 17"
                min="10"
                max="100"
                value={context.age}
                onChange={(e) => setContext({ ...context, age: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Your lifestyle</label>
            <select
              className="form-select"
              value={context.lifestyle}
              onChange={(e) => setContext({ ...context, lifestyle: e.target.value })}
            >
              <option value="student">Student</option>
              <option value="student-athlete">Student + Athlete</option>
              <option value="working-professional">Working professional</option>
              <option value="entrepreneur">Entrepreneur / Founder</option>
              <option value="freelancer">Freelancer / Creative</option>
              <option value="athlete">Athlete</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Weekly goals</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Study 20hrs, gym 4x, read daily"
              value={context.weeklyGoals}
              onChange={(e) => setContext({ ...context, weeklyGoals: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Anything Melius should know right now?</label>
            <textarea
              className="form-input form-textarea"
              placeholder="e.g. Exam on Monday, recovering from injury, big meeting tomorrow..."
              value={context.notes}
              onChange={(e) => setContext({ ...context, notes: e.target.value })}
              rows={3}
            />
          </div>

          <button className="btn-primary" onClick={handleSave}>
            <span className="btn-accent">✦</span> Save Profile
          </button>
        </div>
      )}
    </div>
  );
}

export default ContextBar;