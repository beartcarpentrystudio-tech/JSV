import { collection, doc, getDocs, addDoc, updateDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { AIWorkflow } from '../types';
import { logTelemetry } from './telemetryService';

export const getAIWorkflows = async (): Promise<AIWorkflow[]> => {
  try {
    const q = query(collection(db, 'ai_workflows'), orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AIWorkflow));
  } catch (error) {
    console.error('Error fetching AI workflows:', error);
    return [];
  }
};

export const createAIWorkflow = async (workflow: Omit<AIWorkflow, 'id' | 'timestamp' | 'lastModifiedBy' | 'version'>): Promise<string | null> => {
  try {
    if (!auth.currentUser) return null;
    
    const newWorkflow = {
      ...workflow,
      lastModifiedBy: auth.currentUser.uid,
      version: 1,
      timestamp: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'ai_workflows'), newWorkflow);
    
    await logTelemetry('CREATE_WORKFLOW', docRef.id, { title: workflow.title, version: 1 });
    
    return docRef.id;
  } catch (error) {
    console.error('Error creating AI workflow:', error);
    return null;
  }
};

export const updateAIWorkflow = async (id: string, updates: Partial<AIWorkflow>, currentVersion: number): Promise<boolean> => {
  try {
    if (!auth.currentUser) return false;
    
    const newVersion = currentVersion + 1;
    const docRef = doc(db, 'ai_workflows', id);
    await updateDoc(docRef, {
      ...updates,
      lastModifiedBy: auth.currentUser.uid,
      version: newVersion,
      timestamp: serverTimestamp()
    });
    
    await logTelemetry('UPDATE_WORKFLOW', id, { updates, previousVersion: currentVersion, newVersion });
    
    return true;
  } catch (error) {
    console.error('Error updating AI workflow:', error);
    return false;
  }
};

export const reportWorkflowError = async (workflow: AIWorkflow): Promise<boolean> => {
  try {
    const newErrorCount = workflow.errorCount + 1;
    const newEfficiency = Math.max(0, 100 - (newErrorCount * 5)); // Simple efficiency calculation
    let newStatus: 'green' | 'yellow' | 'red' = 'green';
    
    if (newEfficiency < 50) newStatus = 'red';
    else if (newEfficiency < 80) newStatus = 'yellow';
    
    const success = await updateAIWorkflow(workflow.id, {
      errorCount: newErrorCount,
      efficiency: newEfficiency,
      status: newStatus
    }, workflow.version);
    
    if (success) {
      await logTelemetry('REPORT_WORKFLOW_BUG', workflow.id, { errorCount: newErrorCount, efficiency: newEfficiency });
    }
    
    return success;
  } catch (error) {
    console.error('Error reporting workflow error:', error);
    return false;
  }
};

export const incrementWorkflowUse = async (workflow: AIWorkflow): Promise<boolean> => {
  try {
    return await updateAIWorkflow(workflow.id, {
      useCount: workflow.useCount + 1
    }, workflow.version);
  } catch (error) {
    console.error('Error incrementing workflow use:', error);
    return false;
  }
};
