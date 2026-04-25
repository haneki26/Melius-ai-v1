import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './supabase';
import AuthScreen from './components/AuthScreen';
import Header from './components/Header';
import ContextBar from './components/ContextBar';
import ChatInput from './components/ChatInput';
import DailyPlan from './components/DailyPlan';
import LogPanel from './components/LogPanel';
import MeliusOrb from './components/MeliusOrb';
import CalorieTracker from './components/CalorieTracker';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [planMode, setPlanMode] = useState(null);
  const [userContext, setUserContext] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [lastReply, setLastReply] = useState(null);
  const [logs, setLogs] = useState({ plans: [], training: [], activity: [] });
  const [calorieData, setCalorieData] = useState(null);
  const [showCalorieTracker, setShowCalorieTracker] = useState(false);
  const chatInputRef = useRef(null);
  const planRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
      } else {
        setUser(null);
        setUserContext(null);
        setLogs({ plans: [], training: [], activity: [] });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profile?.name) {
      setUserContext({
        name: profile.name,
        age: profile.age?.toString() || '',
        lifestyle: profile.lifestyle || 'student',
        weeklyGoals: profile.weekly_goals || '',
        notes: profile.notes || '',
      });
    }

    const { data: plans } = await supabase
      .from('plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (plans) {
      const daily = plans.filter(p => p.mode !== 'Training plan').map(p => ({
        summary: p.summary,
        schedule: p.schedule,
        recommendations: p.recommendations,
        mode: p.mode,
        date: new Date(p.created_at).toLocaleDateString([], {
          weekday: 'short', month: 'short', day: 'numeric'
        }),
      }));
      const training = plans.filter(p => p.mode === 'Training plan').map(p => ({
        summary: p.summary,
        schedule: p.schedule,
        recommendations: p.recommendations,
        date: new Date(p.created_at).toLocaleDateString([], {
          weekday: 'short', month: 'short', day: 'numeric'
        }),
      }));
      setLogs(prev => ({ ...prev, plans: daily, training }));
    }

    const { data: activity } = await supabase
      .from('activity_log')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (activity) {
      setLogs(prev => ({
        ...prev,
        activity: activity.map(a => ({
          icon: a.icon,
          text: a.text,
          time: new Date(a.created_at).toLocaleTimeString([], {
            hour: '2-digit', minute: '2-digit'
          }),
        })),
      }));
    }
  };

  const saveActivity = async (icon, text) => {
    if (!user) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => ({
      ...prev,
      activity: [{ icon, text, time }, ...prev.activity],
    }));
    await supabase.from('activity_log').insert({ user_id: user.id, icon, text });
  };

  const handleContextSave = async (context) => {
    setUserContext(context);
    saveActivity('👤', `Profile updated — ${context.name || 'unnamed'}`);
    setLastReply(
      context.name
        ? `Got it. Nice to meet you, ${context.name}. Your profile is saved.`
        : 'Profile saved.'
    );
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id,
      name: context.name,
      age: context.age ? parseInt(context.age) : null,
      lifestyle: context.lifestyle,
      weekly_goals: context.weeklyGoals,
      notes: context.notes,
      updated_at: new Date().toISOString(),
    });
  };

  const handlePlanReady = async (planData, mode) => {
    setPlan(planData);
    setPlanMode(mode);

    // Scroll to plan
    setTimeout(() => {
      planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 300);

    const date = new Date().toLocaleDateString([], {
      weekday: 'short', month: 'short', day: 'numeric'
    });
    const newEntry = { ...planData, date, mode: mode || 'Daily plan' };

    if (mode === 'Training plan') {
      setLogs(prev => ({ ...prev, training: [newEntry, ...prev.training] }));
    } else {
      setLogs(prev => ({ ...prev, plans: [newEntry, ...prev.plans] }));
    }

    saveActivity('📅', `${mode || 'Daily'} plan generated`);

    if (planData.summary) {
      setLastReply(`Here is your plan. ${planData.summary}`);
    }

    if (!user) return;
    await supabase.from('plans').insert({
      user_id: user.id,
      mode: mode || 'Daily plan',
      summary: planData.summary,
      recommendations: planData.recommendations || [],
      schedule: planData.schedule || [],
    });
  };

  const handleCalorieUpdate = (data) => {
    setCalorieData(data);
    setShowCalorieTracker(true);
  };

  const handleOrbTranscript = (text) => {
    if (chatInputRef.current) {
      chatInputRef.current.receiveVoiceInput(text);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPlan(null);
    setPlanMode(null);
    setLastReply(null);
  };

  if (authLoading) {
    return (
      <div className="auth-loading">
        <div className="spinner" />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen onAuth={(u) => { setUser(u); loadUserData(u.id); }} />;
  }

  return (
    <div className="app">
      <button className="log-toggle-btn" onClick={() => setLogOpen(true)}>
        <span className="log-toggle-icon">☰</span>
        <span>Log</span>
        {(logs.plans.length + logs.training.length) > 0 && (
          <span className="log-badge">{logs.plans.length + logs.training.length}</span>
        )}
      </button>

      <button className="signout-btn" onClick={handleSignOut} title="Sign out">↩</button>

      <Header />
      <ContextBar onContextSave={handleContextSave} initialContext={userContext} />

      {/* Calorie tracker */}
      {showCalorieTracker && (
        <CalorieTracker
          data={calorieData}
          onClose={() => setShowCalorieTracker(false)}
          onUpdate={setCalorieData}
        />
      )}

      {/* Chat input — always visible */}
      <ChatInput
        ref={chatInputRef}
        onSubmit={handlePlanReady}
        userContext={userContext}
        onMeliusReply={setLastReply}
        onCalorieUpdate={handleCalorieUpdate}
        calorieData={calorieData}
        currentPlan={plan}
        onClearPlan={() => { setPlan(null); setPlanMode(null); }}
      />

      {/* Full plan display below chat — like before */}
      {plan && (
        <div ref={planRef} className="plan-below-chat fade-in">
          <div className="plan-below-header">
            <p className="plan-below-eyebrow">{planMode || 'Daily plan'}</p>
            <button
              className="plan-below-close"
              onClick={() => { setPlan(null); setPlanMode(null); }}
            >
              ✕ Clear plan
            </button>
          </div>
          <DailyPlan plan={plan} onReset={() => { setPlan(null); setPlanMode(null); }} />
        </div>
      )}

      <MeliusOrb onTranscript={handleOrbTranscript} lastReply={lastReply} />
      <LogPanel isOpen={logOpen} onClose={() => setLogOpen(false)} logs={logs} />
    </div>
  );
}

export default App;