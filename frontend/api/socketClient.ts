import { io, Socket } from 'socket.io-client';
// TODO: replace with ../../shared/contract.ts import
import { Entity } from '@/types/contract';
import { useMapStore } from '@/store/useMapStore';

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
  
  connect() {
    if (this.socket) return;
    
    this.socket = io('http://localhost:4000', {
      transports: ['websocket'],
    });

    const handleEntityUpdate = (entity: Entity) => {
      this.pendingUpdates.push(entity);
      this.scheduleFlush();
    };

    const handleEntityBatch = (entities: Entity[]) => {
      useMapStore.getState().applyEntityBatch(entities);
    };

    this.socket.on('entity_update', handleEntityUpdate);
    this.socket.on('entity:update', handleEntityUpdate);
    this.socket.on('entity:batch', handleEntityBatch);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    if (this.raf !== null) {
      window.cancelAnimationFrame(this.raf);
      this.raf = null;
    }

    this.pendingUpdates = [];
  }
}

export const socketClient = new SocketClient();
