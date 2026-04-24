import React, { useState, useRef, useEffect } from 'react';

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
};

// Sun rays SVG — 16 alternating long/short rays, no core
const SunRays = () => (
  <svg viewBox="-70 -70 140 140" xmlns="http://www.w3.org/2000/svg">
    {/* Long rays */}
    <polygon points="0,-65 -5,-38 5,-38" fill="#C9A84C"/>
    <polygon points="0,65 -5,38 5,38" fill="#C9A84C"/>
    <polygon points="-65,0 -38,-5 -38,5" fill="#C9A84C"/>
    <polygon points="65,0 38,-5 38,5" fill="#C9A84C"/>
    <polygon points="-46,-46 -28,-23 -23,-28" fill="#C9A84C"/>
    <polygon points="46,-46 28,-23 23,-28" fill="#C9A84C"/>
    <polygon points="-46,46 -28,23 -23,28" fill="#C9A84C"/>
    <polygon points="46,46 28,23 23,28" fill="#C9A84C"/>
    {/* Short rays */}
    <polygon points="0,-48 -3.5,-30 3.5,-30" fill="#C9A84C" opacity="0.7"/>
    <polygon points="0,48 -3.5,30 3.5,30" fill="#C9A84C" opacity="0.7"/>
    <polygon points="-48,0 -30,-3.5 -30,3.5" fill="#C9A84C" opacity="0.7"/>
    <polygon points="48,0 30,-3.5 30,3.5" fill="#C9A84C" opacity="0.7"/>
    <polygon points="-34,-34 -20,-16 -16,-20" fill="#C9A84C" opacity="0.7"/>
    <polygon points="34,-34 20,-16 16,-20" fill="#C9A84C" opacity="0.7"/>
    <polygon points="-34,34 -20,16 -16,20" fill="#C9A84C" opacity="0.7"/>
    <polygon points="34,34 20,16 16,20" fill="#C9A84C" opacity="0.7"/>
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

  useEffect(() => {
    if (lastReply) speakText(lastReply);
  }, [lastReply]);
// eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => stopEverything(); 
  }, []);

  const stopEverything = () => {
    synthRef.current?.cancel();
    recognitionRef.current?.abort();
    stopAmplitudeTracking();
  };

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

  const stopAmplitudeTracking = () => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(t => t.stop());
      micStreamRef.current = null;
    }
    setAmplitude(0);
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
        {/* Rotating sun rays */}
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