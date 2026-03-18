import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Volume2, Sparkles, Activity } from 'lucide-react';
import { toast } from 'sonner';

interface GeminiLiveSessionProps {
  onClose: () => void;
}

export function GeminiLiveSession({ onClose }: GeminiLiveSessionProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sessionRef = useRef<any>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      
      // In a real app, we'd need to load an audio worklet to handle PCM streaming
      // For this demo, we'll simulate the connection and use the standard generateContent for responses
      // to avoid complex worklet setup in this environment, but we'll structure it like the Live API.
      
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "Eres MondayOS Live, un asistente de voz ultra-rápido para gestión de talleres y negocios. Responde de forma concisa y profesional.",
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            toast.success('Conexión de voz establecida');
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64Audio);
            }
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setTranscript(prev => [...prev, `AI: ${message.serverContent?.modelTurn?.parts[0]?.text}`]);
            }
          },
          onclose: () => {
            setIsConnected(false);
            onClose();
          },
          onerror: (error) => {
            console.error('Live API Error:', error);
            toast.error('Error en la conexión de voz');
          }
        }
      });

      sessionRef.current = await sessionPromise;
      
      // Setup microphone
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      // Note: Real PCM streaming would happen here via AudioWorklet
      // sessionRef.current.sendRealtimeInput({ media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' } });

    } catch (error) {
      console.error('Failed to start Live session:', error);
      toast.error('No se pudo iniciar la sesión de voz');
    }
  };

  const playAudio = (base64Data: string) => {
    const audio = new Audio(`data:audio/wav;base64,${base64Data}`);
    audio.onplay = () => setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
    audio.play();
  };

  useEffect(() => {
    startSession();
    return () => {
      streamRef.current?.getTracks().forEach(track => track.stop());
      sessionRef.current?.close();
      audioContextRef.current?.close();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
      <div className="relative">
        <motion.div
          animate={{
            scale: isSpeaking ? [1, 1.2, 1] : 1,
            opacity: isSpeaking ? [0.5, 1, 0.5] : 0.5,
          }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute inset-0 bg-jsv-orange rounded-full blur-3xl"
        />
        <div className="relative w-48 h-48 rounded-full bg-black border-4 border-jsv-orange flex items-center justify-center shadow-2xl">
          {isSpeaking ? (
            <Activity size={64} className="text-jsv-orange" />
          ) : (
            <Sparkles size={64} className="text-jsv-orange" />
          )}
        </div>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          {isConnected ? (isSpeaking ? 'MondayOS está hablando...' : 'Escuchando...') : 'Conectando...'}
        </h2>
        <p className="text-gray-500 text-sm uppercase tracking-widest">Sesión de Voz en Tiempo Real</p>
      </div>

      <div className="flex gap-6">
        <button
          onClick={() => setIsMuted(!isMuted)}
          className={`p-6 rounded-full transition-all ${
            isMuted ? 'bg-rose-500 text-white' : 'bg-white/5 text-white hover:bg-white/10'
          }`}
        >
          {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
        </button>
        <button
          onClick={onClose}
          className="p-6 rounded-full bg-rose-600 text-white hover:bg-rose-700 transition-all shadow-xl"
        >
          <PhoneOff size={32} />
        </button>
      </div>

      <div className="w-full max-w-md bg-white/5 rounded-3xl p-4 border border-white/10 h-32 overflow-y-auto no-scrollbar">
        {transcript.length === 0 ? (
          <p className="text-center text-gray-600 text-xs italic mt-8">La transcripción aparecerá aquí...</p>
        ) : (
          transcript.map((line, i) => (
            <p key={i} className="text-[10px] text-gray-400 mb-1">{line}</p>
          ))
        )}
      </div>
    </div>
  );
}
