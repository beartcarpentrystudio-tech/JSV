import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { GripVertical, Maximize2, Minimize2, X, Check, Settings2, Package, TrendingUp } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface GridItem {
  id: string;
  content: React.ReactNode;
  w: number; // width in columns (1 or 2)
  h: number; // height unit
  title?: string;
  category?: string;
}

interface ModularGridProps {
  items: GridItem[];
  onLayoutChange?: (newItems: GridItem[]) => void;
  storageKey?: string;
}

export function ModularGrid({ items: initialItems, onLayoutChange, storageKey = 'mondayos-layout' }: ModularGridProps) {
  const [items, setItems] = useState<GridItem[]>([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load saved layout
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge with initial items to ensure we have content but keep order
        const merged = parsed.map((p: any) => {
          const original = initialItems.find(i => i.id === p.id);
          return original ? { ...p, content: original.content } : null;
        }).filter(Boolean);
        
        // Add any new items that weren't in saved layout
        const newItems = initialItems.filter(i => !parsed.find((p: any) => p.id === i.id));
        setItems([...merged, ...newItems]);
      } catch (e) {
        setItems(initialItems);
      }
    } else {
      setItems(initialItems);
    }
  }, [initialItems, storageKey]);

  const saveLayout = (newItems: GridItem[]) => {
    const toSave = newItems.map(({ id, w, h }) => ({ id, w, h }));
    localStorage.setItem(storageKey, JSON.stringify(toSave));
    if (onLayoutChange) onLayoutChange(newItems);
  };

  const handleLongPressStart = (id: string) => {
    if (isEditMode) return;
    longPressTimer.current = setTimeout(() => {
      setIsEditMode(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 600);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  const toggleSize = (id: string) => {
    const newItems = items.map(item => {
      if (item.id === id) {
        return { ...item, w: item.w === 1 ? 2 : 1 };
      }
      return item;
    });
    setItems(newItems);
    saveLayout(newItems);
  };

  const moveItem = (draggedId: string, overId: string) => {
    if (draggedId === overId) return;
    const oldIndex = items.findIndex(i => i.id === draggedId);
    const newIndex = items.findIndex(i => i.id === overId);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newItems = [...items];
    const [removed] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, removed);
    
    setItems(newItems);
  };

  const handleDragOver = (id: string) => {
    if (draggedId && draggedId !== id) {
      moveItem(draggedId, id);
    }
  };

  const addWidget = (type: 'stat' | 'shortcut' | 'tool') => {
    const id = `custom-${Date.now()}`;
    let newItem: GridItem;

    if (type === 'shortcut') {
      newItem = {
        id,
        w: 1,
        h: 1,
        content: (
          <div className="glass-panel p-4 rounded-2xl h-full flex flex-col items-center justify-center gap-2 border-white/10 group">
            <div className="p-2 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors">
              <Package size={20} className="text-white" />
            </div>
            <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400">Acceso Rápido</span>
          </div>
        )
      };
    } else if (type === 'stat') {
      newItem = {
        id,
        w: 1,
        h: 1,
        content: (
          <div className="glass-panel p-4 rounded-2xl h-full border-emerald-500/20">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <TrendingUp size={16} strokeWidth={1.5} />
              <span className="text-[10px] font-medium tracking-wider uppercase">Métrica</span>
            </div>
            <div className="text-2xl font-light text-white">0.0</div>
            <div className="text-[10px] text-gray-500 mt-1">Tiempo Real</div>
          </div>
        )
      };
    } else {
      newItem = {
        id,
        w: 1,
        h: 1,
        content: (
          <div className="glass-panel p-4 rounded-2xl h-full flex flex-col items-center justify-center gap-2 border-jsv-orange/30">
            <Settings2 size={20} className="text-jsv-orange" />
            <span className="text-[8px] font-bold tracking-widest uppercase text-gray-400">Herramienta</span>
          </div>
        )
      };
    }

    const newItems = [...items, newItem];
    setItems(newItems);
    saveLayout(newItems);
  };

  return (
    <div className="relative min-h-screen">
      {/* Edit Mode Overlay/Toolbar */}
      <AnimatePresence>
        {isEditMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-4 right-4 z-50 bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl flex flex-col gap-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-jsv-orange rounded-full flex items-center justify-center text-black">
                  <Settings2 size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white tracking-tight">Personalizar MondayOS</div>
                  <div className="text-[8px] font-medium text-gray-400 tracking-widest uppercase">Arrastra para reordenar</div>
                </div>
              </div>
              
              <button 
                onClick={() => {
                  setIsEditMode(false);
                  saveLayout(items);
                }}
                className="bg-jsv-orange text-black px-4 py-2 rounded-xl text-[8px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,208,97,0.4)] hover:scale-105 transition-all"
              >
                Listo
              </button>
            </div>
            
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              <button 
                onClick={() => addWidget('stat')}
                className="whitespace-nowrap bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-[8px] font-bold tracking-widest uppercase border border-white/5 transition-all"
              >
                + Métrica
              </button>
              <button 
                onClick={() => addWidget('shortcut')}
                className="whitespace-nowrap bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-[8px] font-bold tracking-widest uppercase border border-white/5 transition-all"
              >
                + Acceso
              </button>
              <button 
                onClick={() => addWidget('tool')}
                className="whitespace-nowrap bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-[8px] font-bold tracking-widest uppercase border border-white/5 transition-all"
              >
                + Herramienta
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3 auto-rows-min">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            layout
            onMouseEnter={() => isEditMode && handleDragOver(item.id)}
            onMouseDown={() => handleLongPressStart(item.id)}
            onMouseUp={handleLongPressEnd}
            onMouseLeave={handleLongPressEnd}
            onTouchStart={() => handleLongPressStart(item.id)}
            onTouchEnd={handleLongPressEnd}
            drag={isEditMode}
            dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
            dragElastic={0.1}
            onDragStart={() => setDraggedId(item.id)}
            onDragEnd={() => {
              setDraggedId(null);
              saveLayout(items);
            }}
            whileDrag={{ 
              scale: 1.05, 
              zIndex: 50, 
              rotate: 0,
              boxShadow: "0 20px 40px rgba(0,0,0,0.4)"
            }}
            animate={isEditMode ? {
              rotate: [0, -1.5, 0, 1.5, 0],
              x: [0, -0.5, 0, 0.5, 0],
              y: [0, 0.5, 0, -0.5, 0],
              transition: {
                repeat: Infinity,
                duration: 0.18,
                delay: index * 0.02
              }
            } : { rotate: 0, x: 0, y: 0 }}
            className={cn(
              "relative group transition-all duration-300",
              item.w === 2 ? "col-span-2" : "col-span-1",
              isEditMode && "cursor-grab active:cursor-grabbing"
            )}
          >
            {/* Magnetism Placeholder */}
            {draggedId === item.id && (
              <div className="absolute inset-0 border-2 border-dashed border-jsv-orange/40 rounded-2xl bg-jsv-orange/5 z-0" />
            )}
            
            {/* Item Content Wrapper */}
            <div className={cn(
              "h-full w-full",
              isEditMode && "opacity-90 scale-[0.96] shadow-xl"
            )}>
              {item.content}
            </div>

            {/* Edit Controls */}
            <AnimatePresence>
              {isEditMode && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -top-2 -right-2 flex gap-1 z-20"
                >
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSize(item.id);
                    }}
                    className="bg-white text-black p-1.5 rounded-full shadow-lg hover:bg-jsv-orange transition-all"
                  >
                    {item.w === 1 ? <Maximize2 size={10} /> : <Minimize2 size={10} />}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const newItems = items.filter(i => i.id !== item.id);
                      setItems(newItems);
                      saveLayout(newItems);
                    }}
                    className="bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-all"
                  >
                    <X size={10} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      {/* Reorder logic helper - simplified for this implementation */}
      {isEditMode && (
        <div className="fixed inset-0 pointer-events-none z-10 border-2 border-jsv-orange/20 rounded-3xl m-2"></div>
      )}
    </div>
  );
}
