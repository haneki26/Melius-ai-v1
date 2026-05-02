import React, { useState } from 'react';

const STEPS = [
  {
    icon: '✦',
    title: 'Welcome to Melius.',
    subtitle: 'Your personal AI agent.',
    desc: 'Melius plans your day, answers questions, tracks your workouts and habits, generates images, and acts as your intelligent daily companion.',
    action: 'Get started',
  },
  {
    icon: '🎯',
    title: 'What can Melius do?',
    subtitle: null,
    features: [
      { icon: '📅', text: 'Build a personalized daily plan based on your goals and energy' },
      { icon: '💬', text: 'Answer questions, write emails, search the web, do math' },
      { icon: '🏋️', text: 'Track workouts with progressive overload suggestions' },
      { icon: '✦', text: 'Track habits and keep your daily streaks going' },
      { icon: '🍽️', text: 'Analyze food photos and track your calories' },
      { icon: '🎨', text: 'Generate images, presentations, and PDF documents' },
    ],
    action: 'Sounds good',
  },
  {
    icon: '👤',
    title: 'Tell Melius about you.',
    subtitle: 'So responses feel personal from day one.',
    isForm: true,
    action: 'Start using Melius',
  },
];

const LIFESTYLES = [
  { value: 'student', label: '📚 Student' },
  { value: 'professional', label: '💼 Professional' },
  { value: 'athlete', label: '🏋️ Athlete' },
  { value: 'entrepreneur', label: '🚀 Entrepreneur' },
  { value: 'creative', label: '🎨 Creative' },
  { value: 'other', label: '✦ Other' },
];

function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    name: '',
    age: '',
    lifestyle: '',
    weeklyGoals: '',
  });

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      onComplete(form);
    } else {
      setStep(s => s + 1);
    }
  };

  const canProceed = !current.isForm || form.name.trim().length > 0;

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card fade-in">

        {/* Progress dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`onboarding-dot ${i === step ? 'onboarding-dot--active' : i < step ? 'onboarding-dot--done' : ''}`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="onboarding-icon">{current.icon}</div>

        {/* Title */}
        <h1 className="onboarding-title">{current.title}</h1>
        {current.subtitle && <p className="onboarding-subtitle">{current.subtitle}</p>}
        {current.desc && <p className="onboarding-desc">{current.desc}</p>}

        {/* Features list */}
        {current.features && (
          <div className="onboarding-features">
            {current.features.map((f, i) => (
              <div key={i} className="onboarding-feature">
                <span className="onboarding-feature-icon">{f.icon}</span>
                <span className="onboarding-feature-text">{f.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        {current.isForm && (
          <div className="onboarding-form">
            <div className="onboarding-field">
              <label className="onboarding-label">Your name</label>
              <input
                className="onboarding-input"
                placeholder="What should Melius call you?"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                autoFocus
              />
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">Age <span className="onboarding-optional">(optional)</span></label>
              <input
                className="onboarding-input"
                placeholder="Your age"
                type="number"
                value={form.age}
                onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
              />
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">I am a... <span className="onboarding-optional">(optional)</span></label>
              <div className="onboarding-lifestyle-grid">
                {LIFESTYLES.map(l => (
                  <button
                    key={l.value}
                    className={`onboarding-lifestyle-btn ${form.lifestyle === l.value ? 'onboarding-lifestyle-btn--active' : ''}`}
                    onClick={() => setForm(f => ({ ...f, lifestyle: l.value }))}
                    type="button"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="onboarding-field">
              <label className="onboarding-label">Main goal this week <span className="onboarding-optional">(optional)</span></label>
              <input
                className="onboarding-input"
                placeholder="e.g. Study for exams, run 5km, finish project..."
                value={form.weeklyGoals}
                onChange={e => setForm(f => ({ ...f, weeklyGoals: e.target.value }))}
              />
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          className="onboarding-btn"
          onClick={handleNext}
          disabled={!canProceed}
        >
          {current.action}
        </button>

        {/* Skip on first two steps */}
        {!isLast && step > 0 && (
          <button className="onboarding-skip" onClick={() => setStep(s => s + 1)}>
            Skip
          </button>
        )}
        {step === 0 && (
          <button className="onboarding-skip" onClick={() => onComplete({})}>
            Skip setup
          </button>
        )}
      </div>
    </div>
  );
}

export default Onboarding;