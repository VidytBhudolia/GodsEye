import { io, Socket } from 'socket.io-client';
// TODO: replace with ../../shared/contract.ts import
import { Entity } from '@/types/contract';
import { useMapStore } from '@/store/useMapStore';

class SocketClient {
  private socket: Socket | null = null;
  
  connect() {
    if (this.socket) return;
    
    this.socket = io('http://localhost:4000', {
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Connected to GodsEye backend socket.');
    });

    this.socket.on('entity_update', (entity: Entity) => {
      useMapStore.getState().updateEntity(entity);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from GodsEye backend socket.');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketClient = new SocketClient();
