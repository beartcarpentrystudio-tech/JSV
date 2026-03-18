import { Vehicle, Part } from '../types';

export const VEHICLES: Vehicle[] = [
  { 
    id: 'M1', 
    model: 'Chrysler 200', 
    yearRange: '2011-2014', 
    color: 'Café / Bronce',
    notes: 'Motor 2.4L (Venta OK) / Motor 3.6L (NO SE VENDE)',
    segment: 'mid',
    marketValueFactor: 1.3
  },
  { 
    id: 'M2', 
    model: 'Chevrolet Aveo', 
    yearRange: '2008 & 2013', 
    color: 'Olympic White',
    segment: 'economy',
    marketValueFactor: 0.9
  },
  { 
    id: 'M3', 
    model: 'Honda Civic', 
    yearRange: '2001-2005', 
    color: 'Rojo (Radiant Ruby)',
    segment: 'economy',
    marketValueFactor: 1.0
  },
  { 
    id: 'M4', 
    model: 'Toyota Camry', 
    yearRange: '1994-1999', 
    color: 'Verde / Negro Tornasol',
    segment: 'classic',
    marketValueFactor: 0.8
  },
  { 
    id: 'M5', 
    model: 'Ford Econoline E350', 
    yearRange: '1998-2004', 
    color: 'Oxford White',
    segment: 'truck',
    marketValueFactor: 2.2
  },
  { 
    id: 'M6', 
    model: 'Honda Accord Coupé', 
    yearRange: '1994-1997', 
    color: 'Arena Metálico',
    segment: 'classic',
    marketValueFactor: 0.85
  },
  { 
    id: 'M7', 
    model: 'Ford Focus', 
    yearRange: '2008-2012', 
    color: 'Negro',
    segment: 'economy',
    marketValueFactor: 1.1
  }
];

