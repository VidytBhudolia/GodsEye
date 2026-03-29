import { Entity, EntityType } from "../../shared/contract";

/**
 * Normalizes OpenSky State Vectors
 * Response fields from /states/all:
 * [0] icao24, [1] callsign, [2] origin_country, [3] time_position,
 * [4] last_contact, [5] longitude, [6] latitude, [7] baro_altitude,
 * [8] on_ground, [9] velocity, [10] true_track, [11] vertical_rate,
 * [12] sensors, [13] geo_altitude, [14] squawk, [15] spi, [16] position_source
 */
export function normalizeOpenSkyState(state: any[]): Entity {
  return {
    id: state[0],
    type: "aircraft",
    position: {
      lon: state[5] || 0,
      lat: state[6] || 0,
      alt_m: state[13] || state[7] || 0,
    },
    metadata: {
      name: state[1] ? state[1].trim() : "Unknown",
      country: state[2] || "International",
      country_flag: "✈️", // Placeholder for now or lookup table
      speed_knots: state[9] ? Math.round(state[9] * 1.94384) : 0, // m/s to knots
      heading_deg: Math.round(state[10] || 0),
      status: state[8] ? "inactive" : "active",
      entity_type: "Aircraft",
      icao24: state[0],
      callsign: state[1] ? state[1].trim() : undefined,
    },
    enrichment: {
      squawk_code: state[14]?.toString(),
    },
    cached_at: new Date().toISOString(),
    cache_ttl_seconds: 60,
  };
}

/**
 * Normalizes AIS Stream JSON representations
 * Supports PositionReport and ShipStaticData
 */
export function normalizeAisMessage(raw: any): Entity | null {
  if (raw.MessageType === "PositionReport" && raw.Message?.PositionReport) {
    const report = raw.Message.PositionReport;
    const mmsi = raw.MetaData.MMSI.toString();
    return {
      id: mmsi,
      type: "ship",
      position: {
        lat: report.Latitude,
        lon: report.Longitude,
      },
      metadata: {
        name: raw.MetaData.ShipName ? raw.MetaData.ShipName.trim() : `MMSI: ${mmsi}`,
        country: "Unknown",
        country_flag: "🚢",
        speed_knots: Math.round(report.Sog || 0),
        heading_deg: Math.round(report.Cog || 0),
        status: report.NavigationalStatus === 0 ? "inactive" : "active",
        entity_type: "Ship",
        mmsi: mmsi,
      },
      cached_at: new Date().toISOString(),
      cache_ttl_seconds: 60,
    };
  }

  if (raw.MessageType === "ShipStaticData" && raw.Message?.ShipStaticData) {
    const data = raw.Message.ShipStaticData;
    const mmsi = raw.MetaData.MMSI.toString();
    return {
      id: mmsi,
      type: "ship",
      position: {
        lat: raw.MetaData.latitude || 0, 
        lon: raw.MetaData.longitude || 0,
      },
      metadata: {
        name: data.Name ? data.Name.trim() : `MMSI: ${mmsi}`,
        country: "Unknown",
        country_flag: "🚢",
        speed_knots: 0,
        heading_deg: 0,
        status: "active",
        entity_type: data.Type ? `Ship Type: ${data.Type}` : "Ship",
        mmsi: mmsi,
        callsign: data.Callsign ? data.Callsign.trim() : undefined,
      },
      current_route: {
        destination: data.Destination ? data.Destination.trim() : undefined,
        eta: data.Eta ? `Day ${data.Eta.Day} ${data.Eta.Hour}:${data.Eta.Minute}` : undefined,
      },
      cached_at: new Date().toISOString(),
      cache_ttl_seconds: 60,
    };
  }
  
  return null;
}
