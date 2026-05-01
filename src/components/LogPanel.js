/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function LogPanel({ isOpen, onClose, logs, userId }) {
  const [activeTab, setActiveTab] = useState('plans');
  const [expandedCard, setExpandedCard] = useState(null);
  const [workoutLogs, setWorkoutLogs] = useState([]);
  const [habitLogs, setHabitLogs] = useState([]);
  const [habits, setHabits] = useState([]);
  const [streak, setStreak] = useState({ current_streak: 0, longest_streak: 0 });
  const [statsLoaded, setStatsLoaded] = useState(false);

  useEffect(() => {
    if (isOpen && userId && !statsLoaded) {
      loadExtendedData();
    }
  }, [isOpen, userId]);

  const loadExtendedData = async () => {
    // Load workouts
    const { data: workouts } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('user_id', userId)
      .order('logged_at', { ascending: false })
      .limit(30);
    if (workouts) setWorkoutLogs(workouts);

    // Load habits
    const { data: habitsData } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId);
    if (habitsData) setHabits(habitsData);

    // Load habit logs last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];
    const { data: hLogs } = await supabase
      .from('habit_logs')
      .select('*')
      .eq('user_id', userId)
      .gte('completed_date', sevenDaysAgo)
      .order('completed_date', { ascending: false });
    if (hLogs) setHabitLogs(hLogs);

    // Load streak
    const { data: streakData } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();
    if (streakData) setStreak(streakData);

    setStatsLoaded(true);
  };

  const tabs = [
    { id: 'plans', label: 'Plans', icon: '📅' },
    { id: 'training', label: 'Training', icon: '🏋️' },
    { id: 'workouts', label: 'Workouts', icon: '💪' },
    { id: 'habits', label: 'Habits', icon: '✦' },
    { id: 'stats', label: 'Stats', icon: '📊' },
    { id: 'activity', label: 'Activity', icon: '⚡' },
  ];

  const toggleCard = (id) => setExpandedCard(expandedCard === id ? null : id);

  // Group workouts by date
  const groupedWorkouts = workoutLogs.reduce((acc, log) => {
    const date = new Date(log.logged_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {});

  // Personal records from workouts
  const prs = workoutLogs.reduce((acc, log) => {
    if (!acc[log.exercise] || log.weight_kg > acc[log.exercise]) {
      acc[log.exercise] = log.weight_kg;
    }
    return acc;
  }, {});

  // Last 7 days for habits
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(Date.now() - i * 86400000);
    return d.toISOString().split('T')[0];
  }).reverse();

  const getHabitCompletionsForDay = (date) =>
    habitLogs.filter(l => l.completed_date === date).length;

  // Stats calculations
  const totalPlans = logs.plans.length + logs.training.length;
  const totalWorkoutSessions = Object.keys(groupedWorkouts).length;
  const habitsThisWeek = habitLogs.length;
  const bestStreak = streak.longest_streak || 0;

  return (
    <>
      {isOpen && <div className="log-overlay" onClick={onClose} />}
      <div className={`log-panel ${isOpen ? 'log-panel--open' : ''}`}>
        <div className="log-panel-header">
          <div>
            <p className="log-panel-eyebrow">Your history</p>
            <h2 className="log-panel-title">Activity Log</h2>
          </div>
          <button className="log-close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="log-tabs" style={{ flexWrap: 'wrap', gap: '4px' }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`log-tab ${activeTab === tab.id ? 'log-tab--active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setExpandedCard(null); }}
              style={{ fontSize: '0.72rem', padding: '6px 8px' }}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="log-content">

          {/* PLANS TAB */}
          {activeTab === 'plans' && (
            <div className="log-section">
              {logs.plans.length === 0 ? (
                <EmptyState icon="📅" title="No plans yet" desc="Generate your first plan and it will appear here." />
              ) : logs.plans.map((plan, i) => (
                <div key={i} className="log-card">
                  <button className="log-card-header log-card-toggle" onClick={() => toggleCard(`plan-${i}`)}>
                    <span className="log-card-icon">📅</span>
                    <div className="log-card-header-text">
                      <p className="log-card-title">{plan.summary}</p>
                      <p className="log-card-meta">{plan.date} · {plan.mode || 'Daily plan'}</p>
                    </div>
                    <span className="log-card-chevron">{expandedCard === `plan-${i}` ? '▲' : '▼'}</span>
                  </button>
                  {expandedCard === `plan-${i}` && plan.schedule && (
                    <div className="log-card-expanded">
                      {plan.recommendations?.length > 0 && (
                        <div className="log-expanded-section">
                          <p className="log-expanded-label">✦ Tips</p>
                          {plan.recommendations.map((rec, j) => (
                            <div key={j} className="log-rec-item">
                              <span>{rec.icon}</span><span>{rec.tip}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="log-expanded-section">
                        <p className="log-expanded-label">Schedule</p>
                        {plan.schedule.map((item, j) => (
                          <div key={j} className="log-schedule-item">
                            <span className="log-schedule-time">{item.time}</span>
                            <span className="log-schedule-icon">{item.icon}</span>
                            <div>
                              <p className="log-schedule-title">{item.title}</p>
                              <p className="log-schedule-desc">{item.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TRAINING TAB */}
          {activeTab === 'training' && (
            <div className="log-section">
              {logs.training.length === 0 ? (
                <EmptyState icon="🏋️" title="No training plans yet" desc="Use Training plan mode to generate your first workout." />
              ) : logs.training.map((plan, i) => (
                <div key={i} className="log-card">
                  <button className="log-card-header log-card-toggle" onClick={() => toggleCard(`training-${i}`)}>
                    <span className="log-card-icon">🏋️</span>
                    <div className="log-card-header-text">
                      <p className="log-card-title">{plan.summary}</p>
                      <p className="log-card-meta">{plan.date}</p>
                    </div>
                    <span className="log-card-chevron">{expandedCard === `training-${i}` ? '▲' : '▼'}</span>
                  </button>
                  {expandedCard === `training-${i}` && (
                    <div className="log-card-expanded">
                      {plan.schedule?.map((item, j) => (
                        <div key={j} className="log-schedule-item">
                          <span className="log-schedule-time">{item.time}</span>
                          <span className="log-schedule-icon">{item.icon}</span>
                          <div>
                            <p className="log-schedule-title">{item.title}</p>
                            <p className="log-schedule-desc">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* WORKOUTS TAB */}
          {activeTab === 'workouts' && (
            <div className="log-section">
              {Object.keys(prs).length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p className="log-expanded-label">Personal Records</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
                    {Object.entries(prs).map(([ex, w]) => (
                      <div key={ex} style={{ background: 'var(--paper-warm)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '10px 12px' }}>
                        <p style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', color: 'var(--gold)' }}>{w}kg</p>
                        <p style={{ fontSize: '0.72rem', color: 'var(--ink-muted)' }}>{ex}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {Object.keys(groupedWorkouts).length === 0 ? (
                <EmptyState icon="💪" title="No workouts logged yet" desc="Use the workout tracker to log your sets and weights." />
              ) : Object.entries(groupedWorkouts).map(([date, wLogs]) => (
                <div key={date} style={{ marginBottom: 14 }}>
                  <p className="log-expanded-label">{date}</p>
                  {wLogs.map((log, i) => (
                    <div key={i} className="log-schedule-item">
                      <span className="log-schedule-icon">🏋️</span>
                      <div>
                        <p className="log-schedule-title">{log.exercise}</p>
                        <p className="log-schedule-desc">{log.sets}×{log.reps} @ {log.weight_kg}kg{log.notes ? ` — ${log.notes}` : ''}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* HABITS TAB */}
          {activeTab === 'habits' && (
            <div className="log-section">
              {habits.length === 0 ? (
                <EmptyState icon="✦" title="No habits yet" desc="Add habits to start tracking your daily consistency." />
              ) : (
                <>
                  <p className="log-expanded-label" style={{ marginBottom: 12 }}>Last 7 days</p>
                  <div style={{ display: 'flex', gap: 6, marginBottom: 20, justifyContent: 'space-between' }}>
                    {last7Days.map(date => {
                      const count = getHabitCompletionsForDay(date);
                      const pct = habits.length > 0 ? count / habits.length : 0;
                      const day = new Date(date).toLocaleDateString([], { weekday: 'short' });
                      return (
                        <div key={date} style={{ textAlign: 'center', flex: 1 }}>
                          <div style={{
                            height: 40, borderRadius: 4, marginBottom: 4,
                            background: pct === 0 ? 'var(--border)' : `rgba(201,168,76,${0.2 + pct * 0.8})`,
                            border: '1px solid var(--border)',
                          }} />
                          <p style={{ fontSize: '0.65rem', color: 'var(--ink-faint)' }}>{day}</p>
                        </div>
                      );
                    })}
                  </div>
                  {habits.map(habit => {
                    const completions = habitLogs.filter(l => l.habit_id === habit.id).length;
                    return (
                      <div key={habit.id} className="log-schedule-item">
                        <span className="log-schedule-icon">{habit.icon}</span>
                        <div style={{ flex: 1 }}>
                          <p className="log-schedule-title">{habit.name}</p>
                          <p className="log-schedule-desc">{completions}/7 days this week</p>
                        </div>
                        <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2 }}>
                          <div style={{ width: `${(completions / 7) * 100}%`, height: '100%', background: habit.color || 'var(--gold)', borderRadius: 2 }} />
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab === 'stats' && (
            <div className="log-section">
              <p className="log-expanded-label" style={{ marginBottom: 14 }}>Your numbers</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'Current streak', value: streak.current_streak, unit: 'days', icon: '🔥' },
                  { label: 'Best streak', value: bestStreak, unit: 'days', icon: '🏆' },
                  { label: 'Plans generated', value: totalPlans, unit: 'total', icon: '📅' },
                  { label: 'Workout sessions', value: totalWorkoutSessions, unit: 'logged', icon: '💪' },
                  { label: 'Habits this week', value: habitsThisWeek, unit: 'completions', icon: '✦' },
                  { label: 'Exercises tracked', value: Object.keys(prs).length, unit: 'exercises', icon: '🏋️' },
                ].map((stat, i) => (
                  <div key={i} style={{
                    background: 'var(--paper-warm)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                  }}>
                    <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                    <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', color: 'var(--gold)', lineHeight: 1 }}>{stat.value}</p>
                    <p style={{ fontSize: '0.68rem', color: 'var(--ink-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="log-section">
              {logs.activity.length === 0 ? (
                <EmptyState icon="⚡" title="No activity yet" desc="Your sessions and interactions will be tracked here." />
              ) : logs.activity.map((item, i) => (
                <div key={i} className="log-activity-item">
                  <span className="log-activity-icon">{item.icon}</span>
                  <div>
                    <p className="log-activity-text">{item.text}</p>
                    <p className="log-card-meta">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="log-footer">
          <p>Tap any plan to expand and view full details</p>
        </div>
      </div>
    </>
  );
}

function EmptyState({ icon, title, desc }) {
  return (
    <div className="log-empty">
      <span className="log-empty-icon">{icon}</span>
      <p className="log-empty-title">{title}</p>
      <p className="log-empty-desc">{desc}</p>
    </div>
  );
}

export default LogPanel;