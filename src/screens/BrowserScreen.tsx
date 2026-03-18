import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowRight, ExternalLink, ShoppingCart, Globe, Image as ImageIcon, AlertCircle, MessageCircle, Facebook, Youtube, Link as LinkIcon, X, Maximize2, Plus, History, Star, ArrowUpRight, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Tab {
  id: string;
  title: string;
  url: string;
  icon: React.ReactNode;
}

interface HistoryItem {
  url: string;
  title: string;
  timestamp: number;
  type: 'url' | 'search';
}

export function BrowserScreen() {
  const [query, setQuery] = useState('');
  const [customUrl, setCustomUrl] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [suggestions, setSuggestions] = useState<HistoryItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeInput, setActiveInput] = useState<'query' | 'url' | null>(null);
  
  const [tabs, setTabs] = useState<Tab[]>([
    { id: 'home', title: 'Inicio', url: '', icon: <Globe size={16} /> }
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('home');

  const suggestionRef = useRef<HTMLDivElement>(null);

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('browser-history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error('Error loading history', e);
      }
    }
  }, []);

  // Save history to localStorage
  const addToHistory = (item: Omit<HistoryItem, 'timestamp'>) => {
    const newItem: HistoryItem = { ...item, timestamp: Date.now() };
    const updatedHistory = [newItem, ...history.filter(h => h.url !== item.url)].slice(0, 50);
    setHistory(updatedHistory);
    localStorage.setItem('browser-history', JSON.stringify(updatedHistory));
  };

  // Handle outside clicks to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
        setActiveInput(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update suggestions based on input
  useEffect(() => {
    const input = activeInput === 'query' ? query : customUrl;
    if (!input.trim()) {
      setSuggestions([]);
      return;
    }

    const filtered = history.filter(item => 
      item.title.toLowerCase().includes(input.toLowerCase()) || 
      item.url.toLowerCase().includes(input.toLowerCase())
    ).slice(0, 5);
    
    // Add provider suggestions if it's a search query
    const providerSuggestions: HistoryItem[] = activeInput === 'query' ? searchProviders.map(p => ({
      url: p.getUrl(input),
      title: `Buscar en ${p.name}: ${input}`,
      type: 'search',
      timestamp: Date.now()
    })) : [];

    setSuggestions([...filtered, ...providerSuggestions].slice(0, 8));
  }, [query, customUrl, activeInput, history]);

  const searchProviders = [
    { 
      name: 'MercadoLibre', 
      icon: <ShoppingCart className="text-yellow-500" />, 
      color: 'hover:border-yellow-500',
      getUrl: (q: string) => `https://listado.mercadolibre.com.mx/${encodeURIComponent(q)}#D[A:${encodeURIComponent(q)}]`,
      description: 'Precios de mercado local y competencia.'
    },
    { 
      name: 'eBay Motors', 
      icon: <Globe className="text-blue-500" />, 
      color: 'hover:border-blue-500',
      getUrl: (q: string) => `https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(q)}&_sacat=6000`,
      description: 'Referencia internacional y partes difíciles.'
    },
    { 
      name: 'Google Imágenes', 
      icon: <ImageIcon className="text-red-500" />, 
      color: 'hover:border-red-500',
      getUrl: (q: string) => `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(q)}`,
      description: 'Identificación visual y comparativa.'
    },
    { 
      name: 'Google Shopping', 
      icon: <Search className="text-green-500" />, 
      color: 'hover:border-green-500',
      getUrl: (q: string) => `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(q)}`,
      description: 'Comparativa general de precios.'
    },
    {
      name: 'YouTube',
      icon: <Youtube className="text-red-600" />,
      color: 'hover:border-red-600',
      getUrl: (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q + ' tutorial')}`,
      description: 'Tutoriales de instalación y desmontaje.'
    }
  ];

  const socialShortcuts = [
    {
      name: 'WhatsApp Web',
      icon: <MessageCircle className="text-green-500" />,
      url: 'https://web.whatsapp.com/',
      color: 'hover:border-green-500',
      description: 'Comunicación directa con clientes.'
    },
    {
      name: 'Messenger',
      icon: <Facebook className="text-blue-600" />,
      url: 'https://www.messenger.com/',
      color: 'hover:border-blue-600',
      description: 'Gestión de mensajes de Facebook.'
    }
  ];

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query) return;
    addToHistory({ url: query, title: `Búsqueda: ${query}`, type: 'search' });
    setShowSuggestions(false);
  };

  const handleCustomUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl) return;
    let finalUrl = customUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }
    openTab(finalUrl, finalUrl, <LinkIcon size={16} />);
    addToHistory({ url: finalUrl, title: finalUrl, type: 'url' });
    setCustomUrl('');
    setShowSuggestions(false);
  };

  const openTab = (url: string, title: string, icon: React.ReactNode, e?: React.MouseEvent) => {
    e?.preventDefault();
    
    const existingTab = tabs.find(t => t.url === url);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: Tab = {
      id: Date.now().toString(),
      title,
      url,
      icon
    };
    
    setTabs([...tabs, newTab]);
    setActiveTabId(newTab.id);
    addToHistory({ url, title, type: 'url' });
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1]?.id || 'home');
    }
  };

  const renderSuggestions = () => (
    <AnimatePresence>
      {showSuggestions && suggestions.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 mt-2 z-[70] bg-zinc-900/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          <div className="p-2">
            <div className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em] px-3 py-2">Sugerencias e Historial</div>
            {suggestions.map((item, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (item.type === 'search') {
                    setQuery(item.url);
                    handleSearch();
                  } else {
                    openTab(item.url, item.title, <LinkIcon size={16} />);
                  }
                  setShowSuggestions(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 rounded-xl transition-colors group text-left"
              >
                <div className="p-2 bg-white/5 rounded-lg group-hover:bg-white/10 transition-colors">
                  {item.type === 'search' ? <Search size={14} className="text-gray-400" /> : <Globe size={14} className="text-blue-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-white truncate">{item.title}</div>
                  <div className="text-[10px] text-gray-500 truncate">{item.url}</div>
                </div>
                <ArrowUpRight size={14} className="text-gray-600 group-hover:text-white transition-colors" />
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] bg-transparent overflow-hidden">
      
      {/* Tabs Bar */}
      <div className="flex items-center bg-black/40 backdrop-blur-md border-b border-white/10 px-2 pt-2 overflow-x-auto custom-scrollbar shrink-0">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium transition-all min-w-[120px] max-w-[200px] border-t border-x ${
              activeTabId === tab.id 
                ? 'bg-white/10 text-white border-white/20 shadow-[0_-4px_20px_rgba(0,0,0,0.2)]' 
                : 'bg-transparent text-gray-500 border-transparent hover:bg-white/5 hover:text-gray-300'
            }`}
          >
            <span className="shrink-0">{tab.icon}</span>
            <span className="truncate flex-1 text-left tracking-tight">{tab.title}</span>
            {tab.id !== 'home' && (
              <div 
                onClick={(e) => closeTab(tab.id, e)}
                className="shrink-0 p-1 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X size={14} strokeWidth={2} />
              </div>
            )}
          </button>
        ))}
        <button 
          onClick={() => setActiveTabId('home')}
          className="ml-2 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
          title="Nueva Pestaña"
        >
          <Plus size={18} strokeWidth={2} />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 relative bg-black/20">
        {/* Home Tab Content */}
        <div className={`absolute inset-0 overflow-y-auto custom-scrollbar p-6 ${activeTabId === 'home' ? 'block' : 'hidden'}`}>
          <div className="max-w-3xl mx-auto w-full mb-8 mt-4">
            <h2 className="text-3xl font-medium text-white mb-3 text-center tracking-tight">Centro de Investigación</h2>
            <p className="text-gray-400 text-center text-sm mb-8 font-light tracking-wide">
              Consulta múltiples fuentes simultáneamente para cotizar con precisión.
            </p>
            
            <div className="relative" ref={suggestionRef}>
              <form onSubmit={handleSearch} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-jsv-orange/20 to-white/10 rounded-3xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
                <input 
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveInput('query');
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setActiveInput('query');
                    setShowSuggestions(true);
                  }}
                  className="relative w-full bg-black/40 backdrop-blur-xl text-white text-lg rounded-2xl py-4 pl-14 pr-16 border border-white/10 focus:border-jsv-orange focus:bg-black/60 outline-none shadow-2xl transition-all placeholder:text-gray-500 font-light"
                  placeholder="Ej. Alternador Aveo 2012..."
                  autoFocus
                />
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={22} strokeWidth={1.5} />
                <button 
                  type="submit"
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-jsv-orange p-2.5 rounded-xl text-black hover:bg-[#f5d061] transition-colors shadow-[0_0_15px_rgba(245,208,97,0.3)]"
                >
                  <ArrowRight size={20} strokeWidth={2} />
                </button>
              </form>
              {activeInput === 'query' && renderSuggestions()}
            </div>
          </div>

          <div className="max-w-3xl mx-auto w-full mb-10">
            <div className="relative" ref={suggestionRef}>
              <form onSubmit={handleCustomUrl} className="relative">
                <input 
                  value={customUrl}
                  onChange={(e) => {
                    setCustomUrl(e.target.value);
                    setActiveInput('url');
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    setActiveInput('url');
                    setShowSuggestions(true);
                  }}
                  className="w-full bg-white/5 backdrop-blur-md text-white text-sm rounded-xl py-3.5 pl-12 pr-14 border border-white/10 focus:border-blue-500 focus:bg-white/10 outline-none transition-all shadow-sm placeholder:text-gray-500 font-light"
                  placeholder="Abrir enlace directo (ej. www.autozone.com)..."
                />
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
                <button 
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/10 p-2 rounded-lg text-white hover:bg-white/20 transition-colors border border-white/5"
                  title="Abrir en Mirror"
                >
                  <Maximize2 size={16} strokeWidth={1.5} />
                </button>
              </form>
              {activeInput === 'url' && renderSuggestions()}
            </div>
          </div>

          {query && (
            <div className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {searchProviders.map((provider) => (
                <button 
                  key={provider.name}
                  onClick={(e) => openTab(provider.getUrl(query), provider.name, provider.icon, e)}
                  className={`glass-panel p-6 rounded-2xl flex items-center gap-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl group text-left border border-white/5 hover:border-white/20`}
                >
                  <div className="bg-black/40 p-4 rounded-2xl shadow-inner group-hover:bg-black/60 transition-colors shrink-0 border border-white/5">
                    {React.cloneElement(provider.icon as React.ReactElement, { strokeWidth: 1.5, size: 24 } as any)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-white font-medium text-lg truncate tracking-tight">{provider.name}</h3>
                      <Maximize2 size={16} className="text-gray-500 group-hover:text-white shrink-0 transition-colors" strokeWidth={1.5} />
                    </div>
                    <p className="text-gray-400 text-xs line-clamp-2 font-light leading-relaxed">{provider.description}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!query && (
            <div className="max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between mb-4 px-2">
                <h3 className="text-gray-400 text-[10px] font-medium uppercase tracking-[0.2em]">Accesos Directos</h3>
                {history.length > 0 && (
                  <button 
                    onClick={() => {
                      setHistory([]);
                      localStorage.removeItem('browser-history');
                    }}
                    className="text-[8px] text-gray-600 hover:text-red-400 uppercase tracking-widest transition-colors"
                  >
                    Limpiar Historial
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {socialShortcuts.map((shortcut) => (
                  <button 
                    key={shortcut.name}
                    onClick={(e) => openTab(shortcut.url, shortcut.name, shortcut.icon, e)}
                    className={`glass-panel p-5 rounded-2xl flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group text-left border border-white/5 hover:border-white/20`}
                  >
                    <div className="bg-black/40 p-3.5 rounded-xl shadow-inner group-hover:bg-black/60 transition-colors shrink-0 border border-white/5">
                      {React.cloneElement(shortcut.icon as React.ReactElement, { strokeWidth: 1.5, size: 20 } as any)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h3 className="text-gray-200 font-medium truncate tracking-tight">{shortcut.name}</h3>
                        <Maximize2 size={14} className="text-gray-500 group-hover:text-white shrink-0 transition-colors" strokeWidth={1.5} />
                      </div>
                      <p className="text-gray-400 text-xs line-clamp-1 font-light">{shortcut.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="max-w-3xl mx-auto w-full mt-10 bg-blue-900/10 border border-blue-500/20 p-5 rounded-2xl flex gap-4 items-start backdrop-blur-sm">
            <AlertCircle className="text-blue-400 shrink-0 mt-0.5" size={20} strokeWidth={1.5} />
            <div className="text-xs text-blue-200/80 font-light leading-relaxed">
              <p className="font-medium text-blue-300 mb-1 tracking-wide">Acerca de las Pestañas (Mirrors)</p>
              <p>
                Al hacer clic en un proveedor o acceso directo, se abrirá en una nueva pestaña dentro de esta pantalla. Las pestañas se mantienen cargadas en segundo plano para que puedas cambiar entre MercadoLibre, WhatsApp, etc., sin perder tu sesión ni tu búsqueda.
              </p>
            </div>
          </div>
        </div>

        {/* Iframe Tabs */}
        {tabs.filter(t => t.id !== 'home').map(tab => (
          <div 
            key={tab.id} 
            className={`absolute inset-0 flex flex-col ${activeTabId === tab.id ? 'block' : 'hidden'}`}
          >
            <div className="flex justify-between items-center glass-header p-3 border-b border-white/10 shrink-0">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                {tab.icon}
                <div className="flex-1 min-w-0 bg-black/20 rounded-lg px-3 py-1.5 border border-white/5 flex items-center gap-2">
                  <Globe size={12} className="text-gray-500" />
                  <span className="text-white font-medium text-xs truncate tracking-tight">{tab.url}</span>
                </div>
              </div>
              <div className="flex items-center gap-4 ml-4">
                <a href={tab.url} target="_blank" rel="noreferrer" className="text-xs text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-1.5 font-medium tracking-wide transition-colors">
                  Abrir Externo <ExternalLink size={14} strokeWidth={1.5} />
                </a>
              </div>
            </div>
            <div className="w-full flex-1 bg-white relative">
              <iframe 
                src={tab.url} 
                className="w-full h-full border-none"
                title={`Mirror ${tab.title}`}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
