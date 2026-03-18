import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Send, MousePointer2, Bot, User, ChevronRight, Image as ImageIcon, Mic, Volume2, Square, Radio, Maximize2, Minimize2, ExternalLink, Globe, Database, Download, Settings, Activity } from 'lucide-react';
import { Vehicle, Part } from '../types';
import { useInventory } from '../hooks/useInventory';
import { Screen } from '../types/ui';
import { generateChatResponse, generateSearchResponse, generateSpeech, transcribeAudio, appTools, analyzeConversationContext } from '../services/geminiService';
import { useLiveAPI } from '../hooks/useLiveAPI';
import { useTheme } from '../context/ThemeContext';
import { addSessionMemory, getSessionMemories, downloadSessionBackup, AISession } from '../services/knowledgeService';
import { useFirebase } from '../context/FirebaseContext';
import { toast } from 'sonner';

interface AIAgentProps {
  mode: 'animated' | 'automatic' | 'text';
  setAgentMode: (mode: 'animated' | 'automatic' | 'text') => void;
  onNavigate: (screen: Screen) => void;
  currentScreen: Screen;
  setGlobalSearch: (q: string) => void;
  inventoryHook: ReturnType<typeof useInventory>;
  vehicles: Vehicle[];
  parts: Part[];
  forceOpen?: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
  image?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function AIAgent({ mode, setAgentMode, onNavigate, currentScreen, setGlobalSearch, inventoryHook, vehicles, parts, forceOpen }: AIAgentProps) {
  const { applyTheme } = useTheme();
  const { user } = useFirebase();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      role: 'agent', 
      text: 'Hola, soy tu asistente de MondayOS. ¿En qué te puedo ayudar hoy?' 
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorClick, setCursorClick] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [sessions, setSessions] = useState<AISession[]>([]);
  const [lastLearnedIndex, setLastLearnedIndex] = useState(0);
  
