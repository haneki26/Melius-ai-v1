import React from 'react';

function DailyPlan({ plan, onReset }) {
  return (
    <div className="fade-up">
      <div className="card">
        <h2 className="card-title">
          <span className="card-title-icon">📅</span>
          Your day, optimized
        </h2>

        <p className="plan-summary">{plan.summary}</p>

        {plan.recommendations && plan.recommendations.length > 0 && (
          <div className="recommendations">
            <p className="recommendations-title">✦ Performance insights</p>
            <div className="recommendations-list">
              {plan.recommendations.map((rec, index) => (
                <div key={index} className="recommendation-item">
                  <span className="rec-icon">{rec.icon}</span>
                  <span className="rec-tip">{rec.tip}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="schedule-divider"><span>Schedule</span></div>

        {plan.schedule && plan.schedule.map((item, index) => (
          <div key={index} className="plan-section">
            <div className="plan-time">{item.time}</div>
            <div className="plan-item">
              <span className="plan-icon">{item.icon}</span>
              <div className="plan-text">
                <div className="plan-title">{item.title}</div>
                <div className="plan-desc">{item.desc}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-secondary" onClick={onReset}>← Start over</button>
      <div className="app-footer">Melius · Your personal AI agent</div>
    </div>
  );
}

export default DailyPlan;