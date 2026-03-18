import { useState, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export function useLiveAPI() {
  const [isLive, setIsLive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<{role: string, text: string}[]>([]);

  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  
  // Audio playback state
  const playbackQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const nextPlayTimeRef = useRef(0);

  const startLive = useCallback(async () => {
    try {
      setIsConnecting(true);
      setError(null);
      setTranscript([]);

      // 1. Setup Audio Context
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      audioContextRef.current = audioContext;

      // 2. Setup Microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      const source = audioContext.createMediaStreamSource(stream);
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorRef.current = processor;
      
      source.connect(processor);
      processor.connect(audioContext.destination);

      // 3. Connect to Gemini Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
          },
          systemInstruction: "Eres un asistente virtual experto en autopartes para el sistema MondayOS. Responde de manera concisa y amigable.",
        },
        callbacks: {
          onopen: () => {
            setIsLive(true);
            setIsConnecting(false);
            
            // Start sending audio
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32 to Int16 PCM
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
              }
              
              // Convert to base64
              const buffer = new Uint8Array(pcmData.buffer);
              let binary = '';
              for (let i = 0; i < buffer.byteLength; i++) {
                binary += String.fromCharCode(buffer[i]);
              }
              const base64Data = btoa(binary);

              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle interruption
            if (message.serverContent?.interrupted) {
              playbackQueueRef.current = [];
              isPlayingRef.current = false;
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
            }

            // Handle audio output
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              // Decode base64 PCM (24kHz, 16-bit, mono)
              const binaryString = atob(base64Audio);
              const bytes = new Uint8Array(binaryString.length);
              for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
              }
              const pcmData = new Int16Array(bytes.buffer);
              const floatData = new Float32Array(pcmData.length);
              for (let i = 0; i < pcmData.length; i++) {
                floatData[i] = pcmData[i] / 0x7FFF;
              }
              
              playbackQueueRef.current.push(floatData);
              playNextAudioChunk();
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Error en la conexión en vivo.");
            stopLive();
          },
          onclose: () => {
            stopLive();
          }
        }
      });

      sessionRef.current = sessionPromise;

    } catch (err) {
      console.error("Failed to start live session:", err);
      setError("No se pudo iniciar la sesión en vivo.");
      setIsConnecting(false);
      stopLive();
    }
  }, []);

  const playNextAudioChunk = () => {
    if (!audioContextRef.current || playbackQueueRef.current.length === 0) return;

    const audioContext = audioContextRef.current;
    
    // Ensure we don't schedule in the past
    if (nextPlayTimeRef.current < audioContext.currentTime) {
      nextPlayTimeRef.current = audioContext.currentTime + 0.05;
    }

    const floatData = playbackQueueRef.current.shift()!;
    
    // The output from Gemini is 24kHz PCM
    const audioBuffer = audioContext.createBuffer(1, floatData.length, 24000);
    audioBuffer.getChannelData(0).set(floatData);

    const source = audioContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContext.destination);
    source.start(nextPlayTimeRef.current);

    nextPlayTimeRef.current += audioBuffer.duration;

    source.onended = () => {
      if (playbackQueueRef.current.length > 0) {
        playNextAudioChunk();
      }
    };
  };

  const stopLive = useCallback(() => {
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current.onaudioprocess = null;
      processorRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (sessionRef.current) {
      sessionRef.current.then((session: any) => session.close());
      sessionRef.current = null;
    }
    
    playbackQueueRef.current = [];
    isPlayingRef.current = false;
    nextPlayTimeRef.current = 0;

    setIsLive(false);
    setIsConnecting(false);
  }, []);

  return {
    isLive,
    isConnecting,
    error,
    startLive,
    stopLive,
    transcript
  };
}
