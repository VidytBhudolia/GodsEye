export type EntityType = 'ship' | 'aircraft' | 'satellite' | 'signal';
export interface EntityPosition {
    lat: number;
    lon: number;
    alt_m?: number;
}
export interface EntityMetadata {
    name?: string;
    country?: string;
    country_flag?: string;
    entity_type?: string;
    speed_knots?: number;
    heading_deg?: number;
    status?: 'active' | 'inactive';
}
export interface EntityRoute {
    origin?: string;
    destination?: string;
    eta?: string;
    waypoints?: [number, number][];
}
export interface EntityEnrichment {
    cargo_manifest?: string;
    squawk_code?: string;
    satellite_purpose?: string;
}
export interface Entity {
    id: string;
    type: EntityType;
    position: EntityPosition;
    metadata: EntityMetadata;
    current_route?: EntityRoute;
    enrichment?: EntityEnrichment;
    ai_summary?: string;
    cached_at?: string;
    cache_ttl_seconds?: number;
}
export interface ServerToClientEvents {
    'entity:update': (entity: Entity) => void;
}
export interface ClientToServerEvents {
}
export interface GetEntitiesResponse {
    data: Entity[];
    error?: string;
}
export interface SummarizeResponse {
    summary: string;
    error?: string;
}
//# sourceMappingURL=contract.d.ts.map