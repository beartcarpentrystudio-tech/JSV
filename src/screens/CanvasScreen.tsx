import React, { useState, useEffect } from 'react';
import { Upload, Download, Layers, Search, ExternalLink, Play, CheckCircle, Sparkles, Wand2, Box, Image as ImageIcon, Scissors } from 'lucide-react';
import { toast } from 'sonner';
import { AssetGenerator } from '../components/AssetGenerator';
import { Vehicle, Part, PartState } from '../types';
import { VEHICLES, MASTER_PARTS } from '../data/inventory';
import { CanvasData } from '../types/ui';

interface CanvasScreenProps {
  initialData?: CanvasData | null;
  onClearInitialData?: () => void;
}

export function CanvasScreen({ initialData, onClearInitialData }: CanvasScreenProps) {
  // Standalone State
  const [customVehicle, setCustomVehicle] = useState<Vehicle>({ id: 'custom', model: '', yearRange: '', segment: 'mid', marketValueFactor: 1, color: '' });
  const [customPart, setCustomPart] = useState<Part>({ id: 'custom', name: '', basePrice: 0 });
  const [customState, setCustomState] = useState<PartState>({ 
    price: 0, 
    confirmed: true, 
    url: '' 
  });

  // Handle Initial Data
  useEffect(() => {
    if (initialData) {
      setCustomVehicle(prev => ({
        ...prev,
        model: initialData.vehicle.model,
        yearRange: initialData.vehicle.yearRange
      }));
      setCustomPart(prev => ({
        ...prev,
        name: initialData.part.name
      }));
      setCustomState(prev => ({
        ...prev,
        price: initialData.part.price,
        url: initialData.imageUrl || ''
      }));
      
      // Clear initial data after consuming it
      if (onClearInitialData) {
        onClearInitialData();
      }
      
      toast.success('Datos de cotización cargados');
    }
  }, [initialData, onClearInitialData]);

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // Suggestions
  const [vehicleSuggestions, setVehicleSuggestions] = useState<string[]>([]);
  const [partSuggestions, setPartSuggestions] = useState<string[]>([]);

  // Autocomplete Logic
  useEffect(() => {
    if (customVehicle.model.length > 1) {
      const matches = VEHICLES
        .filter(v => v.model.toLowerCase().includes(customVehicle.model.toLowerCase()))
        .map(v => v.model);
      setVehicleSuggestions([...new Set(matches)]);
    } else {
      setVehicleSuggestions([]);
    }
  }, [customVehicle.model]);

  useEffect(() => {
    if (customPart.name.length > 1) {
      const matches = MASTER_PARTS
        .filter(p => p.name.toLowerCase().includes(customPart.name.toLowerCase()))
        .map(p => p.name);
      setPartSuggestions(matches);
    } else {
      setPartSuggestions([]);
    }
  }, [customPart.name]);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setCustomState(prev => ({ ...prev, url: reader.result as string }));
      toast.success('Imagen cargada correctamente');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // Paste Listener
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const file = e.clipboardData?.files[0];
      if (file && file.type.startsWith('image/')) {
        handleImageUpload(file);
        e.preventDefault();
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  const handleMirrorSearch = () => {
    if (!customPart.name || !customVehicle.model) {
      toast.error('Ingresa pieza y modelo para buscar');
      return;
    }
    const query = `${customPart.name} ${customVehicle.model} ${customVehicle.yearRange} autoparte fondo blanco`;
    const url = `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`;
    window.open(url, '_blank');
    toast.info('Copia la imagen o su URL y súbela aquí');
  };

  const handleDownload = () => {
    if (generatedImage) {
      const link = document.createElement('a');
      link.href = generatedImage;
      link.download = `JSV_${customPart.name.replace(/\s+/g, '_')}_${customVehicle.model.replace(/\s+/g, '_')}.png`;
      link.click();
      toast.success('Imagen descargada');
    }
  };

  return (
    <div className="p-6 pb-24 space-y-8 min-h-screen bg-[#0a0a0a]">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <div className="p-2 bg-jsv-orange/20 rounded-xl">
              <Layers className="text-jsv-orange" size={24} strokeWidth={2} />
            </div>
            CANVAS STUDIO <span className="text-jsv-orange font-black italic">PRO</span>
          </h1>
          <p className="text-gray-500 text-xs font-medium tracking-widest uppercase">Motor de Diseño Publicitario IA</p>
        </div>

        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1.5 backdrop-blur-xl">
          <button 
            onClick={() => setMode('single')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${mode === 'single' ? 'bg-jsv-orange text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Individual
          </button>
          <button 
            onClick={() => setMode('batch')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-bold tracking-widest uppercase transition-all ${mode === 'batch' ? 'bg-jsv-orange text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
          >
            Lote (Auto)
          </button>
        </div>
      </div>

      {mode === 'single' ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Left Sidebar: Inputs */}
          <div className="xl:col-span-1 space-y-6">
            <div className="glass-panel rounded-3xl p-6 space-y-6 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <Box size={16} className="text-jsv-orange" />
                <h3 className="text-[10px] font-bold text-white tracking-widest uppercase">Datos de la Pieza</h3>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Nombre de Pieza</label>
                  <input 
                    type="text" 
                    value={customPart.name}
                    onChange={(e) => setCustomPart(prev => ({ ...prev, name: e.target.value }))}
                    list="part-list"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-jsv-orange outline-none transition-all"
                    placeholder="Ej. Parrilla Superior"
                  />
                  <datalist id="part-list">
                    {partSuggestions.map((s, i) => <option key={i} value={s} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Precio de Oferta</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-jsv-orange font-bold">$</span>
                    <input 
                      type="number" 
                      value={customState.price}
                      onChange={(e) => setCustomState(prev => ({ ...prev, price: parseInt(e.target.value) || 0 }))}
                      className="w-full bg-black/40 border border-white/10 rounded-xl p-4 pl-8 text-jsv-orange text-lg font-bold outline-none focus:border-jsv-orange transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Modelo de Vehículo</label>
                  <input 
                    type="text" 
                    value={customVehicle.model}
                    onChange={(e) => setCustomVehicle(prev => ({ ...prev, model: e.target.value }))}
                    list="vehicle-list"
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-jsv-orange outline-none transition-all"
                    placeholder="Ej. Chevrolet Aveo"
                  />
                  <datalist id="vehicle-list">
                    {vehicleSuggestions.map((s, i) => <option key={i} value={s} />)}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Años Compatibles</label>
                  <input 
                    type="text" 
                    value={customVehicle.yearRange}
                    onChange={(e) => setCustomVehicle(prev => ({ ...prev, yearRange: e.target.value }))}
                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-white text-sm focus:border-jsv-orange outline-none transition-all"
                    placeholder="Ej. 2012-2017"
                  />
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 space-y-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <ImageIcon size={16} className="text-jsv-orange" />
                <h3 className="text-[10px] font-bold text-white tracking-widest uppercase">Recursos</h3>
              </div>
              
              <button 
                onClick={handleMirrorSearch}
                className="w-full bg-blue-500/10 border border-blue-500/20 text-blue-400 py-4 rounded-2xl text-[10px] font-bold tracking-widest uppercase flex items-center justify-center gap-3 hover:bg-blue-500/20 transition-all"
              >
                <Search size={18} /> Buscar en Google
              </button>

              <div 
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="relative group"
              >
                <input 
                  type="file" 
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                  className="absolute inset-0 opacity-0 cursor-pointer z-10"
                  accept="image/*"
                />
                <div className="w-full bg-white/5 border border-dashed border-white/20 text-gray-400 py-8 rounded-2xl text-[10px] font-bold tracking-widest uppercase flex flex-col items-center justify-center gap-3 group-hover:bg-white/10 group-hover:border-jsv-orange transition-all">
                  <Upload size={24} />
                  <div className="text-center">
                    <p>Arrastra o selecciona imagen</p>
                    <p className="text-[8px] text-gray-500 mt-1">O PEGA CON CTRL+V</p>
                  </div>
                </div>
              </div>
            </div>

            <button 
              onClick={handleDownload}
              disabled={!generatedImage}
              className="w-full bg-jsv-orange text-black py-5 rounded-3xl text-xs font-black tracking-[0.2em] uppercase flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_20px_40px_rgba(245,208,97,0.2)] disabled:opacity-50 disabled:grayscale"
            >
              <Download size={20} strokeWidth={2.5} /> Exportar Final
            </button>
          </div>

          {/* Main Content: Canvas */}
          <div className="xl:col-span-3 h-[800px]">
            <AssetGenerator 
              vehicle={customVehicle}
              part={customPart}
              state={customState}
              onImageGenerated={setGeneratedImage}
              autoMagic={!!initialData}
            />
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto py-12">
          <div className="glass-panel rounded-[40px] p-12 text-center space-y-8 border border-white/5">
            <div className="w-32 h-32 bg-jsv-orange/10 border border-jsv-orange/20 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(245,208,97,0.1)]">
              <Sparkles size={48} className="text-jsv-orange" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-bold text-white tracking-tight">Automatización por Lote</h2>
              <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md mx-auto uppercase tracking-widest">
                Nuestro agente IA procesará todo tu inventario, eliminará fondos y aplicará la plantilla JSV automáticamente.
              </p>
            </div>
            
            <button 
              className="bg-emerald-500 text-black px-12 py-6 rounded-[30px] text-xs font-black tracking-[0.3em] uppercase flex items-center justify-center gap-4 mx-auto hover:scale-105 transition-all shadow-[0_20px_50px_rgba(16,185,129,0.3)]"
            >
              <Play size={20} fill="currentColor" /> Iniciar Agente de Diseño
            </button>

            <div className="pt-8 grid grid-cols-3 gap-6">
              {[
                { label: 'Remover Fondos', icon: <Scissors size={16} /> },
                { label: 'Auto-Layout', icon: <Layers size={16} /> },
                { label: 'Optimizar SEO', icon: <Search size={16} /> }
              ].map((f, i) => (
                <div key={i} className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="p-3 bg-white/5 rounded-xl">{f.icon}</div>
                  <span className="text-[9px] font-bold tracking-widest uppercase">{f.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
