import { doc, collection, setDoc, getDocs, onSnapshot, query, where, orderBy, limit, addDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { generateChatResponse } from './geminiService';

export interface AIAgent {
  id: string;
  name: string;
  role: string;
  specialty: string;
  systemInstruction: string;
  model: string;
  avatar: string;
  color: string;
  status: 'active' | 'idle' | 'busy';
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  assignedAgentIds: string[];
  status: 'pending' | 'in_progress' | 'waiting_user' | 'completed' | 'failed';
  progress: number;
  checkpoints: any[];
  logs: any[];
  createdAt: string;
  updatedAt: string;
}

export interface AgentInteraction {
  id: string;
  taskId?: string;
  senderId: string;
  senderType: 'agent' | 'user' | 'system';
  content: string;
  timestamp: string;
  metadata?: any;
}

export const getAgentProfiles = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'ai_agent_profiles'));
    return querySnapshot.docs.map(doc => doc.data() as AIAgent);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'ai_agent_profiles');
    return [];
  }
};

export const createAgentProfile = async (agent: AIAgent) => {
  try {
    const agentId = agent.id || `agent-${Date.now()}`;
    const finalAgent = { ...agent, id: agentId };
    await setDoc(doc(db, 'ai_agent_profiles', agentId), finalAgent);
    return agentId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `ai_agent_profiles/${agent.id}`);
    return null;
  }
};

export const deleteAgentProfile = async (id: string) => {
  try {
    await deleteDoc(doc(db, 'ai_agent_profiles', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `ai_agent_profiles/${id}`);
  }
};

export const createTask = async (task: Omit<AgentTask, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'agent_tasks'), {
      ...task,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'agent_tasks');
    return null;
  }
};

export const logInteraction = async (interaction: Omit<AgentInteraction, 'id' | 'timestamp'>) => {
  try {
    await addDoc(collection(db, 'agent_interactions'), {
      ...interaction,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'agent_interactions');
  }
};

// Orchestration logic simulation
export const runAgentWorkflow = async (
  taskId: string, 
  agents: AIAgent[], 
  prompt: string,
  options?: { useThinking?: boolean, useSearch?: boolean }
) => {
  // 1. Log initial user request
  await logInteraction({
    taskId,
    senderId: 'user',
    senderType: 'user',
    content: prompt
  });

  // 2. Simulate agent collaboration
  for (const agent of agents) {
    // Update task status
    await setDoc(doc(db, 'agent_tasks', taskId), {
      status: 'in_progress',
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Log agent thinking
    await logInteraction({
      taskId,
      senderId: 'system',
      senderType: 'system',
      content: `${agent.name} está procesando la solicitud...`
    });

    // Configure tools and thinking
    const tools = options?.useSearch ? [{ googleSearch: {} }] : [];
    
    // Call Gemini for this agent
    const response = await generateChatResponse(
      prompt,
      agent.systemInstruction,
      undefined,
      tools
    );

    const agentReply = response.text || 'No pude procesar la solicitud.';

    // Log agent response
    await logInteraction({
      taskId,
      senderId: agent.id,
      senderType: 'agent',
      content: agentReply,
      metadata: { 
        agentName: agent.name, 
        agentColor: agent.color,
        groundingMetadata: response.candidates?.[0]?.groundingMetadata
      }
    });
  }

  // 3. Mark task as waiting for user or completed
  await setDoc(doc(db, 'agent_tasks', taskId), {
    status: 'waiting_user',
    progress: 100,
    updatedAt: new Date().toISOString()
  }, { merge: true });
};
