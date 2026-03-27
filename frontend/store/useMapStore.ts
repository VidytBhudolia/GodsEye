import { create } from 'zustand';
// TODO: replace with ../../shared/contract.ts import
import { Entity } from '@/types/contract';

interface MapStore {
  entities: Record<string, Entity>;
  selectedEntity: Entity | null;
  activeLayers: string[];
  cursorCoords: { lng: number; lat: number } | null;
  updateEntity: (entity: Entity) => void;
  removeEntity: (id: string) => void;
  setSelectedEntity: (entity: Entity | null) => void;
  toggleLayer: (layer: string) => void;
  setCursorCoords: (coords: { lng: number; lat: number } | null) => void;
}

export const useMapStore = create<MapStore>((set) => ({
  entities: {},
  selectedEntity: null,
  activeLayers: ['ship', 'aircraft'],
  cursorCoords: null,
  
  updateEntity: (entity) =>
    set((state) => ({
      entities: { ...state.entities, [entity.id]: entity },
    })),
    
  removeEntity: (id) =>
    set((state) => {
      const newEntities = { ...state.entities };
      delete newEntities[id];
      return { entities: newEntities };
    }),
    
  setSelectedEntity: (entity) => set({ selectedEntity: entity }),
  
  toggleLayer: (layer) =>
    set((state) => ({
      activeLayers: state.activeLayers.includes(layer)
        ? state.activeLayers.filter((l) => l !== layer)
        : [...state.activeLayers, layer],
    })),
    
  setCursorCoords: (coords) => set({ cursorCoords: coords }),
}));
