/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const COMMON_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press',
  'Pull Up', 'Barbell Row', 'Dumbbell Curl', 'Tricep Pushdown',
  'Leg Press', 'Lateral Raise', 'Romanian Deadlift', 'Incline Press'
];

function WorkoutTracker({ userId, onWorkoutUpdate }) {
  const [recentWorkouts, setRecentWorkouts] = useState([]);
  const [personalRecords, setPersonalRecords] = useState({});
  const [logging, setLogging] = useState(false);
  const [form, setForm] = useState({ exercise: '', sets: 3, reps: 8, weight_kg: '', notes: '' });
  const [suggestion, setSuggestion] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (userId) loadWorkouts();
  }, [userId]);

  const loadWorkouts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(50);

    if (data) {
      setRecentWorkouts(data);
      // Build personal records
      const prs = {};
      data.forEach(log => {
        if (!prs[log.exercise] || log.weight_kg > prs[log.exercise]) {
          prs[log.exercise] = log.weight_kg;
        }
      });
      setPersonalRecords(prs);
      if (onWorkoutUpdate) onWorkoutUpdate(data);
    }
    setLoading(false);
  };

  const getLastWorkout = (exercise) => {
    return recentWorkouts.find(w => w.exercise === exercise);
  };

  const getSuggestion = (exercise) => {
    const last = getLastWorkout(exercise);
    if (!last) return null;
    const suggested = Math.round((parseFloat(last.weight_kg) * 1.025) * 4) / 4;
    return {
      lastWeight: last.weight_kg,
      suggestedWeight: suggested,
      lastSets: last.sets,
      lastReps: last.reps,
      date: new Date(last.logged_at).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    };
  };

  const handleExerciseChange = (exercise) => {
    setForm(f => ({ ...f, exercise }));
    const sug = getSuggestion(exercise);
    setSuggestion(sug);
    if (sug) {
      setForm(f => ({
        ...f,
        exercise,
        sets: sug.lastSets,
        reps: sug.lastReps,
        weight_kg: sug.suggestedWeight,
      }));
    }
  };

  const logWorkout = async () => {
    if (!form.exercise || !form.weight_kg) return;
    const { data } = await supabase.from('workout_logs').insert({
      user_id: userId,
      exercise: form.exercise,
      sets: parseInt(form.sets),
      reps: parseInt(form.reps),
      weight_kg: parseFloat(form.weight_kg),
      notes: form.notes,
    }).select('*').single();

    if (data) {
      setRecentWorkouts(prev => [data, ...prev]);
      // Update PR if needed
      if (!personalRecords[form.exercise] || parseFloat(form.weight_kg) > personalRecords[form.exercise]) {
        setPersonalRecords(prev => ({ ...prev, [form.exercise]: parseFloat(form.weight_kg) }));
      }
    }

    setForm({ exercise: '', sets: 3, reps: 8, weight_kg: '', notes: '' });
    setSuggestion(null);
    setLogging(false);
    loadWorkouts();
  };

  const deleteLog = async (id) => {
    await supabase.from('workout_logs').delete().eq('id', id);
    setRecentWorkouts(prev => prev.filter(w => w.id !== id));
  };

  // Group recent workouts by date
  const grouped = recentWorkouts.slice(0, 20).reduce((acc, log) => {
    const date = new Date(log.logged_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  if (loading) return null;

  return (
    <div className="workout-tracker card fade-in">
      <div className="workout-header">
        <div>
          <p className="habit-eyebrow">Workout tracking</p>
          <p className="workout-subtitle">
            {Object.keys(personalRecords).length > 0
              ? `${Object.keys(personalRecords).length} exercises tracked`
              : 'Log your workouts'}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="workout-history-btn" onClick={() => setShowHistory(!showHistory)}>
            {showHistory ? 'Hide history' : 'History'}
          </button>
          <button className="workout-log-btn" onClick={() => setLogging(!logging)}>
            {logging ? 'Cancel' : '+ Log set'}
          </button>
        </div>
      </div>

      {/* Log form */}
      {logging && (
        <div className="workout-form fade-in">
          <div className="workout-form-group">
            <label className="workout-label">Exercise</label>
            <input
              className="workout-input"
              list="exercise-list"
              placeholder="e.g. Bench Press"
              value={form.exercise}
              onChange={e => handleExerciseChange(e.target.value)}
            />
            <datalist id="exercise-list">
              {COMMON_EXERCISES.map(ex => <option key={ex} value={ex} />)}
            </datalist>
          </div>

          {/* Progressive overload suggestion */}
          {suggestion && (
            <div className="workout-suggestion fade-in">
              <span>📈</span>
              <span>Last: {suggestion.lastWeight}kg × {suggestion.lastSets}×{suggestion.lastReps} on {suggestion.date}. Suggested today: <strong>{suggestion.suggestedWeight}kg</strong></span>
            </div>
          )}

          <div className="workout-form-row">
            <div className="workout-form-group">
              <label className="workout-label">Sets</label>
              <input className="workout-input" type="number" min="1" max="20"
                value={form.sets} onChange={e => setForm(f => ({ ...f, sets: e.target.value }))} />
            </div>
            <div className="workout-form-group">
              <label className="workout-label">Reps</label>
              <input className="workout-input" type="number" min="1" max="100"
                value={form.reps} onChange={e => setForm(f => ({ ...f, reps: e.target.value }))} />
            </div>
            <div className="workout-form-group">
              <label className="workout-label">Weight (kg)</label>
              <input className="workout-input" type="number" min="0" step="0.25"
                value={form.weight_kg} onChange={e => setForm(f => ({ ...f, weight_kg: e.target.value }))}
                placeholder="0" />
            </div>
          </div>

          <input className="workout-input" placeholder="Notes (optional)"
            value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />

          <button className="workout-save-btn" onClick={logWorkout}>Log workout</button>
        </div>
      )}

      {/* Personal records */}
      {Object.keys(personalRecords).length > 0 && !showHistory && (
        <div className="workout-prs">
          <p className="workout-section-label">Personal records</p>
          <div className="workout-pr-grid">
            {Object.entries(personalRecords).slice(0, 6).map(([exercise, weight]) => (
              <div key={exercise} className="workout-pr-card">
                <p className="workout-pr-weight">{weight}<span>kg</span></p>
                <p className="workout-pr-exercise">{exercise}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* History */}
      {showHistory && (
        <div className="workout-history fade-in">
          <p className="workout-section-label">Recent sessions</p>
          {Object.entries(grouped).map(([date, logs]) => (
            <div key={date} className="workout-day">
              <p className="workout-day-label">{date}</p>
              {logs.map(log => (
                <div key={log.id} className="workout-log-item">
                  <div className="workout-log-info">
                    <span className="workout-log-exercise">{log.exercise}</span>
                    <span className="workout-log-details">
                      {log.sets}×{log.reps} @ {log.weight_kg}kg
                      {log.notes && ` — ${log.notes}`}
                    </span>
                  </div>
                  <button className="workout-log-delete" onClick={() => deleteLog(log.id)}>✕</button>
                </div>
              ))}
            </div>
          ))}
          {recentWorkouts.length === 0 && (
            <p className="workout-empty">No workouts logged yet. Start tracking to see your progress.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default WorkoutTracker;