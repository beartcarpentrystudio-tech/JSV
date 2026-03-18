import React, { useState, useEffect, useMemo } from 'react';
import { Vehicle, PartState, Part } from '../types';
import { useInventory } from '../hooks/useInventory';
import { Package, MessageSquare, Image as ImageIcon, TrendingUp, Calendar, CheckSquare, DollarSign, BarChart3, Bot } from 'lucide-react';
import { MASTER_PARTS } from '../data/inventory';
import { db } from '../firebase';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ModularGrid, GridItem } from '../components/ModularGrid';

interface DashboardProps {
  vehicles: Vehicle[];
  inventoryHook: ReturnType<typeof useInventory>;
  onNavigate: (screen: any) => void;
}

export function Dashboard({ vehicles, inventoryHook, onNavigate }: DashboardProps) {
  const [convCount, setConvCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // Stats
  const { inventory } = inventoryHook;
  
  // Sync conversation stats
  useEffect(() => {
    const q = collection(db, 'conversations');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setConvCount(snapshot.size);
      const unread = snapshot.docs.reduce((acc, doc) => acc + (doc.data().unread || 0), 0);
      setUnreadCount(unread);
    });
    return () => unsubscribe();
  }, []);

  // Calculate Total Inventory Value (Base Price + Adjustments)
  const totalPotentialValue = vehicles.reduce((acc, v) => {
    const vehiclePartsValue = MASTER_PARTS.reduce((sum, part) => {
      const partState = inventory[v.id]?.[part.id];
      if (partState?.price) {
        return sum + partState.price;
      }
      const estimatedPrice = part.basePrice * (v.marketValueFactor || 1.0);
      return sum + estimatedPrice;
    }, 0);
    return acc + vehiclePartsValue;
  }, 0);

  const totalConfirmed = vehicles.reduce((acc, v) => {
    const vehicleData = inventory[v.id] || {};
    return acc + Object.values(vehicleData).filter((p: any) => p.confirmed).length;
  }, 0);

  const totalPartsCount = vehicles.length * MASTER_PARTS.length;
  const totalProgress = (totalConfirmed / totalPartsCount) * 100;

  const stats = {
    quotations: convCount,
    sales: 12,
    scheduled: 3,
    pending: unreadCount
  };

  // Define Dashboard Widgets
  const dashboardItems: GridItem[] = useMemo(() => [
    {
      id: 'hero',
      w: 2,
      h: 1,
      content: (
        <div className="glass-panel rounded-3xl p-6 relative overflow-hidden shadow-[0_0_20px_rgba(255,255,255,0.03)] h-full">
          <div className="relative z-10">
            <h1 className="text-3xl font-medium text-white mb-1 tracking-tight">MondayOS</h1>
            <p className="text-jsv-orange text-[10px] font-medium tracking-widest uppercase mb-6 opacity-90">SISTEMA OPERATIVO v4.4</p>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-light text-white tracking-tighter">{Math.round(totalProgress)}%</span>
                </div>
                <span className="text-gray-400 text-[10px] font-medium tracking-wider uppercase mt-1 block">Auditoría</span>
              </div>
              <div>
                <div className="flex items-end gap-2">
                  <span className="text-2xl font-light text-white tracking-tighter">${totalPotentialValue.toLocaleString()}</span>
                </div>
                <span className="text-gray-400 text-[10px] font-medium tracking-wider uppercase mt-1 block">Valor Total</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 top-0 w-40 h-40 bg-jsv-orange/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
        </div>
      )
    },
    {
      id: 'stat-messages',
      w: 1,
      h: 1,
      content: (
        <div className="glass-panel p-4 rounded-2xl h-full">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <MessageSquare size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wider uppercase">Mensajes</span>
          </div>
          <div className="text-2xl font-light text-white">{stats.quotations}</div>
          <div className="text-[10px] text-gray-500 mt-1">Total Activos</div>
        </div>
      )
    },
    {
      id: 'stat-sales',
      w: 1,
      h: 1,
      content: (
        <div className="glass-panel p-4 rounded-2xl h-full">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <DollarSign size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wider uppercase">Ventas</span>
          </div>
          <div className="text-2xl font-light text-white">{stats.sales}</div>
          <div className="text-[10px] text-white/60 mt-1">Meta: 50</div>
        </div>
      )
    },
    {
      id: 'stat-scheduled',
      w: 1,
      h: 1,
      content: (
        <div className="glass-panel p-4 rounded-2xl h-full">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <Calendar size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wider uppercase">Citas</span>
          </div>
          <div className="text-2xl font-light text-white">{stats.scheduled}</div>
          <div className="text-[10px] text-gray-500 mt-1">Próxima: Mañana</div>
        </div>
      )
    },
    {
      id: 'stat-pending',
      w: 1,
      h: 1,
      content: (
        <div className="glass-panel p-4 rounded-2xl h-full">
          <div className="flex items-center gap-2 mb-2 text-gray-400">
            <CheckSquare size={16} strokeWidth={1.5} />
            <span className="text-[10px] font-medium tracking-wider uppercase">Pendientes</span>
          </div>
          <div className="text-2xl font-light text-white">{stats.pending}</div>
          <div className="text-[10px] text-jsv-orange mt-1">Atención</div>
        </div>
      )
    },
    {
      id: 'breakdown',
      w: 2,
      h: 1,
      content: (
        <div className="glass-panel rounded-2xl p-5 h-full">
          <h3 className="text-xs font-medium text-white mb-4 flex items-center gap-2 tracking-wider uppercase">
            <BarChart3 size={16} className="text-jsv-orange" strokeWidth={1.5} /> DESGLOSE MODELOS
          </h3>
          <div className="space-y-3">
            {vehicles.slice(0, 3).map(v => {
              const vValue = MASTER_PARTS.reduce((sum, part) => {
                const partState = inventory[v.id]?.[part.id];
                if (partState?.price) return sum + partState.price;
                return sum + (part.basePrice * (v.marketValueFactor || 1.0));
              }, 0);
              return (
                <div key={v.id} className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-300 font-medium truncate max-w-[100px]">{v.model}</span>
                  <span className="text-white font-light tracking-wide">${vValue.toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </div>
      )
    },
    {
      id: 'action-agent',
      w: 2,
      h: 1,
      content: (
        <button 
          onClick={() => onNavigate('agent')}
          className="w-full h-full bg-gradient-to-r from-jsv-orange/20 to-jsv-orange/5 border border-jsv-orange/30 text-white p-6 rounded-2xl flex items-center justify-center gap-4 hover:bg-white/10 transition-all shadow-[0_0_20px_rgba(245,208,97,0.1)] group"
        >
          <div className="p-3 bg-jsv-orange/20 rounded-full group-hover:bg-jsv-orange/30 transition-colors border border-jsv-orange/30">
            <Bot size={28} className="text-jsv-orange" strokeWidth={1.5} />
          </div>
          <div className="text-left">
            <div className="text-base font-medium tracking-tight">WORKSPACE IA</div>
            <div className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mt-0.5">ASISTENTE</div>
          </div>
        </button>
      )
    },
    {
      id: 'action-inventory',
      w: 1,
      h: 1,
      content: (
        <button 
          onClick={() => onNavigate('inventory')}
          className="w-full h-full glass-button p-6 rounded-2xl flex flex-col items-center justify-center gap-3 group"
        >
          <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors border border-white/5">
            <Package size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-medium tracking-widest text-gray-400 group-hover:text-white uppercase transition-colors">INVENTARIO</span>
        </button>
      )
    },
    {
      id: 'action-quotes',
      w: 1,
      h: 1,
      content: (
        <button 
          onClick={() => onNavigate('quotes')}
          className="w-full h-full glass-button p-6 rounded-2xl flex flex-col items-center justify-center gap-3 group"
        >
          <div className="p-3 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors border border-white/5">
            <MessageSquare size={28} className="text-white" strokeWidth={1.5} />
          </div>
          <span className="text-[10px] font-medium tracking-widest text-gray-400 group-hover:text-white uppercase transition-colors">COTIZADOR</span>
        </button>
      )
    },
    {
      id: 'action-canvas',
      w: 2,
      h: 1,
      content: (
        <button 
          onClick={() => onNavigate('canvas')}
          className="w-full h-full bg-jsv-orange text-black p-6 rounded-2xl flex items-center justify-center gap-4 hover:bg-white transition-all shadow-[0_0_20px_rgba(245,208,97,0.3)]"
        >
          <ImageIcon size={28} strokeWidth={1.5} />
          <div className="text-left">
            <div className="text-base font-medium tracking-tight">CANVAS STUDIO</div>
            <div className="text-[10px] font-medium tracking-widest uppercase opacity-80 mt-0.5">EDITOR FOTOS</div>
          </div>
        </button>
      )
    }
  ], [vehicles, inventory, totalProgress, totalPotentialValue, stats, onNavigate]);

  return (
    <div className="p-4 pb-24">
      <ModularGrid items={dashboardItems} />
    </div>
  );
}
