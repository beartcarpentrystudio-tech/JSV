import { LayoutDashboard, Car, MessageSquare, Bell, CheckSquare, Globe, MessageCircle, Bot, GripVertical, Settings2, Check, X, Plus, Image as ImageIcon, ShieldCheck, Users } from 'lucide-react';
import { Screen } from '../../types/ui';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';

interface BottomNavProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
}

export function BottomNav({ currentScreen, onNavigate }: BottomNavProps) {
  const ALL_SCREENS = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Car },
    { id: 'tasks', label: 'Tareas', icon: CheckSquare },
    { id: 'messages', label: 'Mensajes', icon: MessageCircle },
    { id: 'browser', label: 'Web', icon: Globe },
    { id: 'agent', label: 'IA', icon: Bot },
    { id: 'agent-workspace', label: 'Equipo', icon: Users },
    { id: 'quotes', label: 'Cotizador', icon: MessageSquare },
    { id: 'canvas', label: 'Canvas', icon: ImageIcon },
    { id: 'notifications', label: 'Avisos', icon: Bell },
    { id: 'settings', label: 'Ajustes', icon: Settings2 },
  ];

  const [navItems, setNavItems] = useState(ALL_SCREENS.slice(0, 6));
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  // Load saved dock layout
  useEffect(() => {
    const saved = localStorage.getItem('mondayos-dock');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged = parsed.map((p: any) => {
          const original = ALL_SCREENS.find(i => i.id === p.id);
          return original ? { ...p, icon: original.icon, label: original.label } : null;
        }).filter(Boolean);
        setNavItems(merged);
      } catch (e) {
        setNavItems(ALL_SCREENS.slice(0, 6));
      }
    }
  }, []);

  const saveDock = (items: typeof navItems) => {
    localStorage.setItem('mondayos-dock', JSON.stringify(items.map(i => ({ id: i.id }))));
  };

  const handleLongPressStart = (id: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsEditMode(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 800);
  };

  const handleLongPressEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const moveItem = (draggedId: string, overId: string) => {
    if (draggedId === overId) return;
    const oldIndex = navItems.findIndex(i => i.id === draggedId);
    const newIndex = navItems.findIndex(i => i.id === overId);
    if (oldIndex === -1 || newIndex === -1) return;
    
    const newItems = [...navItems];
    const [removed] = newItems.splice(oldIndex, 1);
    newItems.splice(newIndex, 0, removed);
    setNavItems(newItems);
  };

  const removeItem = (id: string) => {
    const newItems = navItems.filter(i => i.id !== id);
    setNavItems(newItems);
    saveDock(newItems);
  };

  const addItem = (screen: any) => {
    if (navItems.length >= 8) return; // Limit dock size
    const newItems = [...navItems, screen];
    setNavItems(newItems);
    saveDock(newItems);
    setShowAddMenu(false);
  };

  const availableScreens = ALL_SCREENS.filter(s => !navItems.find(n => n.id === s.id));

  return (
    <>
      <AnimatePresence>
        {isEditMode && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 left-4 right-4 z-[60] bg-black/80 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-jsv-orange rounded-full flex items-center justify-center text-black">
                <Settings2 size={18} />
              </div>
              <div>
                <div className="text-xs font-bold text-white tracking-tight">Personalizar Dock</div>
                <div className="text-[8px] font-medium text-gray-400 tracking-widest uppercase">Arrastra o elimina iconos</div>
              </div>
            </div>
            
            <div className="flex gap-2">
              {availableScreens.length > 0 && (
                <button 
                  onClick={() => setShowAddMenu(!showAddMenu)}
                  className="bg-white/5 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-[8px] font-bold tracking-widest uppercase border border-white/5 transition-all"
                >
                  {showAddMenu ? 'Cerrar' : '+ Icono'}
                </button>
              )}
              <button 
                onClick={() => { setIsEditMode(false); setShowAddMenu(false); saveDock(navItems); }} 
                className="bg-jsv-orange text-black px-4 py-2 rounded-xl text-[8px] font-bold tracking-widest uppercase shadow-[0_0_15px_rgba(245,208,97,0.4)] hover:scale-105 transition-all"
              >
                Listo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Menu */}
      <AnimatePresence>
        {showAddMenu && isEditMode && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-44 left-4 right-4 z-[60] bg-black/90 backdrop-blur-2xl border border-white/10 p-4 rounded-3xl shadow-2xl"
          >
            <div className="text-[10px] font-bold text-gray-500 tracking-widest uppercase mb-4 px-2">Añadir al Dock</div>
            <div className="grid grid-cols-4 gap-2">
              {availableScreens.map(screen => (
                <button
                  key={screen.id}
                  onClick={() => addItem(screen)}
                  className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                >
                  <screen.icon size={20} className="text-white" />
                  <span className="text-[8px] text-gray-400 truncate w-full text-center">{screen.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <nav 
        onMouseDown={() => handleLongPressStart('dock')}
        onMouseUp={handleLongPressEnd}
        onMouseLeave={handleLongPressEnd}
        onTouchStart={() => handleLongPressStart('dock')}
        onTouchEnd={handleLongPressEnd}
        className={`fixed bottom-0 left-0 right-0 glass-nav pb-safe z-50 h-[72px] transition-all duration-500 ${isEditMode ? 'bg-white/10 scale-[1.02] mx-4 mb-4 rounded-[32px] border border-white/20' : ''}`}
      >
        <div className="flex justify-around items-center h-full max-w-md mx-auto px-2">
          {navItems.map((item, index) => {
            const isActive = currentScreen === item.id;
            return (
              <motion.div
                key={item.id}
                layout
                onMouseEnter={() => isEditMode && draggedId && moveItem(draggedId, item.id)}
                className="relative flex-1 h-full"
              >
                {/* Magnetism Placeholder */}
                {draggedId === item.id && (
                  <div className="absolute inset-2 border border-dashed border-jsv-orange/40 rounded-xl bg-jsv-orange/5 z-0" />
                )}

                <motion.div
                  onMouseDown={() => handleLongPressStart(item.id)}
                  onMouseUp={handleLongPressEnd}
                  onMouseLeave={handleLongPressEnd}
                  onTouchStart={() => handleLongPressStart(item.id)}
                  onTouchEnd={handleLongPressEnd}
                  drag={isEditMode}
                  dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                  onDragStart={() => setDraggedId(item.id)}
                  onDragEnd={() => { setDraggedId(null); saveDock(navItems); }}
                  animate={isEditMode ? {
                    rotate: [0, -1.5, 0, 1.5, 0],
                    x: [0, -0.5, 0, 0.5, 0],
                    y: [0, 0.5, 0, -0.5, 0],
                    transition: { repeat: Infinity, duration: 0.18, delay: index * 0.02 }
                  } : { rotate: 0, x: 0, y: 0 }}
                  onClick={() => !isEditMode && onNavigate(item.id as Screen)}
                  className="relative flex flex-col items-center justify-center w-full h-full z-10 cursor-pointer"
                  role="button"
                  tabIndex={0}
                >
                  {isActive && !isEditMode && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute top-0 w-8 h-1 bg-jsv-orange rounded-b-full shadow-[0_0_10px_rgba(245,208,97,0.5)]"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                  <div className={`transition-all duration-300 ${isActive ? 'text-jsv-orange scale-110 drop-shadow-[0_0_8px_rgba(245,208,97,0.4)]' : 'text-gray-500 hover:text-gray-300'}`}>
                    <item.icon size={22} strokeWidth={isActive ? 2 : 1.5} />
                  </div>
                  <span className={`text-[10px] mt-1.5 font-medium tracking-wide transition-colors ${isActive ? 'text-white' : 'text-gray-500'}`}>
                    {item.label}
                  </span>

                  {/* Delete Button */}
                  <AnimatePresence>
                    {isEditMode && (
                      <motion.button
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white p-1 rounded-full shadow-lg z-20"
                      >
                        <X size={8} />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </motion.div>
              </motion.div>
            );
          })}
        </div>
      </nav>
    </>
  );
}
