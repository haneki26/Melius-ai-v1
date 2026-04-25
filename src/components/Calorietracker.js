import React, { useState } from 'react';

function CalorieTracker({ data, onClose, onUpdate }) {
  const [goal, setGoal] = useState(data?.goal || 2000);
  const [entries, setEntries] = useState(data?.entries || []);
  const [editingGoal, setEditingGoal] = useState(false);
  const [tempGoal, setTempGoal] = useState(goal);

  const totalCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);
  const remaining = goal - totalCalories;
  const progress = Math.min((totalCalories / goal) * 100, 100);

  const progressColor =
    progress < 70 ? 'var(--gold)' :
    progress < 95 ? '#f59e0b' :
    '#ef4444';

  const removeEntry = (index) => {
    const updated = entries.filter((_, i) => i !== index);
    setEntries(updated);
    onUpdate({ goal, entries: updated });
  };

  const saveGoal = () => {
    setGoal(tempGoal);
    setEditingGoal(false);
    onUpdate({ goal: tempGoal, entries });
  };

  return (
    <div className="calorie-tracker fade-in">
      <div className="calorie-tracker-header">
        <div>
          <p className="calorie-tracker-eyebrow">Daily tracker</p>
          <h3 className="calorie-tracker-title">🔥 Calorie Tracker</h3>
        </div>
        <button className="calorie-tracker-close" onClick={onClose}>✕</button>
      </div>

      {/* Progress bar */}
      <div className="calorie-progress-wrap">
        <div className="calorie-progress-bar">
          <div
            className="calorie-progress-fill"
            style={{ width: `${progress}%`, background: progressColor }}
          />
        </div>
        <div className="calorie-stats">
          <div className="calorie-stat">
            <span className="calorie-stat-value">{totalCalories}</span>
            <span className="calorie-stat-label">eaten</span>
          </div>
          <div className="calorie-stat calorie-stat--center">
            <span className="calorie-stat-value" style={{ color: remaining < 0 ? '#ef4444' : 'var(--gold)' }}>
              {remaining < 0 ? `${Math.abs(remaining)} over` : remaining}
            </span>
            <span className="calorie-stat-label">{remaining < 0 ? 'over goal' : 'remaining'}</span>
          </div>
          <div className="calorie-stat calorie-stat--right">
            {editingGoal ? (
              <div className="calorie-goal-edit">
                <input
                  type="number"
                  className="calorie-goal-input"
                  value={tempGoal}
                  onChange={(e) => setTempGoal(parseInt(e.target.value))}
                  onKeyDown={(e) => e.key === 'Enter' && saveGoal()}
                  autoFocus
                />
                <button className="calorie-goal-save" onClick={saveGoal}>✓</button>
              </div>
            ) : (
              <button className="calorie-goal-btn" onClick={() => setEditingGoal(true)}>
                <span className="calorie-stat-value">{goal}</span>
                <span className="calorie-stat-label">goal ✎</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Entries */}
      {entries.length > 0 && (
        <div className="calorie-entries">
          {entries.map((entry, i) => (
            <div key={i} className="calorie-entry">
              <span className="calorie-entry-icon">{entry.icon || '🍽️'}</span>
              <div className="calorie-entry-info">
                <span className="calorie-entry-name">{entry.name}</span>
                {entry.protein && (
                  <span className="calorie-entry-macros">
                    P: {entry.protein}g · C: {entry.carbs}g · F: {entry.fat}g
                  </span>
                )}
              </div>
              <span className="calorie-entry-cal">{entry.calories} kcal</span>
              <button className="calorie-entry-remove" onClick={() => removeEntry(i)}>✕</button>
            </div>
          ))}
        </div>
      )}

      {entries.length === 0 && (
        <p className="calorie-empty">
          Take a photo of food or ask Melius about a meal to add it here.
        </p>
      )}

      <p className="calorie-disclaimer">
        Estimates are approximate. For precise tracking consult nutritional labels.
      </p>
    </div>
  );
}

export default CalorieTracker;