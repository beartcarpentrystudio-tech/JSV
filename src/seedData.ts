import { db } from './firebase';
import { collection, doc, setDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { VEHICLES, MASTER_PARTS } from './data/inventory';

export async function seedInitialData() {
  try {
    // Check if already seeded
    const vehiclesSnap = await getDocs(collection(db, 'vehicles'));
    if (!vehiclesSnap.empty) {
      console.log('Data already seeded, skipping...');
      return;
    }

    console.log('Seeding initial data...');

    // Seed Vehicles
    for (const v of VEHICLES) {
      await setDoc(doc(db, 'vehicles', v.id), v);
    }

    // Seed Parts
    for (const p of MASTER_PARTS) {
      await setDoc(doc(db, 'parts', p.id), p);
    }

    // Seed some initial conversations
    const conversations = [
      {
        clientName: 'Juan Mecánico',
        platform: 'whatsapp',
        lastMessage: '¿Tienes el alternador del Aveo?',
        timestamp: serverTimestamp(),
        unread: 1,
        avatarColor: 'bg-green-600'
      },
      {
        clientName: 'Taller Express',
        platform: 'messenger',
        lastMessage: 'Precio de la fascia de versa por favor',
        timestamp: serverTimestamp(),
        unread: 0,
        avatarColor: 'bg-blue-600'
      },
      {
        clientName: 'Cliente Nuevo',
        platform: 'whatsapp',
        lastMessage: 'Busco motor de F-150',
        timestamp: serverTimestamp(),
        unread: 2,
        avatarColor: 'bg-purple-600'
      }
    ];

    for (const conv of conversations) {
      await setDoc(doc(collection(db, 'conversations')), conv);
    }

    // Seed Agent Profiles
    const agents = [
      {
        id: 'agent-analyst',
        name: 'Analista Pro',
        role: 'Estratega de Datos',
        specialty: 'Análisis de mercado y tendencias',
        systemInstruction: 'Eres un analista de datos experto en el mercado de autopartes. Tu objetivo es proporcionar insights basados en datos, comparar precios y sugerir estrategias de venta.',
        model: 'gemini-3.1-pro-preview',
        avatar: '',
        color: 'bg-blue-500',
        status: 'idle'
      },
      {
        id: 'agent-creative',
        name: 'Creativo IA',
        role: 'Content Designer',
        specialty: 'Marketing y redacción creativa',
        systemInstruction: 'Eres un experto en marketing digital para el sector automotriz. Creas descripciones de productos atractivas y estrategias de comunicación para redes sociales.',
        model: 'gemini-3.1-pro-preview',
        avatar: '',
        color: 'bg-purple-500',
        status: 'idle'
      },
      {
        id: 'agent-support',
        name: 'Soporte Técnico',
        role: 'Especialista Mecánico',
        specialty: 'Compatibilidad y fallas técnicas',
        systemInstruction: 'Eres un mecánico experto. Tu función es verificar la compatibilidad de piezas entre modelos y años, y explicar detalles técnicos de las refacciones.',
        model: 'gemini-3.1-pro-preview',
        avatar: '',
        color: 'bg-emerald-500',
        status: 'idle'
      }
    ];

    for (const agent of agents) {
      await setDoc(doc(db, 'ai_agent_profiles', agent.id), agent);
    }

    console.log('Seeding complete!');
  } catch (error) {
    console.error('Error seeding data:', error);
  }
}
