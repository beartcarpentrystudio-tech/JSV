import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bot, 
  Users, 
  MessageSquare, 
  Activity, 
  ShieldCheck, 
  Plus, 
  Send, 
  Settings2, 
  ChevronRight, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Terminal,
  Cpu,
  Zap,
  Layout,
  Mic,
  MicOff,
  Volume2,
  Search,
  BrainCircuit,
  Globe,
  ExternalLink
} from 'lucide-react';
import { useFirebase } from '../context/FirebaseContext';
import { 
  getAgentProfiles, 
  createAgentProfile, 
  createTask, 
  runAgentWorkflow,
  AIAgent,
  AgentTask,
  AgentInteraction
} from '../services/agentService';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { toast } from 'sonner';
import { transcribeAudio, generateSpeech } from '../services/geminiService';

import { Screen } from '../types/ui';

export function AgentWorkspace({ onNavigate }: { onNavigate: (screen: Screen) => void }) {
  const { user, isAdmin } = useFirebase();
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [tasks, setTasks] = useState<AgentTask[]>([]);
  const [interactions, setInteractions] = useState<AgentInteraction[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [useThinking, setUseThinking] = useState(false);
  const [useSearch, setUseSearch] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    // Load agents
    const unsubAgents = onSnapshot(collection(db, 'ai_agent_profiles'), (snap) => {
      setAgents(snap.docs.map(doc => doc.data() as AIAgent));
    });

    // Load active tasks
    const unsubTasks = onSnapshot(
      query(collection(db, 'agent_tasks'), orderBy('updatedAt', 'desc')),
      (snap) => {
        setTasks(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentTask)));
      }
    );

    return () => {
      unsubAgents();
      unsubTasks();
    };
  }, []);

  useEffect(() => {
    if (activeTaskId) {
      const unsubInteractions = onSnapshot(
        query(
          collection(db, 'agent_interactions'),
          where('taskId', '==', activeTaskId),
          orderBy('timestamp', 'asc')
        ),
        (snap) => {
          setInteractions(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AgentInteraction)));
        }
      );
      return () => unsubInteractions();
    } else {
      setInteractions([]);
    }
  }, [activeTaskId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [interactions]);

  const handleSendMessage = async (textOverride?: string) => {
    const message = textOverride || inputMessage;
    if (!message.trim() || selectedAgents.length === 0) {
      toast.error('Selecciona al menos un agente y escribe un mensaje');
      return;
    }

    setIsProcessing(true);
    try {
      let taskId = activeTaskId;
      if (!taskId) {
        taskId = await createTask({
          title: message.slice(0, 30) + '...',
          description: message,
          assignedAgentIds: selectedAgents,
          status: 'pending',
          progress: 0,
          checkpoints: [],
          logs: []
        });
        setActiveTaskId(taskId);
      }

      const selectedAgentProfiles = agents.filter(a => selectedAgents.includes(a.id));
      await runAgentWorkflow(taskId!, selectedAgentProfiles, message, {
        useThinking,
        useSearch
      });
      setInputMessage('');
    } catch (error) {
      toast.error('Error al procesar la solicitud');
    } finally {
      setIsProcessing(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          toast.info('Transcribiendo audio...');
          const transcription = await transcribeAudio(base64Audio, 'audio/webm');
          if (transcription) {
            setInputMessage(transcription);
            toast.success('Audio transcrito');
          } else {
            toast.error('No se pudo transcribir el audio');
          }
        };
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      toast.error('Error al acceder al micrófono');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handlePlayTTS = async (text: string, id: string) => {
    setPlayingId(id);
    try {
      const base64Audio = await generateSpeech(text);
      if (base64Audio) {
        const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
        audio.onended = () => setPlayingId(null);
        audio.play();
      }
    } catch (error) {
      toast.error('Error al generar voz');
      setPlayingId(null);
    }
  };

  const toggleAgent = (id: string) => {
    setSelectedAgents(prev => 
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    );
  };

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4 p-4 overflow-hidden">
      {/* Left Sidebar: Agents */}
      <div className="w-64 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 flex flex-col gap-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Agentes Disponibles</h3>
          {isAdmin && (
            <button 
              onClick={() => setIsConfigOpen(true)}
              className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Plus size={14} className="text-jsv-orange" />
            </button>
          )}
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
          {agents.map(agent => (
            <button
              key={agent.id}
              onClick={() => toggleAgent(agent.id)}
              className={`w-full p-3 rounded-2xl border transition-all flex items-center gap-3 group ${
                selectedAgents.includes(agent.id) 
                  ? 'bg-jsv-orange/10 border-jsv-orange/30' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${agent.color}`}>
                <Bot size={20} />
              </div>
              <div className="text-left overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{agent.name}</div>
                <div className="text-[8px] text-gray-500 uppercase tracking-tighter truncate">{agent.role}</div>
              </div>
              {selectedAgents.includes(agent.id) && (
                <div className="ml-auto w-2 h-2 bg-jsv-orange rounded-full animate-pulse" />
              )}
            </button>
          ))}
        </div>

        <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={14} className="text-emerald-400" />
            <span className="text-[8px] font-bold text-white uppercase tracking-widest">Estado del Sistema</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-gray-500">Agentes Activos</span>
            <span className="text-[10px] text-emerald-400 font-bold">{agents.length}</span>
          </div>
        </div>
      </div>

      {/* Center: Chat Room */}
      <div className="flex-1 flex flex-col bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl overflow-hidden relative">
        {/* Chat Header */}
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {agents.filter(a => selectedAgents.includes(a.id)).map(agent => (
                <div key={agent.id} className={`w-8 h-8 rounded-full border-2 border-black flex items-center justify-center text-white text-[10px] font-bold ${agent.color}`}>
                  {agent.name[0]}
                </div>
              ))}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {selectedAgents.length > 0 ? 'Espacio de Trabajo Colaborativo' : 'Selecciona Agentes para Comenzar'}
              </h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest">
                {selectedAgents.length} Agentes en línea
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setUseSearch(!useSearch)}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 border ${
                useSearch ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-white/5 border-white/5 text-gray-500'
              }`}
              title="Búsqueda en Google"
            >
              <Globe size={16} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Search</span>
            </button>
            <button 
              onClick={() => setUseThinking(!useThinking)}
              className={`p-2 rounded-xl transition-all flex items-center gap-2 border ${
                useThinking ? 'bg-purple-500/10 border-purple-500/30 text-purple-400' : 'bg-white/5 border-white/5 text-gray-500'
              }`}
              title="Modo Pensamiento Profundo"
            >
              <BrainCircuit size={16} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Thinking</span>
            </button>
            <button 
              onClick={() => onNavigate('live-voice')}
              className="p-2 bg-jsv-orange/10 border border-jsv-orange/30 text-jsv-orange rounded-xl hover:bg-jsv-orange/20 transition-all flex items-center gap-2"
              title="Iniciar Sesión de Voz en Vivo"
            >
              <Mic size={16} />
              <span className="text-[8px] font-bold uppercase tracking-widest">Live</span>
            </button>
            <button className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-gray-400">
              <Layout size={16} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
          {interactions.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-20">
              <Users size={64} className="mb-4 text-gray-500" />
              <p className="text-sm font-light text-white">Inicia una conversación con tu equipo de IA</p>
              <p className="text-[10px] uppercase tracking-widest mt-2">Auditado y Respaldado en tiempo real</p>
            </div>
          ) : (
            interactions.map((msg, idx) => {
              const agent = agents.find(a => a.id === msg.senderId);
              const isUser = msg.senderType === 'user';
              const isSystem = msg.senderType === 'system';

              if (isSystem) {
                return (
                  <div key={msg.id} className="flex justify-center">
                    <div className="bg-white/5 border border-white/10 px-4 py-1 rounded-full flex items-center gap-2">
                      <Cpu size={10} className="text-jsv-orange animate-pulse" />
                      <span className="text-[9px] text-gray-400 uppercase tracking-widest font-medium">{msg.content}</span>
                    </div>
                  </div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-4 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xl ${isUser ? 'bg-jsv-orange' : (agent?.color || 'bg-gray-800')}`}>
                    {isUser ? <Users size={20} /> : <Bot size={20} />}
                  </div>
                  <div className={`max-w-[80%] space-y-1 ${isUser ? 'items-end' : ''}`}>
                    <div className={`flex items-center gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
                      <span className="text-[10px] font-bold text-white uppercase tracking-tight">
                        {isUser ? 'Tú (Director)' : agent?.name}
                      </span>
                      <span className="text-[8px] text-gray-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-4 rounded-3xl text-sm leading-relaxed ${
                      isUser 
                        ? 'bg-jsv-orange text-black rounded-tr-none' 
                        : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                    }`}>
                      {msg.content}
                      
                      {msg.metadata?.groundingMetadata?.searchEntryPoint && (
                        <div className="mt-3 pt-3 border-t border-white/5">
                          <div className="flex items-center gap-2 mb-2">
                            <Search size={10} className="text-emerald-400" />
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Fuentes de Google Search</span>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {msg.metadata.groundingMetadata.groundingChunks?.map((chunk: any, i: number) => (
                              chunk.web && (
                                <a 
                                  key={i}
                                  href={chunk.web.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-2 py-1 bg-white/5 hover:bg-white/10 border border-white/5 rounded-lg text-[9px] text-emerald-400 transition-colors"
                                >
                                  <ExternalLink size={8} />
                                  {chunk.web.title}
                                </a>
                              )
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    {!isUser && (
                      <div className="flex gap-3 mt-2 items-center">
                        <button 
                          onClick={() => handlePlayTTS(msg.content, msg.id)}
                          disabled={playingId === msg.id}
                          className={`flex items-center gap-1.5 text-[8px] font-bold uppercase tracking-widest transition-colors ${
                            playingId === msg.id ? 'text-jsv-orange' : 'text-gray-500 hover:text-white'
                          }`}
                        >
                          <Volume2 size={12} className={playingId === msg.id ? 'animate-pulse' : ''} />
                          {playingId === msg.id ? 'Reproduciendo...' : 'Escuchar'}
                        </button>
                        <button className="text-[8px] font-bold text-jsv-orange uppercase tracking-widest hover:underline">Aceptar Ruta</button>
                        <button className="text-[8px] font-bold text-gray-500 uppercase tracking-widest hover:underline">Solicitar Cambio</button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-white/5 border-t border-white/5">
          <div className="relative">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())}
              placeholder="Asigna una tarea al equipo..."
              className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pr-32 text-sm text-white focus:border-jsv-orange outline-none transition-all resize-none h-24 no-scrollbar"
            />
            <div className="absolute bottom-4 right-4 flex gap-2">
              <button
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                className={`p-3 rounded-xl transition-all ${
                  isRecording 
                    ? 'bg-rose-500 text-white animate-pulse scale-110' 
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                title="Mantén presionado para hablar"
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              <button
                onClick={() => handleSendMessage()}
                disabled={isProcessing || !inputMessage.trim()}
                className="p-3 bg-jsv-orange text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isProcessing ? <Zap size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between mt-2 px-2">
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">Auditado</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={12} className="text-blue-400" />
                <span className="text-[8px] text-gray-500 uppercase tracking-widest">Backup Cloud</span>
              </div>
            </div>
            <div className="text-[8px] text-gray-600 uppercase tracking-tighter">
              MondayOS Agent Orchestrator v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Right Sidebar: Task Monitor */}
      <div className="w-72 bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl p-4 flex flex-col gap-4">
        <h3 className="text-[10px] font-bold text-gray-500 tracking-widest uppercase px-2">Monitor de Tareas</h3>
        
        <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar">
          {tasks.map(task => (
            <button
              key={task.id}
              onClick={() => setActiveTaskId(task.id)}
              className={`w-full p-4 rounded-2xl border transition-all text-left space-y-3 ${
                activeTaskId === task.id 
                  ? 'bg-white/10 border-white/20' 
                  : 'bg-white/5 border-white/5 hover:bg-white/10'
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold text-white truncate w-40">{task.title}</div>
                {task.status === 'in_progress' ? (
                  <Zap size={12} className="text-jsv-orange animate-pulse" />
                ) : task.status === 'completed' ? (
                  <CheckCircle2 size={12} className="text-emerald-400" />
                ) : (
                  <Clock size={12} className="text-gray-500" />
                )}
              </div>
              
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] uppercase tracking-widest font-bold">
                  <span className="text-gray-500">Progreso</span>
                  <span className="text-white">{task.progress}%</span>
                </div>
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${task.progress}%` }}
                    className="h-full bg-jsv-orange"
                  />
                </div>
              </div>

              <div className="flex -space-x-1">
                {task.assignedAgentIds.map(id => {
                  const agent = agents.find(a => a.id === id);
                  return (
                    <div key={id} className={`w-5 h-5 rounded-full border border-black flex items-center justify-center text-[6px] text-white font-bold ${agent?.color || 'bg-gray-800'}`}>
                      {agent?.name[0]}
                    </div>
                  );
                })}
              </div>
            </button>
          ))}
        </div>

        <div className="p-4 bg-jsv-orange/5 border border-jsv-orange/20 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={14} className="text-jsv-orange" />
            <span className="text-[8px] font-bold text-white uppercase tracking-widest">Puntos de Control</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-relaxed">
            No hay decisiones pendientes del usuario en este momento.
          </p>
        </div>
      </div>

      {/* Agent Config Modal */}
      <AnimatePresence>
        {isConfigOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsConfigOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[32px] p-8 shadow-2xl"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Configurar Nuevo Agente</h2>
              <AgentConfigForm onComplete={() => setIsConfigOpen(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AgentConfigForm({ onComplete }: { onComplete: () => void }) {
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    specialty: '',
    systemInstruction: '',
    model: 'gemini-3.1-pro-preview',
    color: 'bg-blue-500'
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = `agent-${Date.now()}`;
    await createAgentProfile({
      ...formData,
      id,
      avatar: '',
      status: 'idle'
    });
    toast.success('Agente creado correctamente');
    onComplete();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest">Nombre del Agente</label>
          <input 
            required
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-jsv-orange"
            placeholder="Ej: Jarvis"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest">Rol / Título</label>
          <input 
            required
            value={formData.role}
            onChange={e => setFormData({...formData, role: e.target.value})}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-jsv-orange"
            placeholder="Ej: Analista de Datos"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] text-gray-500 uppercase tracking-widest">Instrucción del Sistema (Core Prompt)</label>
        <textarea 
          required
          value={formData.systemInstruction}
          onChange={e => setFormData({...formData, systemInstruction: e.target.value})}
          className="w-full h-32 bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-jsv-orange resize-none"
          placeholder="Define el comportamiento, tono y límites del agente..."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest">Color de Identidad</label>
          <div className="flex gap-2">
            {['bg-blue-500', 'bg-purple-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500'].map(c => (
              <button
                key={c}
                type="button"
                onClick={() => setFormData({...formData, color: c})}
                className={`w-8 h-8 rounded-full ${c} ${formData.color === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900' : ''}`}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest">Modelo Base</label>
          <select 
            value={formData.model}
            onChange={e => setFormData({...formData, model: e.target.value})}
            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white outline-none"
          >
            <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
            <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash</option>
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button 
          type="button"
          onClick={onComplete}
          className="flex-1 bg-white/5 hover:bg-white/10 text-white py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase border border-white/10"
        >
          Cancelar
        </button>
        <button 
          type="submit"
          className="flex-1 bg-jsv-orange text-black py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase shadow-xl hover:scale-[1.02] transition-all"
        >
          Crear Agente
        </button>
      </div>
    </form>
  );
}
