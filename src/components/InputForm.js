import React, { useState } from 'react';

function InputForm({ onSubmit }) {
  const [sleepHours, setSleepHours] = useState(7);
  const [energyLevel, setEnergyLevel] = useState(6);
  const [mainGoal, setMainGoal] = useState('');
  const [availableHours, setAvailableHours] = useState(10);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      sleepHours,
      energyLevel,
      mainGoal: mainGoal || 'General productivity',
      availableHours,
    });
  };

  const energyLabel =
    energyLevel <= 3 ? 'Low — recovery mode' :
    energyLevel <= 5 ? 'Moderate — steady pace' :
    energyLevel <= 7 ? 'Good — focused mode' :
    'High — peak performance';

  const sleepLabel =
    sleepHours < 6 ? 'Poor — needs recovery' :
    sleepHours < 7 ? 'Below average' :
    sleepHours <= 8 ? 'Optimal' :
    'Well rested';

  return (
    <form onSubmit={handleSubmit}>
      <div className="card fade-up fade-up-2">
        <h2 className="card-title">
          <span className="card-title-icon">📋</span>
          Today's check-in
        </h2>

        <div className="form-group">
          <label className="form-label">Sleep last night</label>
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="3"
              max="12"
              step="0.5"
              value={sleepHours}
              onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            />
            <span className="slider-value">{sleepHours}</span>
          </div>
          <div className="slider-labels">
            <span>{sleepLabel}</span>
            <span>hrs</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Energy level right now</label>
          <div className="slider-container">
            <input
              type="range"
              className="slider"
              min="1"
              max="10"
              value={energyLevel}
              onChange={(e) => setEnergyLevel(parseInt(e.target.value))}
            />
            <span className="slider-value">{energyLevel}</span>
          </div>
          <div className="slider-labels">
            <span>{energyLabel}</span>
            <span>/ 10</span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Main focus for today</label>
          <input
            type="text"
            className="form-input"
            placeholder="e.g. Finish math assignment, prep for interview, gym day..."
            value={mainGoal}
            onChange={(e) => setMainGoal(e.target.value)}
          />
        </div>

        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label">Hours available</label>
          <select
            className="form-select"
            value={availableHours}
            onChange={(e) => setAvailableHours(parseInt(e.target.value))}
          >
            <option value={3}>3 hours — very busy</option>
            <option value={5}>5 hours — busy day</option>
            <option value={7}>7 hours</option>
            <option value={9}>9 hours</option>
            <option value={11}>11+ hours — full day</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn-primary fade-up fade-up-3">
        <span className="btn-accent">✦</span>
        Build my day
      </button>
    </form>
  );
}

export default InputForm;