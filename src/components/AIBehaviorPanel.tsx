import React, { useState, useEffect } from 'react';
import { Sparkles, Zap, MessageSquare, Cpu, Languages, ShieldCheck, Gauge, Settings } from 'lucide-react';
import { toast } from 'sonner';

interface AIBehaviorPanelProps {
  agentMode: 'animated' | 'automatic' | 'text';
  setAgentMode: (mode: 'animated' | 'automatic' | 'text') => void;
}

export function AIBehaviorPanel({ agentMode, setAgentMode }: AIBehaviorPanelProps) {
  const [selectedModel, setSelectedModel] = useState(() => localStorage.getItem('ai_model') || 'gemini-3.1-flash-lite-preview');
  const [temperature, setTemperature] = useState(() => Number(localStorage.getItem('ai_temperature')) || 0.7);
  const [maxTokens, setMaxTokens] = useState(() => Number(localStorage.getItem('ai_max_tokens')) || 2048);
  const [personality, setPersonality] = useState(() => localStorage.getItem('ai_personality') || 'professional');
  const [language, setLanguage] = useState(() => localStorage.getItem('ai_language') || 'es');

  const saveSettings = () => {
    localStorage.setItem('ai_model', selectedModel);
    localStorage.setItem('ai_temperature', temperature.toString());
    localStorage.setItem('ai_max_tokens', maxTokens.toString());
    localStorage.setItem('ai_personality', personality);
    localStorage.setItem('ai_language', language);
    toast.success('Configuración de IA guardada');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
            <Sparkles size={20} className="text-jsv-orange" />
            Comportamiento y Personalización IA
          </h2>
          <p className="text-xs text-gray-400 mt-1">Configura el cerebro y la personalidad de tu asistente.</p>
        </div>
        <button 
          onClick={saveSettings}
          className="bg-jsv-orange text-black px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest hover:bg-white transition-colors"
        >
          GUARDAR CAMBIOS
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Model Selection */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Cpu size={18} className="text-jsv-orange" />
            Modelo de Lenguaje
          </h3>
          <div className="space-y-3">
            <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${selectedModel === 'gemini-3.1-flash-lite-preview' ? 'bg-jsv-orange/10 border-jsv-orange/30 text-white' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}>
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="model" 
                  checked={selectedModel === 'gemini-3.1-flash-lite-preview'} 
                  onChange={() => setSelectedModel('gemini-3.1-flash-lite-preview')}
                  className="accent-jsv-orange"
                />
                <div>
                  <div className="text-xs font-medium">Gemini 3.1 Flash Lite</div>
                  <div className="text-[10px] opacity-60">Baja latencia, respuestas instantáneas</div>
                </div>
              </div>
              <Zap size={14} className={selectedModel === 'gemini-3.1-flash-lite-preview' ? 'text-jsv-orange' : 'text-gray-600'} />
            </label>

            <label className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${selectedModel === 'gemini-3.1-pro-preview' ? 'bg-jsv-orange/10 border-jsv-orange/30 text-white' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}>
              <div className="flex items-center gap-3">
                <input 
                  type="radio" 
                  name="model" 
                  checked={selectedModel === 'gemini-3.1-pro-preview'} 
                  onChange={() => setSelectedModel('gemini-3.1-pro-preview')}
                  className="accent-jsv-orange"
                />
                <div>
                  <div className="text-xs font-medium">Gemini 3.1 Pro</div>
                  <div className="text-[10px] opacity-60">Razonamiento complejo y precisión</div>
                </div>
              </div>
              <ShieldCheck size={14} className={selectedModel === 'gemini-3.1-pro-preview' ? 'text-jsv-orange' : 'text-gray-600'} />
            </label>
          </div>
        </div>

        {/* Agent Interaction Mode */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Gauge size={18} className="text-jsv-orange" />
            Modo de Interacción
          </h3>
          <div className="space-y-2">
            {[
              { id: 'animated', label: 'Manual (Animado)', desc: 'Muestra clics paso a paso' },
              { id: 'automatic', label: 'Automático', desc: 'Acción directa sin esperas' },
              { id: 'text', label: 'Solo Texto', desc: 'Respuesta sin navegación' }
            ].map((mode) => (
              <label key={mode.id} className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${agentMode === mode.id ? 'bg-white/10 border-white/20 text-white' : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'}`}>
                <input 
                  type="radio" 
                  checked={agentMode === mode.id} 
                  onChange={() => setAgentMode(mode.id as any)}
                  className="mt-1 accent-jsv-orange"
                />
                <div>
                  <div className="text-xs font-medium">{mode.label}</div>
                  <div className="text-[10px] opacity-60">{mode.desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Personality & Tone */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-jsv-orange" />
            Personalidad y Tono
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block">Perfil de Respuesta</label>
              <select 
                value={personality}
                onChange={(e) => setPersonality(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-jsv-orange outline-none"
              >
                <option value="professional">Profesional y Directo</option>
                <option value="friendly">Amigable y Colaborativo</option>
                <option value="technical">Técnico y Detallado</option>
                <option value="creative">Creativo e Inspirador</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 block">Idioma Preferido</label>
              <div className="flex items-center gap-2">
                <Languages size={14} className="text-gray-500" />
                <select 
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white focus:border-jsv-orange outline-none"
                >
                  <option value="es">Español (México)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Parameters */}
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
          <h3 className="text-sm font-medium text-white flex items-center gap-2">
            <Settings size={18} className="text-jsv-orange" />
            Parámetros Avanzados
          </h3>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest">Temperatura ({temperature})</label>
                <span className="text-[10px] text-gray-400">{temperature > 0.7 ? 'Creativo' : 'Preciso'}</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="1" 
                step="0.1" 
                value={temperature}
                onChange={(e) => setTemperature(Number(e.target.value))}
                className="w-full accent-jsv-orange"
              />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] text-gray-500 uppercase tracking-widest">Límite de Tokens ({maxTokens})</label>
              </div>
              <input 
                type="range" 
                min="256" 
                max="4096" 
                step="256" 
                value={maxTokens}
                onChange={(e) => setMaxTokens(Number(e.target.value))}
                className="w-full accent-jsv-orange"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
