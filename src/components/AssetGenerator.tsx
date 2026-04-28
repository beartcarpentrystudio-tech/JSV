import React, { useRef, useState, useEffect, useCallback } from 'react';
import * as fabric from 'fabric';
import { Vehicle, Part, PartState } from '../types';
import { 
  Download, Type, Image as ImageIcon, Layers, RefreshCw, Save, Upload, Wand2, Eraser, 
  Move, Plus, Undo, Redo, AlignCenter, AlignLeft, AlignRight, Palette, Sun, Eye, EyeOff,
  Sparkles, Scissors, Box, Maximize, Trash2, Copy
} from 'lucide-react';
import { toast } from 'sonner';
import { removeBackground } from "@imgly/background-removal";
import { getArtDirection, generateBackground } from '../services/imageAiService';

interface AssetGeneratorProps {
  vehicle: Vehicle;
  part: Part;
  state: PartState;
  onImageGenerated: (dataUrl: string) => void;
  triggerRemoveBg?: boolean;
  autoMagic?: boolean;
}

export function AssetGenerator({ vehicle, part, state, onImageGenerated, triggerRemoveBg, autoMagic }: AssetGeneratorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'layers' | 'templates' | 'ai'>('edit');
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(null);
  const [hasAutoMagicked, setHasAutoMagicked] = useState(false);
  const [bgPrompt, setBgPrompt] = useState('');
  const [isGeneratingBg, setIsGeneratingBg] = useState(false);

  // Shadow State
  const [shadowConfig, setShadowConfig] = useState({
    enabled: false,
    type: 'contact' as 'contact' | '3d_floor' | 'drop',
    blur: 20,
    opacity: 0.5,
    offsetX: 10,
    offsetY: 10
  });

  // Outline State
  const [outlineConfig, setOutlineConfig] = useState({
    enabled: false,
    color: '#ffffff',
    width: 5
  });

  // --- Initialization ---
  useEffect(() => {
    if (canvasRef.current && !fabricCanvas.current) {
      const canvas = new fabric.Canvas(canvasRef.current, {
        width: 1080,
        height: 1080,
        backgroundColor: '#ffffff',
        preserveObjectStacking: true,
      });
      
      fabricCanvas.current = canvas;

      // Responsive scaling for preview
      const updateSize = () => {
        const container = canvasRef.current?.closest('.flex-1');
        if (!container || !canvas) return;
        
        const availableWidth = container.clientWidth - 8; // Subtract small padding
        const availableHeight = container.clientHeight - 8;
        
        // Ensure we have valid dimensions
        if (availableWidth <= 0 || availableHeight <= 0) return;

        // Use the maximum possible square size that fits
        const size = Math.min(availableWidth, availableHeight);
        const scale = size / 1080;
        
        canvas.setZoom(scale);
        canvas.setDimensions({
          width: size,
          height: size
        });
      };

      const resizeObserver = new ResizeObserver(() => {
        window.requestAnimationFrame(() => {
          updateSize();
        });
      });

      const container = canvasRef.current?.closest('.flex-1');
      if (container) {
        resizeObserver.observe(container);
      }

      updateSize();

      canvas.on('selection:created', (e) => setSelectedObject(e.selected?.[0] || null));
      canvas.on('selection:updated', (e) => setSelectedObject(e.selected?.[0] || null));
      canvas.on('selection:cleared', () => setSelectedObject(null));
      canvas.on('object:modified', () => generateOutput());

      applyTemplate('jsv_standard');

      return () => {
        resizeObserver.disconnect();
        canvas.dispose();
        fabricCanvas.current = null;
      };
    }
  }, []);

  // --- Shadow Logic ---
  const applyShadow = (obj: fabric.Object, config: typeof shadowConfig) => {
    if (!config.enabled) {
      obj.set('shadow', null);
      return;
    }

    if (config.type === 'drop') {
      obj.set('shadow', new fabric.Shadow({
        color: `rgba(0,0,0,${config.opacity})`,
        blur: config.blur,
        offsetX: config.offsetX,
        offsetY: config.offsetY
      }));
    } else if (config.type === 'contact') {
      obj.set('shadow', new fabric.Shadow({
        color: `rgba(0,0,0,${config.opacity})`,
        blur: 10,
        offsetX: 0,
        offsetY: 5
      }));
    }
    fabricCanvas.current?.renderAll();
    generateOutput();
  };

  // --- Outline Logic ---
  const applyOutline = (obj: fabric.Object, config: typeof outlineConfig) => {
    if (obj instanceof fabric.Image) {
      // For images, outlines are tricky in Fabric without filters or cache
      // Photoroom style outline usually requires a stroke on the alpha mask
      // Simplified version:
      if (config.enabled) {
        obj.set({
          stroke: config.color,
          strokeWidth: config.width,
          paintFirst: 'stroke'
        });
      } else {
        obj.set('strokeWidth', 0);
      }
    } else if (obj instanceof fabric.Text) {
      obj.set({
        stroke: config.enabled ? config.color : null,
        strokeWidth: config.enabled ? config.width : 0
      });
    }
    fabricCanvas.current?.renderAll();
    generateOutput();
  };

  // --- Handle Auto Magic ---
  useEffect(() => {
    if (autoMagic && vehicle.model && part.name && !hasAutoMagicked && fabricCanvas.current) {
      // Delay slightly to ensure canvas is ready and initial images are loaded
      const timer = setTimeout(() => {
        handleMagicAi();
        setHasAutoMagicked(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [autoMagic, vehicle.model, part.name, hasAutoMagicked]);

  // --- Output Generation ---
  const generateOutput = useCallback(() => {
    if (!fabricCanvas.current) return;
    // Export at full resolution
    const dataUrl = fabricCanvas.current.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 1 / fabricCanvas.current.getZoom()
    });
    onImageGenerated(dataUrl);
  }, [onImageGenerated]);

  // --- Template System ---
  const applyTemplate = async (templateId: string) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    if (templateId === 'jsv_standard') {
      // 1. Logo (Top Right)
      fabric.Image.fromURL('https://i.imgur.com/3X1b2X3.png', {
        crossOrigin: 'anonymous'
      }).then(img => {
        img.scale(0.8);
        img.set({ left: 750, top: 40, selectable: true });
        canvas.add(img);
      });

      // 2. Part Name (Top Left)
      const title = new fabric.Text(part.name.toUpperCase() || 'NOMBRE AUTOPARTE', {
        left: 50,
        top: 40,
        fontSize: 80,
        fontFamily: 'Impact',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 15,
        paintFirst: 'stroke',
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 })
      });
      canvas.add(title);

      // 3. Vehicle Info (Bottom Left)
      const vehicleInfo = new fabric.Text(`${vehicle.model.toUpperCase()}\n${vehicle.yearRange}`, {
        left: 50,
        top: 850,
        fontSize: 70,
        fontFamily: 'Impact',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 12,
        paintFirst: 'stroke',
        lineHeight: 1,
        shadow: new fabric.Shadow({ color: 'rgba(0,0,0,0.5)', blur: 10, offsetX: 5, offsetY: 5 })
      });
      canvas.add(vehicleInfo);

      // 4. Price (Bottom Right)
      const priceLabel = new fabric.Text('OFERTA', {
        left: 800,
        top: 800,
        fontSize: 50,
        fontFamily: 'Impact',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 8,
        paintFirst: 'stroke'
      });
      const priceValue = new fabric.Text(`$${state.price}`, {
        left: 750,
        top: 860,
        fontSize: 120,
        fontFamily: 'Impact',
        fill: '#f5d061',
        stroke: '#000000',
        strokeWidth: 15,
        paintFirst: 'stroke'
      });
      const priceStatus = new fabric.Text('SOBRE PEDIDO', {
        left: 700,
        top: 980,
        fontSize: 45,
        fontFamily: 'Impact',
        fill: '#ffffff',
        stroke: '#000000',
        strokeWidth: 8,
        paintFirst: 'stroke'
      });
      canvas.add(priceLabel, priceValue, priceStatus);
    }

    canvas.renderAll();
    generateOutput();
  };

  // --- Image Handling ---
  useEffect(() => {
    if (state.url && fabricCanvas.current) {
      addImageToCanvas(state.url);
    }
  }, [state.url]);

  const addImageToCanvas = async (url: string) => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    // Remove old part image if exists
    const oldPart = canvas.getObjects().find(obj => (obj as any).isPart);
    if (oldPart) canvas.remove(oldPart);

    fabric.Image.fromURL(url, { crossOrigin: 'anonymous' }).then(img => {
      img.scaleToWidth(800);
      img.set({
        left: 540 - (img.getScaledWidth() / 2),
        top: 540 - (img.getScaledHeight() / 2),
        selectable: true,
        shadow: new fabric.Shadow({
          color: 'rgba(0,0,0,0.3)',
          blur: 30,
          offsetX: 10,
          offsetY: 20
        })
      });
      (img as any).isPart = true;
      
      // Add Reflection
      img.clone().then(reflection => {
        reflection.set({
          top: img.top + img.getScaledHeight(),
          scaleY: -img.scaleY * 0.5,
          opacity: 0.3,
          selectable: false,
          evented: false
        });
        (reflection as any).isReflection = true;
        canvas.add(reflection);
        canvas.add(img);
        canvas.setActiveObject(img);
        canvas.renderAll();
        generateOutput();
      });
    });
  };

  // --- AI Features ---
  const handleRemoveBg = async () => {
    const canvas = fabricCanvas.current;
    const activeObj = canvas?.getActiveObject();
    if (!activeObj || !(activeObj instanceof fabric.Image)) {
      toast.error('Selecciona una imagen primero');
      return;
    }

    setIsRemovingBg(true);
    try {
      const blob = await fetch(activeObj.getSrc()).then(r => r.blob());
      const resultBlob = await removeBackground(blob);
      const reader = new FileReader();
      reader.onload = () => {
        const newUrl = reader.result as string;
        fabric.util.loadImage(newUrl).then(htmlImg => {
          activeObj.setElement(htmlImg);
          canvas?.renderAll();
          generateOutput();
          setIsRemovingBg(false);
          toast.success('Fondo eliminado');
        });
      };
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error(error);
      setIsRemovingBg(false);
      toast.error('Error al eliminar fondo');
    }
  };

  const handleGenerateBackground = async (prompt: string) => {
    const canvas = fabricCanvas.current;
    if (!canvas || !prompt) return;

    setIsGeneratingBg(true);
    toast.info('IA: Generando fondo publicitario...');
    
    const bgUrl = await generateBackground(prompt);
    if (bgUrl) {
      // Remove old background
      const oldBg = canvas.getObjects().find(obj => (obj as any).isBackground);
      if (oldBg) canvas.remove(oldBg);

      fabric.Image.fromURL(bgUrl, { crossOrigin: 'anonymous' }).then(img => {
        img.scaleToWidth(1080);
        img.set({
          left: 0,
          top: 0,
          selectable: false,
          evented: false
        });
        (img as any).isBackground = true;
        canvas.add(img);
        canvas.sendObjectToBack(img);
        canvas.renderAll();
        generateOutput();
        toast.success('IA: Fondo generado y aplicado');
      });
    } else {
      toast.error('Error al generar fondo');
    }
    setIsGeneratingBg(false);
  };

  const handleMagicAi = async () => {
    const canvas = fabricCanvas.current;
    if (!canvas) return;

    setIsAiLoading(true);
    const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
    
    const suggestion = await getArtDirection(dataUrl, part.name, vehicle.model);
    if (suggestion) {
      toast.success('IA: Dirección de Arte aplicada');
      
      // Apply suggested text color
      if (suggestion.text_color) {
        canvas.getObjects().forEach(obj => {
          if (obj instanceof fabric.Text) {
            obj.set('fill', suggestion.text_color);
          }
        });
      }

      // Apply suggested scale and position to product
      const partObj = canvas.getObjects().find(obj => (obj as any).isPart);
      if (partObj && suggestion.object_scale) {
        partObj.scaleToWidth(800 * suggestion.object_scale);
        partObj.set({
          left: 540 - (partObj.getScaledWidth() / 2),
          top: 540 - (partObj.getScaledHeight() / 2)
        });
      }

      // Apply suggested shadow type
      if (suggestion.shadow_type) {
        setShadowConfig(prev => ({ ...prev, enabled: true, type: suggestion.shadow_type }));
        if (partObj) applyShadow(partObj, { ...shadowConfig, enabled: true, type: suggestion.shadow_type });
      }

      canvas.renderAll();
      generateOutput();

      if (suggestion.composition_notes) {
        toast.info(suggestion.composition_notes);
      }

      // If background prompt is suggested, generate it
      if (suggestion.background_prompt) {
        setBgPrompt(suggestion.background_prompt);
        handleGenerateBackground(suggestion.background_prompt);
      }
    }
    setIsAiLoading(false);
  };

  // --- UI Helpers ---
  const updateSelectedStyle = (updates: any) => {
    const canvas = fabricCanvas.current;
    const active = canvas?.getActiveObject();
    if (active) {
      active.set(updates);
      canvas?.renderAll();
      generateOutput();
    }
  };

  // --- UI Components for Tools ---
  const renderEditTools = () => {
    if (!selectedObject) {
      return (
        <div className="text-center py-12 space-y-4">
          <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto border border-white/10">
            <Box className="text-gray-600" size={32} />
          </div>
          <p className="text-gray-500 text-xs font-medium tracking-tight uppercase tracking-widest">Selecciona un objeto para editarlo</p>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Common Controls: Opacity, Layer Order */}
        <div className="space-y-4">
          <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Opacidad</label>
          <input 
            type="range" min="0" max="1" step="0.01"
            value={selectedObject.opacity}
            onChange={(e) => updateSelectedStyle({ opacity: parseFloat(e.target.value) })}
            className="w-full accent-jsv-orange"
          />
        </div>

        {selectedObject instanceof fabric.Text && (
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Texto</label>
              <textarea 
                value={selectedObject.text}
                onChange={(e) => updateSelectedStyle({ text: e.target.value })}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-jsv-orange outline-none h-24"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Tamaño</label>
                <input 
                  type="range" min="10" max="300" 
                  value={selectedObject.fontSize}
                  onChange={(e) => updateSelectedStyle({ fontSize: parseInt(e.target.value) })}
                  className="w-full accent-jsv-orange"
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Color</label>
                <input 
                  type="color"
                  value={selectedObject.fill as string}
                  onChange={(e) => updateSelectedStyle({ fill: e.target.value })}
                  className="w-full h-10 bg-transparent border-none cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Shadow Controls */}
        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <Sun size={14} /> Sombras
            </label>
            <input 
              type="checkbox" 
              checked={shadowConfig.enabled}
              onChange={(e) => {
                const newConfig = { ...shadowConfig, enabled: e.target.checked };
                setShadowConfig(newConfig);
                applyShadow(selectedObject, newConfig);
              }}
              className="accent-jsv-orange"
            />
          </div>
          
          {shadowConfig.enabled && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
              <div className="flex gap-2">
                {(['contact', 'drop', '3d_floor'] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => {
                      const newConfig = { ...shadowConfig, type };
                      setShadowConfig(newConfig);
                      applyShadow(selectedObject, newConfig);
                    }}
                    className={`flex-1 py-2 rounded-lg text-[8px] font-bold uppercase border transition-all ${shadowConfig.type === type ? 'bg-jsv-orange border-jsv-orange text-black' : 'border-white/10 text-gray-400'}`}
                  >
                    {type.replace('_', ' ')}
                  </button>
                ))}
              </div>
              <input 
                type="range" min="0" max="100" 
                value={shadowConfig.blur}
                onChange={(e) => {
                  const newConfig = { ...shadowConfig, blur: parseInt(e.target.value) };
                  setShadowConfig(newConfig);
                  applyShadow(selectedObject, newConfig);
                }}
                className="w-full accent-jsv-orange"
              />
            </div>
          )}
        </div>

        {/* Outline Controls */}
        <div className="space-y-4 border-t border-white/5 pt-6">
          <div className="flex items-center justify-between">
            <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase flex items-center gap-2">
              <Scissors size={14} /> Contorno
            </label>
            <input 
              type="checkbox" 
              checked={outlineConfig.enabled}
              onChange={(e) => {
                const newConfig = { ...outlineConfig, enabled: e.target.checked };
                setOutlineConfig(newConfig);
                applyOutline(selectedObject, newConfig);
              }}
              className="accent-jsv-orange"
            />
          </div>
          {outlineConfig.enabled && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
              <input 
                type="range" min="0" max="20" 
                value={outlineConfig.width}
                onChange={(e) => {
                  const newConfig = { ...outlineConfig, width: parseInt(e.target.value) };
                  setOutlineConfig(newConfig);
                  applyOutline(selectedObject, newConfig);
                }}
                className="w-full accent-jsv-orange"
              />
              <input 
                type="color"
                value={outlineConfig.color}
                onChange={(e) => {
                  const newConfig = { ...outlineConfig, color: e.target.value };
                  setOutlineConfig(newConfig);
                  applyOutline(selectedObject, newConfig);
                }}
                className="w-full h-8 bg-transparent border-none cursor-pointer"
              />
            </div>
          )}
        </div>

        {selectedObject instanceof fabric.Image && (
          <div className="space-y-4 border-t border-white/5 pt-6">
            <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Transformación</label>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => updateSelectedStyle({ flipX: !selectedObject.flipX })} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-white hover:bg-white/10 transition-all flex flex-col items-center gap-2">
                <RefreshCw size={20} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Reflejar H</span>
              </button>
              <button onClick={() => updateSelectedStyle({ flipY: !selectedObject.flipY })} className="bg-white/5 border border-white/10 p-4 rounded-2xl text-white hover:bg-white/10 transition-all flex flex-col items-center gap-2">
                <RefreshCw className="rotate-90" size={20} />
                <span className="text-[10px] font-bold tracking-widest uppercase">Reflejar V</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full min-h-[600px] lg:h-[calc(100vh-100px)]">
      {/* Canvas Area */}
      <div className="flex-1 glass-panel rounded-3xl overflow-hidden relative flex items-center justify-center bg-black/20 p-1">
        <div className="relative shadow-2xl border border-white/10 rounded-lg overflow-hidden bg-white">
          <canvas ref={canvasRef} />
        </div>

        {/* Floating AI Actions */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
          <button 
            onClick={handleRemoveBg}
            disabled={isRemovingBg}
            className="bg-black/60 backdrop-blur-xl border border-white/20 text-white px-6 py-3 rounded-2xl flex items-center gap-2 hover:bg-jsv-orange hover:text-black transition-all shadow-xl group"
          >
            {isRemovingBg ? <RefreshCw className="animate-spin" size={18} /> : <Scissors className="group-hover:rotate-12 transition-transform" size={18} />}
            <span className="text-xs font-bold tracking-widest uppercase">Quitar Fondo</span>
          </button>
          <button 
            onClick={handleMagicAi}
            disabled={isAiLoading}
            className="bg-jsv-orange text-black px-6 py-3 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_20px_rgba(245,208,97,0.4)]"
          >
            {isAiLoading ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            <span className="text-xs font-bold tracking-widest uppercase">Mágia IA</span>
          </button>
        </div>
      </div>

      {/* Sidebar Tools */}
      <div className="w-full lg:w-72 glass-panel rounded-3xl flex flex-col overflow-hidden border border-white/5">
        <div className="flex border-b border-white/10 bg-black/40">
          <button onClick={() => setActiveTab('edit')} className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'edit' ? 'text-jsv-orange border-b-2 border-jsv-orange bg-white/5' : 'text-gray-500 hover:text-white'}`}>Editar</button>
          <button onClick={() => setActiveTab('templates')} className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'templates' ? 'text-jsv-orange border-b-2 border-jsv-orange bg-white/5' : 'text-gray-500 hover:text-white'}`}>Plantillas</button>
          <button onClick={() => setActiveTab('layers')} className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'layers' ? 'text-jsv-orange border-b-2 border-jsv-orange bg-white/5' : 'text-gray-500 hover:text-white'}`}>Capas</button>
          <button onClick={() => setActiveTab('ai')} className={`flex-1 py-4 text-[10px] font-bold tracking-widest uppercase transition-all ${activeTab === 'ai' ? 'text-jsv-orange border-b-2 border-jsv-orange bg-white/5' : 'text-gray-500 hover:text-white'}`}>IA</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
          {activeTab === 'edit' && renderEditTools()}

          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 gap-4">
              {[
                { id: 'jsv_standard', name: 'JSV Estándar', icon: <Box /> },
                { id: 'marketplace', name: 'Marketplace', icon: <ImageIcon /> },
                { id: 'social', name: 'Redes Sociales', icon: <Sparkles /> }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => applyTemplate(t.id)}
                  className="group relative bg-black/40 border border-white/10 p-6 rounded-3xl hover:border-jsv-orange transition-all overflow-hidden"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 rounded-2xl text-gray-400 group-hover:text-jsv-orange transition-colors">
                      {t.icon}
                    </div>
                    <span className="text-sm font-bold text-white tracking-tight">{t.name}</span>
                  </div>
                  <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Plus size={16} className="text-jsv-orange" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'layers' && (
            <div className="space-y-3">
              {fabricCanvas.current?.getObjects().map((obj, i) => (
                <div key={i} className="flex items-center justify-between bg-black/40 p-4 rounded-2xl border border-white/5 hover:bg-white/5 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/5 rounded-lg">
                      {obj instanceof fabric.Text ? <Type size={14} /> : <ImageIcon size={14} />}
                    </div>
                    <span className="text-xs font-bold text-white tracking-tight">
                      {obj instanceof fabric.Text ? obj.text?.substring(0, 15) : 'Imagen'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { obj.visible = !obj.visible; fabricCanvas.current?.renderAll(); }} className="p-2 text-gray-500 hover:text-white transition-colors">
                      {obj.visible ? <Eye size={16} /> : <EyeOff size={16} />}
                    </button>
                    <button onClick={() => { fabricCanvas.current?.remove(obj); fabricCanvas.current?.renderAll(); }} className="p-2 text-red-500/50 hover:text-red-500 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )).reverse()}
            </div>
          )}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-gray-500 tracking-widest uppercase">Generar Fondo con IA</label>
                <div className="flex gap-2">
                  <input 
                    type="text"
                    value={bgPrompt}
                    onChange={(e) => setBgPrompt(e.target.value)}
                    placeholder="Ej. Estudio minimalista, luz cálida..."
                    className="flex-1 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm focus:border-jsv-orange outline-none"
                  />
                  <button 
                    onClick={() => handleGenerateBackground(bgPrompt)}
                    disabled={isGeneratingBg || !bgPrompt}
                    className="bg-jsv-orange text-black p-3 rounded-xl hover:scale-105 transition-all disabled:opacity-50"
                  >
                    {isGeneratingBg ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
                  </button>
                </div>
                <p className="text-[9px] text-gray-500 italic">Describe el entorno donde quieres colocar tu producto.</p>
              </div>

              <div className="pt-6 border-t border-white/5 space-y-4">
                <label className="text-[10px] font-bold text-gray-400 tracking-widest uppercase">Mejoras Automáticas</label>
                <button 
                  onClick={handleMagicAi}
                  disabled={isAiLoading}
                  className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white hover:bg-white/10 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isAiLoading ? <RefreshCw className="animate-spin" size={18} /> : <Wand2 size={18} className="text-jsv-orange" />}
                  <div className="text-left">
                    <p className="text-[10px] font-bold uppercase">Auto-Composición</p>
                    <p className="text-[8px] text-gray-500">Ajusta escala, luz y sombras con Gemini</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Global Actions */}
        <div className="p-6 bg-black/60 border-t border-white/10 grid grid-cols-2 gap-4">
          <button onClick={() => fabricCanvas.current?.clear()} className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all">
            <Eraser size={16} /> Limpiar
          </button>
          <button onClick={() => {
            const active = fabricCanvas.current?.getActiveObject();
            if (active) {
              active.clone().then((cloned: any) => {
                cloned.set({ left: cloned.left + 20, top: cloned.top + 20 });
                fabricCanvas.current?.add(cloned);
                fabricCanvas.current?.setActiveObject(cloned);
              });
            }
          }} className="flex items-center justify-center gap-2 py-4 rounded-2xl border border-white/10 text-white text-[10px] font-bold tracking-widest uppercase hover:bg-white/5 transition-all">
            <Copy size={16} /> Duplicar
          </button>
        </div>
      </div>
    </div>
  );
}