export const MASTER_PARTS: Part[] = [
  // MOTOR (Mechanical)
  { id: 'ENG-01', name: 'Motor 3/4', basePrice: 12000, category: 'mechanical' },
  { id: 'ENG-02', name: 'Cabeza de Motor', basePrice: 3500, category: 'mechanical' },
  { id: 'ENG-03', name: 'Cigüeñal', basePrice: 2500, category: 'mechanical' },
  { id: 'ENG-04', name: 'Árbol de Levas', basePrice: 1200, category: 'mechanical' },
  { id: 'ENG-05', name: 'Pistón con Biela', basePrice: 450, category: 'mechanical' },
  { id: 'ENG-06', name: 'Cárter de Motor', basePrice: 800, category: 'mechanical' },
  { id: 'ENG-07', name: 'Tapa de Punterías', basePrice: 650, category: 'mechanical' },
  { id: 'ENG-08', name: 'Polea Damper', basePrice: 550, category: 'mechanical' },
  { id: 'ENG-09', name: 'Soporte de Motor', basePrice: 450, category: 'mechanical' },
  { id: 'ENG-10', name: 'Volante Motriz', basePrice: 900, category: 'mechanical' },

  // TRANSMISIÓN (Mechanical/Electronic)
  { id: 'TRN-01', name: 'Transmisión Automática', basePrice: 8500, category: 'mechanical' },
  { id: 'TRN-02', name: 'Turbina', basePrice: 1200, category: 'mechanical' },
  { id: 'TRN-03', name: 'Cuerpo de Válvulas', basePrice: 2500, category: 'mechanical' },
  { id: 'TRN-04', name: 'Computadora Transmisión (TCM)', basePrice: 2800, category: 'electronic' },
  { id: 'TRN-05', name: 'Flecha Homocinética', basePrice: 850, category: 'mechanical' },

  // ELÉCTRICO (Electronic)
  { id: 'ELE-01', name: 'Alternador', basePrice: 1300, category: 'electronic' },
  { id: 'ELE-02', name: 'Marcha', basePrice: 1050, category: 'electronic' },
  { id: 'ELE-03', name: 'Computadora Motor (ECU)', basePrice: 3850, category: 'electronic' },
  { id: 'ELE-04', name: 'Bobina de Encendido', basePrice: 950, category: 'electronic' },
  { id: 'ELE-05', name: 'Cuerpo de Aceleración', basePrice: 1250, category: 'electronic' },
  { id: 'ELE-06', name: 'Sensor MAF', basePrice: 850, category: 'electronic' },
  { id: 'ELE-07', name: 'Sensor MAP', basePrice: 450, category: 'electronic' },
  { id: 'ELE-08', name: 'Sensor Oxígeno', basePrice: 650, category: 'electronic' },
  { id: 'ELE-09', name: 'Tablero de Instrumentos', basePrice: 1500, category: 'electronic' },
  { id: 'ELE-10', name: 'Módulo ABS', basePrice: 2200, category: 'electronic' },

  // ENFRIAMIENTO (Mechanical)
  { id: 'COL-01', name: 'Radiador', basePrice: 1100, category: 'mechanical' },
  { id: 'COL-02', name: 'Motoventilador', basePrice: 1250, category: 'electronic' },
  { id: 'COL-03', name: 'Bomba de Agua', basePrice: 750, category: 'mechanical' },
  { id: 'COL-04', name: 'Compresor A/C', basePrice: 2800, category: 'mechanical' },
  { id: 'COL-05', name: 'Condensador', basePrice: 950, category: 'mechanical' },

  // SUSPENSIÓN Y FRENOS (Chassis)
  { id: 'SUS-01', name: 'Amortiguador Delantero', basePrice: 750, category: 'chassis' },
  { id: 'SUS-02', name: 'Horquilla', basePrice: 650, category: 'chassis' },
  { id: 'SUS-03', name: 'Cremallera Dirección', basePrice: 2950, category: 'chassis' },
  { id: 'SUS-04', name: 'Mango con Masa', basePrice: 850, category: 'chassis' },
  { id: 'SUS-05', name: 'Caliper de Freno', basePrice: 650, category: 'chassis' },
  { id: 'SUS-06', name: 'Booster de Freno', basePrice: 950, category: 'chassis' },

  // CARROCERÍA (Chassis)
  { id: 'BDY-01', name: 'Faro Derecho', basePrice: 1100, category: 'chassis' },
  { id: 'BDY-02', name: 'Faro Izquierdo', basePrice: 1100, category: 'chassis' },
  { id: 'BDY-03', name: 'Calavera Derecha', basePrice: 850, category: 'chassis' },
  { id: 'BDY-04', name: 'Calavera Izquierda', basePrice: 850, category: 'chassis' },
  { id: 'BDY-05', name: 'Espejo Lateral', basePrice: 650, category: 'chassis' },
  { id: 'BDY-06', name: 'Facia Delantera', basePrice: 1500, category: 'chassis' },
  { id: 'BDY-07', name: 'Facia Trasera', basePrice: 1500, category: 'chassis' },
  { id: 'BDY-08', name: 'Salpicadera', basePrice: 900, category: 'chassis' },
  { id: 'BDY-09', name: 'Cofre', basePrice: 2200, category: 'chassis' },
  { id: 'BDY-10', name: 'Puerta Delantera', basePrice: 1800, category: 'chassis' },
];

export const DEFAULT_WARRANTY_CONFIG: import('../types').WarrantyConfig = {
  categories: [
    {
      id: 'transmission',
      name: 'Transmisión Automática',
      checks: [
        { name: 'Solenoide de Cambio A (1-2)', referenceRange: '11 - 15', unit: 'Ω' },
        { name: 'Solenoide de Cambio B (2-3)', referenceRange: '11 - 15', unit: 'Ω' },
        { name: 'Solenoide TCC (Lock-Up)', referenceRange: '11 - 15', unit: 'Ω' },
        { name: 'Solenoide EPC (Presión)', referenceRange: '3 - 6', unit: 'Ω' },
        { name: 'Partes Duras / Carcasa', referenceRange: 'Inspección Visual', unit: '' },
      ]
    },
    {
      id: 'engine_electric',
      name: 'Motor / Eléctrico',
      checks: [
        { name: 'Resistencia Bobinado', referenceRange: '0.5 - 1.2', unit: 'Ω' },
        { name: 'Continuidad', referenceRange: 'Audible', unit: '' },
        { name: 'Voltaje Salida', referenceRange: '13.5 - 14.5', unit: 'V' },
        { name: 'Inspección Conectores', referenceRange: 'Sin Sulfato', unit: '' },
      ]
    },
    {
      id: 'suspension',
      name: 'Suspensión / Frenos',
      checks: [
        { name: 'Fugas de Fluido', referenceRange: 'Nula', unit: '' },
        { name: 'Juego Axial', referenceRange: 'Nulo', unit: '' },
        { name: 'Gomas / Bujes', referenceRange: 'Sin Grietas', unit: '' },
      ]
    }
  ]
};
