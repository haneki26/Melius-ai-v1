import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const SUGGESTIONS = [
  { icon: '🏋️', label: 'Training plan', prompt: 'I want to create a training plan for today' },
  { icon: '📚', label: 'Study session', prompt: 'Help me plan a focused study session today' },
  { icon: '💼', label: 'Work day', prompt: 'Plan my work day and help me stay productive' },
  { icon: '😴', label: 'Recovery day', prompt: 'I need a recovery day, help me rest and recharge' },
  { icon: '🍽️', label: 'Nutrition plan', prompt: 'Help me plan my nutrition and calorie intake' },
  { icon: '🎯', label: 'Custom goal', prompt: '' },
];

const ChatInput = forwardRef(function ChatInput({ onSubmit, userContext, onMeliusReply }, ref) {
  const [messages, setMessages] = useState([
    {
      role: 'melius',
      text: userContext?.name
        ? `Hey ${userContext.name}. I'm Melius — your personal AI. I can plan your day, answer questions, write emails, give recommendations, or just chat. What do you need?`
        : `Hey. I'm Melius — your personal AI. I can plan your day, answer questions, write emails, give recommendations, or just chat. What do you need?`,
      type: 'chat',
    }
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [mode, setMode] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  useImperativeHandle(ref, () => ({
    receiveVoiceInput: (text) => sendMessage(text),
  }));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const sendMessage = async (text, selectedMode) => {
    if (!text.trim()) return;
    setShowSuggestions(false);

    const userMsg = { role: 'user', text: text.trim(), type: 'chat' };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setLoading(true);

    try {
   const response = await fetch('https://melius-backend-production.up.railway.app/api/chat-plan',  {
          method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text.trim(),
          userContext,
          history: updatedMessages,
          mode: selectedMode || mode,
        }),
      });

      const data = await response.json();

      if (data.type === 'plan') {
        setMessages(prev => [...prev, {
          role: 'melius',
          text: data.reply,
          type: 'plan',
        }]);
        if (onMeliusReply) onMeliusReply(data.reply);
        setTimeout(() => onSubmit(data.plan, selectedMode || mode), 900);

      } else if (data.type === 'draft') {
        setMessages(prev => [...prev, {
          role: 'melius',
          text: data.reply,
          type: 'draft',
          draft: data.draft,
        }]);
        if (onMeliusReply) onMeliusReply(data.reply + ' ' + data.draft?.content);

      } else {
        setMessages(prev => [...prev, {
          role: 'melius',
          text: data.reply,
          type: 'chat',
        }]);
        if (onMeliusReply) onMeliusReply(data.reply);
      }

    } catch (error) {
      const errMsg = 'Something went wrong. Make sure the backend is running.';
      setMessages(prev => [...prev, { role: 'melius', text: errMsg, type: 'chat' }]);
    }

    setLoading(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).catch(() => {});
  };

  const handleSuggestion = (suggestion) => {
    if (suggestion.label === 'Custom goal') {
      setShowSuggestions(false);
      inputRef.current?.focus();
      return;
    }
    setMode(suggestion.label);
    sendMessage(suggestion.prompt, suggestion.label);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const startListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      setMessages(prev => [...prev, { role: 'melius', text: 'Voice input requires Chrome.', type: 'chat' }]);
      return;
    }
    const recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (e) => sendMessage(e.results[0][0].transcript);
    recognition.onerror = () => setListening(false);
    recognition.start();
  };

  const stopListening = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  return (
    <div className="chat-container fade-up fade-up-2">

      {showSuggestions && (
        <div className="suggestions-wrap fade-in">
          <p className="suggestions-label">Quick start</p>
          <div className="suggestions-grid">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="suggestion-bubble"
                onClick={() => handleSuggestion(s)} type="button">
                <span className="suggestion-icon">{s.icon}</span>
                <span className="suggestion-text">{s.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {mode && (
        <div className="mode-badge fade-in">
          <span>Mode: {mode}</span>
          <button onClick={() => setMode(null)} className="mode-clear">✕</button>
        </div>
      )}

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble-wrap ${msg.role === 'user' ? 'chat-bubble-wrap--user' : 'chat-bubble-wrap--melius'}`}>
            {msg.role === 'melius' && <div className="chat-avatar"></div>}
            <div className="chat-bubble-col">
              <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--melius'}`}>
                {msg.text.split('\n').map((line, j) => (
                  <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                ))}
              </div>

              {/* Draft card */}
              {msg.type === 'draft' && msg.draft && (
                <div className="draft-card fade-in">
                  <div className="draft-card-header">
                    <span className="draft-card-title">✉ {msg.draft.title}</span>
                    <button
                      className="draft-copy-btn"
                      onClick={() => copyToClipboard(msg.draft.content)}
                      title="Copy to clipboard"
                    >
                      Copy
                    </button>
                  </div>
                  <div className="draft-card-content">
                    {msg.draft.content.split('\n').map((line, j) => (
                      <span key={j}>{line}{j < msg.draft.content.split('\n').length - 1 && <br />}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="chat-bubble-wrap chat-bubble-wrap--melius">
            <div className="chat-avatar"></div>
            <div className="chat-bubble chat-bubble--melius chat-bubble--typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="chat-input-row">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask me anything — plans, questions, emails, recommendations..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          <button
            className={`chat-mic-btn ${listening ? 'chat-mic-btn--active' : ''}`}
            onClick={listening ? stopListening : startListening}
            type="button"
          >
            {listening ? '■' : '🎙'}
          </button>
        </div>
        <button
          className="chat-send-btn"
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          type="button"
        >↑</button>
      </div>

      <p className="chat-hint">
        Ask anything · Plan your day · Write emails · Get recommendations · Tap orb to speak
      </p>
    </div>
  );
});

export default ChatInput;