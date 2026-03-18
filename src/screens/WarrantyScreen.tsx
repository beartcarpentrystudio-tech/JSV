import React, { useState, useEffect, useRef } from 'react';
import { Printer, Save, ArrowLeft, Settings, RefreshCw } from 'lucide-react';
import { Vehicle, Part, WarrantyConfig } from '../types';
import { DEFAULT_WARRANTY_CONFIG } from '../data/inventory';
import { toast } from 'sonner';

interface WarrantyScreenProps {
  vehicle?: Vehicle;
  part?: Part;
  price?: number;
  onBack: () => void;
}

export function WarrantyScreen({ vehicle, part, price, onBack }: WarrantyScreenProps) {
  const [config, setConfig] = useState<WarrantyConfig>(() => {
    const saved = localStorage.getItem('warranty_config');
    return saved ? JSON.parse(saved) : DEFAULT_WARRANTY_CONFIG;
  });

  const [selectedCategory, setSelectedCategory] = useState(config.categories[0].id);
  
  // Form State
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem('warranty_form_draft');
    return saved ? JSON.parse(saved) : {
      clientName: '',
      phone: '',
      city: '',
      destModel: '',
      destVin: '',
      destKm: '',
      mechanic: '',
      laborCost: '',
      atfSpec: '',
      failureDeclaration: '',
      folio: new Date().getTime().toString().slice(-6),
      issueDate: new Date().toLocaleDateString('es-MX'),
      limitDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX'),
      checks: {} as Record<string, string>
    };
  });

  // Auto-save effect
  useEffect(() => {
    const timeout = setTimeout(() => {
      localStorage.setItem('warranty_form_draft', JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData]);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currentCategory = config.categories.find(c => c.id === selectedCategory) || config.categories[0];

  return (
    <div className="min-h-screen bg-black text-black font-sans">
      {/* No-Print Toolbar */}
      <div className="print:hidden glass-header p-4 sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 text-gray-400 hover:text-white glass-button rounded-full transition-all">
            <ArrowLeft size={20} strokeWidth={1.5} />
          </button>
          <h1 className="font-medium text-white tracking-tight text-lg">Generador de Garantía</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:outline-none focus:border-jsv-orange transition-colors"
          >
            {config.categories.map(cat => (
              <option key={cat.id} value={cat.id} className="bg-gray-900">{cat.name}</option>
            ))}
          </select>

          <button onClick={handlePrint} className="bg-jsv-orange text-black px-6 py-2.5 rounded-xl text-[10px] font-medium tracking-widest uppercase flex items-center gap-2 hover:bg-[#f5d061]/90 transition-all shadow-[0_0_15px_rgba(245,208,97,0.3)] hover:shadow-[0_0_25px_rgba(255,255,255,0.4)]">
            <Printer size={16} strokeWidth={1.5} /> IMPRIMIR
          </button>
        </div>
      </div>

      {/* Printable Area */}
      <div className="p-4 md:p-8 print:p-0">
        <div ref={printRef} className="max-w-[21.59cm] mx-auto bg-white p-8 shadow-lg border border-gray-300 print:shadow-none print:border-0 print:p-0 text-xs md:text-sm leading-tight">
          
          {/* HEADER */}
          <header className="border-b-2 border-black pb-2 mb-4 flex justify-between items-start">
            <div className="w-2/3">
              <h1 className="text-2xl font-bold tracking-tighter">JSV-AUTOPARTES</h1>
              <p className="font-bold text-gray-800 text-base">POLÍTICA DE GARANTÍA Y CERTIFICACIÓN TÉCNICA</p>
              <p className="text-xs mt-1">Ubicación: Carretera Bermejillo Kilómetro 16</p>
              <p className="text-xs">Especialistas en Transmisiones Automáticas y Partes de Colisión</p>
            </div>
            <div className="w-1/3 text-right text-[11px]">
              <div className="mb-1">
                <span className="font-bold">FECHA DE EMISIÓN:</span> 
                <span className="inline-block border-b border-black w-24 text-center">{formData.issueDate}</span>
              </div>
              <div className="mb-1">
                <span className="font-bold">FECHA LÍMITE (60 DÍAS):</span> 
                <span className="inline-block border-b border-black w-24 text-center">{formData.limitDate}</span>
              </div>
              <div className="mb-2">
                <span className="font-bold">FOLIO/NOTA:</span> 
                <input 
                  type="text" 
                  value={formData.folio}
                  onChange={(e) => setFormData({...formData, folio: e.target.value})}
                  className="inline-block border-b border-black w-20 text-right font-mono focus:outline-none"
                />
              </div>
              <div className="bg-gray-800 text-white px-1 font-bold inline-block">VENTA AL CAMBIO (AC)</div>
            </div>
          </header>

          {/* PRICE */}
          <div className="text-center mb-3 p-1 border-2 border-green-600 bg-green-100 font-bold text-base print:text-black print:border-black print:bg-white">
            PRECIO DE VENTA (AL CAMBIO): <span className="text-2xl">${price?.toLocaleString() || '0.00'} MXN</span>
          </div>

          {/* SECTION 1: GENERAL DATA */}
          <section className="mb-4 border border-gray-400 p-2">
            <h2 className="font-bold bg-gray-800 text-white px-2 py-0.5 mb-2 text-xs uppercase">1. Datos Generales y Declaración de Instalación</h2>
            
            <div className="grid grid-cols-1 gap-2 mb-2">
              <div className="flex items-end">
                <span className="font-bold w-20">CLIENTE:</span>
                <input 
                  type="text" 
                  className="flex-1 border-b border-black focus:outline-none px-1 uppercase"
                  value={formData.clientName}
                  onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                />
              </div>
              <div className="flex gap-4">
                <div className="w-1/2 flex items-end">
                  <span className="font-bold w-20">TELÉFONO:</span> 
                  <input 
                    type="text" 
                    className="flex-1 border-b border-black focus:outline-none px-1"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div className="w-1/2 flex items-end">
                  <span className="font-bold w-24">CIUDAD/DIR:</span> 
                  <input 
                    type="text" 
                    className="flex-1 border-b border-black focus:outline-none px-1 uppercase"
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-2 border-t border-dashed border-gray-300 pt-2">
              <div>
                <p className="font-bold text-xs mb-1">ORIGEN DE LA PIEZA (JSV):</p>
                <p>Desmontada de: <span className="border-b border-black font-mono font-bold">{vehicle ? `${vehicle.model} ${vehicle.yearRange}` : 'VEHÍCULO NO ESPECIFICADO'}</span></p>
                <p className="text-[10px] mt-1">Parte: <span className="font-bold">{part?.name || 'GENÉRICA'}</span></p>
              </div>
              <div>
                <p className="font-bold text-xs mb-1">DESTINO (VEHÍCULO CLIENTE):</p>
                <div className="flex items-end mb-1"><span className="w-24">MODELO:</span> <input type="text" className="flex-1 border-b border-black focus:outline-none px-1 uppercase text-xs" value={formData.destModel} onChange={e => setFormData({...formData, destModel: e.target.value})} /></div>
                <div className="flex items-end mb-1"><span className="w-24">VIN/SERIE:</span> <input type="text" className="flex-1 border-b border-black focus:outline-none px-1 uppercase text-xs" value={formData.destVin} onChange={e => setFormData({...formData, destVin: e.target.value})} /></div>
                <div className="flex items-end"><span className="w-24">KILOMETRAJE:</span> <input type="text" className="flex-1 border-b border-black focus:outline-none px-1 uppercase text-xs" value={formData.destKm} onChange={e => setFormData({...formData, destKm: e.target.value})} /></div>
              </div>
            </div>

            <div className="mb-2 border-t border-dashed border-gray-300 pt-2">
              <div className="flex gap-2 mb-1 items-end">
                <span className="font-bold">MECÁNICO/TALLER:</span> 
                <input type="text" className="flex-1 border-b border-black focus:outline-none px-1 uppercase" value={formData.mechanic} onChange={e => setFormData({...formData, mechanic: e.target.value})} />
                <span className="font-bold ml-2">COSTO M.O.:</span> 
                <span className="border-b border-black w-4 text-center">$</span>
                <input type="text" className="w-20 border-b border-black focus:outline-none px-1" value={formData.laborCost} onChange={e => setFormData({...formData, laborCost: e.target.value})} />
              </div>
              <div className="flex gap-2 mb-1 items-end">
                <span className="font-bold">ESPECIFICACIÓN ATF USADO:</span> 
                <input type="text" className="flex-1 border-b border-black focus:outline-none px-1 uppercase" value={formData.atfSpec} onChange={e => setFormData({...formData, atfSpec: e.target.value})} />
              </div>
              <div className="bg-gray-100 p-2 border border-gray-300 mt-1">
                <span className="font-bold block text-xs mb-1">DECLARACIÓN DE FALLA PREVIA (OBLIGATORIO):</span>
                <p className="text-[10px] italic text-gray-500 mb-1">Motivo exacto por el que falló la transmisión anterior del cliente.</p>
                <textarea 
                  className="w-full bg-transparent border-b border-black focus:outline-none resize-none h-12 text-xs"
                  value={formData.failureDeclaration}
                  onChange={e => setFormData({...formData, failureDeclaration: e.target.value})}
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: CHECKLIST */}
          <section className="mb-4">
            <h2 className="font-bold bg-gray-800 text-white px-2 py-0.5 mb-2 text-xs uppercase">2. Checklist de Certificación Técnica (Pre-Entrega JSV)</h2>
            <table className="w-full text-xs border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-200 text-center font-bold">
                  <th className="border border-gray-400 p-1 text-left w-1/3">COMPONENTE</th>
                  <th className="border border-gray-400 p-1 w-1/4">RANGO REFERENCIA</th>
                  <th className="border border-gray-400 p-1 w-1/4">VALOR OBTENIDO</th>
                  <th className="border border-gray-400 p-1 w-1/6">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {currentCategory.checks.map((check, idx) => (
                  <tr key={idx}>
                    <td className="border border-gray-400 p-1 font-medium">{check.name}</td>
                    <td className="border border-gray-400 p-1 text-center">{check.referenceRange} {check.unit}</td>
                    <td className="border border-gray-400 p-1 bg-white p-0">
                      <input 
                        type="text" 
                        className="w-full h-full text-center focus:outline-none py-1"
                        placeholder="---"
                        value={formData.checks[check.name] || ''}
                        onChange={(e) => setFormData({
                          ...formData, 
                          checks: { ...formData.checks, [check.name]: e.target.value }
                        })}
                      />
                    </td>
                    <td className="border border-gray-400 p-1 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <div className="w-3 h-3 border border-black"></div> OK
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* SECTION 3: CLAUSES */}
          <section className="mb-4">
            <h2 className="font-bold bg-gray-800 text-white px-2 py-0.5 mb-1 text-xs uppercase">3. Cláusulas y Restricciones</h2>
            <ol className="list-decimal list-inside text-[10px] md:text-xs text-justify space-y-1 pl-1">
              <li><span className="font-bold">ALCANCE DE GARANTÍA:</span> La garantía tiene una vigencia estricta de <span className="font-bold underline">60 días naturales</span> a partir de la fecha de compra. Se limita exclusivamente a la <span className="font-bold">reparación o cambio físico</span> de la autoparte. <span className="font-bold text-red-700 print:text-black">NO SE REALIZAN DEVOLUCIONES DE DINERO EN EFECTIVO</span>.</li>
              <li><span className="font-bold">EXCLUSIÓN TOTAL DE GASTOS ADICIONALES:</span> JSV-AUTOPARTES <span className="font-bold text-red-700 print:text-black">NO SE HACE RESPONSABLE</span> por costos de mano de obra, instalaciones, grúas, aceites, etc.</li>
              <li><span className="font-bold">RESPONSABILIDAD DE INSTALACIÓN:</span> Es obligación del instalador verificar cableado y computadora. Uso de fluido incorrecto anula garantía. Corto circuito anula garantía.</li>
              <li><span className="font-bold">INTEGRIDAD DE LA PIEZA:</span> Sellos rotos o pieza abierta sin autorización anulan la garantía.</li>
            </ol>
          </section>

          {/* SECTION 4: PROTOCOL */}
          <section className="mb-6">
            <h2 className="font-bold bg-gray-800 text-white px-2 py-0.5 mb-1 text-xs uppercase">4. Protocolo Obligatorio de Reclamación</h2>
            <div className="border border-gray-400 p-2 text-[10px] md:text-xs">
              <p className="mb-1"><span className="font-bold">PASO 1 (NOTIFICACIÓN):</span> Notificar falla y agendar cita (48h). Tomar evidencia foto/video antes de mover.</p>
              <p className="mb-1 bg-gray-100 py-1"><span className="font-bold">PASO 2 (REVISIÓN MONTADA):</span> Vehículo debe presentarse con <span className="font-bold underline">TRANSMISIÓN MONTADA</span>. Si se desmonta antes, se pierde garantía. Diagnóstico fallido (falla ajena a pieza) tiene costo de $600.00.</p>
              <p><span className="font-bold">PASO 3 (RESOLUCIÓN):</span> A) Ajuste externo: Se corrige. B) Falla interna: 3-5 días hábiles para reparación/reemplazo.</p>
            </div>
          </section>

          {/* FOOTER */}
          <footer className="mt-8 pt-4">
            <div className="flex justify-between items-end text-center gap-8">
              <div className="w-1/2">
                <div className="h-10 border-b border-black mb-2"></div>
                <p className="font-bold text-xs">FIRMA DE CONFORMIDAD DEL CLIENTE</p>
                <p className="text-[9px] text-gray-500">Acepto términos, condiciones y estado físico de la pieza vendida.</p>
              </div>
              <div className="w-1/2">
                <div className="h-10 border-b border-black mb-2 flex justify-center items-end pb-1">
                  <span className="font-serif text-xl italic text-gray-400">JSV-Official</span>
                </div>
                <p className="font-bold text-xs">AUTORIZACIÓN JSV-AUTOPARTES</p>
                <p className="text-[9px] text-gray-500">Departamento Técnico / Ventas</p>
              </div>
            </div>
            <p className="text-center text-[8px] mt-6 text-gray-400 uppercase">Documento generado por Sistema MondayOS v4.4 - Uso exclusivo JSV Autopartes - Bermejillo, Dgo.</p>
          </footer>

        </div>
      </div>
    </div>
  );
}
