import { useState, useEffect } from 'react';
import { InventoryState, PartState } from '../types';
import { MASTER_PARTS } from '../data/inventory';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, onSnapshot, doc, setDoc, collectionGroup, query } from 'firebase/firestore';
import { useFirebase } from '../context/FirebaseContext';
import { localDB } from '../services/db';

export function useInventory(activeVehicleId: string) {
  const [inventory, setInventory] = useState<InventoryState>({});
  const [loading, setLoading] = useState(true);
  const { user } = useFirebase();

  // Sync with Firestore
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // We use a collectionGroup to listen to all 'states' subcollections across all vehicles
    const q = query(collectionGroup(db, 'states'));
    
    // Load from cache first
    const loadCache = async () => {
      const cachedParts = await localDB.parts.toArray();
      if (cachedParts.length > 0) {
        const cachedInventory: InventoryState = {};
        cachedParts.forEach(p => {
          if (!cachedInventory[p.vehicleId]) cachedInventory[p.vehicleId] = {};
          cachedInventory[p.vehicleId][p.id] = {
            price: p.price,
            status: p.status as any,
            url: '',
            confirmed: p.status === 'available'
          };
        });
        setInventory(prev => ({ ...prev, ...cachedInventory }));
        setLoading(false);
      }
    };
    loadCache();
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newInventory: InventoryState = {};
      
      snapshot.docs.forEach((docSnap) => {
        const partId = docSnap.id;
        const vehicleId = docSnap.ref.parent.parent?.id;
        const data = docSnap.data() as PartState;
        
        if (vehicleId) {
          if (!newInventory[vehicleId]) {
            newInventory[vehicleId] = {};
          }
          newInventory[vehicleId][partId] = data;

          // Update cache
          localDB.parts.put({
            id: partId,
            vehicleId,
            name: partId, // We don't have the name here easily, but ID is enough for cache key
            price: data.price,
            status: data.status,
            lastUpdated: new Date().toISOString()
          });
        }
      });
      
      setInventory(newInventory);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'inventory/*/states/*');
    });

    return () => unsubscribe();
  }, [user]);

  const getPartState = (vehicleId: string, partId: string): PartState => {
    const vehicleData = inventory[vehicleId] || {};
    const partData = vehicleData[partId];
    
    if (partData) return partData;

    // Default state if not found
    const masterPart = MASTER_PARTS.find(p => p.id === partId);
    return {
      price: masterPart ? masterPart.basePrice : 0,
      url: '',
      confirmed: false,
      status: 'pending'
    };
  };

  const updatePartState = async (vehicleId: string, partId: string, updates: Partial<PartState>) => {
    const currentState = getPartState(vehicleId, partId);
    const newState = { ...currentState, ...updates };
    
    const docRef = doc(db, 'inventory', vehicleId, 'states', partId);
    try {
      await setDoc(docRef, newState, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `inventory/${vehicleId}/states/${partId}`);
    }
  };

  const updatePartPrice = (vehicleId: string, partId: string, delta: number, marketData?: PartState['marketData']) => {
    const currentPart = getPartState(vehicleId, partId);
    updatePartState(vehicleId, partId, { 
      price: Math.max(0, currentPart.price + delta),
      ...(marketData ? { marketData } : {})
    });
  };

  const updatePartUrl = (vehicleId: string, partId: string, url: string) => {
    const isConfirmed = url.trim().startsWith('http');
    updatePartState(vehicleId, partId, { 
      url,
      confirmed: isConfirmed
    });
  };

  const updatePartStatus = (vehicleId: string, partId: string, status: 'available' | 'sold' | 'pending') => {
    updatePartState(vehicleId, partId, { 
      status,
      confirmed: status === 'available'
    });
  };

  return {
    inventory,
    loading,
    getPartState,
    updatePartPrice,
    updatePartUrl,
    updatePartStatus,
    updatePartState
  };
}
