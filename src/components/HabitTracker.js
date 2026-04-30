/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

const PRESET_HABITS = [
  { name: 'Workout', icon: '🏋️', color: '#C9A84C' },
  { name: 'Read', icon: '📚', color: '#4C9AC9' },
  { name: 'Sleep 8hrs', icon: '😴', color: '#9A4CC9' },
  { name: 'Healthy eating', icon: '🥗', color: '#4CC97A' },
  { name: 'Meditate', icon: '🧘', color: '#C97A4C' },
  { name: 'No social media', icon: '📵', color: '#C94C4C' },
];

const ICONS = ['🏋️', '📚', '😴', '🥗', '🧘', '💧', '🏃', '✍️', '🎯', '💊', '🚴', '🧹'];

function HabitTracker({ userId, onHabitsUpdate }) {
  const [habits, setHabits] = useState([]);
  const [todayLogs, setTodayLogs] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: '', icon: '🎯', color: '#C9A84C' });
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (userId) {
      loadHabits();
      loadStreak();
      updateStreak();
    }
  }, [userId]);

  const loadHabits = async () => {
    setLoading(true);
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    const { data: logsData } = await supabase
      .from('habit_logs')
      .select('habit_id')
      .eq('user_id', userId)
      .eq('completed_date', today);

    setHabits(habitsData || []);
    setTodayLogs((logsData || []).map(l => l.habit_id));
    setLoading(false);

    if (onHabitsUpdate && habitsData) {
      const completed = (logsData || []).map(l => l.habit_id);
      onHabitsUpdate(habitsData, completed);
    }
  };

  const loadStreak = async () => {
    const { data } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (data) setStreak(data);
  };

  const updateStreak = async () => {
    const { data: existing } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    const todayDate = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (!existing) {
      await supabase.from('streaks').insert({
        user_id: userId,
        current_streak: 1,
        longest_streak: 1,
        last_active_date: todayDate,
      });
      setStreak({ current_streak: 1, longest_streak: 1 });
      return;
    }

    if (existing.last_active_date === todayDate) return;

    let newStreak = existing.last_active_date === yesterday
      ? existing.current_streak + 1
      : 1;

    const newLongest = Math.max(newStreak, existing.longest_streak || 0);

    await supabase.from('streaks').update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_active_date: todayDate,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId);

    setStreak({ current_streak: newStreak, longest_streak: newLongest });
  };

  const toggleHabit = async (habitId) => {
    const isCompleted = todayLogs.includes(habitId);
    if (isCompleted) {
      await supabase.from('habit_logs')
        .delete()
        .eq('habit_id', habitId)
        .eq('user_id', userId)
        .eq('completed_date', today);
      setTodayLogs(prev => prev.filter(id => id !== habitId));
    } else {
      await supabase.from('habit_logs').insert({
        user_id: userId,
        habit_id: habitId,
        completed_date: today,
      });
      setTodayLogs(prev => [...prev, habitId]);
    }
  };

  const addHabit = async () => {
    if (!form.name.trim()) return;
    const { data } = await supabase.from('habits').insert({
      user_id: userId,
      name: form.name,
      icon: form.icon,
      color: form.color,
    }).select('*').single();
    if (data) setHabits(prev => [...prev, data]);
    setForm({ name: '', icon: '🎯', color: '#C9A84C' });
    setAdding(false);
  };

  const addPreset = async (preset) => {
    const { data } = await supabase.from('habits').insert({
      user_id: userId,
      name: preset.name,
      icon: preset.icon,
      color: preset.color,
    }).select('*').single();
    if (data) setHabits(prev => [...prev, data]);
  };

  const deleteHabit = async (habitId) => {
    await supabase.from('habits').delete().eq('id', habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setTodayLogs(prev => prev.filter(id => id !== habitId));
  };

  const completedCount = todayLogs.length;
  const totalCount = habits.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  if (loading) return null;

  return (
    <div className="habit-tracker card fade-in">
      {/* Header with streak */}
      <div className="habit-header">
        <div>
          <p className="habit-eyebrow">Today's habits</p>
          <div className="habit-progress-text">
            {completedCount}/{totalCount} completed
          </div>
        </div>
        <div className="streak-badge">
          <span className="streak-flame">🔥</span>
          <div>
            <p className="streak-number">{streak.current_streak}</p>
            <p className="streak-label">day streak</p>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="habit-progress-bar">
          <div
            className="habit-progress-fill"
            style={{ width: `${progress}%`, background: progress === 100 ? '#4CC97A' : 'var(--gold)' }}
          />
        </div>
      )}

      {/* Habit list */}
      {habits.length > 0 && (
        <div className="habit-list">
          {habits.map(habit => {
            const done = todayLogs.includes(habit.id);
            return (
              <div key={habit.id} className={`habit-item ${done ? 'habit-item--done' : ''}`}>
                <button
                  className="habit-check"
                  onClick={() => toggleHabit(habit.id)}
                  style={{ borderColor: done ? habit.color : undefined, background: done ? habit.color : undefined }}
                >
                  {done && <span>✓</span>}
                </button>
                <span className="habit-icon">{habit.icon}</span>
                <span className="habit-name">{habit.name}</span>
                <button className="habit-delete" onClick={() => deleteHabit(habit.id)}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state with presets */}
      {habits.length === 0 && !adding && (
        <div className="habit-empty">
          <p className="habit-empty-text">Add habits to track daily</p>
          <div className="habit-presets">
            {PRESET_HABITS.map((p, i) => (
              <button key={i} className="habit-preset-btn" onClick={() => addPreset(p)}>
                {p.icon} {p.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Add habit form */}
      {adding && (
        <div className="habit-form fade-in">
          <div className="habit-icon-row">
            {ICONS.map(icon => (
              <button
                key={icon}
                className={`habit-icon-btn ${form.icon === icon ? 'habit-icon-btn--active' : ''}`}
                onClick={() => setForm(f => ({ ...f, icon }))}
              >
                {icon}
              </button>
            ))}
          </div>
          <input
            className="habit-form-input"
            placeholder="Habit name..."
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            onKeyDown={e => e.key === 'Enter' && addHabit()}
            autoFocus
          />
          <div className="habit-form-actions">
            <button className="habit-form-save" onClick={addHabit}>Add habit</button>
            <button className="habit-form-cancel" onClick={() => setAdding(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* Add button */}
      {!adding && (
        <button className="habit-add-btn" onClick={() => setAdding(true)}>
          + Add habit
        </button>
      )}

      {/* Longest streak */}
      {streak.longest_streak > 0 && (
        <p className="streak-best">Best streak: {streak.longest_streak} days</p>
      )}
    </div>
  );
}

export default HabitTracker;