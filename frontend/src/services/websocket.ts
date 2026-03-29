import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WebSocketMessage } from '../types/api';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private client: Client | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private subscriptions: Map<string, boolean> = new Map();

  connect(mapId: string, onMessage: MessageHandler): () => void {
    const key = `map-${mapId}`;
    const existing = this.handlers.get(key) || [];
    this.handlers.set(key, [...existing, onMessage]);

    if (!this.client) {
      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
        onConnect: () => {
          this.subscriptions.forEach((_, subKey) => {
            const id = subKey.replace('map-', '');
            this.subscribeToMap(id);
          });
        },
      });
      this.client.activate();
    }

    if (!this.subscriptions.has(key)) {
      this.subscriptions.set(key, true);
      if (this.client.connected) {
        this.subscribeToMap(mapId);
      }
    }

    return () => {
      const current = this.handlers.get(key) || [];
      this.handlers.set(key, current.filter((h) => h !== onMessage));
    };
  }

  private subscribeToMap(mapId: string): void {
    const key = `map-${mapId}`;
    this.client!.subscribe(`/topic/map/${mapId}`, (msg) => {
      const parsed: WebSocketMessage = JSON.parse(msg.body);
      const handlers = this.handlers.get(key) || [];
      handlers.forEach((h) => h(parsed));
    });
  }

  disconnect() {
    this.client?.deactivate();
    this.client = null;
    this.handlers.clear();
    this.subscriptions.clear();
  }
}

export const wsService = new WebSocketService();
