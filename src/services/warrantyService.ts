import jsPDF from 'jspdf';
import { toast } from 'sonner';

export interface WarrantyRecord {
  id: string;
  customerName: string;
  partName: string;
  vehicle: string;
  price: number;
  discount?: number;
  costPrice?: number;
  date: string;
  warrantyDays: number;
  expiryDate: string;
  status: 'active' | 'expired' | 'pending';
}

export const saveWarranty = (record: WarrantyRecord) => {
  const existing = JSON.parse(localStorage.getItem('warranty_registry') || '[]');
  existing.push(record);
  localStorage.setItem('warranty_registry', JSON.stringify(existing));
};

export const getWarranties = (): WarrantyRecord[] => {
  const records = JSON.parse(localStorage.getItem('warranty_registry') || '[]') as WarrantyRecord[];
  // Update statuses based on date
  const now = new Date();
  return records.map(r => {
    const expiry = new Date(r.expiryDate);
    if (expiry < now) r.status = 'expired';
    return r;
  });
};

export const generateWarrantyPDF = (record: WarrantyRecord) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(20);
  doc.text('JSV AUTOPARTES - PÓLIZA DE GARANTÍA', 20, 20);
  
  doc.setFontSize(12);
  doc.text(`Folio: ${record.id}`, 20, 30);
  doc.text(`Fecha: ${record.date}`, 20, 36);
  
  // Customer Info
  doc.setLineWidth(0.5);
  doc.line(20, 45, 190, 45);
  doc.text(`Cliente: ${record.customerName}`, 20, 55);
  doc.text(`Vehículo: ${record.vehicle}`, 20, 62);
  doc.text(`Pieza: ${record.partName}`, 20, 69);
  doc.text(`Precio: $${record.price.toLocaleString()}`, 20, 76);
  // Terms
  doc.setFontSize(10);
  const terms = [
    "1. Esta garantía cubre exclusivamente defectos de funcionamiento de la pieza.",
    "2. No cubre daños por mala instalación, negligencia o modificaciones.",
    "3. Es indispensable presentar esta póliza para cualquier reclamación.",
    "4. Las partes eléctricas tienen garantía limitada de 15 días.",
    "5. En caso de devolución, se entregará otra pieza igual o nota de crédito.",
    "6. No hay devoluciones de dinero en efectivo."
  ];

  let y = 0;
  if (record.discount && record.discount > 0) {
    doc.text(`Descuento: -$${record.discount.toLocaleString()}`, 20, 83);
    doc.setFontSize(14);
    doc.text(`TOTAL PAGADO: $${(record.price - record.discount).toLocaleString()}`, 20, 92);
    doc.setFontSize(12);
    doc.line(20, 100, 190, 100);
    doc.setFontSize(14);
    doc.text(`VIGENCIA: ${record.warrantyDays} DÍAS`, 20, 110);
    doc.setFontSize(12);
    doc.text(`Vence el: ${record.expiryDate}`, 20, 117);
    y = 135;
  } else {
    doc.line(20, 85, 190, 85);
    doc.setFontSize(14);
    doc.text(`VIGENCIA: ${record.warrantyDays} DÍAS`, 20, 95);
    doc.setFontSize(12);
    doc.text(`Vence el: ${record.expiryDate}`, 20, 102);
    y = 120;
  }
  terms.forEach(term => {
    doc.text(term, 20, y);
    y += 8;
  });
  
  // Signatures
  doc.line(20, 250, 80, 250);
  doc.text("Firma JSV Autopartes", 20, 255);
  
  doc.line(120, 250, 180, 250);
  doc.text("Firma de Conformidad Cliente", 120, 255);
  
  doc.save(`GARANTIA_${record.customerName}_${record.partName}.pdf`);
  toast.success('Póliza PDF generada');
};