  useEffect(() => {
    if (user) {
      getSessionMemories().then(setSessions);
    }
  }, [user, isOpen]);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [isExpanded, setIsExpanded] = useState(false);
  const [mirrorUrl, setMirrorUrl] = useState<string | null>(null);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setIsExpanded(true);
    } else {
      setIsExpanded(false);
    }
  }, [forceOpen]);

  const { isLive, isConnecting, startLive, stopLive, error: liveError } = useLiveAPI();

  const suggestions = [
    "¿Cuál es el valor del inventario?",
    "Precio alternador Aveo",
    "Abre mis mensajes",
    "¿Tienes fascia de Versa?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const addMessage = (role: 'user' | 'agent', text: string, action?: Message['action'], image?: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role, text, action, image }]);
  };

  const handleImageFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Paste Listener for AIAgent
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!isOpen) return;
      const file = e.clipboardData?.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageFile(file);
        e.preventDefault();
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          setIsTyping(true);
          const transcribedText = await transcribeAudio(base64Audio, 'audio/webm');
          setIsTyping(false);
          if (transcribedText) {
            setQuery(transcribedText);
          } else {
            addMessage('agent', 'No pude entender el audio. ¿Podrías intentarlo de nuevo?');
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      addMessage('agent', 'No se pudo acceder al micrófono.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playTTS = async (text: string, messageId: string) => {
    if (playingAudioId === messageId) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    setPlayingAudioId(messageId);
    const base64Audio = await generateSpeech(text);
    if (base64Audio) {
      const audioUrl = `data:audio/mp3;base64,${base64Audio}`;
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
        audioRef.current.onended = () => setPlayingAudioId(null);
      } else {
        const audio = new Audio(audioUrl);
        audioRef.current = audio;
        audio.play();
        audio.onended = () => setPlayingAudioId(null);
      }
    } else {
      setPlayingAudioId(null);
    }
  };

  const handleSend = async (text: string = query) => {
    if (!text.trim() && !imageFile) return;
    
    addMessage('user', text, undefined, imagePreview || undefined);
    setQuery('');
    const currentImagePreview = imagePreview;
    setImageFile(null);
    setImagePreview(null);
    setIsTyping(true);
    
    try {
      let imagePart = undefined;
      if (currentImagePreview) {
        const base64Data = currentImagePreview.split(',')[1];
        const mimeType = currentImagePreview.match(/data:(.*?);base64/)?.[1] || 'image/jpeg';
        imagePart = { inlineData: { data: base64Data, mimeType } };
      }

      const systemInstruction = `Eres MondayOS AI, un asistente virtual proactivo y altamente inteligente para un centro de reciclaje automotriz y venta de autopartes.
      Tu objetivo es ayudar al usuario a gestionar su negocio de manera eficiente.
      
      CONTEXTO DE NAVEGACIÓN:
      - Actualmente el usuario está viendo la pantalla: ${currentScreen.toUpperCase()}. 
      - Adapta tus respuestas y sugerencias basándote en lo que el usuario tiene frente a él.
      
      CAPACIDADES:
      1. Navegar por la app: Puedes abrir pantallas como inventario, mensajes, tareas, etc.
      2. Consultar inventario: Puedes buscar piezas y vehículos específicos.
      3. Estadísticas: Puedes dar el valor total del inventario.
      4. Cotizar en MercadoLibre: Puedes buscar precios reales y actuales de autopartes en MercadoLibre usando Google Search.
      5. Búsqueda Web: Puedes buscar información técnica o de mercado en Google.
      6. Modificar Inventario: Puedes actualizar el estado (available, sold, damaged) y precio de una pieza.
      7. Cambiar Tema: Puedes cambiar el tema visual de la aplicación.
      8. Cambiar Modo de Agente: Puedes cambiar tu propio modo de interacción.
      9. Aprender y Memorizar: DEBES usar la herramienta conclude_topic_and_learn cuando termines de ayudar al usuario con un tema específico.
      
      REGLAS DE COMPORTAMIENTO:
      - Sé proactivo. Si el usuario pregunta por una pieza, búscala en el inventario.
      - Si el usuario pide cotizar una pieza en MercadoLibre o ver precios del mercado, usa la herramienta quoteMercadoLibre.
      - Si encuentras la pieza, ofrece navegar al inventario para ver detalles.
      - IMPORTANTE: Cuando hayas terminado de resolver una duda, tarea o flujo de trabajo del usuario, llama a la herramienta conclude_topic_and_learn para guardar el contexto de la conversación, aprender de ella y mejorar en el futuro.
      - Mantén un tono profesional, experto y amigable.
      - Responde siempre en español.
      
      CONTEXTO ACTUAL:
      - Pantalla Activa: ${currentScreen.toUpperCase()} (Ayuda al usuario basándote en lo que está viendo ahora mismo).
      - Vehículos en sistema: ${vehicles.map(v => `${v.model} (ID: ${v.id})`).join(', ')}
      - Piezas base: ${parts.map(p => `${p.name} (ID: ${p.id})`).join(', ')}
      - Valor total estimado: $${calculateTotalValue().toLocaleString()}
      
      BASE DE CONOCIMIENTO Y APRENDIZAJE (SESIONES ANTERIORES):
      ${sessions.length > 0 ? sessions.map(s => `
      TEMA: ${s.topicName}
      - Puntos Clave: ${s.keyPoints.join(', ')}
      - Workflows: ${s.workflows.join(', ')}
      - Conclusiones: ${s.conclusions}
      - Mejoras a aplicar: ${s.errorsAndImprovements}
      `).join('\n') : 'Sin sesiones previas.'}
      `;

      const response = await generateChatResponse(text, systemInstruction, imagePart, [{ functionDeclarations: appTools }]);
      
      // Handle Function Calls
      const functionCalls = response.candidates?.[0]?.content?.parts?.find(p => p.functionCall)?.functionCall;
      
      if (functionCalls) {
        const { name, args } = functionCalls;
        
        if (name === 'navigateToScreen') {
          const screen = args.screen as Screen;
          executeNavigation(screen, `Entendido. Navegando a ${screen}...`);
        } 
        else if (name === 'searchInventory') {
          const query = args.query as string;
          const lowerQuery = query.toLowerCase();
          
          // Local search logic
          const foundVehicle = vehicles.find(v => v.model.toLowerCase().includes(lowerQuery));
          const foundPart = parts.find(p => p.name.toLowerCase().includes(lowerQuery));
          
          if (foundVehicle || foundPart) {
            setGlobalSearch(query);
            addMessage('agent', `He buscado "${query}" en tu inventario. ¿Quieres que te lleve a la pantalla de inventario para ver los resultados?`, {
              label: 'Ir al Inventario',
              onClick: () => { setIsOpen(false); onNavigate('inventory'); }
            });
          } else {
            addMessage('agent', `No encontré resultados exactos para "${query}" en el inventario local. ¿Quieres que busque en la web?`, {
              label: 'Buscar en Google',
              onClick: () => handleSend(`Busca en internet información sobre ${query}`)
            });
          }
        }
        else if (name === 'getInventoryStats') {
          const totalValue = calculateTotalValue();
          addMessage('agent', `El valor total estimado de tu inventario es de $${totalValue.toLocaleString()}. Tienes ${vehicles.length} vehículos registrados.`, {
            label: 'Ver Dashboard',
            onClick: () => { setIsOpen(false); onNavigate('dashboard'); }
          });
        }
        else if (name === 'googleSearch') {
          const query = args.query as string;
          const searchResult = await generateSearchResponse(query, "Eres un experto en autopartes. Resume la información encontrada de manera útil.");
          addMessage('agent', searchResult);
        }
        else if (name === 'quoteMercadoLibre') {
          const partName = args.partName as string;
          const vehicleModel = args.vehicleModel as string;
          const searchQuery = `${partName} ${vehicleModel} site:mercadolibre.com.mx`;
          const mlUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(partName + ' ' + vehicleModel).replace(/%20/g, '-')}`;
          
          addMessage('agent', `Consultando precios reales en MercadoLibre para ${partName} de ${vehicleModel}...`, {
            label: 'Ver en MercadoLibre',
            onClick: () => {
              setMirrorUrl(mlUrl);
              setIsExpanded(true);
            }
          });
          
          // Auto-expand and show mirror
          setMirrorUrl(mlUrl);
          setIsExpanded(true);
          
          const quoteInstruction = `Eres un experto cotizador de autopartes. 
          Analiza los resultados de búsqueda de MercadoLibre para "${partName} ${vehicleModel}".
          Extrae un rango de precios realista (mínimo, máximo y promedio estimado).
          Menciona si los precios son de piezas nuevas o usadas si es posible.
          Responde de manera profesional, concisa y estructurada usando viñetas.`;
          
          const searchResult = await generateSearchResponse(searchQuery, quoteInstruction);
          addMessage('agent', searchResult);
        }
        else if (name === 'updateInventoryPart') {
          const vehicleId = args.vehicleId as string;
          const partId = args.partId as string;
          const status = args.status as 'available' | 'sold' | 'pending';
          const price = args.price as number;
          
          inventoryHook.updatePartState(vehicleId, partId, { status, price });
          addMessage('agent', `He actualizado la pieza en el inventario. Estado: ${status}, Precio: $${price}.`);
        }
        else if (name === 'changeTheme') {
          const themeId = args.themeId as string;
          applyTheme(themeId);
          addMessage('agent', `He cambiado el tema de la aplicación a ${themeId}.`);
        }
        else if (name === 'changeAgentMode') {
          const newMode = args.mode as 'animated' | 'automatic' | 'text';
          setAgentMode(newMode);
          addMessage('agent', `He cambiado mi modo de interacción a ${newMode}.`);
        }
        else if (name === 'conclude_topic_and_learn') {
          const topicName = args.topicName as string;
          const newMessages = messages.slice(lastLearnedIndex);
          const transcript = newMessages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
          
          setLastLearnedIndex(messages.length + 1);
          
          addMessage('agent', `He detectado que hemos concluido el tema "${topicName}". Estoy analizando la conversación para extraer el contexto, flujos de trabajo y puntos clave para mi memoria permanente...`);
          
          // Run in background
          analyzeConversationContext(transcript).then(async (analysis) => {
            if (user) {
              await addSessionMemory({
                topicName,
                addedBy: user.uid,
                transcript,
                keyPoints: analysis.keyPoints || [],
                workflows: analysis.workflows || [],
                conclusions: analysis.conclusions || '',
                errorsAndImprovements: analysis.errorsAndImprovements || ''
              });
              const updated = await getSessionMemories();
              setSessions(updated);
              toast.success('Contexto inteligente guardado en memoria.');
            }
          });
        }
      } else {
        // Regular text response
        addMessage('agent', response.text || "No estoy seguro de cómo ayudar con eso, pero puedo intentar buscarlo en la web si gustas.");
      }
    } catch (error) {
      console.error("Error in AIAgent handleSend:", error);
      addMessage('agent', "Lo siento, tuve un problema al procesar tu solicitud. ¿Podrías intentar de nuevo?");
    } finally {
      setIsTyping(false);
    }
  };

  const executeNavigation = (screen: Screen, msg: string) => {
    addMessage('agent', msg);
    setIsTyping(false);
    
    // Visual feedback for navigation
    toast.info(`Navegando a ${screen.toUpperCase()}...`, {
      icon: <Activity size={16} className="animate-spin" />,
      duration: 2000
    });

    setTimeout(() => {
      setIsOpen(false);
      onNavigate(screen);
    }, 1000);
  };

  const calculateTotalValue = () => {
    return vehicles.reduce((acc, v) => {
      return acc + parts.reduce((sum, part) => {
        const state = inventoryHook.getPartState(v.id, part.id);
        return sum + (state.price || (part.basePrice * (v.marketValueFactor || 1)));
      }, 0);
    }, 0);
  };

  const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

  const runAnimationSequence = async (vehicle: Vehicle, part: Part) => {
    setCursorVisible(true);
    
    // 1. Move to Bottom Nav "Inventario"
    const navEl = document.querySelector('[data-agent="nav-inventory"]');
    if (navEl) {
      const rect = navEl.getBoundingClientRect();
      setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      await delay(1000);
      setCursorClick(true);
      await delay(200);
      setCursorClick(false);
      onNavigate('inventory');
      await delay(800); // wait for screen to render
    }

    // 2. Move to Search Bar
    const searchEl = document.querySelector('[data-agent="inventory-search"]');
    if (searchEl) {
      const rect = searchEl.getBoundingClientRect();
      setCursorPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 });
      await delay(1000);
      setCursorClick(true);
      await delay(200);
      setCursorClick(false);
      
      // Simulate typing
      const searchText = `${part.name} ${vehicle.model}`;
      setGlobalSearch(searchText);
      await delay(1000);
    }

    // 3. Move to the center to point at results
    setCursorPos({ x: window.innerWidth / 2, y: window.innerHeight / 3 });
    await delay(1000);

    setCursorVisible(false);
    setIsOpen(true);
    addMessage('agent', `Hecho. Busqué ${part.name} para ${vehicle.model} en el inventario.`);
  };

  const toggleExpand = () => {
    if (isExpanded && forceOpen) {
      onNavigate('dashboard');
    }
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      {/* Fake Cursor */}
      <AnimatePresence>
        {cursorVisible && (
          <motion.div
            initial={{ opacity: 0, x: window.innerWidth / 2, y: window.innerHeight }}
            animate={{ opacity: 1, x: cursorPos.x, y: cursorPos.y, scale: cursorClick ? 0.8 : 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="fixed z-[9999] pointer-events-none"
            style={{ marginLeft: -12, marginTop: -12 }}
          >
            <div className="relative">
              <MousePointer2 size={32} className="text-white drop-shadow-lg" fill="black" />
              {cursorClick && (
                <motion.div 
                  initial={{ scale: 0, opacity: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  className="absolute top-1/2 left-1/2 w-8 h-8 bg-jsv-orange rounded-full -translate-x-1/2 -translate-y-1/2"
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isExpanded ? '100vw' : 340,
              height: isExpanded ? '100vh' : 500,
              right: isExpanded ? 0 : 16,
              bottom: isExpanded ? 0 : 96,
              borderRadius: isExpanded ? 0 : 24
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, type: 'spring', bounce: 0 }}
            className={`fixed glass-panel shadow-2xl z-[100] flex overflow-hidden border border-white/10 ${isExpanded ? 'flex-row' : 'flex-col max-h-[70vh]'}`}
          >
            {/* Main Chat Area */}
            <div className={`flex flex-col h-full ${isExpanded ? (mirrorUrl ? 'w-1/3 border-r border-white/10' : 'w-1/2 mx-auto') : 'w-full'}`}>
              {/* Header */}
              <div className="bg-black/40 p-4 flex justify-between items-center border-b border-white/5 backdrop-blur-md shrink-0">
                <div className="flex items-center gap-3">
                  <div className="bg-jsv-orange/20 p-2 rounded-full border border-jsv-orange/30 shadow-[0_0_10px_rgba(245,208,97,0.2)]">
                    <Sparkles size={20} className="text-jsv-orange" strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-white font-medium text-sm tracking-tight">MondayOS Agent</h3>
                    <p className="text-[10px] text-gray-400 flex items-center gap-1.5 font-medium tracking-widest uppercase mt-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.5)]"></span> En línea
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={isLive ? stopLive : startLive}
                    disabled={isConnecting}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border ${
                      isLive 
                        ? 'bg-red-500/20 text-red-400 border-red-500/30 shadow-[0_0_10px_rgba(239,68,68,0.2)]' 
                        : isConnecting
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
                    }`}
                    title="Modo Voz en Vivo"
                  >
                    <Radio size={14} className={isLive ? 'animate-pulse' : ''} />
                    {isLive ? 'En Vivo' : isConnecting ? 'Conectando...' : 'Live'}
                  </button>
                  <button onClick={toggleExpand} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/5">
                    {isExpanded ? <Minimize2 size={16} strokeWidth={1.5} /> : <Maximize2 size={16} strokeWidth={1.5} />}
                  </button>
                  <button onClick={() => { setIsOpen(false); setIsExpanded(false); if (forceOpen) onNavigate('dashboard'); }} className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-2 rounded-full border border-white/5">
                    <X size={16} strokeWidth={1.5} />
                  </button>
                </div>
              </div>
              
              {/* Live Mode Overlay */}
              <AnimatePresence>
                {isLive && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 top-[73px] bg-black/80 backdrop-blur-lg z-10 flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="w-24 h-24 rounded-full bg-jsv-orange/20 border-2 border-jsv-orange/50 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(245,208,97,0.3)] relative">
                      <motion.div 
                        animate={{ scale: [1, 1.2, 1] }} 
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute inset-0 rounded-full bg-jsv-orange/10"
                      />
                      <Mic size={40} className="text-jsv-orange relative z-10" />
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">Modo Conversación</h3>
                    <p className="text-sm text-gray-400 mb-8 max-w-[250px]">
                      Habla naturalmente. El agente te está escuchando y responderá por voz.
                    </p>
                    <button 
                      onClick={stopLive}
                      className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-colors shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                      Finalizar Conversación
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages Area */}
              <div 
                className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-black/20"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                {messages.map((m) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={m.id} 
                    className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'agent' && (
                      <div className="w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                        <Bot size={12} className="text-jsv-orange" />
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-1 max-w-[80%]">
                      <div className={`p-3 text-sm shadow-lg ${
                        m.role === 'user' 
                          ? 'bg-jsv-orange text-black rounded-2xl rounded-tr-sm font-medium' 
                          : 'bg-black/60 text-gray-200 rounded-2xl rounded-tl-sm border border-white/10 font-light leading-relaxed backdrop-blur-md'
                      }`}>
                        {m.image && (
                          <img src={m.image} alt="Uploaded" className="w-full max-w-[200px] rounded-xl mb-2 border border-black/10" referrerPolicy="no-referrer" />
                        )}
                        {m.text}
                        {m.role === 'agent' && (
                          <button 
                            onClick={() => playTTS(m.text, m.id)}
                            className="ml-2 inline-flex items-center justify-center p-1 rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-jsv-orange align-middle"
                            title="Escuchar"
                          >
                            {playingAudioId === m.id ? <Square size={12} fill="currentColor" /> : <Volume2 size={14} />}
                          </button>
                        )}
                      </div>
                      
                      {m.action && (
                        <button 
                          onClick={m.action.onClick}
                          className="self-start mt-1 flex items-center gap-1 text-[10px] font-medium tracking-widest uppercase text-jsv-orange hover:text-white transition-colors bg-black/40 px-3 py-1.5 rounded-full border border-white/10 hover:border-jsv-orange/50"
                        >
                          {m.action.label} <ChevronRight size={12} strokeWidth={1.5} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-2 justify-start">
                    <div className="w-6 h-6 rounded-full bg-black/40 border border-white/10 flex items-center justify-center shrink-0 mt-1 shadow-[0_0_10px_rgba(0,0,0,0.5)]">
                      <Bot size={12} className="text-jsv-orange" />
                    </div>
                    <div className="bg-black/60 p-3 rounded-2xl rounded-tl-sm border border-white/10 flex gap-1.5 items-center h-10 backdrop-blur-md">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-jsv-orange/50 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-jsv-orange/50 rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-jsv-orange/50 rounded-full" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggestions */}
              {messages.length < 3 && !isTyping && (
                <div className="px-4 pb-3 pt-1 flex gap-2 overflow-x-auto no-scrollbar bg-black/20 shrink-0">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => handleSend(s)}
                      className="whitespace-nowrap text-[10px] font-medium tracking-wide bg-black/40 text-gray-400 px-4 py-2 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-all hover:border-white/20"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Area */}
              <div className="p-3 bg-black/40 border-t border-white/5 backdrop-blur-md flex flex-col gap-2 shrink-0">
                {imagePreview && (
                  <div className="relative self-start">
                    <img src={imagePreview} alt="Preview" className="h-16 rounded-xl border border-white/10" referrerPolicy="no-referrer" />
                    <button 
                      onClick={() => { setImageFile(null); setImagePreview(null); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="relative flex items-center gap-2">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
                    title="Subir imagen"
                  >
                    <ImageIcon size={18} />
                  </button>
                  
                  <input 
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSend()}
                    placeholder="Pregúntale a MondayOS..."
                    className="flex-1 bg-black/60 text-white text-sm rounded-2xl px-4 py-3 border border-white/10 focus:border-jsv-orange outline-none transition-colors font-light placeholder:text-gray-600 shadow-inner"
                  />
                  
                  {query.trim() || imageFile ? (
                    <button 
                      onClick={() => handleSend()} 
                      disabled={isTyping}
                      className="p-2.5 bg-jsv-orange text-black rounded-xl disabled:opacity-50 disabled:bg-white/10 disabled:text-gray-500 transition-all hover:bg-[#f5d061]/90 shadow-[0_0_10px_rgba(245,208,97,0.2)] disabled:shadow-none shrink-0"
                    >
                      <Send size={18} strokeWidth={1.5} />
                    </button>
                  ) : (
                    <button 
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={startRecording}
                      onTouchEnd={stopRecording}
                      className={`p-2.5 rounded-xl transition-all shrink-0 ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] animate-pulse' 
                          : 'bg-white/10 text-gray-300 hover:bg-white/20 border border-white/5'
                      }`}
                      title="Mantén presionado para hablar"
                    >
                      <Mic size={18} strokeWidth={1.5} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Mirror View (Only in Expanded Mode) */}
            {isExpanded && mirrorUrl && (
              <div className="flex-1 bg-black/80 flex flex-col relative">
                <div className="absolute top-0 left-0 right-0 p-2 bg-black/60 backdrop-blur-md border-b border-white/10 flex justify-between items-center z-10">
                  <div className="flex items-center gap-2 px-2">
                    <Globe size={14} className="text-gray-400" />
                    <span className="text-xs text-gray-300 font-mono truncate max-w-md">{mirrorUrl}</span>
                  </div>
                  <div className="flex gap-2">
                    <a href={mirrorUrl} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <ExternalLink size={14} />
                    </a>
                    <button onClick={() => setMirrorUrl(null)} className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                </div>
                <iframe 
                  src={mirrorUrl} 
                  className="w-full h-full pt-10 border-none bg-white"
                  title="Mirror View"
                  sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
                />
              </div>
            )}
            
            {/* Expanded Mode Empty State (if no mirror URL) */}
            {isExpanded && !mirrorUrl && (
              <div className="flex-1 bg-black/40 flex flex-col items-center justify-center p-8 text-center border-l border-white/5 relative">
                <div className="absolute top-4 right-4 flex gap-2">
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      setIsExpanded(false);
                      onNavigate('settings-ai');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs text-gray-300 hover:text-white transition-colors"
                  >
                    <Settings size={14} />
                    Configuración IA
                  </button>
                  <button 
                    onClick={() => {
                      setIsOpen(false);
                      setIsExpanded(false);
                      onNavigate('settings-workflows');
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    <Activity size={14} />
                    Workflows
                  </button>
                  <button 
                    onClick={async () => {
                      if (user) {
                        toast.promise(downloadSessionBackup(), {
                          loading: 'Generando backup de conocimiento...',
                          success: 'Backup descargado exitosamente',
                          error: 'Error al descargar el backup'
                        });
                      } else {
                        toast.error('Debes iniciar sesión para descargar el backup');
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    <Download size={16} />
                    Descargar Backup de Memoria
                  </button>
                </div>
                
                <div className="w-24 h-24 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-6 mt-8">
                  <Database size={40} className="text-gray-500" />
                </div>
                <h2 className="text-2xl font-medium text-white tracking-tight mb-2">Workspace de IA & Base de Conocimiento</h2>
                <p className="text-gray-400 max-w-md font-light mb-8">
                  Aquí aparecerán los enlaces, cotizaciones y datos de mercado que el asistente encuentre. Además, aquí puedes revisar el índice contextual de aprendizaje de la IA.
                </p>
                
                <div className="w-full max-w-3xl bg-black/60 border border-white/10 rounded-2xl p-6 text-left flex flex-col flex-1 min-h-0">
                  <h3 className="text-white font-medium mb-4 flex items-center gap-2 shrink-0">
                    <Database size={18} className="text-jsv-orange" />
                    Índice Contextual Inteligente
                  </h3>
                  <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                    {sessions.length > 0 ? (
                      sessions.map((s, i) => (
                        <div key={s.id || i} className="p-4 bg-white/5 rounded-2xl border border-white/10 text-sm text-gray-300">
                          <div className="flex justify-between items-center mb-3">
                            <h4 className="font-medium text-jsv-orange uppercase tracking-widest text-xs">{s.topicName}</h4>
                            <span className="text-[10px] text-gray-500">{s.timestamp?.toDate ? s.timestamp.toDate().toLocaleString() : 'Reciente'}</span>
                          </div>
                          <div className="space-y-3 text-xs font-light">
                            <div>
                              <strong className="text-white font-medium block mb-1">Puntos Clave:</strong>
                              <ul className="list-disc pl-4 space-y-0.5 text-gray-400">
                                {s.keyPoints.map((k, j) => <li key={j}>{k}</li>)}
                              </ul>
                            </div>
                            {s.workflows.length > 0 && (
                              <div>
                                <strong className="text-white font-medium block mb-1">Workflows Realizados:</strong>
                                <ul className="list-disc pl-4 space-y-0.5 text-gray-400">
                                  {s.workflows.map((w, j) => <li key={j}>{w}</li>)}
                                </ul>
                              </div>
                            )}
                            <div>
                              <strong className="text-white font-medium block mb-1">Conclusión:</strong>
                              <p className="text-gray-400">{s.conclusions}</p>
                            </div>
                            <div>
                              <strong className="text-white font-medium block mb-1">Errores y Mejoras:</strong>
                              <p className="text-gray-400">{s.errorsAndImprovements}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <p className="text-sm text-gray-500 italic text-center py-4">
                          La IA aún no ha indexado conversaciones. Cuando termines un tema con ella, lo analizará y lo guardará aquí.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-4 w-14 h-14 bg-jsv-orange text-black rounded-full shadow-[0_0_20px_rgba(245,208,97,0.4)] flex items-center justify-center hover:scale-110 transition-transform z-40 group hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
          >
            <Sparkles size={24} strokeWidth={1.5} className="group-hover:animate-pulse" />
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}


