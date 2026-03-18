import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, Bot, ShieldCheck, Sparkles, Palette, Code, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import { AIAgent, getAgentProfiles, createAgentProfile, deleteAgentProfile } from '../services/agentService';
import { motion, AnimatePresence } from 'framer-motion';

export function AgentManagementPanel() {
  const [agents, setAgents] = useState<AIAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<AIAgent | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const profiles = await getAgentProfiles();
      setAgents(profiles);
    } catch (error) {
      toast.error('Error al cargar agentes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar este agente?')) {
      try {
        await deleteAgentProfile(id);
        toast.success('Agente eliminado');
        loadAgents();
      } catch (error) {
        toast.error('Error al eliminar agente');
      }
    }
  };

  const handleSave = async (agentData: Partial<AIAgent>) => {
    try {
      await createAgentProfile(agentData as AIAgent);
      toast.success(editingAgent ? 'Agente actualizado' : 'Agente creado');
      setEditingAgent(null);
      setShowForm(false);
      loadAgents();
    } catch (error) {
      toast.error('Error al guardar agente');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-jsv-orange"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Bot className="text-jsv-orange" size={24} />
          <h2 className="text-lg font-medium text-white tracking-tight">Gestión de Agentes IA</h2>
        </div>
        <button
          onClick={() => {
            setEditingAgent(null);
            setShowForm(true);
          }}
          className="glass-button px-4 py-2 rounded-xl text-[10px] font-bold tracking-widest uppercase flex items-center gap-2 text-white hover:bg-white/10 transition-all"
        >
          <Plus size={14} /> Nuevo Agente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {agents.map((agent) => (
          <motion.div
            key={agent.id}
            layout
            className="glass-panel p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${agent.color || 'bg-jsv-orange'} flex items-center justify-center shadow-lg`}>
                  <Bot size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-white font-medium tracking-tight">{agent.name}</h3>
                  <p className="text-[10px] text-gray-500 font-medium uppercase tracking-widest">{agent.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingAgent(agent);
                    setShowForm(true);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => handleDelete(agent.id)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <Sparkles size={12} />
                <span className="font-medium uppercase tracking-widest">Especialidad:</span>
                <span className="text-gray-300">{agent.specialty}</span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-400">
                <Code size={12} />
                <span className="font-medium uppercase tracking-widest">Modelo:</span>
                <span className="text-gray-300">{agent.model}</span>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5">
                <p className="text-[10px] text-gray-400 line-clamp-2 italic leading-relaxed">
                  "{agent.systemInstruction}"
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel w-full max-w-2xl rounded-[32px] overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-jsv-orange/10 rounded-xl">
                    <Bot className="text-jsv-orange" size={20} />
                  </div>
                  <h3 className="text-lg font-medium text-white tracking-tight">
                    {editingAgent ? 'Editar Agente' : 'Nuevo Perfil de Agente'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
                <AgentForm 
                  initialData={editingAgent || undefined} 
                  onSave={handleSave} 
                  onCancel={() => setShowForm(false)} 
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AgentFormProps {
  initialData?: AIAgent;
  onSave: (data: Partial<AIAgent>) => void;
  onCancel: () => void;
}

function AgentForm({ initialData, onSave, onCancel }: AgentFormProps) {
  const [formData, setFormData] = useState<Partial<AIAgent>>(
    initialData || {
      name: '',
      role: '',
      specialty: '',
      systemInstruction: '',
      model: 'gemini-3.1-pro-preview',
      color: 'bg-jsv-orange',
      status: 'idle'
    }
  );

  const colors = [
    { name: 'Naranja', class: 'bg-jsv-orange' },
    { name: 'Azul', class: 'bg-blue-500' },
    { name: 'Esmeralda', class: 'bg-emerald-500' },
    { name: 'Púrpura', class: 'bg-purple-500' },
    { name: 'Rojo', class: 'bg-red-500' },
    { name: 'Cian', class: 'bg-cyan-500' },
  ];

  const models = [
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro (Complejo)' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Rápido)' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Nombre del Agente</label>
          <input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-jsv-orange transition-all"
            placeholder="Ej. Jarvis"
          />
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Rol / Puesto</label>
          <input
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-jsv-orange transition-all"
            placeholder="Ej. Analista de Inventario"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Especialidad</label>
        <input
          value={formData.specialty}
          onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-jsv-orange transition-all"
          placeholder="Ej. Motores y Transmisiones"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Instrucciones Maestras (System Prompt)</label>
        <textarea
          value={formData.systemInstruction}
          onChange={(e) => setFormData({ ...formData, systemInstruction: e.target.value })}
          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-jsv-orange transition-all h-32 resize-none"
          placeholder="Define cómo debe comportarse, qué tono usar y cuáles son sus límites..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Modelo de IA</label>
          <div className="space-y-2">
            {models.map((m) => (
              <button
                key={m.id}
                onClick={() => setFormData({ ...formData, model: m.id })}
                className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  formData.model === m.id 
                    ? 'bg-jsv-orange/10 border-jsv-orange text-white' 
                    : 'bg-black/20 border-white/5 text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-sm font-medium">{m.name}</span>
                {formData.model === m.id && <Check size={16} className="text-jsv-orange" />}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1">Color de Identidad</label>
          <div className="grid grid-cols-3 gap-3">
            {colors.map((c) => (
              <button
                key={c.class}
                onClick={() => setFormData({ ...formData, color: c.class })}
                className={`h-12 rounded-xl transition-all flex items-center justify-center ${c.class} ${
                  formData.color === c.class ? 'ring-4 ring-white/20 scale-110' : 'opacity-60 hover:opacity-100'
                }`}
              >
                {formData.color === c.class && <Check size={20} className="text-white" />}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-6 flex gap-4">
        <button
          onClick={onCancel}
          className="flex-1 py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase text-gray-400 hover:bg-white/5 transition-all"
        >
          Cancelar
        </button>
        <button
          onClick={() => onSave(formData)}
          className="flex-[2] bg-white text-black py-4 rounded-2xl font-bold tracking-widest uppercase hover:bg-jsv-orange transition-all shadow-xl"
        >
          Guardar Perfil de Agente
        </button>
      </div>
    </div>
  );
}
