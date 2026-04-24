import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';

const SUGGESTIONS = [
  { icon: '🏋️', label: 'Training plan', prompt: 'I want to create a training plan for today' },
  { icon: '📚', label: 'Study session', prompt: 'Help me plan a focused study session today' },
  { icon: '💼', label: 'Work day', prompt: 'Plan my work day and help me stay productive' },
  { icon: '😴', label: 'Recovery day', prompt: 'I need a recovery day, help me rest and recharge' },
  { icon: '🍽️', label: 'Calorie analyzer', prompt: 'CALORIE_ANALYZER' },
  { icon: '🎯', label: 'Custom goal', prompt: '' },
];

const ChatInput = forwardRef(function ChatInput({ onSubmit, userContext, onMeliusReply }, ref) {
  const [messages, setMessages] = useState([
    {
      role: 'melius',
      text: userContext?.name
        ? `Hey ${userContext.name}. I'm Melius — your personal AI. I can plan your day, answer questions, write emails, analyze food photos, give recommendations, or just chat. What do you need?`
        : `Hey. I'm Melius — your personal AI. I can plan your day, answer questions, write emails, analyze food photos, give recommendations, or just chat. What do you need?`,
      type: 'chat',
    }
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [mode, setMode] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    receiveVoiceInput: (text) => sendMessage(text),
  }));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const preview = URL.createObjectURL(file);
    setPendingImagePreview(preview);

    try {
      const base64 = await toBase64(file);
      setPendingImage({ base64, type: file.type });
    } catch (err) {
      console.error('Image read error:', err);
    }

    e.target.value = '';
  };

  const clearImage = () => {
    setPendingImage(null);
    setPendingImagePreview(null);
  };

  const sendMessage = async (text, selectedMode, imageData) => {
    const textToSend = text?.trim() || '';
    const imageToSend = imageData || pendingImage;

    if (!textToSend && !imageToSend) return;

    setShowSuggestions(false);

    const userMsg = {
      role: 'user',
      text: textToSend || '📷 Image sent',
      type: 'chat',
      imagePreview: pendingImagePreview,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    setPendingImage(null);
    setPendingImagePreview(null);
    setLoading(true);

    try {
      const response = await fetch('https://melius-backend.onrender.com/api/chat-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend || 'Please analyze this image',
          userContext,
          history: updatedMessages,
          mode: selectedMode || mode,
          image: imageToSend || null,
        }),
      });

      const data = await response.json();

      if (data.type === 'plan') {
        setMessages(prev => [...prev, { role: 'melius', text: data.reply, type: 'plan' }]);
        if (onMeliusReply) onMeliusReply(data.reply);
        setTimeout(() => onSubmit(data.plan, selectedMode || mode), 900);
      } else if (data.type === 'draft') {
        setMessages(prev => [...prev, { role: 'melius', text: data.reply, type: 'draft', draft: data.draft }]);
        if (onMeliusReply) onMeliusReply(data.reply + ' ' + data.draft?.content);
      } else {
        setMessages(prev => [...prev, { role: 'melius', text: data.reply, type: 'chat' }]);
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
    if (suggestion.prompt === 'CALORIE_ANALYZER') {
      setShowSuggestions(false);
      setMode('Calorie analyzer');
      setMessages(prev => [...prev, {
        role: 'melius',
        text: 'Sure! Take a photo of your food or upload an image and I will estimate the calories and macros. Keep in mind my estimates are approximate — for precise tracking always check nutritional labels.',
        type: 'chat',
      }]);
      setTimeout(() => fileInputRef.current?.click(), 300);
      return;
    }
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
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleImageSelect}
      />

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
              {msg.imagePreview && (
                <div className="chat-image-preview">
                  <img src={msg.imagePreview} alt="Uploaded" className="chat-image" />
                </div>
              )}
              {msg.text && (
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--melius'}`}>
                  {msg.text.split('\n').map((line, j) => (
                    <span key={j}>{line}{j < msg.text.split('\n').length - 1 && <br />}</span>
                  ))}
                </div>
              )}
              {msg.type === 'draft' && msg.draft && (
                <div className="draft-card fade-in">
                  <div className="draft-card-header">
                    <span className="draft-card-title">✉ {msg.draft.title}</span>
                    <button className="draft-copy-btn" onClick={() => copyToClipboard(msg.draft.content)}>Copy</button>
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

      {/* Image preview before sending */}
      {pendingImagePreview && (
        <div className="pending-image-wrap fade-in">
          <img src={pendingImagePreview} alt="Ready to send" className="pending-image" />
          <button className="pending-image-clear" onClick={clearImage}>✕</button>
          <p className="pending-image-label">Ready to analyze — add a message or send now</p>
        </div>
      )}

      <div className="chat-input-row">
        <div className="chat-input-wrap">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Ask me anything — plans, questions, emails, or upload a photo..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />
          {/* Camera button */}
          <button
            className="chat-camera-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload image"
            type="button"
          >
            📷
          </button>
          {/* Mic button */}
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
          disabled={(!input.trim() && !pendingImage) || loading}
          type="button"
        >↑</button>
      </div>

      <p className="chat-hint">
        Enter to send · 📷 upload photo · 🎙 speak · Tap orb to talk to Melius
      </p>
    </div>
  );
});

export default ChatInput;