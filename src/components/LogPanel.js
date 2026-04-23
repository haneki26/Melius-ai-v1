import React, { useState } from 'react';

function LogPanel({ isOpen, onClose, logs }) {
  const [activeTab, setActiveTab] = useState('plans');

  const tabs = [
    { id: 'plans', label: 'Plans', icon: '📅' },
    { id: 'training', label: 'Training', icon: '🏋️' },
    { id: 'activity', label: 'Activity', icon: '⚡' },
  ];

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="log-overlay" onClick={onClose} />
      )}

      {/* Panel */}
      <div className={`log-panel ${isOpen ? 'log-panel--open' : ''}`}>
        <div className="log-panel-header">
          <div>
            <p className="log-panel-eyebrow">Your history</p>
            <h2 className="log-panel-title">Activity Log</h2>
          </div>
          <button className="log-close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Tabs */}
        <div className="log-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`log-tab ${activeTab === tab.id ? 'log-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="log-content">

          {/* PLANS TAB */}
          {activeTab === 'plans' && (
            <div className="log-section">
              {logs.plans.length === 0 ? (
                <EmptyState
                  icon="📅"
                  title="No plans yet"
                  desc="Generate your first plan and it will appear here."
                />
              ) : (
                logs.plans.map((plan, i) => (
                  <div key={i} className="log-card">
                    <div className="log-card-header">
                      <span className="log-card-icon">📅</span>
                      <div>
                        <p className="log-card-title">{plan.summary}</p>
                        <p className="log-card-meta">{plan.date} · {plan.mode || 'Daily plan'}</p>
                      </div>
                    </div>
                    {plan.schedule && (
                      <div className="log-card-items">
                        {plan.schedule.slice(0, 3).map((item, j) => (
                          <div key={j} className="log-card-item">
                            <span>{item.icon}</span>
                            <span>{item.time} — {item.title}</span>
                          </div>
                        ))}
                        {plan.schedule.length > 3 && (
                          <p className="log-card-more">+{plan.schedule.length - 3} more items</p>
                        )}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TRAINING TAB */}
          {activeTab === 'training' && (
            <div className="log-section">
              {logs.training.length === 0 ? (
                <EmptyState
                  icon="🏋️"
                  title="No training plans yet"
                  desc="Use the Training plan mode to generate your first workout."
                />
              ) : (
                logs.training.map((plan, i) => (
                  <div key={i} className="log-card">
                    <div className="log-card-header">
                      <span className="log-card-icon">🏋️</span>
                      <div>
                        <p className="log-card-title">{plan.summary}</p>
                        <p className="log-card-meta">{plan.date}</p>
                      </div>
                    </div>
                    {plan.recommendations && (
                      <div className="log-card-items">
                        {plan.recommendations.map((rec, j) => (
                          <div key={j} className="log-card-item">
                            <span>{rec.icon}</span>
                            <span>{rec.tip}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* ACTIVITY TAB */}
          {activeTab === 'activity' && (
            <div className="log-section">
              {logs.activity.length === 0 ? (
                <EmptyState
                  icon="⚡"
                  title="No activity logged yet"
                  desc="As you use Melius, your sessions and interactions will be tracked here. Full activity tracking coming with the Android app."
                />
              ) : (
                logs.activity.map((item, i) => (
                  <div key={i} className="log-activity-item">
                    <span className="log-activity-icon">{item.icon}</span>
                    <div>
                      <p className="log-activity-text">{item.text}</p>
                      <p className="log-card-meta">{item.time}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

        <div className="log-footer">
          <p>Full history & sync coming with Supabase</p>
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