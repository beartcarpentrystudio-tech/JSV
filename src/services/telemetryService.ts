import { collection, addDoc, serverTimestamp, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TelemetryLog } from '../types';

export const logTelemetry = async (action: string, target: string, metadata?: any) => {
  try {
    if (!auth.currentUser) return;
    
    const log: TelemetryLog = {
      userId: auth.currentUser.uid,
      action,
      target,
      metadata: metadata ? JSON.stringify(metadata) : undefined,
      timestamp: serverTimestamp()
    };

    await addDoc(collection(db, 'telemetry_logs'), log);
  } catch (error) {
    console.error('Error logging telemetry:', error);
  }
};

export const downloadTelemetryLogs = async () => {
  try {
    if (!auth.currentUser) throw new Error('Usuario no autenticado');
    
    const q = query(collection(db, 'telemetry_logs'), orderBy('timestamp', 'desc'), limit(1000));
    const snapshot = await getDocs(q);
    
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
      };
    });

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `telemetry_logs_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    
    return true;
  } catch (error) {
    console.error('Error downloading telemetry logs:', error);
    throw error;
  }
};
