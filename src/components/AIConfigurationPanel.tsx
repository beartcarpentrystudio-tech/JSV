import React, { useState, useEffect } from 'react';
import { Settings, Activity, Bug, Download, Plus, Save, Edit2, Trash2, CheckCircle2, AlertTriangle, XCircle, BarChart3, Clock, Globe, LayoutTemplate, Copy } from 'lucide-react';
import { AIWorkflow, TelemetryLog } from '../types';
import { getAIWorkflows, createAIWorkflow, updateAIWorkflow, reportWorkflowError } from '../services/aiWorkflowService';
import { downloadTelemetryLogs } from '../services/telemetryService';
import { toast } from 'sonner';

export function AIConfigurationPanel() {
  const [workflows, setWorkflows] = useState<AIWorkflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingWorkflow, setEditingWorkflow] = useState<AIWorkflow | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadWorkflows();
  }, []);

  const loadWorkflows = async () => {
    setLoading(true);
    const data = await getAIWorkflows();
    setWorkflows(data);
    setLoading(false);
  };

  const handleCreateNew = () => {
    setEditingWorkflow({
      id: '',
      title: 'Nuevo Workflow',
      description: '',
      actions: [],
      functionCalls: [],
      categories: [],
      windowsUsed: [],
      websitesUsed: [],
      useCount: 0,
      errorCount: 0,
      efficiency: 100,
      status: 'green',
      lastModifiedBy: '',
      version: 1,
      timestamp: new Date()
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!editingWorkflow) return;
    
    if (editingWorkflow.id) {
      await updateAIWorkflow(editingWorkflow.id, editingWorkflow, editingWorkflow.version);
      toast.success('Workflow actualizado');
    } else {
      await createAIWorkflow(editingWorkflow);
      toast.success('Workflow creado');
    }
    
    setShowForm(false);
    setEditingWorkflow(null);
    loadWorkflows();
  };

  const handleDuplicate = (workflow: AIWorkflow) => {
    setEditingWorkflow({
      ...workflow,
      id: '',
      title: `${workflow.title} (Copia)`,
      useCount: 0,
      errorCount: 0,
      efficiency: 100,
      status: 'green',
      version: 1,
      timestamp: new Date()
    });
    setShowForm(true);
  };

  const handleReportBug = async (workflow: AIWorkflow) => {
    await reportWorkflowError(workflow);
    toast.error('Bug reportado y registrado en logs');
    loadWorkflows();
  };

  const handleDownloadLogs = async () => {
    toast.promise(downloadTelemetryLogs(), {
      loading: 'Descargando logs de telemetría...',
      success: 'Logs descargados exitosamente',
      error: 'Error al descargar logs'
    });
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'green': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'yellow': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'red': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/20';
    }
  };

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'green': return <CheckCircle2 size={14} />;
      case 'yellow': return <AlertTriangle size={14} />;
      case 'red': return <XCircle size={14} />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
            <Settings size={20} className="text-jsv-orange" />
            Configuración y Workflows IA
          </h2>
          <p className="text-xs text-gray-400 mt-1">Gestión, auditoría y telemetría de procesos automatizados.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleDownloadLogs} className="bg-white/5 border border-white/10 hover:bg-white/10 text-white px-3 py-2 rounded-xl text-[10px] font-medium tracking-widest flex items-center gap-2 transition-colors">
            <Download size={14} /> BACKUP LOGS
          </button>
          <button onClick={handleCreateNew} className="bg-jsv-orange text-black px-3 py-2 rounded-xl text-[10px] font-medium tracking-widest flex items-center gap-2 hover:bg-white transition-colors">
            <Plus size={14} /> NUEVO WORKFLOW
          </button>
        </div>
      </div>

      {showForm && editingWorkflow ? (
        <div className="glass-panel p-6 rounded-2xl space-y-4 border border-jsv-orange/30">
          <div className="flex justify-between items-center border-b border-white/10 pb-4">
            <h3 className="text-sm font-medium text-white">{editingWorkflow.id ? 'Editar Workflow' : 'Crear Workflow'}</h3>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><XCircle size={20} /></button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Título</label>
              <input 
                value={editingWorkflow.title}
                onChange={e => setEditingWorkflow({...editingWorkflow, title: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-jsv-orange outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Descripción</label>
              <textarea 
                value={editingWorkflow.description}
                onChange={e => setEditingWorkflow({...editingWorkflow, description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-jsv-orange outline-none h-24"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Acciones (separadas por coma)</label>
                <input 
                  value={editingWorkflow.actions.join(', ')}
                  onChange={e => setEditingWorkflow({...editingWorkflow, actions: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-jsv-orange outline-none"
                  placeholder="Ej: Buscar pieza, Cotizar, Guardar"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Function Calls (separadas por coma)</label>
                <input 
                  value={editingWorkflow.functionCalls.join(', ')}
                  onChange={e => setEditingWorkflow({...editingWorkflow, functionCalls: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-jsv-orange outline-none font-mono"
                  placeholder="Ej: searchInventory, quoteMercadoLibre"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Categorías (separadas por coma)</label>
                <input 
                  value={editingWorkflow.categories.join(', ')}
                  onChange={e => setEditingWorkflow({...editingWorkflow, categories: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-jsv-orange outline-none"
                  placeholder="Ej: Inventario, Cotización, Auditoría"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Ventanas Usadas (separadas por coma)</label>
                <input 
                  value={editingWorkflow.windowsUsed.join(', ')}
                  onChange={e => setEditingWorkflow({...editingWorkflow, windowsUsed: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-jsv-orange outline-none"
                  placeholder="Ej: inventory, quotes, dashboard"
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Sitios Web de Referencia (separados por coma)</label>
                <input 
                  value={editingWorkflow.websitesUsed.join(', ')}
                  onChange={e => setEditingWorkflow({...editingWorkflow, websitesUsed: e.target.value.split(',').map(s=>s.trim()).filter(Boolean)})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm text-white focus:border-jsv-orange outline-none"
                  placeholder="Ej: mercadolibre.com.mx, autozone.com.mx"
                />
              </div>
            </div>

            <button onClick={handleSave} className="w-full bg-jsv-orange text-black py-3 rounded-xl text-xs font-medium tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-colors mt-4">
              <Save size={16} /> GUARDAR CONFIGURACIÓN
            </button>
          </div>
        </div>
      ) : null}

      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-10 text-gray-500 text-sm">Cargando workflows...</div>
        ) : workflows.length === 0 ? (
          <div className="text-center py-10 text-gray-500 text-sm border border-dashed border-white/10 rounded-2xl">
            No hay workflows configurados. Crea uno nuevo para comenzar.
          </div>
        ) : (
          workflows.map(workflow => (
            <div key={workflow.id} className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 hover:border-white/10 transition-colors">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-white font-medium text-lg">{workflow.title}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium tracking-widest border flex items-center gap-1 ${getStatusColor(workflow.status)}`}>
                      {getStatusIcon(workflow.status)} {workflow.efficiency}% EFICIENCIA
                    </span>
                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-0.5 rounded">v{workflow.version}</span>
                  </div>
                  <p className="text-xs text-gray-400">{workflow.description}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleDuplicate(workflow)} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors" title="Duplicar Workflow">
                    <Copy size={16} />
                  </button>
                  <button onClick={() => { setEditingWorkflow(workflow); setShowForm(true); }} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors" title="Editar Workflow">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleReportBug(workflow)} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors" title="Reportar Bug">
                    <Bug size={16} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 py-3 border-y border-white/5">
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><BarChart3 size={12}/> Usos</div>
                  <div className="text-lg text-white font-medium">{workflow.useCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><AlertTriangle size={12}/> Errores</div>
                  <div className="text-lg text-white font-medium">{workflow.errorCount}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Clock size={12}/> Modificado</div>
                  <div className="text-xs text-white font-medium mt-1">{workflow.timestamp?.toDate ? workflow.timestamp.toDate().toLocaleDateString() : 'Reciente'}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-1"><Settings size={12}/> Autor ID</div>
                  <div className="text-xs text-white font-mono mt-1 truncate" title={workflow.lastModifiedBy}>{workflow.lastModifiedBy.substring(0,8)}...</div>
                </div>
              </div>

              <div className="space-y-3">
                {workflow.actions.length > 0 && (
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><LayoutTemplate size={12}/> Esquema de Acciones</div>
                    <div className="flex flex-wrap gap-2">
                      {workflow.actions.map((action, i) => (
                        <span key={i} className="bg-black/40 border border-white/5 text-gray-300 text-[10px] px-2 py-1 rounded-md">{action}</span>
                      ))}
                    </div>
                  </div>
                )}
                
                {workflow.functionCalls.length > 0 && (
                  <div>
                    <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1.5 flex items-center gap-1"><Globe size={12}/> Function Calls & APIs</div>
                    <div className="flex flex-wrap gap-2">
                      {workflow.functionCalls.map((fc, i) => (
                        <span key={i} className="bg-jsv-orange/10 border border-jsv-orange/20 text-jsv-orange text-[10px] px-2 py-1 rounded-md font-mono">{fc}</span>
                      ))}
                    </div>
                  </div>
                )}

                {(workflow.categories.length > 0 || workflow.windowsUsed.length > 0 || workflow.websitesUsed.length > 0) && (
                  <div className="flex flex-wrap gap-4 pt-2 border-t border-white/5">
                    {workflow.categories.length > 0 && (
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Categorías</div>
                        <div className="flex flex-wrap gap-1">
                          {workflow.categories.map((cat, i) => <span key={i} className="text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded">{cat}</span>)}
                        </div>
                      </div>
                    )}
                    {workflow.windowsUsed.length > 0 && (
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ventanas</div>
                        <div className="flex flex-wrap gap-1">
                          {workflow.windowsUsed.map((win, i) => <span key={i} className="text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded">{win}</span>)}
                        </div>
                      </div>
                    )}
                    {workflow.websitesUsed.length > 0 && (
                      <div>
                        <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Sitios Web</div>
                        <div className="flex flex-wrap gap-1">
                          {workflow.websitesUsed.map((web, i) => <span key={i} className="text-xs text-gray-300 bg-white/5 px-2 py-0.5 rounded">{web}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
