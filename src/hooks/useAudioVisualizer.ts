import { useState, useEffect, useRef, useCallback } from 'react';
import { voiceService } from '../services/voiceService';
import { voiceFingerprintService } from '../services/voiceFingerprintService';
import { emotionEngine } from '../services/emotionEngine';

export function useAudioVisualizer(isActive: boolean, isListening: boolean, isSpeaking: boolean) {
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [frequencyData, setFrequencyData] = useState<Uint8Array>(new Uint8Array(32));
  const [coherenceScore, setCoherenceScore] = useState<number>(98.5);
  const [baselineCoherence, setBaselineCoherence] = useState<number>(97.5);
  const [coherenceDropDetected, setCoherenceDropDetected] = useState<boolean>(false);
  const isSimulatedDropRef = useRef<boolean>(false);
  const hasPushedAlertRef = useRef<boolean>(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Send Push Notification alert via system endpoint
  const sendCoherencePushAlert = useCallback(async (current: number, baseline: number) => {
    if (hasPushedAlertRef.current) return;
    hasPushedAlertRef.current = true;

    try {
      console.log(`[N+1 Voice Studio] Triggering coherence drop push notification (${current}% vs Baseline ${baseline}%)...`);
      await fetch('/api/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'N+1 Voice Studio Diagnostic Alert',
          body: `Sudden voice coherence drop detected! Current: ${current.toFixed(1)}% vs Baseline: ${baseline.toFixed(1)}%. Auto-recalibration initialized.`,
          url: '/?tab=voice'
        })
      });
    } catch (err) {
      console.warn('[N+1 Voice Studio] Failed to send push notification:', err);
    }
  }, []);

  const triggerSimulatedCoherenceDrop = useCallback(() => {
    isSimulatedDropRef.current = true;
    hasPushedAlertRef.current = false;
    setCoherenceScore(42.8);
    setCoherenceDropDetected(true);
    sendCoherencePushAlert(42.8, baselineCoherence);
  }, [baselineCoherence, sendCoherencePushAlert]);

  const recalibrateBaseline = useCallback(() => {
    isSimulatedDropRef.current = false;
    hasPushedAlertRef.current = false;
    setCoherenceDropDetected(false);
    setCoherenceScore(98.2);
    setBaselineCoherence(97.8);
  }, []);

  useEffect(() => {
    if (!isActive) return;

    let mounted = true;

    const computeCoherenceAndCheck = (dataArray: Uint8Array, normLevel: number) => {
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        sum += dataArray[i];
      }
      const avg = sum / (dataArray.length || 1);
      
      let varSum = 0;
      for (let i = 0; i < dataArray.length; i++) {
        const diff = dataArray[i] - avg;
        varSum += diff * diff;
      }
      const variance = varSum / (dataArray.length || 1);

      let calcScore = 98.5;
      if (avg > 5) {
        const noiseRatio = variance / (avg * avg + 1);
        calcScore = Math.max(30, Math.min(100, 100 - noiseRatio * 35));
      }

      if (isSimulatedDropRef.current) {
        calcScore = 42.8;
      }

      const currentScore = Math.round(calcScore * 10) / 10;
      setCoherenceScore(currentScore);

      // Detect sudden drop (> 20% below established baseline)
      if (currentScore < baselineCoherence - 20) {
        setCoherenceDropDetected(true);
        sendCoherencePushAlert(currentScore, baselineCoherence);
      }
    };

    const startMic = async () => {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({} as any);
        }
        
        if (audioContextRef.current.state === 'suspended') {
          await audioContextRef.current.resume();
        }

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!mounted) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }

        streamRef.current = stream;
        const ctx = audioContextRef.current;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 64; // 32 bins
        analyser.smoothingTimeConstant = 0.8;
        
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        
        analyserRef.current = analyser;
        sourceRef.current = source;

        const updateData = () => {
          if (!mounted) return;
          if (analyserRef.current) {
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);
            
            // Calculate average level
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              sum += dataArray[i];
            }
            const average = sum / dataArray.length;
            const normalizedLevel = average / 255;
            
            setAudioLevel(normalizedLevel);
            setFrequencyData(new Uint8Array(dataArray));
            computeCoherenceAndCheck(dataArray, normalizedLevel);
            
            if (isListening) {
               voiceFingerprintService.analyzeVoiceSample(normalizedLevel, emotionEngine.getCurrentState(), false);
            }
          }
          requestRef.current = requestAnimationFrame(updateData);
        };
        
        updateData();

      } catch (err) {
        console.error("Microphone access for visualizer failed:", err);
      }
    };

    if (isListening) {
      startMic();
    } else if (isSpeaking) {
      let tick = 0;
      const simulateSpeech = () => {
        if (!mounted) return;
        tick += 0.1;
        
        const dataArray = new Uint8Array(32);
        let sum = 0;
        for (let i = 0; i < 32; i++) {
            const val = Math.max(0, Math.sin(tick + i) * 150 + Math.random() * 100);
            dataArray[i] = val;
            sum += val;
        }
        const normalizedLevel = (sum / 32) / 255;
        setFrequencyData(dataArray);
        setAudioLevel(normalizedLevel);
        computeCoherenceAndCheck(dataArray, normalizedLevel);
        
        voiceFingerprintService.analyzeVoiceSample(normalizedLevel, emotionEngine.getCurrentState(), true);
        
        requestRef.current = requestAnimationFrame(simulateSpeech);
      };
      simulateSpeech();
    } else {
      setAudioLevel(0);
      setFrequencyData(new Uint8Array(32));
      if (!isSimulatedDropRef.current) {
        setCoherenceScore(98.5);
      }
    }

    return () => {
      mounted = false;
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (sourceRef.current) {
        sourceRef.current.disconnect();
        sourceRef.current = null;
      }
    };
  }, [isActive, isListening, isSpeaking, baselineCoherence, sendCoherencePushAlert]);

  return {
    audioLevel,
    frequencyData,
    coherenceScore,
    baselineCoherence,
    coherenceDropDetected,
    triggerSimulatedCoherenceDrop,
    recalibrateBaseline
  };
}

