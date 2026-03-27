export interface Position {
  lat: number;
  lon: number;
  alt_m?: number;
}

export interface Metadata {
  name: string;
  country: string;
  country_flag: string;
  entity_type: string;
  speed_knots: number;
  heading_deg: number;
  status: 'active' | 'inactive';
  callsign?: string;
  icao24?: string;
  mmsi?: string;
}

export interface Entity {
  id: string;
  type: 'ship' | 'aircraft' | 'satellite' | 'signal';
  position: Position;
  metadata: Metadata;
  current_route?: any;
  enrichment?: any;
  ai_summary?: string;
  cached_at: string;
  cache_ttl_seconds: number;
}
