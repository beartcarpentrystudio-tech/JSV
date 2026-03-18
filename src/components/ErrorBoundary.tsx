import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';
import { localDB } from '../services/db';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    
    // Log to IndexedDB for offline persistence
    localDB.errorLogs.add({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      severity: 'high',
      synced: false
    }).catch(err => console.error('Failed to log error to Dexie:', err));
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-zinc-900 border border-white/10 rounded-[32px] p-8 text-center shadow-2xl">
            <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
              <AlertTriangle size={40} className="text-rose-500" />
            </div>
            
            <h1 className="text-2xl font-bold text-white mb-2">Algo salió mal</h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              Hemos detectado un error crítico. El equipo técnico ha sido notificado automáticamente.
            </p>

            <div className="bg-black/40 rounded-2xl p-4 mb-8 text-left overflow-hidden">
              <p className="text-[10px] font-mono text-rose-400 break-all">
                {this.state.error?.message}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-white text-black py-4 rounded-2xl font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
              >
                <RefreshCcw size={18} /> Reintentar
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-white/5 text-white py-4 rounded-2xl font-bold tracking-widest uppercase flex items-center justify-center gap-2 hover:bg-white/10 transition-all border border-white/10"
              >
                <Home size={18} /> Inicio
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
