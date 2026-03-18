import React, { useState } from 'react';
import { Layout, Package, Calculator, PenTool, Shield, Bell, CheckSquare, MessageSquare, Globe, Bot, ChevronRight, Settings, Save } from 'lucide-react';
import { toast } from 'sonner';

interface ComponentConfig {
  id: string;
  name: string;
  icon: any;
  description: string;
  settings: {
    id: string;
    label: string;
    type: 'boolean' | 'number' | 'string' | 'select';
    value: any;
    options?: string[];
  }[];
}

export function ComponentConfigPanel() {
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [configs, setConfigs] = useState<ComponentConfig[]>([
    {
      id: 'inventory',
      name: 'Inventario & Stock',
      icon: Package,
      description: 'Gestión de piezas, vehículos y auditorías de stock.',
      settings: [
        { id: 'low_stock_threshold', label: 'Umbral de Stock Bajo', type: 'number', value: 5 },
        { id: 'auto_audit_frequency', label: 'Frecuencia de Auditoría (días)', type: 'number', value: 30 },
        { id: 'show_part_images', label: 'Mostrar imágenes en lista', type: 'boolean', value: true }
      ]
    },
    {
      id: 'quotes',
      name: 'Cotizador Express',
      icon: Calculator,
      description: 'Cálculo de presupuestos y márgenes de ganancia.',
      settings: [
        { id: 'default_margin', label: 'Margen de ganancia base (%)', type: 'number', value: 25 },
        { id: 'tax_rate', label: 'IVA (%)', type: 'number', value: 16 },
        { id: 'quote_expiry', label: 'Validez de cotización (días)', type: 'number', value: 15 }
      ]
    },
    {
      id: 'canvas',
      name: 'Canvas Studio',
      icon: PenTool,
      description: 'Editor visual para diagramas y planos de piezas.',
      settings: [
        { id: 'grid_size', label: 'Tamaño de cuadrícula (px)', type: 'number', value: 20 },
        { id: 'snap_to_grid', label: 'Ajustar a cuadrícula', type: 'boolean', value: true },
        { id: 'auto_save_interval', label: 'Auto-guardado (seg)', type: 'number', value: 30 }
      ]
    },
    {
      id: 'warranty',
      name: 'Garantías & Auditoría',
      icon: Shield,
      description: 'Checklists de calidad y reportes de garantía.',
      settings: [
        { id: 'require_photo_on_fail', label: 'Requerir foto en fallos', type: 'boolean', value: true },
        { id: 'signature_required', label: 'Firma digital obligatoria', type: 'boolean', value: true }
      ]
    },
    {
      id: 'crm',
      name: 'Mensajería & CRM',
      icon: MessageSquare,
      description: 'Comunicación con clientes y seguimiento de leads.',
      settings: [
        { id: 'auto_reply_enabled', label: 'Respuesta automática activa', type: 'boolean', value: false },
        { id: 'whatsapp_integration', label: 'Integración WhatsApp API', type: 'boolean', value: true }
      ]
    }
  ]);

  const handleSettingChange = (compId: string, settingId: string, newValue: any) => {
    setConfigs(prev => prev.map(comp => {
      if (comp.id === compId) {
        return {
          ...comp,
          settings: comp.settings.map(s => s.id === settingId ? { ...s, value: newValue } : s)
        };
      }
      return comp;
    }));
  };

  const saveAllConfigs = () => {
    // In a real app, this would save to Firebase or LocalStorage
    localStorage.setItem('component_configs', JSON.stringify(configs));
    toast.success('Configuraciones de componentes guardadas');
  };

  const currentComp = configs.find(c => c.id === selectedComponent);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
            <Layout size={20} className="text-jsv-orange" />
            Configuración de Componentes
          </h2>
          <p className="text-xs text-gray-400 mt-1">Ajusta el comportamiento detallado de cada módulo del sistema.</p>
        </div>
        <button 
          onClick={saveAllConfigs}
          className="bg-jsv-orange text-black px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest hover:bg-white transition-colors"
        >
          GUARDAR TODO
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component List */}
        <div className="lg:col-span-1 space-y-2">
          {configs.map((comp) => (
            <button
              key={comp.id}
              onClick={() => setSelectedComponent(comp.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border transition-all text-left ${selectedComponent === comp.id ? 'bg-jsv-orange/10 border-jsv-orange/30 text-white' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}
            >
              <div className={`p-2 rounded-xl ${selectedComponent === comp.id ? 'bg-jsv-orange text-black' : 'bg-white/5 text-gray-400'}`}>
                <comp.icon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{comp.name}</div>
                <div className="text-[10px] opacity-60 truncate">{comp.description}</div>
              </div>
              <ChevronRight size={16} className={selectedComponent === comp.id ? 'text-jsv-orange' : 'text-gray-600'} />
            </button>
          ))}
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-2">
          {currentComp ? (
            <div className="glass-panel p-8 rounded-3xl border border-white/5 space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-4 border-b border-white/10 pb-6">
                <div className="p-3 rounded-2xl bg-jsv-orange/10 text-jsv-orange">
                  <currentComp.icon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-white tracking-tight">{currentComp.name}</h3>
                  <p className="text-sm text-gray-400 font-light">{currentComp.description}</p>
                </div>
              </div>

              <div className="space-y-6">
                {currentComp.settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between group">
                    <div className="space-y-1">
                      <label className="text-sm font-medium text-gray-200 group-hover:text-white transition-colors">{setting.label}</label>
                      <div className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">{setting.id}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      {setting.type === 'boolean' && (
                        <button
                          onClick={() => handleSettingChange(currentComp.id, setting.id, !setting.value)}
                          className={`w-12 h-6 rounded-full transition-all relative ${setting.value ? 'bg-jsv-orange' : 'bg-gray-700'}`}
                        >
                          <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${setting.value ? 'left-7' : 'left-1'}`} />
                        </button>
                      )}

                      {setting.type === 'number' && (
                        <input
                          type="number"
                          value={setting.value}
                          onChange={(e) => handleSettingChange(currentComp.id, setting.id, Number(e.target.value))}
                          className="w-24 bg-black/40 border border-white/10 rounded-xl p-2 text-center text-sm text-white focus:border-jsv-orange outline-none"
                        />
                      )}

                      {setting.type === 'string' && (
                        <input
                          type="text"
                          value={setting.value}
                          onChange={(e) => handleSettingChange(currentComp.id, setting.id, e.target.value)}
                          className="w-48 bg-black/40 border border-white/10 rounded-xl p-2 text-sm text-white focus:border-jsv-orange outline-none"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10 flex justify-end">
                <button 
                  onClick={saveAllConfigs}
                  className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-medium tracking-widest text-white transition-all"
                >
                  <Save size={16} /> GUARDAR ESTE MÓDULO
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center glass-panel rounded-3xl border border-dashed border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                <Settings size={32} className="text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-400">Selecciona un componente</h3>
              <p className="text-sm text-gray-500 max-w-xs mt-2">Elige un módulo de la lista de la izquierda para configurar sus parámetros específicos.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
