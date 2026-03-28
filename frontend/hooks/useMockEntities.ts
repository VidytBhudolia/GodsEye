import { useEffect } from 'react';
import { useMapStore } from '@/store/useMapStore';
// TODO: replace with ../../shared/contract.ts import
import { Entity } from '@/types/contract';

export function useMockEntities() {
  const isMockEnabled = process.env.NEXT_PUBLIC_USE_MOCK === 'true';

  useEffect(() => {
    if (!isMockEnabled) return;

    console.log('Mock entities enabled. Generating data...');
    const numShips = 50;
    const numPlanes = 50;

    const mockEntities: Record<string, Entity> = {};

    const generateEntity = (type: 'ship' | 'aircraft', idStr: string): Entity => {
      return {
        id: idStr,
        type,
        position: {
          lat: (Math.random() - 0.5) * 120, // Global spread
          lon: (Math.random() - 0.5) * 360,
          ...(type === 'aircraft' ? { alt_m: 8000 + Math.random() * 4000 } : {}),
        },
        metadata: {
          name: `${type.toUpperCase()}-${idStr}`,
          country: 'US',
          country_flag: '🇺🇸',
          entity_type: type === 'ship' ? 'cargo' : 'B738',
          speed_knots: type === 'ship' ? 10 + Math.random() * 15 : 400 + Math.random() * 100,
          heading_deg: Math.random() * 360,
          status: 'active',
        },
        cached_at: new Date().toISOString(),
        cache_ttl_seconds: 60,
      };
    };

    // Initialize mock entities
    for (let i = 0; i < numShips; i++) mockEntities[`ship_${i}`] = generateEntity('ship', `ship_${i}`);
    for (let i = 0; i < numPlanes; i++) mockEntities[`plane_${i}`] = generateEntity('aircraft', `plane_${i}`);

    const moveEntities = () => {
      Object.keys(mockEntities).forEach((id) => {
        const e = mockEntities[id];
        const rad = (e.metadata.heading_deg * Math.PI) / 180;
        const speedBase = e.type === 'ship' ? 0.005 : 0.05;
        
        let newLat = e.position.lat + Math.cos(rad) * speedBase;
        let newLon = e.position.lon + Math.sin(rad) * speedBase;
        
        // Wrap around the globe to keep them visible
        if (newLon > 180) newLon -= 360;
        if (newLon < -180) newLon += 360;
        if (newLat > 90) newLat -= 180;
        if (newLat < -90) newLat += 180;

        mockEntities[id] = {
          ...e,
          position: { ...e.position, lat: newLat, lon: newLon },
          cached_at: new Date().toISOString()
        };
        useMapStore.getState().updateEntity(mockEntities[id]);
      });
    };

    // Initial batch
    Object.values(mockEntities).forEach(e => useMapStore.getState().updateEntity(e));

    // Update positions every second
    const interval = setInterval(moveEntities, 1000);

    return () => clearInterval(interval);
  }, [isMockEnabled]);
}
