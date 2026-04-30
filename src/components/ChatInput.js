/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { generatePptx, generatePdf } from './FileGenerator';

const SUGGESTIONS = [
  { icon: '🏋️', label: 'Training plan', prompt: 'I want to create a training plan for today' },
  { icon: '📚', label: 'Study session', prompt: 'Help me plan a focused study session today' },
  { icon: '💼', label: 'Work day', prompt: 'Plan my work day and help me stay productive' },
  { icon: '😴', label: 'Recovery day', prompt: 'I need a recovery day, help me rest and recharge' },
  { icon: '🍽️', label: 'Calorie analyzer', prompt: 'CALORIE_ANALYZER' },
  { icon: '🎯', label: 'Custom goal', prompt: '' },
];

const DEFAULT_MESSAGE = (name) => ({
  role: 'melius',
  text: name
    ? `Hey ${name}. I'm Melius — your personal AI. I can plan your day, answer questions, write emails, analyze food photos, create presentations, give recommendations, or just chat. What do you need?`
    : `Hey. I'm Melius — your personal AI. I can plan your day, answer questions, write emails, analyze food photos, create presentations, give recommendations, or just chat. What do you need?`,
  type: 'chat',
});

const ChatInput = forwardRef(function ChatInput(
  { onSubmit, userContext, onMeliusReply, onCalorieUpdate, calorieData, currentPlan, onClearPlan, onMessagesUpdate, initialMessages, currentProject },
  ref
) {
  const [messages, setMessages] = useState(
    initialMessages?.length > 0 ? initialMessages : [DEFAULT_MESSAGE(userContext?.name)]
  );
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(!initialMessages?.length);
  const [mode, setMode] = useState(null);
  const [pendingImage, setPendingImage] = useState(null);
  const [pendingImagePreview, setPendingImagePreview] = useState(null);
  const [pendingFile, setPendingFile] = useState(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const imageInputRef = useRef(null);
  const fileInputRef = useRef(null);

  useImperativeHandle(ref, () => ({
    receiveVoiceInput: (text) => sendMessage(text),
    loadMessages: (msgs) => {
      setMessages(msgs.length > 0 ? msgs : [DEFAULT_MESSAGE(userContext?.name)]);
      setShowSuggestions(false);
    },
    resetChat: () => {
      setMessages([DEFAULT_MESSAGE(userContext?.name)]);
      setShowSuggestions(true);
      setMode(null);
    },
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

  const toText = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsText(file);
  });

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    setPendingImagePreview(preview);
    try {
      const base64 = await toBase64(file);
      setPendingImage({ base64, type: file.type });
    } catch (err) { console.error('Image read error:', err); }
    e.target.value = '';
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        const base64 = await toBase64(file);
        setPendingFile({ name: file.name, type: 'pdf', base64, size: file.size });
      } else {
        const text = await toText(file);
        setPendingFile({ name: file.name, type: 'text', content: text, size: file.size });
      }
    } catch (err) { console.error('File read error:', err); }
    e.target.value = '';
  };

  const clearImage = () => { setPendingImage(null); setPendingImagePreview(null); };
  const clearFile = () => setPendingFile(null);
  const handlePaste = async (e) => {
  const items = e.clipboardData?.items;
  if (!items) return;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault();
      const file = item.getAsFile();
      if (!file) return;
      const preview = URL.createObjectURL(file);
      setPendingImagePreview(preview);
      try {
        const base64 = await toBase64(file);
        setPendingImage({ base64, type: file.type });
      } catch (err) { console.error('Paste error:', err); }
      return;
    }
  }
};

  const updateMessages = (newMessages) => {
    setMessages(newMessages);
    if (onMessagesUpdate) onMessagesUpdate(newMessages);
  };

  const sendMessage = async (text, selectedMode, imageData) => {
    const textToSend = text?.trim() || '';
    const imageToSend = imageData || pendingImage;
    if (!textToSend && !imageToSend && !pendingFile) return;

    setShowSuggestions(false);

    const userMsg = {
      role: 'user',
      text: textToSend || (pendingFile ? `📄 ${pendingFile.name}` : '📷 Image sent'),
      type: 'chat',
      imagePreview: pendingImagePreview,
      fileName: pendingFile?.name,
    };

    const updatedMessages = [...messages, userMsg];
    updateMessages(updatedMessages);
    setInput('');
    const fileToSend = pendingFile;
    setPendingImage(null);
    setPendingImagePreview(null);
    setPendingFile(null);
    setLoading(true);

    try {
      const response = await fetch('https://melius-backend.onrender.com/api/chat-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend || 'Please analyze this',
          userContext,
          history: updatedMessages,
          mode: selectedMode || mode,
          image: imageToSend || null,
          file: fileToSend || null,
          calorieContext: calorieData
            ? `User calorie tracker: ${(calorieData.entries || []).reduce((s, e) => s + e.calories, 0)} eaten of ${calorieData.goal || 2000} goal today.`
            : null,
          projectInstructions: currentProject?.instructions || null,
          projectName: currentProject?.name || null,
        
        }),
      });

      const data = await response.json();
      let replyMsg;

      if (data.type === 'plan') {
        replyMsg = { role: 'melius', text: data.reply, type: 'plan', plan: data.plan };
        if (onMeliusReply) onMeliusReply(data.reply);
        onSubmit(data.plan, selectedMode || mode);
        updateMessages([...updatedMessages, replyMsg]);

      } else if (data.type === 'draft') {
        replyMsg = { role: 'melius', text: data.reply, type: 'draft', draft: data.draft };
        if (onMeliusReply) onMeliusReply(data.reply);
        updateMessages([...updatedMessages, replyMsg]);

      } else if (data.type === 'presentation') {
        replyMsg = { role: 'melius', text: data.reply, type: 'chat' };
        if (onMeliusReply) onMeliusReply(data.reply);
        updateMessages([...updatedMessages, replyMsg]);
        try {
          const filename = await generatePptx(data.file);
          const confirmMsg = {
            role: 'melius',
            text: `Your presentation "${data.file?.title}" has been downloaded as ${filename}. Let me know if you want to adjust anything.`,
            type: 'chat',
          };
          updateMessages([...updatedMessages, replyMsg, confirmMsg]);
        } catch (err) {
          console.error('PPTX error:', err);
          const errMsg = { role: 'melius', text: 'Could not generate the presentation. Please try again.', type: 'chat' };
          updateMessages([...updatedMessages, replyMsg, errMsg]);
        }

      } else if (data.type === 'pdf') {
        replyMsg = { role: 'melius', text: data.reply, type: 'chat' };
        if (onMeliusReply) onMeliusReply(data.reply);
        updateMessages([...updatedMessages, replyMsg]);
        try {
          const filename = await generatePdf(data.file);
          const confirmMsg = {
            role: 'melius',
            text: `Your document "${data.file?.title}" has been downloaded as ${filename}. Let me know if you need changes.`,
            type: 'chat',
          };
          updateMessages([...updatedMessages, replyMsg, confirmMsg]);
        } catch (err) {
          console.error('PDF error:', err);
          const errMsg = { role: 'melius', text: 'Could not generate the PDF. Please try again.', type: 'chat' };
          updateMessages([...updatedMessages, replyMsg, errMsg]);
        }

      } else if (data.type === 'calorie') {
        replyMsg = { role: 'melius', text: data.reply, type: 'calorie', calorieEntry: data.calorieEntry };
        if (onMeliusReply) onMeliusReply(data.reply);
        if (data.calorieEntry && onCalorieUpdate) {
          onCalorieUpdate({ goal: calorieData?.goal || 2000, entries: calorieData?.entries || [] });
        }
        const withReply = [...updatedMessages, replyMsg];
        updateMessages(withReply);
        setTimeout(() => {
          updateMessages([...withReply, {
            role: 'melius',
            text: 'Want me to add this to your calorie tracker?',
            type: 'calorie_prompt',
            calorieEntry: data.calorieEntry,
          }]);
        }, 600);

      } else {
        replyMsg = { role: 'melius', text: data.reply, type: 'chat' };
        if (onMeliusReply) onMeliusReply(data.reply);
        updateMessages([...updatedMessages, replyMsg]);
      }

    } catch (error) {
      updateMessages([...updatedMessages, {
        role: 'melius',
        text: 'Something went wrong. Please try again.',
        type: 'chat',
      }]);
    }

    setLoading(false);
  };

  const addToTracker = (calorieEntry) => {
    if (!calorieEntry) return;
    onCalorieUpdate({
      goal: calorieData?.goal || 2000,
      entries: [...(calorieData?.entries || []), calorieEntry],
    });
    updateMessages([...messages, {
      role: 'melius',
      text: `Added ${calorieEntry.name} (${calorieEntry.calories} kcal) to your tracker.`,
      type: 'chat',
    }]);
  };

  const copyToClipboard = (text) => navigator.clipboard.writeText(text).catch(() => {});

  const handleSuggestion = (suggestion) => {
    if (suggestion.prompt === 'CALORIE_ANALYZER') {
      setShowSuggestions(false);
      setMode('Calorie analyzer');
      updateMessages([...messages, {
        role: 'melius',
        text: 'Sure! Take a photo of your food or tell me what you ate and I will estimate the calories and macros. I can also add it to your daily tracker.',
        type: 'chat',
      }]);
      setTimeout(() => imageInputRef.current?.click(), 300);
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
    if (!SR) return;
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

  const stopListening = () => { recognitionRef.current?.stop(); setListening(false); };

  return (
    <div className="chat-container fade-up fade-up-2">
      <input ref={imageInputRef} type="file" accept="image/*" capture="environment"
        style={{ display: 'none' }} onChange={handleImageSelect} />
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.doc,.docx,.csv"
        style={{ display: 'none' }} onChange={handleFileSelect} />

      {showSuggestions && (
        <div className="suggestions-wrap fade-in">
          <p className="suggestions-label">Quick start</p>
          <div className="suggestions-grid">
            {SUGGESTIONS.map((s, i) => (
              <button key={i} className="suggestion-bubble" onClick={() => handleSuggestion(s)} type="button">
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
            {msg.role === 'melius' && <div className="chat-avatar" />}
            <div className="chat-bubble-col">
              {msg.imagePreview && (
                <div className="chat-image-preview">
                  <img src={msg.imagePreview} alt="Uploaded" className="chat-image" />
                </div>
              )}
              {msg.fileName && <div className="chat-file-badge">📄 {msg.fileName}</div>}
              {msg.type === 'plan' && msg.plan && (
                <div className="chat-plan-card fade-in">
                  <p className="chat-plan-summary">{msg.plan.summary}</p>
                  {msg.plan.recommendations?.slice(0, 2).map((r, j) => (
                    <div key={j} className="chat-plan-rec"><span>{r.icon}</span><span>{r.tip}</span></div>
                  ))}
                  {msg.plan.schedule?.slice(0, 4).map((item, j) => (
                    <div key={j} className="chat-plan-item">
                      <span className="chat-plan-time">{item.time}</span>
                      <span>{item.icon}</span>
                      <div>
                        <p className="chat-plan-title">{item.title}</p>
                        <p className="chat-plan-desc">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                  {msg.plan.schedule?.length > 4 && (
                    <p className="chat-plan-more">+{msg.plan.schedule.length - 4} more — see full plan below</p>
                  )}
                </div>
              )}
              {msg.text && (
                <div className={`chat-bubble ${msg.role === 'user' ? 'chat-bubble--user' : 'chat-bubble--melius'}`}>
                  {msg.text.split('\n').map((line, j) => {
                    const urlRegex = /(https?:\/\/[^\s]+)/g;
                    const parts = line.split(urlRegex);
                    return (
                      <span key={j}>
                        {parts.map((part, k) =>
                          urlRegex.test(part)
                            ? <a key={k} href={part} target="_blank" rel="noopener noreferrer" className="chat-link">{part}</a>
                            : part
                        )}
                        {j < msg.text.split('\n').length - 1 && <br />}
                      </span>
                    );
                  })}
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
              {msg.type === 'calorie_prompt' && msg.calorieEntry && (
                <div className="calorie-prompt fade-in">
                  <button className="calorie-prompt-yes" onClick={() => addToTracker(msg.calorieEntry)}>
                    ✓ Add to tracker
                  </button>
                  <button className="calorie-prompt-no" onClick={() => {}}>Skip</button>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="chat-bubble-wrap chat-bubble-wrap--melius">
            <div className="chat-avatar" />
            <div className="chat-bubble chat-bubble--melius chat-bubble--typing">
              <span className="dot" /><span className="dot" /><span className="dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {pendingImagePreview && (
        <div className="pending-image-wrap fade-in">
          <img src={pendingImagePreview} alt="Ready to send" className="pending-image" />
          <button className="pending-image-clear" onClick={clearImage}>✕</button>
          <p className="pending-image-label">Ready to analyze — add a message or send now</p>
        </div>
      )}

      {pendingFile && (
        <div className="pending-file-wrap fade-in">
          <span className="pending-file-icon">📄</span>
          <div className="pending-file-info">
            <p className="pending-file-name">{pendingFile.name}</p>
            <p className="pending-file-size">{(pendingFile.size / 1024).toFixed(1)} KB</p>
          </div>
          <button className="pending-image-clear" onClick={clearFile}>✕</button>
        </div>
      )}

      <div className="chat-input-row">
        <div className="chat-input-wrap">
          <textarea ref={inputRef} className="chat-input"
            placeholder="Ask me anything — plans, questions, emails, presentations..."
            value={input} onChange={(e) => setInput(e.target.value)}
           onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1} />
          <button className="chat-camera-btn" onClick={() => imageInputRef.current?.click()} title="Upload image" type="button">📷</button>
          <button className="chat-file-btn" onClick={() => fileInputRef.current?.click()} title="Upload file" type="button">📎</button>
          <button className={`chat-mic-btn ${listening ? 'chat-mic-btn--active' : ''}`}
            onClick={listening ? stopListening : startListening} type="button">
            {listening ? '■' : '🎙'}
          </button>
        </div>
        <button className="chat-send-btn" onClick={() => sendMessage(input)}
          disabled={(!input.trim() && !pendingImage && !pendingFile) || loading} type="button">↑</button>
      </div>
      <p className="chat-hint">Enter to send · 📷 photo · 📎 file · 🎙 speak · Tap orb to talk</p>
    </div>
  );
});

export default ChatInput;