import React, { useState } from 'react';

function CollapsibleTracker({ icon, title, summary, stat, children }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="tracker-card">
      <button className="tracker-card-toggle" onClick={() => setOpen(!open)}>
        <div className="tracker-card-toggle-left">
          <div className="tracker-card-icon">{icon}</div>
          <div className="tracker-card-info">
            <p className="tracker-card-title">{title}</p>
            <p className="tracker-card-summary">{summary}</p>
          </div>
        </div>
        <div className="tracker-card-right">
          {stat && <span className="tracker-card-stat">{stat}</span>}
          <span className={`tracker-card-chevron ${open ? 'tracker-card-chevron--open' : ''}`}>▼</span>
        </div>
      </button>
      {open && (
        <div className="tracker-card-body">
          {children}
        </div>
      )}
    </div>
  );
}

export default CollapsibleTracker;