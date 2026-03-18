import React, { useState } from 'react';
import { Zap, ClipboardCheck, BarChart2, ChevronRight, Play } from 'lucide-react';
import { Vehicle, Part } from '../types';
import { useInventory } from '../hooks/useInventory';
import { StockBlitzGame } from './StockBlitzGame';

interface TasksScreenProps {
  vehicles: Vehicle[];
  parts: Part[];
  inventoryHook: ReturnType<typeof useInventory>;
}

export function TasksScreen({ vehicles, parts, inventoryHook }: TasksScreenProps) {
  const [activeModule, setActiveModule] = useState<'blitz' | null>(null);

  if (activeModule === 'blitz') {
    return (
      <StockBlitzGame 
        vehicles={vehicles} 
        parts={parts} 
        inventoryHook={inventoryHook} 
        onExit={() => setActiveModule(null)} 
      />
    );
  }

  return (
    <div className="p-4 pb-24 space-y-6">
      
      {/* Hero Section */}
      <div className="glass-panel rounded-3xl p-6 relative overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.03)]">
        <div className="relative z-10">
          <h2 className="text-3xl font-medium text-white mb-2 tracking-tight">Centro de Tareas</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-[80%] font-light">
            Mantén el inventario actualizado completando micro-tareas diarias.
          </p>
          
          <div className="flex gap-4">
            <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-3xl font-light text-white tracking-tighter">12</div>
              <div className="text-[10px] text-gray-500 uppercase font-medium tracking-widest mt-1">Pendientes</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl backdrop-blur-md border border-white/10">
              <div className="text-3xl font-light text-jsv-orange tracking-tighter">85%</div>
              <div className="text-[10px] text-gray-500 uppercase font-medium tracking-widest mt-1">Precisión</div>
            </div>
          </div>
        </div>
        <div className="absolute right-0 top-0 w-40 h-40 bg-jsv-orange/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        <div className="absolute left-0 bottom-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>
      </div>

      {/* Modules Grid */}
      <div className="space-y-4">
        <h3 className="text-[10px] font-medium text-gray-500 uppercase tracking-widest ml-2 mb-4">Módulos Disponibles</h3>
        
        {/* Stock Blitz Module Card */}
        <button 
          onClick={() => setActiveModule('blitz')}
          className="w-full glass-panel rounded-2xl p-5 flex items-center gap-5 hover:border-jsv-orange/50 transition-all group text-left relative overflow-hidden hover:shadow-[0_0_20px_rgba(245,208,97,0.1)]"
        >
          <div className="bg-jsv-orange/10 p-4 rounded-xl text-jsv-orange shrink-0 relative z-10 border border-jsv-orange/20 group-hover:bg-jsv-orange group-hover:text-black transition-colors">
            <Zap size={24} strokeWidth={1.5} />
          </div>
          <div className="flex-1 relative z-10">
            <h4 className="text-white font-medium text-lg tracking-tight group-hover:text-jsv-orange transition-colors">Stock Blitz</h4>
            <p className="text-gray-400 text-xs mt-1 font-light">Juego rápido de verificación. 60 segundos.</p>
          </div>
          <div className="bg-white/5 p-3 rounded-full text-gray-400 group-hover:text-white group-hover:bg-white/10 transition-colors relative z-10 border border-white/5">
            <Play size={20} strokeWidth={1.5} className="ml-0.5" />
          </div>
          
          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-jsv-orange/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out"></div>
        </button>

        {/* Placeholder: Price Audit */}
        <div className="w-full glass-panel rounded-2xl p-5 flex items-center gap-5 opacity-50 grayscale">
          <div className="bg-white/5 p-4 rounded-xl text-gray-400 shrink-0 border border-white/5">
            <BarChart2 size={24} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-gray-300 font-medium text-lg tracking-tight">Auditoría de Precios</h4>
            <p className="text-gray-500 text-xs mt-1 font-light">Próximamente</p>
          </div>
        </div>

        {/* Placeholder: Photo Check */}
        <div className="w-full glass-panel rounded-2xl p-5 flex items-center gap-5 opacity-50 grayscale">
          <div className="bg-white/5 p-4 rounded-xl text-gray-400 shrink-0 border border-white/5">
            <ClipboardCheck size={24} strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <h4 className="text-gray-300 font-medium text-lg tracking-tight">Foto-Check</h4>
            <p className="text-gray-500 text-xs mt-1 font-light">Próximamente</p>
          </div>
        </div>

      </div>
    </div>
  );
}
