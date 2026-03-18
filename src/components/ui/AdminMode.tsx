import React, { useState } from 'react';
import { Shield, ChevronRight, LayoutDashboard, Package, MessageSquare, CheckSquare, Palette, Bell, FileText, Box, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Screen } from '../../types/ui';

interface AdminModeProps {
  onNavigate: (screen: Screen) => void;
}

export function AdminMode({ onNavigate }: AdminModeProps) {
  const [isOpen, setIsOpen] = useState(false);

  const modules = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Inventario', icon: Package },
    { id: 'messages', label: 'Mensajes CRM', icon: MessageSquare },
    { id: 'tasks', label: 'Tareas / Blitz', icon: CheckSquare },
    { id: 'quotes', label: 'Cotizador', icon: FileText },
    { id: 'canvas', label: 'Canvas Studio', icon: Box },
    { id: 'browser', label: 'Navegador Web', icon: Globe },
    { id: 'notifications', label: 'Notificaciones', icon: Bell },
    { id: 'settings', label: 'Configuración', icon: Palette },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-bold tracking-widest uppercase transition-all border ${
          isOpen 
            ? 'bg-jsv-orange text-black border-jsv-orange shadow-[0_0_15px_rgba(245,208,97,0.4)]' 
            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'
        }`}
      >
        <Shield size={14} strokeWidth={2.5} />
        Admin
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-64 glass-panel rounded-2xl overflow-hidden z-[101] shadow-2xl border border-white/10"
            >
              <div className="p-4 border-b border-white/5 bg-white/5">
                <h3 className="text-white text-[10px] font-bold tracking-widest uppercase flex items-center gap-2">
                  <Shield size={12} className="text-jsv-orange" />
                  Panel de Control Admin
                </h3>
              </div>
              <div className="p-2 max-h-[70vh] overflow-y-auto custom-scrollbar">
                {modules.map((module) => (
                  <button
                    key={module.id}
                    onClick={() => {
                      onNavigate(module.id as Screen);
                      setIsOpen(false);
                    }}
                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-white/5 text-gray-400 group-hover:text-jsv-orange group-hover:bg-jsv-orange/10 transition-all">
                        <module.icon size={18} strokeWidth={1.5} />
                      </div>
                      <span className="text-sm text-gray-300 group-hover:text-white transition-colors font-light">{module.label}</span>
                    </div>
                    <ChevronRight size={14} className="text-gray-600 group-hover:text-jsv-orange transition-colors" />
                  </button>
                ))}
              </div>
              <div className="p-3 bg-black/20 border-t border-white/5">
                <p className="text-[9px] text-gray-500 text-center font-medium tracking-widest uppercase">
                  Modo de Auditoría Activo
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
