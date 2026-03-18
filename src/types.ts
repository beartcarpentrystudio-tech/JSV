export interface Vehicle {
  id: string;
  model: string;
  yearRange: string;
  color: string;
  notes?: string;
  segment: 'economy' | 'mid' | 'luxury' | 'truck' | 'classic';
  marketValueFactor: number; // 1.0 = Standard, 1.5 = +50%, etc.
}

export interface Part {
  id: string;
  name: string;
  basePrice: number;
  category?: 'mechanical' | 'electronic' | 'chassis' | 'other';
}

export interface PartState {
  price: number;
  url: string;
  confirmed: boolean;
  status?: 'available' | 'sold' | 'pending'; // New status field
  marketData?: {
    report: string;
    referenceUrl: string; // Used
    referenceUrlNew: string; // New
    priceNew: number;
    priceUsed: number;
    timestamp: string;
    source: string;
  };
}

export interface InventoryState {
  [vehicleId: string]: {
    [partId: string]: PartState;
  };
}

export interface WarrantyComponentCheck {
  name: string;
  referenceRange: string;
  unit: string;
}

export interface WarrantyCategory {
  id: string;
  name: string;
  checks: WarrantyComponentCheck[];
}

export interface WarrantyConfig {
  categories: WarrantyCategory[];
}

export interface AISession {
  id: string;
  topicName: string;
  transcript: string;
  keyPoints: string[];
  workflows: string[];
  conclusions: string;
  errorsAndImprovements: string;
  timestamp: any;
  addedBy: string;
}

export interface AIWorkflow {
  id: string;
  title: string;
  description: string;
  actions: string[];
  functionCalls: string[];
  categories: string[];
  windowsUsed: string[];
  websitesUsed: string[];
  useCount: number;
  errorCount: number;
  efficiency: number;
  status: 'green' | 'yellow' | 'red';
  lastModifiedBy: string;
  version: number;
  timestamp: any;
}

export interface TelemetryLog {
  id?: string;
  userId: string;
  action: string;
  target: string;
  metadata?: string;
  timestamp: any;
}
