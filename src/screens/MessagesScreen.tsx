import React, { useState, useEffect } from 'react';
import { MessageCircle, Facebook, Search, Paperclip, Send, User, Check, X, Car, Sparkles, Bot } from 'lucide-react';
import { Vehicle, Part } from '../types';
import { useInventory } from '../hooks/useInventory';
import { toast } from 'sonner';
import { generateChatResponse } from '../services/geminiService';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, query, orderBy, addDoc, serverTimestamp } from 'firebase/firestore';

interface MessagesScreenProps {
  vehicles: Vehicle[];
  parts: Part[];
  inventoryHook: ReturnType<typeof useInventory>;
}

interface Conversation {
  id: string;
  clientName: string;
  platform: 'whatsapp' | 'messenger';
  lastMessage: string;
  timestamp: any;
  unread: number;
  avatarColor: string;
}

export function MessagesScreen({ vehicles, parts, inventoryHook }: MessagesScreenProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedChat, setSelectedChat] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showInventoryPicker, setShowInventoryPicker] = useState(false);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState(false);
  const [suggestedQuote, setSuggestedQuote] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const { getPartState } = inventoryHook;

  // Sync with Firestore
  useEffect(() => {
    const q = query(collection(db, 'conversations'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Conversation[];
      setConversations(convs);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'conversations');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      setMessageText('');
      setSuggestedQuote(null);
      analyzeMessageForQuote(selectedChat);
    }
  }, [selectedChat]);

  const analyzeMessageForQuote = async (chat: Conversation) => {
    setIsGeneratingQuote(true);
    try {
      const msg = chat.lastMessage.toLowerCase();
      
      let foundVehicle = vehicles.find(v => msg.includes(v.model.toLowerCase()));
      let foundPart = parts.find(p => msg.includes(p.name.toLowerCase()));

      if (!foundPart && msg.includes('fascia')) foundPart = parts.find(p => p.name.toLowerCase() === 'facia');
      if (!foundPart && msg.includes('compu')) foundPart = parts.find(p => p.name.toLowerCase() === 'computadora');

      let quoteContext = '';
      if (foundVehicle && foundPart) {
        const state = getPartState(foundVehicle.id, foundPart.id);
        const price = state.price || (foundPart.basePrice * (foundVehicle.marketValueFactor || 1));
        quoteContext = `El cliente pregunta por ${foundPart.name} para ${foundVehicle.model}. El precio es $${price.toLocaleString()} y el estado es ${state.status === 'available' ? 'Disponible' : 'Por verificar'}.`;
      } else {
        quoteContext = `El cliente pregunta algo, pero no encontré una coincidencia exacta en el inventario. Intenta responder amablemente y pedir más detalles si es necesario.`;
      }

      const systemInstruction = `Eres un asistente de ventas de autopartes para MondayOS. 
      Tu objetivo es generar una respuesta profesional y amigable para un cliente en ${chat.platform}.
      El nombre del cliente es ${chat.clientName}.
      Contexto del inventario: ${quoteContext}
      Genera una respuesta corta, directa y persuasiva. Usa emojis apropiados.`;

      const aiResponse = await generateChatResponse(chat.lastMessage, systemInstruction);
      setSuggestedQuote(aiResponse.text || '');
      toast.success('Cotización sugerida por IA lista para enviar.');
    } catch (error) {
      console.error("Error generating quote:", error);
      toast.error('Error al generar la cotización.');
    } finally {
      setIsGeneratingQuote(false);
    }
  };

  const handleSendMessage = () => {
    if (!selectedChat || !messageText) return;

    let url = '';
    const text = encodeURIComponent(messageText);

    if (selectedChat.platform === 'whatsapp') {
      url = `https://wa.me/?text=${text}`;
    } else {
      url = `https://m.me/?text=${text}`;
    }

    window.open(url, '_blank');
    setMessageText('');
    setSuggestedQuote(null);
  };

  const attachQuote = (vehicle: Vehicle, part: Part) => {
    const state = getPartState(vehicle.id, part.id);
    const quoteText = `👋 Hola ${selectedChat?.clientName}, aquí está la cotización:

🔧 *Refacción:* ${part.name}
🚗 *Vehículo:* ${vehicle.model} (${vehicle.yearRange})
💰 *Precio:* $${state.price.toLocaleString()}
✅ *Estado:* ${state.status === 'available' ? 'Disponible' : 'Por verificar'}
📝 *Nota:* ${state.marketData?.report ? 'Precio ajustado a mercado.' : 'Original garantizado.'}

¿Te interesa apartarla?`.trim();

    setMessageText(quoteText);
    setShowInventoryPicker(false);
  };

  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    const date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex h-[calc(100vh-80px)] bg-transparent overflow-hidden">
      
      {/* Sidebar List */}
      <div className={`w-full md:w-80 glass-panel border-r border-white/10 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-5 border-b border-white/10">
          <h2 className="text-xl font-medium text-white mb-4 tracking-tight">Mensajes</h2>
          <div className="relative">
            <input 
              className="w-full bg-white/5 text-white text-sm rounded-2xl py-3.5 pl-11 pr-4 border border-white/10 focus:border-jsv-orange focus:bg-white/10 outline-none transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)] placeholder:text-gray-500"
              placeholder="Buscar cliente..."
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {conversations.map(chat => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className={`w-full p-5 flex items-start gap-4 hover:bg-white/5 transition-colors border-b border-white/5 ${selectedChat?.id === chat.id ? 'bg-white/10' : ''}`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-medium text-lg shrink-0 shadow-lg ${chat.avatarColor}`}>
                {chat.clientName[0]}
                <div className="absolute -bottom-1 -right-1 bg-black rounded-full p-0.5 border-2 border-black">
                  {chat.platform === 'whatsapp' ? 
                    <div className="bg-green-500 rounded-full p-1"><MessageCircle size={10} className="text-black" strokeWidth={2} /></div> : 
                    <div className="bg-blue-600 rounded-full p-1"><Facebook size={10} className="text-white" strokeWidth={2} /></div>
                  }
                </div>
              </div>
              <div className="flex-1 text-left overflow-hidden">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-white text-sm truncate tracking-tight">{chat.clientName}</span>
                  <span className="text-[10px] text-gray-500 font-medium tracking-widest">{formatTimestamp(chat.timestamp)}</span>
                </div>
                <p className="text-gray-400 text-xs truncate font-light">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <div className="bg-jsv-orange text-black text-[10px] font-bold px-2 py-1 rounded-full shadow-[0_0_10px_rgba(245,208,97,0.4)]">
                  {chat.unread}
                </div>
              )}
            </button>
          ))}
          {!loading && conversations.length === 0 && (
            <div className="p-10 text-center text-gray-500 font-light text-sm">
              No hay conversaciones activas.
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedChat ? (
        <div className="flex-1 flex flex-col bg-black/20 relative">
          {/* Chat Header */}
          <div className="p-4 border-b border-white/10 flex items-center justify-between glass-header">
            <div className="flex items-center gap-4">
              <button onClick={() => setSelectedChat(null)} className="md:hidden text-gray-400 hover:text-white transition-colors">
                <ArrowLeftIcon />
              </button>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-medium shadow-lg ${selectedChat.avatarColor}`}>
                {selectedChat.clientName[0]}
              </div>
              <div>
                <h3 className="font-medium text-white text-sm tracking-tight">{selectedChat.clientName}</h3>
                <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium tracking-widest uppercase">
                  {selectedChat.platform === 'whatsapp' ? 'WhatsApp Business' : 'Messenger'}
                </span>
              </div>
            </div>
          </div>

          {/* Messages List */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6 custom-scrollbar flex flex-col">
            <div className="flex justify-start">
              <div className="bg-white/10 text-white p-4 rounded-2xl rounded-tl-sm max-w-[80%] text-sm relative group border border-white/5 shadow-lg backdrop-blur-md font-light leading-relaxed">
                {selectedChat.lastMessage}
              </div>
            </div>
            
            {/* AI Suggestion Area */}
            {isGeneratingQuote && (
              <div className="flex justify-start items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-jsv-orange/20 flex items-center justify-center">
                  <Bot size={16} className="text-jsv-orange animate-pulse" />
                </div>
                <span className="text-jsv-orange text-xs font-medium tracking-widest uppercase animate-pulse">Analizando mensaje...</span>
              </div>
            )}

            {suggestedQuote && !messageText && (
              <div className="mt-auto mb-4 flex flex-col items-end animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-jsv-orange/10 border border-jsv-orange/30 p-4 rounded-2xl rounded-br-sm max-w-[80%] relative backdrop-blur-md shadow-[0_0_30px_rgba(245,208,97,0.1)]">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={14} className="text-jsv-orange" />
                    <span className="text-jsv-orange text-[10px] font-medium tracking-widest uppercase">Cotización Generada por IA</span>
                  </div>
                  <p className="text-white text-sm font-light leading-relaxed whitespace-pre-wrap mb-4">
                    {suggestedQuote}
                  </p>
                  <div className="flex gap-3 justify-end">
                    <button 
                      onClick={() => setSuggestedQuote(null)}
                      className="text-gray-400 hover:text-white text-xs font-medium tracking-widest uppercase transition-colors px-3 py-2"
                    >
                      Descartar
                    </button>
                    <button 
                      onClick={() => {
                        setMessageText(suggestedQuote);
                        setSuggestedQuote(null);
                      }}
                      className="bg-jsv-orange text-black px-4 py-2 rounded-xl text-xs font-medium tracking-widest uppercase hover:bg-[#f5d061] transition-colors shadow-[0_0_15px_rgba(245,208,97,0.3)]"
                    >
                      Usar Cotización
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* System Note */}
            {!suggestedQuote && !isGeneratingQuote && (
              <div className="flex justify-center my-6 mt-auto">
                <span className="bg-black/40 text-gray-500 text-[10px] px-4 py-2 rounded-full border border-white/5 text-center max-w-xs font-medium tracking-widest uppercase backdrop-blur-sm">
                  Conectado a CRM Industrial. Las respuestas se sincronizan en tiempo real.
                </span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 glass-panel border-t border-white/10">
            {showInventoryPicker && (
              <div className="absolute bottom-24 left-4 right-4 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto p-3 z-10 custom-scrollbar">
                <div className="flex justify-between items-center p-2 border-b border-white/10 mb-3">
                  <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Seleccionar Pieza</span>
                  <button onClick={() => setShowInventoryPicker(false)} className="text-gray-500 hover:text-white transition-colors"><X size={18} strokeWidth={1.5} /></button>
                </div>
                {vehicles.map(v => (
                  <div key={v.id} className="mb-3">
                    <div className="text-[10px] font-medium tracking-widest text-jsv-orange px-2 mb-2 uppercase">{v.model}</div>
                    {parts.map(p => (
                      <button
                        key={p.id}
                        onClick={() => attachQuote(v, p)}
                        className="w-full text-left p-3 hover:bg-white/10 rounded-xl flex justify-between items-center group transition-colors"
                      >
                        <span className="text-sm text-gray-300 font-light">{p.name}</span>
                        <span className="text-[10px] text-jsv-green font-medium tracking-widest opacity-0 group-hover:opacity-100 transition-opacity uppercase">Adjuntar</span>
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 items-end">
              <button 
                onClick={() => analyzeMessageForQuote(selectedChat)}
                disabled={isGeneratingQuote}
                className="p-3.5 bg-white/5 text-jsv-orange rounded-2xl hover:bg-white/10 transition-colors disabled:opacity-50 border border-white/5 shadow-sm"
                title="Re-analizar con IA"
              >
                <Sparkles size={20} strokeWidth={1.5} />
              </button>
              <textarea 
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 bg-white/5 text-white text-sm rounded-2xl p-4 border border-white/10 focus:border-jsv-orange focus:bg-white/10 outline-none resize-none h-14 max-h-32 transition-all shadow-inner font-light"
                placeholder="Escribe un mensaje..."
              />
              <button 
                onClick={handleSendMessage}
                disabled={!messageText}
                className="p-3.5 bg-jsv-orange text-black rounded-2xl hover:bg-[#f5d061]/90 transition-colors shadow-[0_0_15px_rgba(245,208,97,0.3)] disabled:opacity-50 disabled:shadow-none"
              >
                <Send size={20} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 flex-col items-center justify-center text-gray-600 bg-black/20">
          <MessageCircle size={64} strokeWidth={1} className="mb-6 opacity-20" />
          <p className="font-light tracking-wide">Selecciona una conversación para comenzar</p>
        </div>
      )}
    </div>
  );
}

function ArrowLeftIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
  );
}
