import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, RefreshCw, Trophy, Zap, Package, ArrowLeft, Play, Timer, Eye, AlertTriangle, Globe } from 'lucide-react';
import { Vehicle, Part } from '../types';
import { useInventory } from '../hooks/useInventory';
import { toast } from 'sonner';

interface StockBlitzGameProps {
  vehicles: Vehicle[];
  parts: Part[];
  inventoryHook: ReturnType<typeof useInventory>;
  onExit: () => void;
}

type GameState = 'intro' | 'playing' | 'summary';

export function StockBlitzGame({ vehicles, parts, inventoryHook, onExit }: StockBlitzGameProps) {
  const [gameState, setGameState] = useState<GameState>('intro');
  const [currentCard, setCurrentCard] = useState<{ vehicle: Vehicle; part: Part } | null>(null);
  const [streak, setStreak] = useState(0);
  const [score, setScore] = useState(0);
  const [cardsProcessed, setCardsProcessed] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const [timeLeft, setTimeLeft] = useState(60);
  const [showDetails, setShowDetails] = useState(false);

  const { getPartState, updatePartStatus } = inventoryHook;

  // Timer Logic
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (gameState === 'playing' && timeLeft > 0 && !showDetails) { // Pause timer while reviewing details
      timer = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && gameState === 'playing') {
      setGameState('summary');
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft, showDetails]);

  // Pick a random pending part
  const pickRandomCard = () => {
    setShowDetails(false);
    const candidates: { vehicle: Vehicle; part: Part }[] = [];
    
    vehicles.forEach(v => {
      parts.forEach(p => {
        const state = getPartState(v.id, p.id);
        if (!state.status || state.status === 'pending') {
          candidates.push({ vehicle: v, part: p });
        }
      });
    });

    if (candidates.length === 0) {
      const randomVehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
      const randomPart = parts[Math.floor(Math.random() * parts.length)];
      setCurrentCard({ vehicle: randomVehicle, part: randomPart });
      return;
    }

    const random = candidates[Math.floor(Math.random() * candidates.length)];
    setCurrentCard(random);
  };

  const startGame = () => {
    setScore(0);
    setStreak(0);
    setCardsProcessed(0);
    setTimeLeft(60);
    pickRandomCard();
    setGameState('playing');
  };

  const handleSwipe = (action: 'available' | 'sold' | 'review') => {
    if (!currentCard) return;

    if (action === 'review') {
      setDirection('up');
      setTimeout(() => {
        setShowDetails(true);
        setDirection(null);
      }, 200);
      return;
    }

    setDirection(action === 'available' ? 'right' : 'left');

    // Update Inventory
    updatePartStatus(currentCard.vehicle.id, currentCard.part.id, action);

    // Gamification
    const points = action === 'available' ? 10 : 5;
    const streakBonus = Math.floor(streak / 5) * 5;
    setScore(prev => prev + points + streakBonus);
    setStreak(prev => prev + 1);
    setCardsProcessed(prev => prev + 1);

    // Next card
    setTimeout(() => {
      setDirection(null);
      pickRandomCard();
    }, 200);
  };

  const getTechnicalHints = (partName: string) => {
    const name = partName.toLowerCase();
    if (name.includes('motoventilador') || name.includes('ventilador')) {
      return [
        "¿Es sistema eléctrico o Fan Clutch?",
        "¿Cuántas aspas tiene?",
        "Revisar conector (cuadrado/ovalado)"
      ];
    }
    if (name.includes('alternador')) {
      return [
        "¿Amperaje correcto?",
        "¿Polea libre o fija?",
        "Revisar posición del regulador"
      ];
    }
    if (name.includes('transmisión')) {
      return [
        "¿Es CVT, Automática o Manual?",
        "¿Tiene bayoneta o es sellada?",
        "Revisar código de caja"
      ];
    }
    if (name.includes('faro')) {
      return [
        "¿Fondo negro o cromado?",
        "¿Halógeno, Xenón o LED?",
        "Revisar patas de sujeción"
      ];
    }
    return ["Verificar número de parte", "Revisar lado (Izquierdo/Derecho)", "Confirmar estado físico"];
  };

  // --- RENDERERS ---

  if (gameState === 'intro') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
        <div className="bg-jsv-orange/10 p-8 rounded-full shadow-[0_0_30px_rgba(245,208,97,0.2)] border border-jsv-orange/20">
          <Zap size={64} className="text-jsv-orange" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-4xl font-medium text-white mb-3 tracking-tight">STOCK BLITZ</h2>
          <p className="text-gray-400 max-w-xs mx-auto text-sm font-light leading-relaxed">
            Verificación rápida de inventario.
            <br/><br/>
            <span className="text-emerald-400 font-medium tracking-widest uppercase text-[10px]">DERECHA</span>: Sí la tengo.
            <br/>
            <span className="text-red-400 font-medium tracking-widest uppercase text-[10px]">IZQUIERDA</span>: Se vendió.
            <br/>
            <span className="text-blue-400 font-medium tracking-widest uppercase text-[10px]">ARRIBA</span>: Revisar detalles.
          </p>
        </div>
        <button 
          onClick={startGame}
          className="bg-jsv-orange text-black px-10 py-4 rounded-2xl font-medium text-lg flex items-center gap-3 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,208,97,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
        >
          <Play fill="currentColor" size={20} /> COMENZAR
        </button>
        <button onClick={onExit} className="text-gray-500 text-xs font-medium tracking-widest uppercase hover:text-white transition-colors">
          Volver a Tareas
        </button>
      </div>
    );
  }

  if (gameState === 'summary') {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-8">
        <div className="bg-white/5 p-8 rounded-full border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)]">
          <Trophy size={64} className="text-jsv-orange" strokeWidth={1.5} />
        </div>
        <div>
          <h2 className="text-4xl font-medium text-white mb-3 tracking-tight">¡TIEMPO!</h2>
          <div className="text-6xl font-light text-jsv-orange mb-4 tracking-tighter">{score} <span className="text-2xl font-medium tracking-widest uppercase opacity-80">XP</span></div>
          <p className="text-gray-400 font-light">
            Verificaste <span className="text-white font-medium">{cardsProcessed}</span> piezas.
          </p>
        </div>
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <button 
            onClick={startGame}
            className="bg-jsv-orange text-black px-6 py-4 rounded-2xl font-medium flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(245,208,97,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)] transition-all"
          >
            <RefreshCw size={20} strokeWidth={1.5} /> JUGAR DE NUEVO
          </button>
          <button 
            onClick={onExit}
            className="glass-button px-6 py-4 rounded-2xl font-medium tracking-widest uppercase text-xs text-gray-300 hover:text-white transition-colors"
          >
            SALIR
          </button>
        </div>
      </div>
    );
  }

  // PLAYING STATE
  if (!currentCard) return <div className="text-white text-center mt-20 font-light tracking-widest uppercase">Cargando...</div>;

  const hints = getTechnicalHints(currentCard.part.name);

  return (
    <div className="h-full flex flex-col p-4 pb-8">
      {/* HUD */}
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setGameState('summary')} className="p-3 glass-button rounded-full text-gray-400 hover:text-white transition-colors">
          <X size={20} strokeWidth={1.5} />
        </button>
        <div className="flex items-center gap-5 glass-panel px-5 py-2.5 rounded-full">
          <div className={`flex items-center gap-2 font-medium tracking-widest uppercase text-xs ${showDetails ? 'text-blue-400' : 'text-jsv-orange'}`}>
            {showDetails ? <Eye size={16} strokeWidth={1.5} /> : <Timer size={16} strokeWidth={1.5} />} 
            {showDetails ? 'PAUSA' : `${timeLeft}s`}
          </div>
          <div className="w-px h-4 bg-white/10"></div>
          <div className="flex items-center gap-2 text-white font-medium tracking-widest uppercase text-xs">
            <Trophy size={16} className="text-jsv-orange" strokeWidth={1.5} /> {score}
          </div>
        </div>
        <div className="w-11"></div> {/* Spacer */}
      </div>

      {/* Card Area */}
      <div className="flex-1 flex flex-col items-center justify-center relative w-full max-w-md mx-auto">
        <AnimatePresence mode="wait">
          {!showDetails ? (
            <motion.div
              key="front"
              initial={{ scale: 0.8, opacity: 0, y: 50 }}
              animate={{ 
                scale: 1, 
                opacity: 1, 
                y: direction === 'up' ? -300 : 0,
                x: direction === 'left' ? -300 : direction === 'right' ? 300 : 0,
                rotate: direction === 'left' ? -15 : direction === 'right' ? 15 : 0
              }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="w-full glass-panel border border-white/10 rounded-[2rem] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] relative aspect-[3/4] flex flex-col"
            >
              {/* Image Area */}
              <div className="h-3/5 bg-black/40 relative flex items-center justify-center">
                 <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-transparent to-transparent z-10"></div>
                 <Package size={80} className="text-white/10" strokeWidth={1} />
                 
                 {/* Online Badge */}
                 <div className="absolute top-5 left-5 z-20 flex gap-2">
                   <div className="bg-blue-500/20 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase text-blue-400 border border-blue-500/30 flex items-center gap-1.5 shadow-lg">
                     <Globe size={12} strokeWidth={1.5} /> ONLINE
                   </div>
                 </div>

                 <div className="absolute top-5 right-5 z-20 bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] font-medium tracking-widest uppercase text-white border border-white/10">
                   {currentCard.vehicle.yearRange}
                 </div>
              </div>

              {/* Content Area */}
              <div className="flex-1 p-8 flex flex-col justify-between relative z-20 -mt-16">
                <div>
                  <span className="text-jsv-orange font-mono text-[10px] uppercase tracking-widest mb-2 block">
                    {currentCard.vehicle.model}
                  </span>
                  <h2 className="text-3xl font-medium text-white leading-tight mb-3 tracking-tight">
                    {currentCard.part.name}
                  </h2>
                  <div className="flex gap-2 mt-3">
                     <span className="bg-white/5 text-gray-300 text-[10px] px-3 py-1.5 rounded-full border border-white/10 font-medium tracking-widest uppercase">
                       {currentCard.vehicle.segment}
                     </span>
                  </div>
                </div>

                <div className="bg-white/5 p-5 rounded-2xl border border-white/10 text-center backdrop-blur-md">
                  <p className="text-gray-400 text-[10px] font-medium tracking-widest uppercase mb-1.5">Pregunta de Auditoría</p>
                  <p className="text-white font-medium text-lg tracking-tight">¿Está en el estante?</p>
                </div>
              </div>

              {/* Overlay Indicators */}
              {direction === 'right' && (
                <div className="absolute inset-0 bg-emerald-500/10 flex items-center justify-center z-50 backdrop-blur-sm">
                  <div className="bg-emerald-500 text-black font-medium text-4xl px-8 py-4 rounded-3xl -rotate-12 shadow-[0_0_40px_rgba(16,185,129,0.5)] tracking-tight">
                    ¡SÍ!
                  </div>
                </div>
              )}
              {direction === 'left' && (
                <div className="absolute inset-0 bg-red-500/10 flex items-center justify-center z-50 backdrop-blur-sm">
                  <div className="bg-red-500 text-white font-medium text-4xl px-8 py-4 rounded-3xl rotate-12 shadow-[0_0_40px_rgba(239,68,68,0.5)] tracking-tight">
                    VENDIDO
                  </div>
                </div>
              )}
              {direction === 'up' && (
                <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center z-50 backdrop-blur-sm">
                  <div className="bg-blue-500 text-white font-medium text-3xl px-8 py-4 rounded-3xl shadow-[0_0_40px_rgba(59,130,246,0.5)] tracking-tight">
                    REVISANDO...
                  </div>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="back"
              initial={{ scale: 0.8, opacity: 0, y: 300 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: 300 }}
              className="w-full glass-panel border border-blue-500/30 rounded-[2rem] overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] relative aspect-[3/4] flex flex-col p-8"
            >
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-xl font-medium text-white flex items-center gap-3 tracking-tight">
                  <AlertTriangle className="text-blue-400" strokeWidth={1.5} /> Detalles Técnicos
                </h3>
                <button onClick={() => setShowDetails(false)} className="p-3 glass-button rounded-full hover:text-white transition-colors">
                  <X size={20} strokeWidth={1.5} />
                </button>
              </div>

              <div className="space-y-6 flex-1">
                <div className="bg-blue-500/10 p-5 rounded-2xl border border-blue-500/20">
                  <p className="text-blue-400 text-[10px] font-medium tracking-widest uppercase mb-2">IMPORTANTE</p>
                  <p className="text-white text-sm leading-relaxed font-light">
                    Esta pieza tiene variantes. Verifica físicamente antes de confirmar.
                  </p>
                </div>

                <div className="space-y-4">
                  {hints.map((hint, idx) => (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="bg-white/5 p-1.5 rounded-lg mt-0.5 text-gray-400 font-mono text-[10px] border border-white/5">{idx + 1}</div>
                      <p className="text-gray-300 text-sm font-light leading-relaxed">{hint}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-white/10">
                <p className="text-center text-gray-500 text-[10px] font-medium tracking-widest uppercase mb-5">¿Coincide con la descripción?</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleSwipe('sold')}
                    className="bg-red-500/10 border border-red-500/30 text-red-400 py-4 rounded-2xl font-medium text-xs tracking-widest uppercase hover:bg-red-500 hover:text-white transition-all hover:shadow-[0_0_20px_rgba(239,68,68,0.3)]"
                  >
                    NO (VENDIDO)
                  </button>
                  <button 
                    onClick={() => handleSwipe('available')}
                    className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 py-4 rounded-2xl font-medium text-xs tracking-widest uppercase hover:bg-emerald-500 hover:text-black transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                  >
                    SÍ (CONFIRMAR)
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      {!showDetails && (
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-md mx-auto w-full px-4 items-end">
          <button 
            onClick={() => handleSwipe('sold')}
            className="glass-panel border border-red-500/30 text-red-400 rounded-3xl h-20 flex flex-col items-center justify-center hover:bg-red-500/10 active:scale-95 transition-all"
          >
            <X size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-widest uppercase mt-2">NO ESTÁ</span>
          </button>

          <button 
            onClick={() => handleSwipe('review')}
            className="glass-panel border border-blue-500/30 text-blue-400 rounded-3xl h-24 flex flex-col items-center justify-center hover:bg-blue-500/10 active:scale-95 transition-all -mb-2 shadow-[0_0_30px_rgba(59,130,246,0.1)]"
          >
            <Eye size={32} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-widest uppercase mt-2">REVISAR</span>
          </button>

          <button 
            onClick={() => handleSwipe('available')}
            className="glass-panel border border-emerald-500/30 text-emerald-400 rounded-3xl h-20 flex flex-col items-center justify-center hover:bg-emerald-500/10 active:scale-95 transition-all"
          >
            <Check size={24} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-widest uppercase mt-2">SÍ ESTÁ</span>
          </button>
        </div>
      )}
    </div>
  );
}
