import React, { useState, useEffect } from 'react';
import { Vehicle, Part } from '../types';
import { useInventory } from '../hooks/useInventory';
import { Car, ChevronRight, CheckCircle, AlertCircle, Package, Search } from 'lucide-react';
import { AuditDeck } from './AuditDeck';

interface InventoryScreenProps {
  vehicles: Vehicle[];
  parts: Part[];
  inventoryHook: ReturnType<typeof useInventory>;
  onOpenWarranty: () => void;
  globalSearch?: string;
  setGlobalSearch?: (s: string) => void;
}

export function InventoryScreen({ vehicles, parts, inventoryHook, onOpenWarranty, globalSearch, setGlobalSearch }: InventoryScreenProps) {
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { inventory } = inventoryHook;

  useEffect(() => {
    if (globalSearch !== undefined) {
      setSearchQuery(globalSearch);
    }
  }, [globalSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    if (setGlobalSearch) setGlobalSearch(e.target.value);
  };

  if (selectedVehicleId) {
    const vehicle = vehicles.find(v => v.id === selectedVehicleId)!;
    return (
      <AuditDeck 
        vehicle={vehicle}
        parts={parts}
        inventoryHook={inventoryHook}
        onBack={() => setSelectedVehicleId(null)}
        onOpenWarranty={onOpenWarranty}
        globalSearch={globalSearch}
      />
    );
  }

  // Filter vehicles based on search
  const filteredVehicles = vehicles.filter(v => 
    v.model.toLowerCase().includes(searchQuery.toLowerCase()) || 
    v.yearRange.includes(searchQuery) ||
    v.color.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 pb-24 space-y-6">
      <div className="space-y-3">
        <h2 className="text-[10px] font-medium tracking-widest text-gray-400 uppercase">Inventario Inteligente</h2>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} strokeWidth={1.5} />
          <input 
            type="text" 
            data-agent="inventory-search"
            placeholder="Buscar vehículo..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-jsv-orange focus:bg-white/10 placeholder:text-gray-500 transition-all shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
          />
        </div>
      </div>

      <div className="grid gap-3">
        {filteredVehicles.map((vehicle) => {
          const vehicleData = inventory[vehicle.id] || {};
          const confirmedCount = Object.values(vehicleData).filter((p: any) => p.confirmed).length;
          const progress = Math.round((confirmedCount / parts.length) * 100);
          const isComplete = progress === 100;

          return (
            <button
              key={vehicle.id}
              onClick={() => setSelectedVehicleId(vehicle.id)}
              className="w-full glass-panel p-4 rounded-2xl flex items-center gap-4 hover:border-white/20 hover:bg-white/5 transition-all active:scale-[0.98] text-left group"
            >
              <div className={`p-3.5 rounded-2xl transition-all ${isComplete ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.2)]' : 'bg-black/40 text-gray-400 group-hover:text-white border border-white/5'}`}>
                <Car size={24} strokeWidth={1.5} />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium text-white truncate text-base tracking-tight">{vehicle.model}</span>
                  {isComplete ? (
                    <span className="text-[10px] font-medium tracking-widest text-white flex items-center gap-1 uppercase"><CheckCircle size={12} strokeWidth={2} /> LISTO</span>
                  ) : (
                    <span className="text-[10px] font-medium tracking-widest text-gray-500">{confirmedCount}/{parts.length}</span>
                  )}
                </div>
                <div className="text-xs text-gray-400 truncate font-light tracking-wide">{vehicle.yearRange} • {vehicle.color}</div>
                
                {/* Mini Progress Bar */}
                <div className="h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${isComplete ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-jsv-orange shadow-[0_0_8px_rgba(245,208,97,0.5)]'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <ChevronRight size={20} strokeWidth={1.5} className="text-gray-600 group-hover:text-white transition-colors ml-2" />
            </button>
          );
        })}
        
        {filteredVehicles.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-xs font-medium tracking-wide">
            No se encontraron vehículos.
          </div>
        )}
      </div>
    </div>
  );
}
