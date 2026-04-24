import React, { useState } from 'react';

function LogPanel({ isOpen, onClose, logs }) {
  const [activeTab, setActiveTab] = useState('plans');
  const [expandedCard, setExpandedCard] = useState(null);

  const tabs = [
    { id: 'plans', label: 'Plans', icon: '📅' },
    { id: 'training', label: 'Training', icon: '🏋️' },
    { id: 'activity', label: 'Activity', icon: '⚡' },
  ];

  const toggleCard = (id) => {
    setExpandedCard(expandedCard === id ? null : id);
  };

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

        <div className="log-tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`log-tab ${activeTab === tab.id ? 'log-tab--active' : ''}`}
              onClick={() => { setActiveTab(tab.id); setExpandedCard(null); }}
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
              ) : (
                logs.plans.map((plan, i) => (
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
                        {plan.recommendations && plan.recommendations.length > 0 && (
                          <div className="log-expanded-section">
                            <p className="log-expanded-label">✦ Tips</p>
                            {plan.recommendations.map((rec, j) => (
                              <div key={j} className="log-rec-item">
                                <span>{rec.icon}</span>
                                <span>{rec.tip}</span>
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
                ))
              )}
            </div>
          )}

          {/* TRAINING TAB */}
          {activeTab === 'training' && (
            <div className="log-section">
              {logs.training.length === 0 ? (
                <EmptyState icon="🏋️" title="No training plans yet" desc="Use the Training plan mode to generate your first workout." />
              ) : (
                logs.training.map((plan, i) => (
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
                        {plan.recommendations && plan.recommendations.length > 0 && (
                          <div className="log-expanded-section">
                            <p className="log-expanded-label">✦ Performance tips</p>
                            {plan.recommendations.map((rec, j) => (
                              <div key={j} className="log-rec-item">
                                <span>{rec.icon}</span>
                                <span>{rec.tip}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {plan.schedule && (
                          <div className="log-expanded-section">
                            <p className="log-expanded-label">Workout</p>
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
                        )}
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
                <EmptyState icon="⚡" title="No activity yet" desc="Your sessions and interactions will be tracked here." />
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