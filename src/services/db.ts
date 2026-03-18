import Dexie, { Table } from 'dexie';

export interface CachedVehicle {
  id: string;
  model: string;
  year: string;
  vin: string;
  status: string;
  lastUpdated: string;
}

export interface CachedPart {
  id: string;
  vehicleId: string;
  name: string;
  price: number;
  status: string;
  lastUpdated: string;
}

export interface ErrorLog {
  id?: number;
  message: string;
  stack?: string;
  timestamp: string;
  userId?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  synced: boolean;
}

export class MondayOSDatabase extends Dexie {
  vehicles!: Table<CachedVehicle>;
  parts!: Table<CachedPart>;
  errorLogs!: Table<ErrorLog>;

  constructor() {
    super('MondayOS_DB');
    this.version(1).stores({
      vehicles: 'id, model, status',
      parts: 'id, vehicleId, name, status',
      errorLogs: '++id, timestamp, severity, synced'
    });
  }
}

export const localDB = new MondayOSDatabase();
