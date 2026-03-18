import React, { useState, useEffect } from 'react';
import { Sparkles, Cloud, Download, Upload, Wand2, Save, RotateCcw, FileText, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { optimizePrompt } from '../services/geminiService';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useFirebase } from '../context/FirebaseContext';

export function AIPersonalizationPanel() {
  const { user } = useFirebase();
  const [instructions, setInstructions] = useState(() => localStorage.getItem('ai_custom_instructions') || '');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const handleSaveLocal = () => {
    localStorage.setItem('ai_custom_instructions', instructions);
    toast.success('Instrucciones guardadas localmente');
    setLastSaved(new Date().toLocaleTimeString());
  };

  const handleOptimize = async () => {
    if (!instructions.trim()) {
      toast.error('Escribe algo primero para optimizar');
      return;
    }
    setIsOptimizing(true);
    try {
      const optimized = await optimizePrompt(instructions);
      if (optimized) {
        setInstructions(optimized);
        toast.success('Prompt optimizado con IA');
      }
    } catch (error) {
      toast.error('Error al optimizar el prompt');
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleCloudBackup = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para respaldar en la nube');
      return;
    }
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'user_personalization', user.uid);
      await setDoc(docRef, {
        instructions,
        updatedAt: new Date().toISOString(),
        backup: instructions // Simple backup copy
      }, { merge: true });
      toast.success('Respaldo en la nube completado');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `user_personalization/${user.uid}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    if (!user) {
      toast.error('Debes iniciar sesión para restaurar desde la nube');
      return;
    }
    setIsSyncing(true);
    try {
      const docRef = doc(db, 'user_personalization', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInstructions(data.instructions || '');
        localStorage.setItem('ai_custom_instructions', data.instructions || '');
        toast.success('Configuración restaurada desde la nube');
      } else {
        toast.error('No se encontró respaldo en la nube');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `user_personalization/${user.uid}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadBackup = () => {
    const blob = new Blob([instructions], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mondayos_ai_instructions_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Backup descargado correctamente');
  };

  return (
    <div className="space-y-6 mt-8 pt-8 border-t border-white/10">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-medium tracking-tight text-white flex items-center gap-2">
            <Wand2 size={20} className="text-jsv-orange" />
            Instrucciones Maestras de Personalización
          </h2>
          <p className="text-xs text-gray-400 mt-1">Define cómo quieres que la IA se comporte y responda de forma permanente.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCloudBackup}
            disabled={isSyncing}
            className="bg-white/5 hover:bg-white/10 text-white p-2 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-[10px] font-medium tracking-widest uppercase"
          >
            <Cloud size={14} className={isSyncing ? 'animate-pulse' : ''} />
            {isSyncing ? 'Sincronizando...' : 'Nube'}
          </button>
          <button 
            onClick={handleSaveLocal}
            className="bg-jsv-orange text-black px-4 py-2 rounded-xl text-[10px] font-medium tracking-widest hover:bg-white transition-colors flex items-center gap-2"
          >
            <Save size={14} />
            GUARDAR
          </button>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-2xl space-y-4 border border-white/5">
        <div className="flex items-center justify-between mb-2">
          <label className="text-[10px] text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <FileText size={14} />
            Tu Instrucción de Personalización
          </label>
          {lastSaved && (
            <span className="text-[9px] text-emerald-400 font-medium">Último guardado: {lastSaved}</span>
          )}
        </div>
        
        <textarea 
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Ej: Responde siempre de forma sarcástica pero útil. Prioriza dar precios de piezas usadas sobre nuevas. Usa un lenguaje técnico de mecánica automotriz..."
          className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-4 text-sm text-white focus:border-jsv-orange outline-none transition-all resize-none font-light leading-relaxed placeholder:text-gray-700"
        />

        <div className="flex flex-wrap gap-3 pt-2">
          <button 
            onClick={handleOptimize}
            disabled={isOptimizing}
            className="flex-1 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl border border-white/10 transition-all flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest uppercase group"
          >
            <Sparkles size={16} className={`text-jsv-orange ${isOptimizing ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} />
            {isOptimizing ? 'Optimizando...' : 'Optimizar con IA'}
          </button>
          
          <button 
            onClick={handleCloudRestore}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase"
          >
            <RotateCcw size={16} className="text-blue-400" />
            Restaurar Nube
          </button>

          <button 
            onClick={handleDownloadBackup}
            className="bg-white/5 hover:bg-white/10 text-white px-4 py-3 rounded-xl border border-white/10 transition-all flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase"
          >
            <Download size={16} className="text-emerald-400" />
            Backup Local
          </button>
        </div>

        <div className="mt-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl flex items-start gap-3">
          <ShieldCheck size={18} className="text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-gray-400 leading-relaxed">
            Estas instrucciones se inyectan en cada interacción con la IA. Puedes ser tan específico como desees sobre tu modelo de negocio, tono de voz o reglas de operación.
          </p>
        </div>
      </div>
    </div>
  );
}
