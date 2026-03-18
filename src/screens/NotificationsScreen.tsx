import React from 'react';
import { Bell, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';

export function NotificationsScreen() {
  const notifications = [
    {
      id: 1,
      type: 'warning',
      title: 'Stock Bajo: Alternadores',
      message: 'Quedan menos de 3 alternadores de Aveo en inventario.',
      time: 'Hace 2 horas'
    },
    {
      id: 2,
      type: 'success',
      title: 'Auditoría Completada',
      message: 'El lote #001 ha alcanzado el 85% de auditoría.',
      time: 'Hace 5 horas'
    },
    {
      id: 3,
      type: 'info',
      title: 'Actualización de Mercado',
      message: 'Se han detectado cambios de precio en 15 artículos monitoreados.',
      time: 'Ayer'
    },
    {
      id: 4,
      type: 'alert',
      title: 'Garantía por Vencer',
      message: 'La garantía del folio #8823 (Transmisión Sentra) vence mañana.',
      time: 'Ayer'
    }
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'alert': return <Clock className="text-red-500" size={20} />;
      default: return <Info className="text-blue-500" size={20} />;
    }
  };

  return (
    <div className="p-4 pb-24 space-y-4">
      <div className="flex justify-between items-center mb-4 px-2">
        <h2 className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Centro de Notificaciones</h2>
        <span className="bg-jsv-orange text-black text-[10px] font-medium tracking-widest px-3 py-1 rounded-full shadow-[0_0_10px_rgba(245,208,97,0.3)]">4 NUEVAS</span>
      </div>

      <div className="space-y-3">
        {notifications.map(notif => (
          <div key={notif.id} className="glass-panel p-5 rounded-2xl flex gap-4 hover:bg-white/5 transition-all group">
            <div className="mt-0.5 p-2 bg-black/40 rounded-xl border border-white/5 group-hover:border-white/10 transition-colors">
              {getIcon(notif.type)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <h3 className="text-white font-medium text-sm tracking-tight">{notif.title}</h3>
                <span className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">{notif.time}</span>
              </div>
              <p className="text-gray-400 text-xs mt-1.5 font-light leading-relaxed">{notif.message}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-8">
        <p className="text-gray-500 text-[10px] font-medium tracking-widest uppercase">No hay más notificaciones recientes.</p>
      </div>
    </div>
  );
}
