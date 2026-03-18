import React, { useState, useEffect, useRef } from 'react';
import { Vehicle, Part } from '../types';
import { useInventory } from '../hooks/useInventory';
import { ArrowLeft, Search, Image as ImageIcon, Check, ChevronRight, ChevronLeft, List, Grid, StickyNote, Camera, Copy, Download, FileText, Share2, DollarSign, RefreshCw, Globe, UploadCloud, FileSearch, ExternalLink, Zap, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { AssetGenerator } from '../components/AssetGenerator';
import { generateStandardQuote, generateFastQuote } from '../utils/textGenerator';
import { fetchMarketData } from '../services/marketService';

interface AuditDeckProps {
  vehicle: Vehicle;
  parts: Part[];
  inventoryHook: ReturnType<typeof useInventory>;
  onBack: () => void;
  onOpenWarranty: () => void;
  globalSearch?: string;
}

type ViewMode = 'focus' | 'list' | 'grid';

export function AuditDeck({ vehicle, parts, inventoryHook, onBack, onOpenWarranty, globalSearch }: AuditDeckProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewMode, setViewMode] = useState<ViewMode>('list'); // Default to List/Card view
  const [searchQuery, setSearchQuery] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [marketLoading, setMarketLoading] = useState<string | null>(null); // Part ID being loaded
  const [batchLoading, setBatchLoading] = useState(false);
  const [showReportId, setShowReportId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { getPartState, updatePartPrice, updatePartUrl } = inventoryHook;

  useEffect(() => {
    if (globalSearch) {
      // If global search has the part name, we can pre-filter or set search query
      // For simplicity, we just set the local search query to the global one
      // but we might want to strip the vehicle model from it
      const partNameMatch = parts.find(p => globalSearch.toLowerCase().includes(p.name.toLowerCase()));
      if (partNameMatch) {
        setSearchQuery(partNameMatch.name);
      }
    }
  }, [globalSearch, parts]);


  // Filter parts based on search
  const filteredParts = parts.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentPart = filteredParts[currentIndex] || parts[0];
  const state = getPartState(vehicle.id, currentPart?.id);

  // Global Paste Listener for "Magic Paste"
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (viewMode !== 'focus') return;
      
      // Handle Image Paste (Blob)
      if (e.clipboardData?.files.length) {
        const file = e.clipboardData.files[0];
        if (file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = () => handleImageInput(reader.result as string);
          reader.readAsDataURL(file);
          e.preventDefault();
        }
      } 
      // Handle URL Paste (String)
      else {
        const text = e.clipboardData?.getData('text');
        if (text && (text.startsWith('http') || text.startsWith('data:image'))) {
          handleImageInput(text);
          e.preventDefault();
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [currentIndex, viewMode, vehicle.id, currentPart?.id]);

  const handleImageInput = (val: string) => {
    // Only handle base64 (from file upload/paste)
    if (val.startsWith('data:image')) {
      updatePartUrl(vehicle.id, currentPart.id, val);
      toast.success('Imagen capturada', { description: 'Generando activos...' });
    } else {
      toast.error('Formato no soportado', { description: 'Por favor, arrastra una imagen o pégala directamente.' });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => handleImageInput(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => handleImageInput(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePriceChange = (delta: number) => {
    updatePartPrice(vehicle.id, currentPart.id, delta);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  const downloadImage = () => {
    if (!generatedImage) return;
    const link = document.createElement('a');
    link.href = generatedImage;
    link.download = `JSV_${vehicle.model}_${currentPart.name}.png`;
    link.click();
    toast.success('Imagen descargada');
  };

  const nextPart = () => {
    if (currentIndex < filteredParts.length - 1) setCurrentIndex(prev => prev + 1);
  };

  const prevPart = () => {
    if (currentIndex > 0) setCurrentIndex(prev => prev - 1);
  };

  const handleAutoPrice = async (part: Part) => {
    setMarketLoading(part.id);
    toast.info(`Analizando mercado para ${part.name}...`);
    try {
      const data = await fetchMarketData(part.name, vehicle.model);
      
      // Update Price
      // We calculate the delta needed to reach the average price
      const currentPrice = getPartState(vehicle.id, part.id).price;
      const delta = data.price.average - currentPrice;
      
      updatePartPrice(vehicle.id, part.id, delta, {
        report: data.report,
        referenceUrl: data.referenceUrl,
        referenceUrlNew: data.referenceUrlNew || '',
        priceNew: data.price.new || 0,
        priceUsed: data.price.used || 0,
        timestamp: new Date().toISOString(),
        source: data.source
      });
      
      toast.success('Precio actualizado', {
        description: `Sugerido: $${data.price.average}`
      });
    } catch (error) {
      toast.error('Error al conectar con MercadoLibre');
    } finally {
      setMarketLoading(null);
    }
  };

  const handleBatchAutoPrice = async () => {
    setBatchLoading(true);
    const batchSize = 10;
    // Filter parts that haven't been priced yet (price === 0 or base price) or just take the next 10
    // For simplicity, we take the first 10 visible parts
    const batch = filteredParts.slice(0, batchSize);
    
    toast.info(`Iniciando cotización masiva de ${batch.length} piezas...`);

    let completed = 0;
    for (const part of batch) {
      try {
        await handleAutoPrice(part);
        completed++;
      } catch (e) {
        console.error(e);
      }
    }
    
    setBatchLoading(false);
    toast.success(`Cotización masiva completada (${completed}/${batch.length})`);
  };

  // Search Queries
  const mlQuery = encodeURIComponent(`${currentPart?.name} ${vehicle.model} ${vehicle.yearRange} USADO`);
  const googleQuery = encodeURIComponent(`${currentPart?.name} ${vehicle.model} ${vehicle.yearRange} site:mercadolibre.com.mx`);
  const mlUrl = `https://listado.mercadolibre.com.mx/${mlQuery}`;
  const googleUrl = `https://www.google.com/search?tbm=isch&q=${googleQuery}`;

  const getQuoteParams = () => ({
    vehicle: `${vehicle.model} (${vehicle.yearRange})`,
    partName: currentPart.name,
    priceVD: state.price,
    priceAC: state.price - 200, // Default logic
  });

  if (filteredParts.length === 0) return <div>No parts found</div>;

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-transparent pb-20">
      {/* Top Bar */}
      <div className="flex flex-col gap-3 p-4 border-b border-white/10 glass-header">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="p-2 -ml-2 text-gray-400 hover:text-white transition-colors active:scale-95">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <div className="text-center">
            <div className="text-[10px] text-gray-400 font-medium tracking-widest uppercase">{vehicle.model}</div>
            <div className="text-sm font-medium text-white tracking-tight">
              {viewMode === 'focus' ? `Pieza ${currentIndex + 1}/${filteredParts.length}` : `${filteredParts.length} Piezas`}
            </div>
          </div>
          <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
             {/* View Toggles */}
             <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white/10 text-jsv-orange shadow-sm' : 'text-gray-500 hover:text-white'}`}><List size={18} strokeWidth={1.5} /></button>
             <button onClick={() => setViewMode('focus')} className={`p-2 rounded-lg transition-all ${viewMode === 'focus' ? 'bg-white/10 text-jsv-orange shadow-sm' : 'text-gray-500 hover:text-white'}`}><Camera size={18} strokeWidth={1.5} /></button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
          <input 
            type="text" 
            placeholder="Buscar pieza (ej. Alternador)..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-jsv-orange focus:bg-white/10 placeholder:text-gray-500 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          />
        </div>

        {/* Batch Actions (Only in List Mode) */}
        {viewMode === 'list' && (
          <div className="flex gap-2 mt-1">
            <button 
              onClick={handleBatchAutoPrice}
              disabled={batchLoading}
              className="w-full glass-button py-3 rounded-2xl text-xs font-medium tracking-wide flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {batchLoading ? <RefreshCw className="animate-spin" size={16} strokeWidth={1.5} /> : <Zap size={16} strokeWidth={1.5} className="text-jsv-orange" />}
              AUTO-COTIZAR LOTE (10 PIEZAS)
            </button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          <div className="p-4 space-y-4">
            {filteredParts.map((part, idx) => {
              const partState = getPartState(vehicle.id, part.id);
              const isLoading = marketLoading === part.id;
              const hasReport = !!partState.marketData;
              
              return (
                <div key={part.id} className="glass-panel p-5 rounded-3xl flex flex-col gap-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-white text-lg tracking-tight">{part.name}</h3>
                      <span className="text-[10px] font-mono text-gray-500 tracking-widest">{part.id}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-medium text-white tracking-tight">${partState.price.toLocaleString()}</div>
                      <div className="text-[10px] text-jsv-orange font-medium tracking-widest">PRECIO BASE</div>
                    </div>
                  </div>

                  {/* Market Report Expansion */}
                  {showReportId === part.id && partState.marketData && (
                    <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
                      <div className="flex justify-between items-center text-gray-400 border-b border-white/10 pb-2">
                        <span className="font-medium tracking-widest uppercase text-[10px]">REPORTE DE MERCADO</span>
                        <span className="font-light">{new Date(partState.marketData.timestamp).toLocaleDateString()}</span>
                      </div>
                      <pre className="whitespace-pre-wrap font-mono text-gray-300 text-[10px] leading-relaxed">
                        {partState.marketData.report}
                      </pre>
                      <div className="grid grid-cols-2 gap-3 pt-2">
                        <a 
                          href={partState.marketData.referenceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-white/5 text-white py-2.5 rounded-xl border border-white/10 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-widest transition-colors"
                        >
                          <span className="flex items-center gap-2"><ExternalLink size={14} strokeWidth={1.5} /> VER USADOS</span>
                          {partState.marketData.priceUsed && <span className="text-jsv-orange text-xs">${partState.marketData.priceUsed.toLocaleString()}</span>}
                        </a>
                        {partState.marketData.referenceUrlNew && (
                          <a 
                            href={partState.marketData.referenceUrlNew} 
                            target="_blank" 
                            rel="noreferrer"
                            className="bg-white/5 text-white py-2.5 rounded-xl border border-white/10 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-widest transition-colors"
                          >
                            <span className="flex items-center gap-2"><ExternalLink size={14} strokeWidth={1.5} /> VER NUEVOS</span>
                            {partState.marketData.priceNew && <span className="text-jsv-orange text-xs">${partState.marketData.priceNew.toLocaleString()}</span>}
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="flex gap-3 border-t border-white/10 pt-4">
                    <button 
                      onClick={() => handleAutoPrice(part)}
                      disabled={isLoading}
                      className="flex-1 bg-white/5 text-white border border-white/10 py-3 rounded-2xl text-[10px] font-medium tracking-widest flex items-center justify-center gap-2 hover:bg-white/10 disabled:opacity-50 transition-colors"
                    >
                      {isLoading ? <RefreshCw className="animate-spin" size={16} strokeWidth={1.5} /> : <Globe size={16} strokeWidth={1.5} />}
                      {hasReport ? 'RE-COTIZAR' : 'AUTO-COTIZAR'}
                    </button>

                    {hasReport && (
                      <button 
                        onClick={() => setShowReportId(showReportId === part.id ? null : part.id)}
                        className={`px-4 py-3 rounded-2xl border flex items-center justify-center transition-colors ${showReportId === part.id ? 'bg-white/20 border-white/30 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                      >
                        <FileSearch size={18} strokeWidth={1.5} />
                      </button>
                    )}
                    
                    <button 
                      onClick={() => { setCurrentIndex(idx); setViewMode('focus'); }}
                      className="flex-1 bg-jsv-orange text-black py-3 rounded-2xl text-[10px] font-medium tracking-widest flex items-center justify-center gap-2 hover:bg-[#f5d061]/90 transition-colors shadow-[0_0_15px_rgba(245,208,97,0.3)]"
                    >
                      <Camera size={16} strokeWidth={1.5} />
                      AUDITAR / FOTO
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // FOCUS MODE (Existing Logic)
          <div className="p-4 flex flex-col gap-6 max-w-md mx-auto w-full">
            
            {/* 1. ASSET GENERATOR (The "Publicity Photo") */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center px-1">
                <span className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">VISTA PREVIA PUBLICIDAD</span>
                {state.url && (
                  <button onClick={downloadImage} className="flex items-center gap-1 text-[10px] text-jsv-orange font-medium tracking-widest hover:text-white transition-colors">
                    <Download size={14} strokeWidth={1.5} /> DESCARGAR PNG
                  </button>
                )}
              </div>
              
              <div className="rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.5)] border border-white/10">
                <AssetGenerator 
                  vehicle={vehicle} 
                  part={currentPart} 
                  state={state} 
                  onImageGenerated={setGeneratedImage}
                />
              </div>

              {/* Robust Image Uploader */}
              <div 
                className="mt-2 border border-dashed border-white/20 rounded-3xl p-8 flex flex-col items-center justify-center gap-4 bg-black/20 hover:bg-white/5 transition-all cursor-pointer group"
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
                
                <div className="p-5 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors border border-white/10 shadow-[0_0_20px_rgba(255,255,255,0.05)]">
                  <UploadCloud size={32} strokeWidth={1.5} className="text-jsv-orange" />
                </div>
                
                <div className="text-center">
                  <p className="text-sm font-medium text-white tracking-tight">Toca para subir o arrastra aquí</p>
                  <p className="text-xs text-gray-500 mt-1 font-light">Soporta JPG, PNG, WEBP</p>
                </div>

                <div className="flex gap-2 mt-2">
                   <span className="text-[10px] bg-black/40 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5 font-medium tracking-widest">CÁMARA</span>
                   <span className="text-[10px] bg-black/40 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5 font-medium tracking-widest">ARCHIVOS</span>
                   <span className="text-[10px] bg-black/40 px-3 py-1.5 rounded-lg text-gray-400 border border-white/5 font-medium tracking-widest">CTRL+V</span>
                </div>
              </div>
            </div>

            {/* 2. DATA CONTROL */}
            <div className="glass-panel rounded-3xl p-5 space-y-5">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-medium tracking-widest text-gray-400 uppercase">Datos de Pieza</h3>
                <button 
                  onClick={onOpenWarranty}
                  className="text-[10px] bg-white/5 text-gray-300 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 flex items-center gap-1.5 transition-colors font-medium tracking-widest"
                >
                  <ShieldCheck size={14} strokeWidth={1.5} /> GARANTÍA
                </button>
              </div>
              <div className="text-center">
                <h2 className="text-xl font-medium text-white tracking-tight">{currentPart.name}</h2>
                <span className="text-[10px] text-jsv-orange font-mono tracking-widest">[{currentPart.id}]</span>
              </div>

              {/* Price */}
              <div className="flex items-center justify-between bg-black/40 rounded-2xl p-2 border border-white/5">
                <button onClick={() => handlePriceChange(-100)} className="w-14 h-14 bg-white/5 hover:bg-white/10 text-white rounded-xl font-light text-2xl transition-colors flex items-center justify-center">-</button>
                <div className="text-center">
                  <div className="text-3xl font-medium text-white tracking-tight">${state.price}</div>
                  <div className="text-[10px] text-jsv-orange font-medium tracking-widest mt-1">VENTA DIRECTA</div>
                </div>
                <button onClick={() => handlePriceChange(100)} className="w-14 h-14 bg-white/5 hover:bg-white/10 text-white rounded-xl font-light text-2xl transition-colors flex items-center justify-center">+</button>
              </div>

              {/* Market Report Expansion (Focus Mode) */}
              {state.marketData && (
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5 text-xs space-y-3 animate-in fade-in">
                  <div className="flex justify-between items-center text-gray-400 border-b border-white/10 pb-2">
                    <span className="font-medium tracking-widest uppercase text-[10px]">REPORTE DE MERCADO</span>
                    <span className="font-light">{new Date(state.marketData.timestamp).toLocaleDateString()}</span>
                  </div>
                  <pre className="whitespace-pre-wrap font-mono text-gray-300 text-[10px] leading-relaxed">
                    {state.marketData.report}
                  </pre>
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <a 
                      href={state.marketData.referenceUrl} 
                      target="_blank" 
                      rel="noreferrer"
                      className="bg-white/5 text-white py-2.5 rounded-xl border border-white/10 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-widest transition-colors"
                    >
                      <span className="flex items-center gap-2"><ExternalLink size={14} strokeWidth={1.5} /> VER USADOS</span>
                      {state.marketData.priceUsed && <span className="text-jsv-orange text-xs">${state.marketData.priceUsed.toLocaleString()}</span>}
                    </a>
                    {state.marketData.referenceUrlNew && (
                      <a 
                        href={state.marketData.referenceUrlNew} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-white/5 text-white py-2.5 rounded-xl border border-white/10 hover:bg-white/10 flex flex-col items-center justify-center gap-1 text-[10px] font-medium tracking-widest transition-colors"
                      >
                        <span className="flex items-center gap-2"><ExternalLink size={14} strokeWidth={1.5} /> VER NUEVOS</span>
                        {state.marketData.priceNew && <span className="text-jsv-orange text-xs">${state.marketData.priceNew.toLocaleString()}</span>}
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Audit Links & Actions */}
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => handleAutoPrice(currentPart)}
                  disabled={marketLoading === currentPart.id}
                  className="bg-white/5 text-white border border-white/10 hover:bg-white/10 py-3 rounded-xl text-center text-[10px] font-medium tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {marketLoading === currentPart.id ? <RefreshCw className="animate-spin" size={16} strokeWidth={1.5} /> : <Globe size={16} strokeWidth={1.5} />}
                  {state.marketData ? 'RE-COTIZAR' : 'AUTO-COTIZAR'}
                </button>
                <a href={googleUrl} target="nyx_mirror" className="bg-white/5 text-white border border-white/10 hover:bg-white/10 py-3 rounded-xl text-center text-[10px] font-medium tracking-widest flex items-center justify-center gap-2 transition-colors">
                  <ImageIcon size={16} strokeWidth={1.5} /> FOTOS GOOGLE
                </a>
              </div>
            </div>

            {/* 3. TEXT GENERATOR */}
            <div className="space-y-3">
              <h3 className="text-[10px] font-medium tracking-widest text-gray-400 uppercase px-1">Generador de Textos</h3>
              
              <button 
                onClick={() => copyToClipboard(generateStandardQuote(getQuoteParams()), 'Descripción')}
                className="w-full glass-panel hover:bg-white/10 text-white py-4 rounded-2xl text-xs font-medium tracking-wide flex items-center justify-between px-5 transition-all group"
              >
                <span className="flex items-center gap-3"><FileText size={18} strokeWidth={1.5} className="text-gray-400 group-hover:text-white transition-colors" /> DESCRIPCIÓN MARKETPLACE</span>
                <Copy size={16} strokeWidth={1.5} className="text-gray-500 group-hover:text-white transition-colors" />
              </button>

              <button 
                onClick={() => copyToClipboard(generateFastQuote(getQuoteParams()), 'Cotización')}
                className="w-full glass-panel hover:bg-white/10 text-white py-4 rounded-2xl text-xs font-medium tracking-wide flex items-center justify-between px-5 transition-all group"
              >
                <span className="flex items-center gap-3"><Share2 size={18} strokeWidth={1.5} className="text-gray-400 group-hover:text-white transition-colors" /> COTIZACIÓN WHATSAPP</span>
                <Copy size={16} strokeWidth={1.5} className="text-gray-500 group-hover:text-white transition-colors" />
              </button>
            </div>

            {/* Navigation */}
            <div className="flex justify-between items-center pt-6 pb-4">
              <button onClick={prevPart} disabled={currentIndex === 0} className="p-4 text-gray-500 hover:text-white transition-colors disabled:opacity-30 disabled:hover:text-gray-500"><ChevronLeft size={32} strokeWidth={1} /></button>
              <span className="text-[10px] font-mono tracking-widest text-gray-500">{currentIndex + 1} / {filteredParts.length}</span>
              <button onClick={nextPart} disabled={currentIndex === filteredParts.length - 1} className="p-4 text-white hover:text-jsv-orange transition-colors disabled:opacity-30 disabled:hover:text-white"><ChevronRight size={32} strokeWidth={1} /></button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
