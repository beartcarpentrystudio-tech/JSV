import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BottomNav } from './components/ui/BottomNav';
import { Header } from './components/ui/Header';
import { Dashboard } from './screens/Dashboard';
import { InventoryScreen } from './screens/InventoryScreen';
import { QuotesScreen } from './screens/QuotesScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CanvasScreen } from './screens/CanvasScreen';
import { WarrantyScreen } from './screens/WarrantyScreen';
import { NotificationsScreen } from './screens/NotificationsScreen';
import { TasksScreen } from './screens/TasksScreen';
import { BrowserScreen } from './screens/BrowserScreen';
import { MessagesScreen } from './screens/MessagesScreen';
import { AIAgent } from './components/AIAgent';
import { AgentWorkspace } from './screens/AgentWorkspace';
import { LiveVoiceScreen } from './screens/LiveVoiceScreen';
import { Screen } from './types/ui';
import { VEHICLES, MASTER_PARTS } from './data/inventory';
import { useInventory } from './hooks/useInventory';
import { ThemeProvider } from './context/ThemeContext';
import { FirebaseProvider, useFirebase } from './context/FirebaseContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { X, LogIn, ShieldCheck } from 'lucide-react';

function LoginScreen() {
  const { login } = useFirebase();
  return (
    <div className="min-h-screen bg-jsv-black flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-20">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-jsv-orange rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white rounded-full blur-[120px]" />
      </div>
      
      <div className="glass-panel p-10 rounded-[40px] max-w-md w-full text-center relative z-10 border border-white/10 shadow-2xl">
        <div className="w-20 h-20 bg-jsv-orange/10 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-jsv-orange/20 shadow-[0_0_30px_rgba(245,208,97,0.1)]">
          <ShieldCheck size={40} className="text-jsv-orange" strokeWidth={1.5} />
        </div>
        <h1 className="text-4xl font-medium text-white mb-3 tracking-tight">MondayOS</h1>
        <p className="text-gray-400 font-light mb-10 leading-relaxed">
          Sistema de Gestión y Auditoría Industrial JSV-AUTOPARTES.
        </p>
        
        <button
          onClick={login}
          className="w-full bg-white text-black py-4 rounded-2xl font-bold tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-gray-100 transition-all active:scale-[0.98] shadow-xl"
        >
          <LogIn size={20} />
          Acceder con Google
        </button>
        
        <p className="mt-8 text-[10px] text-gray-500 font-medium tracking-widest uppercase opacity-50">
          Acceso Restringido a Personal Autorizado
        </p>
      </div>
    </div>
  );
}

import { initWorkflowAutomation } from './services/workflowService';

function AppContent() {
  const { user, loading } = useFirebase();
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [agentMode, setAgentMode] = useState<'animated' | 'automatic' | 'text'>('animated');
  const [globalSearch, setGlobalSearch] = useState('');
  const [canvasInitialData, setCanvasInitialData] = useState<any>(null);
  
  useEffect(() => {
    if (user) {
      initWorkflowAutomation();
    }
  }, [user]);
  
  const inventoryHook = useInventory(VEHICLES[0].id);

  if (loading) return null;
  if (!user) return <LoginScreen />;

  const handleNavigate = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const openWarranty = () => setShowWarrantyModal(true);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'dashboard':
      case 'agent':
        return (
          <>
            <Header title="MondayOS" subtitle="DASHBOARD" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <Dashboard 
              vehicles={VEHICLES} 
              inventoryHook={inventoryHook}
              onNavigate={handleNavigate}
            />
          </>
        );
      case 'inventory':
        return (
          <>
            <Header title="Inventario" subtitle="LOTE #001" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <InventoryScreen 
              vehicles={VEHICLES}
              parts={MASTER_PARTS}
              inventoryHook={inventoryHook}
              onOpenWarranty={openWarranty}
              globalSearch={globalSearch}
              setGlobalSearch={setGlobalSearch}
            />
          </>
        );
      case 'quotes':
        return (
          <>
            <Header title="Cotizador" subtitle="EXPRESS" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <QuotesScreen 
              onOpenWarranty={openWarranty} 
              onExportToCanvas={(data) => {
                setCanvasInitialData(data);
                setCurrentScreen('canvas');
              }}
            />
          </>
        );
      case 'canvas':
        return (
          <>
            <Header title="Canvas Studio" subtitle="EDITOR" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <CanvasScreen initialData={canvasInitialData} onClearInitialData={() => setCanvasInitialData(null)} />
          </>
        );
      case 'notifications':
        return (
          <>
            <Header title="Notificaciones" subtitle="CENTRO DE AVISOS" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <NotificationsScreen />
          </>
        );
      case 'tasks':
        return (
          <>
            <Header title="Tareas" subtitle="STOCK BLITZ" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <TasksScreen 
              vehicles={VEHICLES}
              parts={MASTER_PARTS}
              inventoryHook={inventoryHook}
            />
          </>
        );
      case 'messages':
        return (
          <>
            <Header title="Mensajes" subtitle="CRM" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <MessagesScreen 
              vehicles={VEHICLES}
              parts={MASTER_PARTS}
              inventoryHook={inventoryHook}
            />
          </>
        );
      case 'browser':
        return (
          <>
            <Header title="Navegador" subtitle="WEB" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <BrowserScreen />
          </>
        );
      case 'agent-workspace':
        return (
          <>
            <Header title="Orquestador" subtitle="EQUIPO IA" onSettingsClick={() => setCurrentScreen('settings')} onNavigate={handleNavigate} />
            <AgentWorkspace onNavigate={handleNavigate} />
          </>
        );
      case 'live-voice':
        return <LiveVoiceScreen onClose={() => setCurrentScreen('dashboard')} />;
      case 'settings':
      case 'settings-ai':
      case 'settings-workflows':
      case 'settings-components':
        return (
          <>
            <Header title="Ajustes" subtitle="SISTEMA" onSettingsClick={() => {}} onNavigate={handleNavigate} />
            <SettingsScreen 
              inventoryHook={inventoryHook} 
              agentMode={agentMode}
              setAgentMode={setAgentMode}
              initialTab={
                currentScreen === 'settings-ai' ? 'ai' : 
                currentScreen === 'settings-workflows' ? 'workflows' :
                currentScreen === 'settings-components' ? 'components' :
                'general'
              }
            />
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-jsv-orange selection:text-black transition-colors duration-300">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentScreen}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="min-h-screen"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      
      {/* Warranty Modal */}
      {showWarrantyModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-4xl h-[90vh] rounded-3xl overflow-hidden relative flex flex-col shadow-2xl border border-white/10">
            <button 
              onClick={() => setShowWarrantyModal(false)}
              className="absolute top-4 right-4 z-50 glass-button text-white p-2 rounded-full hover:bg-white/10"
            >
              <X size={20} />
            </button>
            <div className="flex-1 overflow-y-auto">
              <WarrantyScreen onBack={() => setShowWarrantyModal(false)} />
            </div>
          </div>
        </div>
      )}

      <BottomNav currentScreen={currentScreen} onNavigate={handleNavigate} />
      
      <AIAgent 
        mode={agentMode}
        setAgentMode={setAgentMode}
        onNavigate={handleNavigate}
        currentScreen={currentScreen}
        setGlobalSearch={setGlobalSearch}
        inventoryHook={inventoryHook}
        vehicles={VEHICLES}
        parts={MASTER_PARTS}
        forceOpen={currentScreen === 'agent'}
      />

      <Toaster position="top-center" theme="dark" toastOptions={{ className: 'glass-panel text-white border-white/10' }} />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <FirebaseProvider>
          <AppContent />
        </FirebaseProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
