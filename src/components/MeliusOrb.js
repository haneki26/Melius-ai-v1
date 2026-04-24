import React, { useState, useRef, useEffect } from 'react';

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
};

// Flame-style sun rays like reference image — curved organic rays
const SunRays = () => (
  <svg viewBox="-80 -80 160 160" xmlns="http://www.w3.org/2000/svg">
    {/* 16 curved flame rays alternating long and short */}
    {/* Long rays */}
    <path d="M 0,-32 C 4,-48 6,-65 0,-72 C -6,-65 -4,-48 0,-32" fill="#C9A84C"/>
    <path d="M 0,32 C -4,48 -6,65 0,72 C 6,65 4,48 0,32" fill="#C9A84C"/>
    <path d="M -32,0 C -48,-4 -65,-6 -72,0 C -65,6 -48,4 -32,0" fill="#C9A84C"/>
    <path d="M 32,0 C 48,4 65,6 72,0 C 65,-6 48,-4 32,0" fill="#C9A84C"/>
    <path d="M -22,-22 C -33,-36 -44,-50 -51,-51 C -50,-44 -36,-33 -22,-22" fill="#C9A84C"/>
    <path d="M 22,-22 C 36,-33 50,-44 51,-51 C 44,-50 33,-36 22,-22" fill="#C9A84C"/>
    <path d="M -22,22 C -33,36 -44,50 -51,51 C -50,44 -36,33 -22,22" fill="#C9A84C"/>
    <path d="M 22,22 C 36,33 50,44 51,51 C 44,50 33,36 22,22" fill="#C9A84C"/>
    {/* Short rays between */}
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

function MeliusOrb({ onTranscript, lastReply }) {
  const [orbState, setOrbState] = useState(STATES.IDLE);
  const [amplitude, setAmplitude] = useState(0);
  const [displayTranscript, setDisplayTranscript] = useState('');

  const synthRef = useRef(window.speechSynthesis);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const recognitionRef = useRef(null);
  const transcriptRef = useRef('');

  // Define stopEverything BEFORE the useEffect that uses it
  const stopAmplitudeTracking = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setAmplitude(0);
  };

  const stopEverything = () => {
    synthRef.current?.cancel();
    recognitionRef.current?.abort();
    stopAmplitudeTracking();
  };

  useEffect(() => {
    if (lastReply) speakText(lastReply);
  }, [lastReply]); // eslint-disable-line react-hooks/exhaustive-deps

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => stopEverything();
  }, []);

  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    synthRef.current.cancel();
    const clean = text.replace(/[\u{1F000}-\u{1FFFF}]/gu, '').trim();
    if (!clean) return;

    const utterance = new SpeechSynthesisUtterance(clean);
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
    if (speechSynthesis.onvoiceschanged !== undefined) {
      speechSynthesis.onvoiceschanged = setVoice;
    }
    utterance.rate = 0.9;
    utterance.pitch = 0.95;
    utterance.volume = 1;
    utterance.onstart = () => setOrbState(STATES.SPEAKING);
    utterance.onend = () => { setOrbState(STATES.IDLE); setAmplitude(0); };
    utterance.onerror = () => setOrbState(STATES.IDLE);
    synthRef.current.speak(utterance);
  };

  const startAmplitudeTracking = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      micStreamRef.current = stream;
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const avg = data.reduce((a, b) => a + b, 0) / data.length;
        setAmplitude(avg);
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
    if (!SpeechRecognition) {
      alert('Voice input requires Chrome browser.');
      return;
    }
    transcriptRef.current = '';
    setDisplayTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;

    let silenceTimer = null;
    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => recognition.stop(), 2500);
    };

    recognition.onstart = () => {
      setOrbState(STATES.LISTENING);
      startAmplitudeTracking();
      silenceTimer = setTimeout(() => recognition.stop(), 5000);
    };

    recognition.onresult = (e) => {
      resetSilenceTimer();
      let final = '';
      let interim = '';
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      if (final) transcriptRef.current = final.trim();
      setDisplayTranscript((transcriptRef.current + ' ' + interim).trim());
    };

    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      stopAmplitudeTracking();
      setDisplayTranscript('');
      const finalText = transcriptRef.current.trim();
      if (finalText) {
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

    recognition.onerror = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      stopAmplitudeTracking();
      setDisplayTranscript('');
      transcriptRef.current = '';
      setOrbState(STATES.IDLE);
    };

    recognition.start();
  };

  const scale = orbState === STATES.LISTENING
    ? 1 + (amplitude / 255) * 0.5
    : 1;

  const label =
    orbState === STATES.IDLE ? 'Tap to speak' :
    orbState === STATES.LISTENING ? 'Listening — speak slowly' :
    orbState === STATES.THINKING ? 'Processing...' :
    'Speaking — tap to stop';

  return (
    <div className="orb-container">
      {displayTranscript && orbState === STATES.LISTENING && (
        <div className="orb-transcript fade-in">{displayTranscript}</div>
      )}

      <button
        className={`orb orb--${orbState}`}
        onClick={handleOrbClick}
        style={{ '--orb-scale': scale }}
        aria-label={label}
        title={label}
      >
        <div className="orb-rays">
          <SunRays />
        </div>
        <span className="orb-ring orb-ring--1" />
        <span className="orb-ring orb-ring--2" />
        <span className="orb-ring orb-ring--3" />
        <span className="orb-core" />
      </button>

      <p className="orb-label">{label}</p>
    </div>
  );
}

export default MeliusOrb;