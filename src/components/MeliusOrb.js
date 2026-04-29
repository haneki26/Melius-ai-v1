/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef } from 'react';

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
};

const getRecognitionLang = () => {
  const lang = navigator.language || navigator.userLanguage || 'en-US';
  const map = {
    'nb': 'nb-NO', 'nn': 'nb-NO', 'no': 'nb-NO',
    'sv': 'sv-SE', 'da': 'da-DK', 'fi': 'fi-FI',
    'de': 'de-DE', 'fr': 'fr-FR', 'es': 'es-ES',
    'it': 'it-IT', 'pt': 'pt-PT', 'nl': 'nl-NL',
    'pl': 'pl-PL', 'ru': 'ru-RU', 'ar': 'ar-SA',
    'zh': 'zh-CN', 'ja': 'ja-JP', 'ko': 'ko-KR',
    'tr': 'tr-TR', 'hi': 'hi-IN',
  };
  const prefix = lang.split('-')[0];
  return map[prefix] || lang || 'en-US';
};

const SunRays = () => (
  <svg viewBox="-80 -80 160 160" xmlns="http://www.w3.org/2000/svg">
    <path d="M 0,-32 C 4,-48 6,-65 0,-72 C -6,-65 -4,-48 0,-32" fill="#C9A84C"/>
    <path d="M 0,32 C -4,48 -6,65 0,72 C 6,65 4,48 0,32" fill="#C9A84C"/>
    <path d="M -32,0 C -48,-4 -65,-6 -72,0 C -65,6 -48,4 -32,0" fill="#C9A84C"/>
    <path d="M 32,0 C 48,4 65,6 72,0 C 65,-6 48,-4 32,0" fill="#C9A84C"/>
    <path d="M -22,-22 C -33,-36 -44,-50 -51,-51 C -50,-44 -36,-33 -22,-22" fill="#C9A84C"/>
    <path d="M 22,-22 C 36,-33 50,-44 51,-51 C 44,-50 33,-36 22,-22" fill="#C9A84C"/>
    <path d="M -22,22 C -33,36 -44,50 -51,51 C -50,44 -36,33 -22,22" fill="#C9A84C"/>
    <path d="M 22,22 C 36,33 50,44 51,51 C 44,50 33,36 22,22" fill="#C9A84C"/>
    <path d="M -12,-30 C -14,-44 -12,-55 -10,-58 C -6,-52 -7,-42 -12,-30" fill="#C9A84C" opacity="0.75"/>
    <path d="M 12,-30 C 14,-44 12,-55 10,-58 C 6,-52 7,-42 12,-30" fill="#C9A84C" opacity="0.75"/>
    <path d="M -12,30 C -14,44 -12,55 -10,58 C -6,52 -7,42 -12,30" fill="#C9A84C" opacity="0.75"/>
    <path d="M 12,30 C 14,44 12,55 10,58 C 6,52 7,42 12,30" fill="#C9A84C" opacity="0.75"/>
    <path d="M -30,-12 C -44,-14 -55,-12 -58,-10 C -52,-6 -42,-7 -30,-12" fill="#C9A84C" opacity="0.75"/>
    <path d="M -30,12 C -44,14 -55,12 -58,10 C -52,6 -42,7 -30,12" fill="#C9A84C" opacity="0.75"/>
    <path d="M 30,-12 C 44,-14 55,-12 58,-10 C 52,-6 42,-7 30,-12" fill="#C9A84C" opacity="0.75"/>
    <path d="M 30,12 C 44,14 55,12 58,10 C 52,6 42,7 30,12" fill="#C9A84C" opacity="0.75"/>
  </svg>
);

// 5 sound bars that react to amplitude
function SoundBars({ amplitude }) {
  // Each bar gets a slightly different height based on amplitude + offset
  const bars = [0.6, 1.0, 0.8, 1.0, 0.6];
  const base = amplitude / 255;
  return (
    <div className="orb-sound-bars">
      {bars.map((mult, i) => {
        const h = Math.max(3, Math.round(base * 20 * mult));
        return (
          <div
            key={i}
            className="orb-bar"
            style={{ height: `${h}px` }}
          />
        );
      })}
    </div>
  );
}

