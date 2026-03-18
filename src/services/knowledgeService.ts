import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

export interface AISession {
  id?: string;
  topicName: string;
  timestamp: any;
  addedBy: string;
  transcript: string;
  keyPoints: string[];
  workflows: string[];
  conclusions: string;
  errorsAndImprovements: string;
}

export const addSessionMemory = async (session: Omit<AISession, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'ai_sessions'), {
      ...session,
      timestamp: serverTimestamp(),
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'ai_sessions');
  }
};

export const getSessionMemories = async (): Promise<AISession[]> => {
  try {
    const q = query(collection(db, 'ai_sessions'), orderBy('timestamp', 'asc'));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as AISession));
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'ai_sessions');
    return [];
  }
};

export const downloadSessionBackup = async () => {
  const entries = await getSessionMemories();
  
  let content = "=== MONDAY OS AI INTELLIGENT CONTEXT INDEX ===\n\n";
  
  entries.forEach(entry => {
    const date = entry.timestamp?.toDate ? entry.timestamp.toDate().toLocaleString() : new Date().toLocaleString();
    content += `==================================================\n`;
    content += `TEMA: ${entry.topicName.toUpperCase()} | FECHA: ${date}\n`;
    content += `==================================================\n\n`;
    
    content += `[TRANSCRIPCIÓN COMPLETA]\n`;
    content += `${entry.transcript}\n\n`;
    
    content += `[ANÁLISIS E INDEXACIÓN]\n`;
    content += `Puntos Clave:\n${entry.keyPoints.map(k => `- ${k}`).join('\n')}\n\n`;
    content += `Workflows Realizados:\n${entry.workflows.map(w => `- ${w}`).join('\n')}\n\n`;
    content += `Conclusiones:\n${entry.conclusions}\n\n`;
    content += `Errores y Mejoras:\n${entry.errorsAndImprovements}\n\n`;
    content += `\n\n`;
  });

  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mondayos_ai_intelligent_backup_${new Date().toISOString().split('T')[0]}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
