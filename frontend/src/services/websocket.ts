import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WebSocketMessage } from '../types/api';

const WS_URL = process.env.REACT_APP_WS_URL || 'http://localhost:8080/ws';

type MessageHandler = (message: WebSocketMessage) => void;

class WebSocketService {
  private client: Client | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();

  connect(mapId: string, onMessage: MessageHandler): () => void {
    if (!this.client) {
      this.client = new Client({
        webSocketFactory: () => new SockJS(WS_URL),
        reconnectDelay: 5000,
      });
      this.client.activate();
    }

    const key = `map-${mapId}`;
    const existing = this.handlers.get(key) || [];
    this.handlers.set(key, [...existing, onMessage]);

    const subscribe = () => {
      if (this.client?.connected) {
        this.client.subscribe(`/topic/map/${mapId}`, (msg) => {
          const parsed: WebSocketMessage = JSON.parse(msg.body);
          const handlers = this.handlers.get(key) || [];
          handlers.forEach((h) => h(parsed));
        });
      } else {
        this.client!.onConnect = () => {
          this.client!.subscribe(`/topic/map/${mapId}`, (msg) => {
            const parsed: WebSocketMessage = JSON.parse(msg.body);
            const handlers = this.handlers.get(key) || [];
            handlers.forEach((h) => h(parsed));
          });
        };
      }
    };

    subscribe();

    return () => {
      const current = this.handlers.get(key) || [];
      this.handlers.set(key, current.filter((h) => h !== onMessage));
    };
  }

  disconnect() {
    this.client?.deactivate();
    this.client = null;
    this.handlers.clear();
  }
}

export const wsService = new WebSocketService();
