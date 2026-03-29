import { io, Socket } from 'socket.io-client';
// TODO: replace with ../../shared/contract.ts import
import { Entity } from '@/types/contract';
import { useMapStore } from '@/store/useMapStore';
import { Alert, useAlertsStore } from '@/store/useAlertsStore';
import { buildBackendUrl, getBackendBaseUrl } from '@/lib/backendUrl';

type AlertEventPayload = {
  id?: string;
  entityId?: string;
  entity_id?: string;
  entityName?: string;
  entity_name?: string;
  type?: string;
  title?: string;
  message?: string;
  severity?: string;
  detectedAt?: string;
  detected_at?: string;
  timestamp?: string;
  createdAt?: string;
  lat?: number;
  latitude?: number;
  lon?: number;
  longitude?: number;
  acknowledged?: boolean;
};

function toAlertSeverity(value: unknown): Alert['severity'] {
  const normalized = String(value ?? '').toLowerCase();
  if (
    normalized === 'low' ||
    normalized === 'medium' ||
    normalized === 'high' ||
    normalized === 'critical'
  ) {
    return normalized;
  }

  return 'medium';
}

function toNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toAlert(payload: AlertEventPayload): Alert | null {
  const id = String(payload.id ?? '').trim();
  const entityId = String(payload.entityId ?? payload.entity_id ?? '').trim();
  if (!id || !entityId) {
    return null;
  }

  return {
    id,
    entityId,
    entityName: String(payload.entityName ?? payload.entity_name ?? payload.title ?? entityId),
    type: String(payload.type ?? 'alert'),
    severity: toAlertSeverity(payload.severity),
    message: String(payload.message ?? 'Operational anomaly detected.'),
    detectedAt: String(
      payload.detectedAt ??
        payload.detected_at ??
        payload.timestamp ??
        payload.createdAt ??
        new Date().toISOString()
    ),
    lat: toNumber(payload.lat ?? payload.latitude),
    lon: toNumber(payload.lon ?? payload.longitude),
    acknowledged: Boolean(payload.acknowledged),
  };
}

class SocketClient {
  private socket: Socket | null = null;
  private raf: number | null = null;
  private pendingUpdates: Entity[] = [];

  private flushPendingUpdates = () => {
    if (this.pendingUpdates.length > 0) {
      useMapStore.getState().applyEntityBatch(this.pendingUpdates.splice(0));
    }
    this.raf = null;
  };

  private scheduleFlush() {
    if (this.raf !== null) {
      return;
    }

    this.raf = window.requestAnimationFrame(this.flushPendingUpdates);
  }

  private hydrateUnreadAlerts = async () => {
    try {
      const response = await fetch(buildBackendUrl('/api/alerts?acknowledged=false'));
      if (!response.ok) {
        return;
      }

      const payload = await response.json();
      const incoming = Array.isArray(payload?.alerts) ? payload.alerts : [];

      for (const rawAlert of incoming as AlertEventPayload[]) {
        const alert = toAlert(rawAlert);
        if (alert) {
          useAlertsStore.getState().addAlert(alert);
        }
      }
    } catch {
      // Keep real-time flow operational even when initial unread fetch fails.
    }
  };
  
  connect() {
    if (this.socket) return;

    useMapStore.getState().setSocketConnected(false);
    
    this.socket = io(getBackendBaseUrl(), {
      transports: ['websocket'],
    });

    const handleEntityUpdate = (entity: Entity) => {
      this.pendingUpdates.push(entity);
      this.scheduleFlush();
    };

    const handleEntityBatch = (entities: Entity[]) => {
      useMapStore.getState().applyEntityBatch(entities);
    };

    const handleAlertEvent = (payload: AlertEventPayload) => {
      const alert = toAlert(payload);
      if (alert) {
        useAlertsStore.getState().addAlert(alert);
      }
    };

    this.socket.on('entity_update', handleEntityUpdate);
    this.socket.on('entity:update', handleEntityUpdate);
    this.socket.on('entity:batch', handleEntityBatch);
    this.socket.on('alert:new', handleAlertEvent);

    this.socket.on('connect', () => {
      useMapStore.getState().setSocketConnected(true);
      void this.hydrateUnreadAlerts();
    });

    this.socket.on('disconnect', () => {
      useMapStore.getState().setSocketConnected(false);
    });

    this.socket.on('connect_error', () => {
      useMapStore.getState().setSocketConnected(false);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    useMapStore.getState().setSocketConnected(false);

    if (this.raf !== null) {
      window.cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    this.pendingUpdates = [];
  }
}

export const socketClient = new SocketClient();
