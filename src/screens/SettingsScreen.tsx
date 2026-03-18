import { useState, useEffect } from 'react';
import { Save, Trash2, Database, FileText, Plus, X, Sparkles, Settings as SettingsIcon, Activity, Layout, Cpu, Bot } from 'lucide-react';
import { toast } from 'sonner';
import { useInventory } from '../hooks/useInventory';
import { generateNyxUpdate } from '../utils/export';
import { VEHICLES, DEFAULT_WARRANTY_CONFIG } from '../data/inventory';
import { WarrantyConfig } from '../types';
import { AIConfigurationPanel } from '../components/AIConfigurationPanel';
import { AIBehaviorPanel } from '../components/AIBehaviorPanel';
import { AIPersonalizationPanel } from '../components/AIPersonalizationPanel';
import { AgentManagementPanel } from '../components/AgentManagementPanel';
import { ComponentConfigPanel } from '../components/ComponentConfigPanel';
import { SettingsTab } from '../types/ui';

interface SettingsScreenProps {
  inventoryHook: ReturnType<typeof useInventory>;
  agentMode: 'animated' | 'automatic' | 'text';
  setAgentMode: (mode: 'animated' | 'automatic' | 'text') => void;
  initialTab?: SettingsTab;
}

export function SettingsScreen({ inventoryHook, agentMode, setAgentMode, initialTab = 'general' }: SettingsScreenProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab);
  const [shippingThreshold, setShippingThreshold] = useState('1000');
  const [shippingCost, setShippingCost] = useState('80');
  
  // Warranty Config State
  const [warrantyConfig, setWarrantyConfig] = useState<WarrantyConfig>(() => {
    const saved = localStorage.getItem('warranty_config');
    return saved ? JSON.parse(saved) : DEFAULT_WARRANTY_CONFIG;
  });

  const handleExport = () => {
    generateNyxUpdate(inventoryHook.inventory, VEHICLES[0]); 
    toast.success('Sistema exportado correctamente');
  };

  const handleClearData = () => {
    if (confirm('¿Estás seguro? Esto borrará todos los precios y fotos guardados.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const saveWarrantyConfig = () => {
    localStorage.setItem('warranty_config', JSON.stringify(warrantyConfig));
    toast.success('Configuración de garantía guardada');
  };

  const updateCheck = (catIdx: number, checkIdx: number, field: 'name' | 'referenceRange' | 'unit', value: string) => {
    const newConfig = { ...warrantyConfig };
    newConfig.categories[catIdx].checks[checkIdx] = {
      ...newConfig.categories[catIdx].checks[checkIdx],
      [field]: value
    };
    setWarrantyConfig(newConfig);
  };

  const addCheck = (catIdx: number) => {
    const newConfig = { ...warrantyConfig };
    newConfig.categories[catIdx].checks.push({ name: 'Nuevo Punto', referenceRange: '', unit: '' });
    setWarrantyConfig(newConfig);
  };

  const removeCheck = (catIdx: number, checkIdx: number) => {
    const newConfig = { ...warrantyConfig };
    newConfig.categories[catIdx].checks.splice(checkIdx, 1);
    setWarrantyConfig(newConfig);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'ai':
        return (
          <div className="space-y-8">
            <AIBehaviorPanel agentMode={agentMode} setAgentMode={setAgentMode} />
            <AIPersonalizationPanel />
          </div>
        );
      case 'agents':
        return <AgentManagementPanel />;
      case 'workflows':
        return <AIConfigurationPanel />;
      case 'components':
        return <ComponentConfigPanel />;
      default:
        return (
          <div className="space-y-8">
            {/* Export Section (Primary) */}
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 text-jsv-orange">
                <Database size={24} strokeWidth={1.5} />
                <h2 className="text-lg font-medium tracking-tight text-white">Respaldo y Exportación</h2>
              </div>
              <p className="text-xs text-gray-400 font-light leading-relaxed">
                Genera el archivo maestro <code className="bg-white/10 px-1 py-0.5 rounded font-mono text-[10px]">NYX_UPDATE.TXT</code> con todo el código fuente, logs de cambios y la base de datos actual del inventario.
              </p>
              <button 
                onClick={handleExport}
                className="w-full bg-jsv-orange text-black py-4 rounded-xl font-medium tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-white transition-all shadow-[0_0_15px_rgba(245,208,97,0.3)]"
              >
                <Save size={18} strokeWidth={1.5} /> GUARDAR Y EXPORTAR LOTE
              </button>
            </div>

            {/* Warranty Configuration */}
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between text-jsv-orange">
                <div className="flex items-center gap-3">
                  <FileText size={24} strokeWidth={1.5} />
                  <h2 className="text-lg font-medium tracking-tight text-white">Configuración de Garantía</h2>
                </div>
                <button onClick={saveWarrantyConfig} className="text-[10px] font-medium tracking-widest uppercase bg-white/5 border border-white/10 text-white px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">Guardar Cambios</button>
              </div>
              
              <div className="space-y-6">
                {warrantyConfig.categories.map((cat, catIdx) => (
                  <div key={cat.id} className="space-y-3">
                    <h3 className="text-[10px] font-medium tracking-widest text-gray-400 uppercase border-b border-white/10 pb-2">{cat.name}</h3>
                    <div className="space-y-2">
                      {cat.checks.map((check, checkIdx) => (
                        <div key={checkIdx} className="grid grid-cols-12 gap-2 items-center">
                          <input 
                            value={check.name}
                            onChange={(e) => updateCheck(catIdx, checkIdx, 'name', e.target.value)}
                            className="col-span-5 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-jsv-orange transition-colors"
                            placeholder="Componente"
                          />
                          <input 
                            value={check.referenceRange}
                            onChange={(e) => updateCheck(catIdx, checkIdx, 'referenceRange', e.target.value)}
                            className="col-span-4 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-jsv-orange transition-colors"
                            placeholder="Rango"
                          />
                          <input 
                            value={check.unit}
                            onChange={(e) => updateCheck(catIdx, checkIdx, 'unit', e.target.value)}
                            className="col-span-2 bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-jsv-orange transition-colors"
                            placeholder="Unidad"
                          />
                          <button onClick={() => removeCheck(catIdx, checkIdx)} className="col-span-1 text-red-400 hover:text-red-300 flex justify-center transition-colors">
                            <X size={16} strokeWidth={1.5} />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => addCheck(catIdx)} className="text-[10px] font-medium tracking-widest uppercase text-blue-400 flex items-center gap-1 hover:text-blue-300 mt-3 transition-colors">
                        <Plus size={14} strokeWidth={1.5} /> Agregar Punto de Revisión
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Business Rules */}
            <div className="glass-panel rounded-2xl p-6 space-y-4">
              <h3 className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Reglas de Negocio</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-medium tracking-widest text-gray-500 uppercase">Umbral Envío Gratis</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="number" 
                      value={shippingThreshold}
                      onChange={(e) => setShippingThreshold(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-8 text-white text-sm focus:outline-none focus:border-jsv-orange transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-medium tracking-widest text-gray-500 uppercase">Costo Envío Local</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                    <input 
                      type="number" 
                      value={shippingCost}
                      onChange={(e) => setShippingCost(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-3 pl-8 text-white text-sm focus:outline-none focus:border-jsv-orange transition-colors"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="pt-4">
              <button 
                onClick={handleClearData}
                className="w-full bg-red-500/10 border border-red-500/30 text-red-400 py-4 rounded-xl text-[10px] font-medium tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-red-500/20 transition-all"
              >
                <Trash2 size={16} strokeWidth={1.5} /> RESTABLECER SISTEMA DE FÁBRICA
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="p-4 pb-24 space-y-8">
      
      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-4">
        <button 
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'general' ? 'bg-white/10 text-white shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <SettingsIcon size={14} /> General
        </button>
        <button 
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-jsv-orange/10 text-jsv-orange border border-jsv-orange/20 shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Cpu size={14} /> IA Personalización
        </button>
        <button 
          onClick={() => setActiveTab('agents')}
          className={`px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'agents' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Bot size={14} /> Agentes IA
        </button>
        <button 
          onClick={() => setActiveTab('workflows')}
          className={`px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'workflows' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Activity size={14} /> Workflows
        </button>
        <button 
          onClick={() => setActiveTab('components')}
          className={`px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest uppercase transition-all flex items-center gap-2 ${activeTab === 'components' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
        >
          <Layout size={14} /> Componentes
        </button>
      </div>

      <div className="animate-in fade-in duration-500">
        {renderTabContent()}
      </div>
    </div>
  );
}

