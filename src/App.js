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
import ChatHistory from './components/ChatHistory';
import ProjectsPanel from './components/ProjectsPanel';
import HabitTracker from './components/HabitTracker';
import WorkoutTracker from './components/WorkoutTracker';
import CollapsibleTracker from './components/CollapsibleTracker';

function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [plan, setPlan] = useState(null);
  const [planMode, setPlanMode] = useState(null);
  const [userContext, setUserContext] = useState(null);
  const [logOpen, setLogOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [lastReply, setLastReply] = useState(null);
  const [logs, setLogs] = useState({ plans: [], training: [], activity: [] });
  const [calorieData, setCalorieData] = useState(null);
  const [showCalorieTracker, setShowCalorieTracker] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [projects, setProjects] = useState([]);
  const [currentProject, setCurrentProject] = useState(null);
  const chatInputRef = useRef(null);
  const planRef = useRef(null);
  const [habitSummary, setHabitSummary] = useState({ completed: 0, total: 0 });
const [workoutSummary, setWorkoutSummary] = useState({ sessions: 0 });
const [currentStreak, setCurrentStreak] = useState(0); // eslint-disable-line no-unused-vars

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
        loadChats(session.user.id);
        loadProjects(session.user.id);
      }
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        loadUserData(session.user.id);
        loadChats(session.user.id);
        loadProjects(session.user.id);
      } else {
        setUser(null);
        setUserContext(null);
        setLogs({ plans: [], training: [], activity: [] });
        setChats([]);
        setProjects([]);
        setCurrentChatId(null);
        setCurrentProject(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProjects = async (userId) => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setProjects(data);
  };

  const handleNewProject = async (form) => {
    if (!user) return;
    const { data } = await supabase.from('projects').insert({
      user_id: user.id,
      name: form.name,
      icon: form.icon,
      description: form.description,
      instructions: form.instructions,
      color: form.color,
    }).select('*').single();
    if (data) setProjects(prev => [data, ...prev]);
  };

  const handleUpdateProject = async (id, form) => {
    await supabase.from('projects').update({
      name: form.name,
      icon: form.icon,
      description: form.description,
      instructions: form.instructions,
      color: form.color,
      updated_at: new Date().toISOString(),
    }).eq('id', id);
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...form } : p));
    if (currentProject?.id === id) setCurrentProject(prev => ({ ...prev, ...form }));
  };

  const handleDeleteProject = async (id) => {
    await supabase.from('projects').delete().eq('id', id);
    setProjects(prev => prev.filter(p => p.id !== id));
    if (currentProject?.id === id) {
      setCurrentProject(null);
      startNewChat();
    }
  };

  const handleSelectProject = (project) => {
    setCurrentProject(project);
    startNewChat();
  };

  const loadChats = async (userId) => {
    const { data } = await supabase
      .from('chats')
      .select('id, title, created_at, updated_at, project_id')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(50);
    if (data) setChats(data);
  };

  const loadChat = async (chatId) => {
    const { data } = await supabase
      .from('chats')
      .select('*')
      .eq('id', chatId)
      .single();
    if (data) {
      setCurrentChatId(chatId);
      setChatMessages(data.messages || []);
      setPlan(null);
      setPlanMode(null);
      if (data.project_id) {
        const proj = projects.find(p => p.id === data.project_id);
        if (proj) setCurrentProject(proj);
      }
      if (chatInputRef.current) chatInputRef.current.loadMessages(data.messages || []);
    }
    setHistoryOpen(false);
  };

  const startNewChat = () => {
    setCurrentChatId(null);
    setChatMessages([]);
    setPlan(null);
    setPlanMode(null);
    if (chatInputRef.current) chatInputRef.current.resetChat();
    setHistoryOpen(false);
  };

  const deleteChat = async (chatId) => {
    await supabase.from('chats').delete().eq('id', chatId);
    setChats(prev => prev.filter(c => c.id !== chatId));
    if (currentChatId === chatId) startNewChat();
  };

  const saveChat = async (messages, userId) => {
    if (!userId || messages.length < 2) return;
    const firstUserMsg = messages.find(m => m.role === 'user');
    const title = firstUserMsg
      ? firstUserMsg.text.slice(0, 50) + (firstUserMsg.text.length > 50 ? '...' : '')
      : 'New chat';

    if (currentChatId) {
      await supabase.from('chats').update({
        messages,
        updated_at: new Date().toISOString(),
      }).eq('id', currentChatId);
      setChats(prev => prev.map(c =>
        c.id === currentChatId ? { ...c, title, updated_at: new Date().toISOString() } : c
      ));
    } else {
      const { data } = await supabase.from('chats').insert({
        user_id: userId,
        title,
        messages,
        project_id: currentProject?.id || null,
      }).select('id, title, created_at, updated_at, project_id').single();
      if (data) {
        setCurrentChatId(data.id);
        setChats(prev => [data, ...prev]);
      }
    }
  };

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
        summary: p.summary, schedule: p.schedule, recommendations: p.recommendations,
        mode: p.mode, date: new Date(p.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      }));
      const training = plans.filter(p => p.mode === 'Training plan').map(p => ({
        summary: p.summary, schedule: p.schedule, recommendations: p.recommendations,
        date: new Date(p.created_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
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
          icon: a.icon, text: a.text,
          time: new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })),
      }));
    }
  };

  const saveActivity = async (icon, text) => {
    if (!user) return;
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setLogs(prev => ({ ...prev, activity: [{ icon, text, time }, ...prev.activity] }));
    await supabase.from('activity_log').insert({ user_id: user.id, icon, text });
  };

  const handleContextSave = async (context) => {
    setUserContext(context);
    saveActivity('👤', `Profile updated — ${context.name || 'unnamed'}`);
    setLastReply(context.name ? `Got it. Nice to meet you, ${context.name}. Your profile is saved.` : 'Profile saved.');
    if (!user) return;
    await supabase.from('profiles').upsert({
      id: user.id, name: context.name,
      age: context.age ? parseInt(context.age) : null,
      lifestyle: context.lifestyle, weekly_goals: context.weeklyGoals,
      notes: context.notes, updated_at: new Date().toISOString(),
    });
  };

  const handlePlanReady = async (planData, mode) => {
    setPlan(planData);
    setPlanMode(mode);
    setTimeout(() => planRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
    const date = new Date().toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const newEntry = { ...planData, date, mode: mode || 'Daily plan' };
    if (mode === 'Training plan') {
      setLogs(prev => ({ ...prev, training: [newEntry, ...prev.training] }));
    } else {
      setLogs(prev => ({ ...prev, plans: [newEntry, ...prev.plans] }));
    }
    saveActivity('📅', `${mode || 'Daily'} plan generated`);
    if (planData.summary) setLastReply(`Here is your plan. ${planData.summary}`);
    if (!user) return;
    await supabase.from('plans').insert({
      user_id: user.id, mode: mode || 'Daily plan',
      summary: planData.summary, recommendations: planData.recommendations || [],
      schedule: planData.schedule || [],
    });
  };

  const handleMessagesUpdate = (messages) => {
    setChatMessages(messages);
    if (user && messages.length >= 2) saveChat(messages, user.id);
  };

  const handleCalorieUpdate = (data) => {
    setCalorieData(data);
    setShowCalorieTracker(true);
  };

  const handleOrbTranscript = (text) => {
    if (chatInputRef.current) chatInputRef.current.receiveVoiceInput(text);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setPlan(null); setPlanMode(null); setLastReply(null);
    setChats([]); setCurrentChatId(null);
    setProjects([]); setCurrentProject(null);
  };

  if (authLoading) return <div className="auth-loading"><div className="spinner" /></div>;
  if (!user) return <AuthScreen onAuth={(u) => { setUser(u); loadUserData(u.id); loadChats(u.id); loadProjects(u.id); }} />;

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
      <button className="history-toggle-btn" onClick={() => setHistoryOpen(true)} title="Chat history">🕐</button>
      <button className="projects-toggle-btn" onClick={() => setProjectsOpen(true)} title="Projects">📁</button>

      <Header />

      {/* Active project badge */}
      {currentProject && (
        <button
          className="project-badge"
          onClick={() => setProjectsOpen(true)}
          style={{ borderColor: `${currentProject.color}40`, color: currentProject.color }}
        >
          <span>{currentProject.icon}</span>
          <span>{currentProject.name}</span>
          <span style={{ opacity: 0.5, fontSize: '0.65rem' }}>✕</span>
        </button>
      )}

      <ContextBar onContextSave={handleContextSave} initialContext={userContext} />

{user && (
  <CollapsibleTracker
    icon="✦"
    title="Habits & Streak"
    summary={`${habitSummary.completed}/${habitSummary.total} today · ${currentStreak} day streak`}
    stat={currentStreak > 0 ? `🔥${currentStreak}` : null}
  >
    <HabitTracker
      userId={user.id}
      onHabitsUpdate={(habits, completed) => {
        setHabitSummary({ completed: completed.length, total: habits.length });
      }}
    />
  </CollapsibleTracker>
)}


{user && (
  <CollapsibleTracker
    icon="💪"
    title="Workout Tracker"
    summary={workoutSummary.sessions > 0 ? `${workoutSummary.sessions} sessions logged` : 'Log your sets and weights'}
    stat={null}
  >
    <WorkoutTracker
      userId={user.id}
      onWorkoutUpdate={(logs) => {
        const sessions = new Set(logs.map(l => l.logged_at.split('T')[0])).size;
        setWorkoutSummary({ sessions });
      }}
    />
  </CollapsibleTracker>
)}


      {showCalorieTracker && (
        <CalorieTracker data={calorieData} onClose={() => setShowCalorieTracker(false)} onUpdate={setCalorieData} />
      )}

      <ChatInput
        ref={chatInputRef}
        onSubmit={handlePlanReady}
        userContext={userContext}
        onMeliusReply={setLastReply}
        onCalorieUpdate={handleCalorieUpdate}
        calorieData={calorieData}
        currentPlan={plan}
        onClearPlan={() => { setPlan(null); setPlanMode(null); }}
        onMessagesUpdate={handleMessagesUpdate}
        initialMessages={chatMessages}
        currentProject={currentProject}
      />

      {plan && (
        <div ref={planRef} className="plan-below-chat fade-in">
          <div className="plan-below-header">
            <p className="plan-below-eyebrow">{planMode || 'Daily plan'}</p>
            <button className="plan-below-close" onClick={() => { setPlan(null); setPlanMode(null); }}>✕ Clear plan</button>
          </div>
          <DailyPlan plan={plan} onReset={() => { setPlan(null); setPlanMode(null); }} />
        </div>
      )}

      <MeliusOrb onTranscript={handleOrbTranscript} lastReply={lastReply} />
      <LogPanel
  isOpen={logOpen}
  onClose={() => setLogOpen(false)}
  logs={logs}
  userId={user?.id}
/>
      <ChatHistory
        isOpen={historyOpen}
        onClose={() => setHistoryOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onLoadChat={loadChat}
        onNewChat={startNewChat}
        onDeleteChat={deleteChat}
        projects={projects}
      />
      <ProjectsPanel
        isOpen={projectsOpen}
        onClose={() => setProjectsOpen(false)}
        projects={projects}
        currentProjectId={currentProject?.id}
        onSelectProject={handleSelectProject}
        onNewProject={handleNewProject}
        onDeleteProject={handleDeleteProject}
        onUpdateProject={handleUpdateProject}
      />
    </div>
  );
}

export default App;