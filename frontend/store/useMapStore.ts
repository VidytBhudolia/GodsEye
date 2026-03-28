import { create } from 'zustand';
import type { Map as MapLibreMap } from 'maplibre-gl';
// TODO: replace with ../../shared/contract.ts import
import { Entity, EntityType } from '@/types/contract';

const LAYERS_STORAGE_KEY = 'godseye:layers';
const ALL_LAYER_IDS = ['ship', 'aircraft', 'satellite', 'signal'] as const;

type LayerId = typeof ALL_LAYER_IDS[number];

type LayerStorageShape = {
  ships?: boolean;
  aircraft?: boolean;
  satellites?: boolean;
  signal?: boolean;
  radio?: boolean;
};

function getDefaultLayerState(): Record<LayerId, boolean> {
  return {
    ship: true,
    aircraft: true,
    satellite: true,
    signal: true,
  };
}

function readStoredLayers(): Record<LayerId, boolean> {
  if (typeof window === 'undefined') {
    return getDefaultLayerState();
  }

  try {
    const raw = window.localStorage.getItem(LAYERS_STORAGE_KEY);
    if (!raw) {
      return getDefaultLayerState();
    }

    const parsed = JSON.parse(raw) as LayerStorageShape;
    const defaults = getDefaultLayerState();

    return {
      ship: parsed.ships ?? defaults.ship,
      aircraft: parsed.aircraft ?? defaults.aircraft,
      satellite: parsed.satellites ?? defaults.satellite,
      signal: parsed.signal ?? parsed.radio ?? defaults.signal,
    };
  } catch {
    return getDefaultLayerState();
  }
}

function persistLayers(layerState: Record<LayerId, boolean>) {
  if (typeof window === 'undefined') {
    return;
  }

  const payload: LayerStorageShape = {
    ships: layerState.ship,
    aircraft: layerState.aircraft,
    satellites: layerState.satellite,
    signal: layerState.signal,
  };

  window.localStorage.setItem(LAYERS_STORAGE_KEY, JSON.stringify(payload));
}

function getActiveLayersFromState(layerState: Record<LayerId, boolean>): LayerId[] {
  return ALL_LAYER_IDS.filter((layer) => layerState[layer]);
}

interface MapStore {
  entities: Record<string, Entity>;
  hasReceivedEntityData: boolean;
  socketConnected: boolean;
  selectedEntity: Entity | null;
  activeLayers: LayerId[];
  layerVisibility: Record<LayerId, boolean>;
  cursorCoords: { lng: number; lat: number } | null;
  historicalRoute: [number, number][] | null;
  selectedHistoryRouteId: string | null;
  mapInstance: MapLibreMap | null;
  updateEntity: (entity: Entity) => void;
  applyEntityBatch: (entities: Entity[]) => void;
  removeEntity: (id: string) => void;
  setSelectedEntity: (entity: Entity | null) => void;
  toggleLayer: (layer: LayerId) => void;
  hydrateLayers: () => void;
  setCursorCoords: (coords: { lng: number; lat: number } | null) => void;
  setHistoricalRoute: (route: [number, number][] | null) => void;
  clearHistoricalRoute: () => void;
  setSelectedHistoryRouteId: (id: string | null) => void;
  setMapInstance: (map: MapLibreMap | null) => void;
  setSocketConnected: (connected: boolean) => void;
  getEntityCountByType: (type: LayerId) => number;
  selectEntitiesByType: (type: EntityType) => Entity[];
  selectCounts: () => {
    aircraft: number;
    ships: number;
    satellites: number;
    signals: number;
  };
}

const initialLayerVisibility = getDefaultLayerState();

export const useMapStore = create<MapStore>((set, get) => ({
  entities: {},
  hasReceivedEntityData: false,
  socketConnected: false,
  selectedEntity: null,
  activeLayers: getActiveLayersFromState(initialLayerVisibility),
  layerVisibility: initialLayerVisibility,
  cursorCoords: null,
  historicalRoute: null,
  selectedHistoryRouteId: null,
  mapInstance: null,
  
  updateEntity: (entity) =>
    set((state) => ({
      entities: { ...state.entities, [entity.id]: entity },
      hasReceivedEntityData: true,
    })),

  applyEntityBatch: (entities) =>
    set((state) => {
      const next = { ...state.entities };
      for (const entity of entities) {
        next[entity.id] = entity;
      }

      return {
        entities: next,
        hasReceivedEntityData: true,
      };
    }),
    
  removeEntity: (id) =>
    set((state) => {
      const newEntities = { ...state.entities };
      delete newEntities[id];
      return { entities: newEntities };
    }),
    
  setSelectedEntity: (entity) =>
    set({
      selectedEntity: entity,
      historicalRoute: null,
      selectedHistoryRouteId: null,
    }),
  
  toggleLayer: (layer) =>
    set((state) => {
      const nextVisibility = {
        ...state.layerVisibility,
        [layer]: !state.layerVisibility[layer],
      };

      persistLayers(nextVisibility);

      return {
        layerVisibility: nextVisibility,
        activeLayers: getActiveLayersFromState(nextVisibility),
      };
    }),

  hydrateLayers: () => {
    const hydrated = readStoredLayers();
    set({
      layerVisibility: hydrated,
      activeLayers: getActiveLayersFromState(hydrated),
    });
  },
    
  setCursorCoords: (coords) => set({ cursorCoords: coords }),

  setHistoricalRoute: (route) => set({ historicalRoute: route }),

  clearHistoricalRoute: () =>
    set({
      historicalRoute: null,
      selectedHistoryRouteId: null,
    }),

  setSelectedHistoryRouteId: (id) => set({ selectedHistoryRouteId: id }),

  setMapInstance: (map) => set({ mapInstance: map }),

  setSocketConnected: (connected) => set({ socketConnected: connected }),

  getEntityCountByType: (type) => {
    const entities = get().entities;
    return Object.values(entities).filter((entity) => entity.type === type).length;
  },

  selectEntitiesByType: (type) =>
    Object.values(get().entities).filter((entity) => entity.type === type),

  selectCounts: () => {
    const entities = Object.values(get().entities);
    return {
      aircraft: entities.filter((entity) => entity.type === 'aircraft').length,
      ships: entities.filter((entity) => entity.type === 'ship').length,
      satellites: entities.filter((entity) => entity.type === 'satellite').length,
      signals: entities.filter((entity) => entity.type === 'signal').length,
    };
  },
}));