function MeliusOrb({ onTranscript, lastReply }) {
  const [orbState, setOrbState] = useState(STATES.IDLE);
  const [amplitude, setAmplitude] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [justHeard, setJustHeard] = useState(false);

  const synthRef = useRef(window.speechSynthesis);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const analyserRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');
  const isListeningRef = useRef(false);
  const lastReplyRef = useRef(null);
  const voiceEnabledRef = useRef(true);

  voiceEnabledRef.current = voiceEnabled;

  if (lastReply && lastReply !== lastReplyRef.current) {
    lastReplyRef.current = lastReply;
    if (voiceEnabledRef.current) speakText(lastReply);
  }

  const stopAmplitudeTracking = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    analyserRef.current = null;
    setAmplitude(0);
  };

  function speakText(text) {
    if (!window.speechSynthesis) return;
    synthRef.current.cancel();
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
    if (!clean) return;
    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.lang = 'en-GB';
    const setVoice = () => {
      const voices = synthRef.current.getVoices();
      const preferred = voices.find(v =>
        v.name.includes('Google UK English Female') ||
        v.name.includes('Samantha') ||
        v.name.includes('Karen') ||
        v.name.includes('Daniel') ||
        v.lang === 'en-GB'
      ) || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
    };
    setVoice();
    if (speechSynthesis.onvoiceschanged !== undefined) speechSynthesis.onvoiceschanged = setVoice;
    utterance.rate = 0.9;
    utterance.pitch = 0.95;
    utterance.volume = 1;
    utterance.onstart = () => setOrbState(STATES.SPEAKING);
    utterance.onend = () => { setOrbState(STATES.IDLE); setAmplitude(0); };
    utterance.onerror = () => setOrbState(STATES.IDLE);
    synthRef.current.speak(utterance);
  }

  const startAmplitudeTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64; // Smaller for faster response
      analyserRef.current = analyser;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!isListeningRef.current) return;
        analyser.getByteFrequencyData(data);
        // Use low-mid frequencies for voice detection
        const voiceRange = Array.from(data.slice(2, 12));
        const avg = voiceRange.reduce((a, b) => a + b, 0) / voiceRange.length;
        setAmplitude(Math.round(avg));
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (e) {}
  };

  const handleOrbClick = () => {
    if (orbState === STATES.SPEAKING) {
      synthRef.current.cancel();
      setOrbState(STATES.IDLE);
      return;
    }
    if (orbState === STATES.THINKING) return;
    if (orbState === STATES.LISTENING) {
      recognitionRef.current?.stop();
      return;
    }
    startListening();
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) { alert('Voice input requires Chrome browser.'); return; }
    transcriptRef.current = '';
    isListeningRef.current = true;
    const recognition = new SpeechRecognition();
    recognition.lang = getRecognitionLang();
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    recognition.onstart = () => {
      setOrbState(STATES.LISTENING);
      startAmplitudeTracking();
    };

    recognition.onresult = (e) => {
      let final = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
      }
      if (final) transcriptRef.current = final.trim();
    };

    recognition.onend = () => {
      stopAmplitudeTracking();
      isListeningRef.current = false;
      const finalText = transcriptRef.current.trim();
      if (finalText) {
        // Flash heard animation
        setJustHeard(true);
        setTimeout(() => setJustHeard(false), 1200);
        setOrbState(STATES.THINKING);
        setTimeout(() => {
          onTranscript(finalText);
          transcriptRef.current = '';
          setTimeout(() => setOrbState(STATES.IDLE), 500);
        }, 300);
      } else {
        setOrbState(STATES.IDLE);
      }
    };

    recognition.onerror = (e) => {
      if (e.error === 'no-speech' && isListeningRef.current) {
        try { recognition.start(); } catch (_) {}
        return;
      }
      stopAmplitudeTracking();
      isListeningRef.current = false;
      transcriptRef.current = '';
      setOrbState(STATES.IDLE);
    };

    recognition.start();
  };

  const toggleVoice = (e) => {
    e.stopPropagation();
    if (!voiceEnabled) {
      setVoiceEnabled(true);
    } else {
      synthRef.current?.cancel();
      setVoiceEnabled(false);
      if (orbState === STATES.SPEAKING) setOrbState(STATES.IDLE);
    }
  };

  // Scale orb with amplitude
  const scale = orbState === STATES.LISTENING
    ? 1 + (amplitude / 255) * 0.35
    : 1;

  const label =
    orbState === STATES.IDLE ? 'Tap to speak' :
    orbState === STATES.LISTENING ? 'Tap to send' :
    orbState === STATES.THINKING ? 'Thinking...' :
    'Tap to stop';

  return (
    <div className="orb-container">
      <button
        className={`orb orb--${orbState} ${justHeard ? 'orb--heard' : ''}`}
        onClick={handleOrbClick}
        style={{ '--orb-scale': scale }}
        aria-label={label}
        title={label}
      >
        <div className="orb-rays"><SunRays /></div>
        <span className="orb-ring orb-ring--1" />
        <span className="orb-ring orb-ring--2" />
        <span className="orb-ring orb-ring--3" />
        <span className="orb-core" />
      </button>

      {/* Real-time sound bars — only show when listening */}
      {orbState === STATES.LISTENING && (
        <SoundBars amplitude={amplitude} />
      )}

      <p className="orb-label">{label}</p>

      {/* Voice on/off toggle */}
      <button
        className={`orb-voice-toggle ${voiceEnabled ? 'orb-voice-toggle--on' : 'orb-voice-toggle--off'}`}
        onClick={toggleVoice}
        title={voiceEnabled ? 'Turn off voice' : 'Turn on voice'}
      >
        {voiceEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  );
}

export default MeliusOrb;