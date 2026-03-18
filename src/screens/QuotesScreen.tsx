import { useState, useEffect } from 'react';
import { Search, Copy, RefreshCw, Edit3, ShieldCheck, Truck, FileText, ExternalLink, FilePlus, Sparkles, Wand2, Image as ImageIcon, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { generateStandardQuote, generateFastQuote, generateOnOrderQuote, calculateACPrice } from '../utils/textGenerator';
import { VEHICLES, MASTER_PARTS } from '../data/inventory';
import { saveWarranty, generateWarrantyPDF } from '../services/warrantyService';
import { generateChatResponse } from '../services/geminiService';
import { CanvasData } from '../types/ui';

type QuoteFormat = 'standard' | 'fast' | 'on_order';

interface QuotesScreenProps {
  onOpenWarranty: () => void;
  onExportToCanvas: (data: CanvasData) => void;
}

export function QuotesScreen({ onOpenWarranty, onExportToCanvas }: QuotesScreenProps) {
  // State for inputs
  const [vehicleQuery, setVehicleQuery] = useState('');
  const [partQuery, setPartQuery] = useState('');
  const [priceVD, setPriceVD] = useState('');
  const [priceAC, setPriceAC] = useState('');
  const [format, setFormat] = useState<QuoteFormat>('standard');
  const [compatibleModels, setCompatibleModels] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  
  // New States for Shipping & Warranty
  const [shippingCost, setShippingCost] = useState('80');
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [warrantyDays, setWarrantyDays] = useState<number | undefined>(undefined);
  const [customerName, setCustomerName] = useState('');
  const [discount, setDiscount] = useState('0');
  const [costPrice, setCostPrice] = useState('');
  
  // State for generated text
  const [generatedText, setGeneratedText] = useState('');
  const [isImprovingQuote, setIsImprovingQuote] = useState(false);
  const [isAutomating, setIsAutomating] = useState(false);

  // Suggestions
  const [vehicleSuggestions, setVehicleSuggestions] = useState<string[]>([]);
  const [partSuggestions, setPartSuggestions] = useState<string[]>([]);

  // Autocomplete Logic
  useEffect(() => {
    if (vehicleQuery.length > 1) {
      const matches = VEHICLES
        .filter(v => v.model.toLowerCase().includes(vehicleQuery.toLowerCase()))
        .map(v => `${v.model} (${v.yearRange})`);
      setVehicleSuggestions(matches);
    } else {
      setVehicleSuggestions([]);
    }
  }, [vehicleQuery]);

  useEffect(() => {
    if (partQuery.length > 1) {
      const matches = MASTER_PARTS
        .filter(p => p.name.toLowerCase().includes(partQuery.toLowerCase()))
        .map(p => p.name);
      setPartSuggestions(matches);
    } else {
      setPartSuggestions([]);
    }
  }, [partQuery]);

  // Auto-calculate AC price and Shipping
  useEffect(() => {
    if (priceVD) {
      const vd = parseInt(priceVD);
      if (!isNaN(vd)) {
        // Calculate AC
        const ac = calculateACPrice(vd);
        setPriceAC(ac.toString());

        // Auto-set Free Shipping
        if (vd >= 1000) {
          setIsFreeShipping(true);
        } else {
          setIsFreeShipping(false);
        }
      }
    }
  }, [priceVD]);

  // Generate Quote
  useEffect(() => {
    if (!vehicleQuery || !partQuery || !priceVD) return;

    const params = {
      vehicle: vehicleQuery,
      partName: partQuery,
      priceVD: parseInt(priceVD) || 0,
      priceAC: parseInt(priceAC) || 0,
      compatibleModels: compatibleModels,
      arrivalDate: arrivalDate,
      shippingCost: parseInt(shippingCost),
      isFreeShipping: isFreeShipping,
      warrantyDays: warrantyDays
    };

    let text = '';
    if (format === 'standard') text = generateStandardQuote(params);
    else if (format === 'fast') text = generateFastQuote(params);
    else if (format === 'on_order') text = generateOnOrderQuote(params);

    setGeneratedText(text);
  }, [vehicleQuery, partQuery, priceVD, priceAC, format, compatibleModels, arrivalDate, shippingCost, isFreeShipping, warrantyDays]);

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success('Cotización copiada');
  };

  const handleImproveWithAI = async () => {
    if (!generatedText) return;
    setIsImprovingQuote(true);
    try {
      const systemInstruction = `Eres un experto en ventas de autopartes para JSV Autopartes. 
      Tu objetivo es mejorar la siguiente cotización para hacerla más persuasiva, profesional y atractiva para el cliente.
      Usa un tono amable pero directo. Resalta los beneficios (Garantía, Envío, Calidad).
      Mantén todos los datos importantes (precios, piezas, vehículos, garantías, envíos).
      Usa emojis de manera profesional.`;
      
      const improvedText = await generateChatResponse(generatedText, systemInstruction);
      setGeneratedText(improvedText.text || '');
      toast.success('Cotización mejorada por IA');
    } catch (error) {
      console.error("Error improving quote:", error);
      toast.error('Error al mejorar la cotización');
    } finally {
      setIsImprovingQuote(false);
    }
  };

  const handleAIAutomation = async () => {
    setIsAutomating(true);
    try {
      // Simulate AI searching for better data or optimizing
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const systemInstruction = `Analiza los datos de esta cotización:
      Vehículo: ${vehicleQuery}
      Pieza: ${partQuery}
      Precio: ${priceVD}
      
      Genera una recomendación de venta estratégica corta (max 2 frases) y sugiere un precio competitivo si el actual parece fuera de rango (asume que el rango es +/- 10% de lo que el usuario puso).`;
      
      const aiAdvice = await generateChatResponse(`Sugiere mejoras para vender este ${partQuery} de ${vehicleQuery}`, systemInstruction);
      toast(aiAdvice.text || '', {
        icon: <Zap className="text-jsv-orange" />,
        duration: 5000
      });
    } catch (error) {
      toast.error('Error en el agente de automatización');
    } finally {
      setIsAutomating(false);
    }
  };

  const handleExportToCanvas = () => {
    if (!vehicleQuery || !partQuery || !priceVD) {
      toast.error('Completa los datos básicos para generar publicidad');
      return;
    }

    const finalPrice = parseInt(priceVD) - (parseInt(discount) || 0);

    const data: CanvasData = {
      vehicle: {
        model: vehicleQuery.split('(')[0].trim(),
        yearRange: vehicleQuery.includes('(') ? vehicleQuery.match(/\((.*?)\)/)?.[1] || '' : ''
      },
      part: {
        name: partQuery,
        price: finalPrice
      }
    };

    onExportToCanvas(data);
    toast.success('Datos exportados a Canvas Studio');
  };

  const calculateProfit = () => {
    const sale = parseInt(priceVD) - (parseInt(discount) || 0);
    const cost = parseInt(costPrice) || 0;
    if (!cost) return null;
    const profit = sale - cost;
    const margin = (profit / sale) * 100;
    return { profit, margin };
  };

  const profitData = calculateProfit();

  const handleRegisterSale = () => {
    if (!customerName) {
      toast.error('Ingresa el nombre del cliente para registrar la venta');
      return;
    }
    
    const record = {
      id: Math.random().toString(36).substr(2, 9).toUpperCase(),
      customerName,
      partName: partQuery,
      vehicle: vehicleQuery,
      price: parseInt(priceVD),
      discount: parseInt(discount) || 0,
      costPrice: parseInt(costPrice) || 0,
      date: new Date().toLocaleDateString(),
      warrantyDays: warrantyDays || 0,
      expiryDate: new Date(Date.now() + (warrantyDays || 0) * 86400000).toLocaleDateString(),
      status: 'active' as const
    };

    saveWarranty(record);
    
    if (warrantyDays) {
      generateWarrantyPDF(record);
    }

    toast.success('Venta registrada y garantía generada');
  };

  // ML Mirror URL
  const mlUrl = `https://listado.mercadolibre.com.mx/${encodeURIComponent(`${partQuery} ${vehicleQuery} usado`)}`;

  return (
    <div className="p-6 pb-28 space-y-8 max-w-4xl mx-auto custom-scrollbar">
      
      {/* Inputs Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
          <div className="absolute -inset-1 bg-gradient-to-br from-jsv-orange/10 to-transparent opacity-50 pointer-events-none"></div>
          
          {/* Vehicle Input */}
          <div className="space-y-2 relative z-10">
            <label className="text-[10px] font-bold tracking-widest text-jsv-orange uppercase">Vehículo (Origen)</label>
            <input 
              type="text" 
              value={vehicleQuery}
              onChange={(e) => setVehicleQuery(e.target.value)}
              placeholder="Ej. Aveo 2013"
              className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-jsv-orange focus:bg-black/60 outline-none transition-all shadow-inner placeholder:text-gray-500 font-light"
              list="vehicle-options"
            />
            <datalist id="vehicle-options">
              {vehicleSuggestions.map((s, i) => <option key={i} value={s} />)}
            </datalist>
          </div>

          {/* Part Input */}
          <div className="space-y-2 relative z-10">
            <label className="text-[10px] font-bold tracking-widest text-jsv-orange uppercase">Pieza</label>
            <input 
              type="text" 
              value={partQuery}
              onChange={(e) => setPartQuery(e.target.value)}
              placeholder="Ej. Alternador"
              className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-jsv-orange focus:bg-black/60 outline-none transition-all shadow-inner placeholder:text-gray-500 font-light"
              list="part-options"
            />
            <datalist id="part-options">
              {partSuggestions.map((s, i) => <option key={i} value={s} />)}
            </datalist>
          </div>

          {/* Pricing Inputs */}
          <div className="grid grid-cols-3 gap-4 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Venta Directa</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                <input 
                  type="number" 
                  value={priceVD}
                  onChange={(e) => setPriceVD(e.target.value)}
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 pl-7 text-white font-medium focus:border-jsv-orange focus:bg-black/60 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Al Cambio</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input 
                  type="number" 
                  value={priceAC}
                  readOnly
                  className="w-full bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-3 pl-7 text-gray-400 font-medium outline-none cursor-not-allowed"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Costo (Privado)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">$</span>
                <input 
                  type="number" 
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value)}
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 pl-7 text-white font-medium focus:border-jsv-orange focus:bg-black/60 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
          </div>

          {/* Discount & Profit */}
          <div className="grid grid-cols-2 gap-5 relative z-10">
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Descuento Especial</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-jsv-orange font-medium">-$</span>
                <input 
                  type="number" 
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 pl-10 text-jsv-orange font-medium focus:border-jsv-orange focus:bg-black/60 outline-none transition-all shadow-inner"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Utilidad Estimada</label>
              <div className="w-full bg-white/5 backdrop-blur-md border border-white/5 rounded-2xl p-4 flex items-center justify-between">
                <span className="text-jsv-green font-bold text-lg">
                  ${profitData ? profitData.profit.toLocaleString() : '0'}
                </span>
                {profitData && (
                  <span className="text-[10px] font-bold bg-jsv-green/20 text-jsv-green px-2 py-1 rounded-lg">
                    {profitData.margin.toFixed(1)}%
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Shipping & Warranty Controls */}
          <div className="grid grid-cols-2 gap-5 relative z-10">
            {/* Shipping */}
            <div className="space-y-3 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                  <Truck size={14} strokeWidth={1.5} /> ENVÍO
                </label>
                <input 
                  type="checkbox" 
                  checked={isFreeShipping} 
                  onChange={(e) => setIsFreeShipping(e.target.checked)}
                  className="accent-jsv-orange w-4 h-4 rounded border-white/10"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 font-medium">$</span>
                <input 
                  type="number" 
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  disabled={isFreeShipping}
                  className={`w-full bg-transparent text-base font-medium outline-none transition-colors ${isFreeShipping ? 'text-gray-600 line-through' : 'text-white'}`}
                />
              </div>
            </div>

            {/* Warranty */}
            <div className="space-y-3 bg-black/40 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-inner">
              <label className="text-[10px] font-bold tracking-widest text-gray-400 uppercase flex items-center gap-1.5">
                <ShieldCheck size={14} strokeWidth={1.5} /> GARANTÍA
              </label>
              <div className="flex gap-2">
                {[15, 30, 60].map(days => (
                  <button
                    key={days}
                    onClick={() => setWarrantyDays(warrantyDays === days ? undefined : days)}
                    className={`flex-1 py-2 rounded-xl text-xs font-medium border transition-all duration-300 ${warrantyDays === days ? 'bg-jsv-green text-black border-jsv-green shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
                  >
                    {days}D
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* AI Automation Agent Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-panel p-6 rounded-3xl border border-white/10 shadow-2xl h-full flex flex-col">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-jsv-orange/20 rounded-xl">
                <Sparkles className="text-jsv-orange" size={20} />
              </div>
              <div>
                <h3 className="text-xs font-bold text-white tracking-widest uppercase">Agente de Ventas</h3>
                <p className="text-[9px] text-gray-500 font-medium tracking-widest uppercase">Automatización Activa</p>
              </div>
            </div>

            <div className="flex-1 space-y-4">
              <button 
                onClick={handleAIAutomation}
                disabled={isAutomating || !vehicleQuery}
                className="w-full bg-white/5 border border-white/10 hover:bg-white/10 p-4 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-jsv-orange tracking-widest uppercase">Optimizar Estrategia</span>
                  <Zap size={14} className="text-jsv-orange group-hover:animate-pulse" />
                </div>
                <p className="text-[9px] text-gray-400 leading-relaxed">Analiza el mercado y sugiere el mejor precio y copy.</p>
              </button>

              <button 
                onClick={handleExportToCanvas}
                className="w-full bg-jsv-orange/10 border border-jsv-orange/20 hover:bg-jsv-orange/20 p-4 rounded-2xl text-left transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-bold text-jsv-orange tracking-widest uppercase">Generar Publicidad</span>
                  <ImageIcon size={14} className="text-jsv-orange" />
                </div>
                <p className="text-[9px] text-gray-400 leading-relaxed">Exporta datos al Canvas Studio para crear el anuncio.</p>
              </button>

              <div className="p-4 bg-black/40 rounded-2xl border border-white/5 mt-auto">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 bg-jsv-green rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-gray-400 tracking-widest uppercase">IA Lista</span>
                </div>
                <p className="text-[9px] text-gray-500 italic leading-relaxed">"Listo para generar la mejor oferta para este {partQuery || 'producto'}."</p>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Format Selector */}
        <div className="space-y-3 relative z-10">
          <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Formato de Salida</label>
          <div className="grid grid-cols-3 gap-3">
            <button 
              onClick={() => setFormat('standard')}
              className={`py-3 rounded-xl text-[10px] font-medium tracking-widest transition-all duration-300 border ${format === 'standard' ? 'bg-jsv-orange text-black border-jsv-orange shadow-[0_0_15px_rgba(245,208,97,0.3)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              NORMAL
            </button>
            <button 
              onClick={() => setFormat('fast')}
              className={`py-3 rounded-xl text-[10px] font-medium tracking-widest transition-all duration-300 border ${format === 'fast' ? 'bg-jsv-orange text-black border-jsv-orange shadow-[0_0_15px_rgba(245,208,97,0.3)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              RÁPIDO
            </button>
            <button 
              onClick={() => setFormat('on_order')}
              className={`py-3 rounded-xl text-[10px] font-medium tracking-widest transition-all duration-300 border ${format === 'on_order' ? 'bg-jsv-orange text-black border-jsv-orange shadow-[0_0_15px_rgba(245,208,97,0.3)]' : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:text-white'}`}
            >
              SOBRE PEDIDO
            </button>
          </div>
        </div>

        {/* Extra Fields based on Format */}
        {format === 'standard' && (
          <div className="space-y-2 relative z-10">
            <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Compatibilidad (Opcional)</label>
            <input 
              type="text" 
              value={compatibleModels}
              onChange={(e) => setCompatibleModels(e.target.value)}
              placeholder="Ej. LOBO/F-150 (2000-2004)"
              className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-white text-sm focus:border-jsv-orange focus:bg-black/60 outline-none transition-all shadow-inner placeholder:text-gray-500 font-light"
            />
          </div>
        )}

        {format === 'on_order' && (
          <div className="space-y-2 relative z-10">
            <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Estimado de Llegada</label>
            <input 
              type="text" 
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              placeholder="Ej. LUNES 15 DE OCTUBRE"
              className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-3 text-white text-sm focus:border-jsv-orange focus:bg-black/60 outline-none transition-all shadow-inner placeholder:text-gray-500 font-light"
            />
          </div>
        )}

      {/* MercadoLibre Mirror (Iframe) */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <label className="text-[10px] font-medium tracking-widest text-gray-400 uppercase flex items-center gap-2">
            <Search size={14} strokeWidth={1.5} /> MERCADOLIBRE MIRROR
          </label>
          <a href={mlUrl} target="_blank" rel="noreferrer" className="text-[10px] font-medium tracking-widest text-blue-400 flex items-center gap-1.5 hover:text-blue-300 hover:underline transition-colors">
            ABRIR EXTERNO <ExternalLink size={12} strokeWidth={1.5} />
          </a>
        </div>
        <div className="w-full h-72 bg-white rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative">
          <iframe 
            src={mlUrl} 
            className="w-full h-full"
            title="MercadoLibre Mirror"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
          {/* Overlay for blocked iframe fallback */}
          <div className="absolute inset-0 pointer-events-none bg-black/5 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
            <span className="bg-black/80 backdrop-blur-md text-white px-4 py-2.5 rounded-xl text-xs shadow-2xl border border-white/10 font-medium tracking-wide">Si no carga, usa el botón externo</span>
          </div>
        </div>
      </div>

      {/* Result Area */}
      <div className="space-y-3">
        <div className="flex justify-between items-center px-2">
          <label className="text-[10px] font-medium tracking-widest text-jsv-orange uppercase flex items-center gap-2">
            <Edit3 size={14} strokeWidth={1.5} /> VISTA PREVIA EDITABLE
          </label>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleImproveWithAI} 
              disabled={isImprovingQuote || !generatedText}
              className="text-[10px] font-bold tracking-widest text-jsv-orange flex items-center gap-1.5 hover:text-[#f5d061] transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10 disabled:opacity-50"
            >
              <Sparkles size={14} strokeWidth={1.5} className={isImprovingQuote ? "animate-pulse" : ""} /> 
              {isImprovingQuote ? 'MEJORANDO...' : 'MEJORAR CON IA'}
            </button>
            <button onClick={handleCopy} className="text-[10px] font-bold tracking-widest text-jsv-orange flex items-center gap-1.5 hover:text-[#f5d061] transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 hover:bg-white/10">
              <Copy size={14} strokeWidth={1.5} /> COPIAR
            </button>
          </div>
        </div>
        <textarea 
          value={generatedText}
          onChange={(e) => setGeneratedText(e.target.value)}
          className="w-full h-72 bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 text-sm font-light text-gray-300 focus:border-jsv-orange focus:bg-black/60 outline-none resize-none leading-relaxed shadow-inner custom-scrollbar"
        />
      </div>

      {/* Sale Registration */}
      <div className="glass-panel border border-white/10 rounded-3xl p-6 space-y-5 shadow-2xl relative overflow-hidden">
        <div className="absolute -inset-1 bg-gradient-to-tr from-jsv-green/10 to-transparent opacity-30 pointer-events-none"></div>
        
        <h3 className="text-sm font-medium tracking-wide text-white flex items-center gap-2.5 relative z-10">
          <FileText size={18} strokeWidth={1.5} className="text-jsv-green" /> REGISTRAR VENTA Y GARANTÍA
        </h3>
        
        <input 
          type="text" 
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Nombre del Cliente"
          className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 text-white text-sm focus:border-jsv-green focus:bg-black/60 outline-none transition-all shadow-inner placeholder:text-gray-500 font-light relative z-10"
        />
        
        <button 
          onClick={handleRegisterSale}
          className="w-full bg-jsv-green text-black py-4 rounded-2xl font-medium text-xs tracking-widest hover:bg-white transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] relative z-10"
        >
          GENERAR PÓLIZA Y REGISTRAR
        </button>
        
        <button 
          onClick={onOpenWarranty}
          className="w-full bg-white/5 text-gray-300 py-3 rounded-2xl font-medium tracking-widest text-[10px] hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2 border border-white/10 relative z-10"
        >
          <FilePlus size={16} strokeWidth={1.5} /> ABRIR GENERADOR COMPLETO
        </button>
      </div>

    </div>
  );
}
