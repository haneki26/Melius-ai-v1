import React, { useState, useRef, useEffect } from 'react';

const STATES = {
  IDLE: 'idle',
  LISTENING: 'listening',
  THINKING: 'thinking',
  SPEAKING: 'speaking',
};

function MeliusOrb({ onTranscript, lastReply }) {
  const [orbState, setOrbState] = useState(STATES.IDLE);
  const [amplitude, setAmplitude] = useState(0);
  const [displayTranscript, setDisplayTranscript] = useState('');

  const synthRef = useRef(window.speechSynthesis);
  const animFrameRef = useRef(null);
  const micStreamRef = useRef(null);
  const recognitionRef = useRef(null);

  // Use a ref to accumulate transcript — avoids stale closure bug
  const transcriptRef = useRef('');

  // Speak when lastReply changes
  useEffect(() => {
    if (lastReply) speakText(lastReply);
  }, [lastReply]);

  // Cleanup
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    return () => stopEverything();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
        (v.lang === 'en-GB')
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

    utterance.onstart = () => {
      setOrbState(STATES.SPEAKING);
    };
    utterance.onend = () => {
      setOrbState(STATES.IDLE);
      setAmplitude(0);
    };
    utterance.onerror = () => {
      setOrbState(STATES.IDLE);
    };

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
    } catch (e) {
      // mic not available — still works
    }
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
    // Stop speaking if tapped while speaking
    if (orbState === STATES.SPEAKING) {
      synthRef.current.cancel();
      setOrbState(STATES.IDLE);
      return;
    }

    // Don't interrupt thinking
    if (orbState === STATES.THINKING) return;

    // Stop listening if tapped again
    if (orbState === STATES.LISTENING) {
      recognitionRef.current?.stop();
      return;
    }

    // Start listening
    startListening();
  };

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice input requires Chrome browser.');
      return;
    }

    // Reset transcript ref
    transcriptRef.current = '';
    setDisplayTranscript('');

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    // KEY FIX 1: Give user much more time to speak
    // continuous = true keeps it open, we manually stop on silence
    recognition.continuous = true;

    recognitionRef.current = recognition;

    // Silence timer — stop after 2.5s of no speech (was instant before)
    let silenceTimer = null;

    const resetSilenceTimer = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      silenceTimer = setTimeout(() => {
        recognition.stop();
      }, 2500); // 2.5 seconds of silence before stopping
    };

    recognition.onstart = () => {
      setOrbState(STATES.LISTENING);
      startAmplitudeTracking();
      // Start initial timer — if user doesn't speak for 5s, stop
      silenceTimer = setTimeout(() => recognition.stop(), 5000);
    };

    recognition.onresult = (e) => {
      // Reset silence timer every time we get speech
      resetSilenceTimer();

      // Accumulate transcript in ref (avoids stale closure)
      let interim = '';
      let final = '';

      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      // Store final parts in ref immediately
      if (final) transcriptRef.current = final.trim();

      // Show interim for display
      const display = (transcriptRef.current + ' ' + interim).trim();
      setDisplayTranscript(display);
    };

    // KEY FIX 2: Use the ref value, not state — no stale closure
    recognition.onend = () => {
      if (silenceTimer) clearTimeout(silenceTimer);
      stopAmplitudeTracking();
      setDisplayTranscript('');

      const finalText = transcriptRef.current.trim();

      if (finalText) {
        setOrbState(STATES.THINKING);
        // Small delay so thinking state is visible
        setTimeout(() => {
          onTranscript(finalText);
          transcriptRef.current = '';
          // Reset to idle after sending — the chat reply will trigger speaking
          setTimeout(() => setOrbState(STATES.IDLE), 500);
        }, 300);
      } else {
        setOrbState(STATES.IDLE);
      }
    };

    recognition.onerror = (e) => {
      if (silenceTimer) clearTimeout(silenceTimer);
      stopAmplitudeTracking();
      setDisplayTranscript('');
      transcriptRef.current = '';

      if (e.error !== 'no-speech') {
        console.warn('Speech error:', e.error);
      }
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
        <div className="orb-transcript fade-in">
          {displayTranscript}
        </div>
      )}

      <button
        className={`orb orb--${orbState}`}
        onClick={handleOrbClick}
        style={{ '--orb-scale': scale }}
        aria-label={label}
        title={label}
      >
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