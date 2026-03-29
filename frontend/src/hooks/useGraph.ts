import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { wsService } from '../services/websocket';
import { EdgeDto, GraphDto, NodeDto, WebSocketMessage } from '../types/api';

export const useGraph = (mapId: string) => {
  const [graph, setGraph] = useState<GraphDto>({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadGraph = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getGraph(mapId);
      setGraph(data);
    } catch (err) {
      setError('Failed to load graph');
    } finally {
      setLoading(false);
    }
  }, [mapId]);

  useEffect(() => {
    loadGraph();
  }, [loadGraph]);

  useEffect(() => {
    const unsubscribe = wsService.connect(mapId, (message: WebSocketMessage) => {
      switch (message.type) {
        case 'NODE_CREATED':
        case 'NODE_UPDATED':
        case 'NODE_MOVED': {
          const node = message.payload as NodeDto;
          setGraph((prev) => ({
            ...prev,
            nodes: prev.nodes.some((n) => n.id === node.id)
              ? prev.nodes.map((n) => (n.id === node.id ? node : n))
              : [...prev.nodes, node],
          }));
          break;
        }
        case 'NODE_DELETED': {
          const { id } = message.payload as { id: string };
          setGraph((prev) => ({
            nodes: prev.nodes.filter((n) => n.id !== id),
            edges: prev.edges.filter((e) => e.fromNodeId !== id && e.toNodeId !== id),
          }));
          break;
        }
        case 'EDGE_CREATED':
        case 'EDGE_UPDATED': {
          const edge = message.payload as EdgeDto;
          setGraph((prev) => ({
            ...prev,
            edges: prev.edges.some((e) => e.id === edge.id)
              ? prev.edges.map((e) => (e.id === edge.id ? edge : e))
              : [...prev.edges, edge],
          }));
          break;
        }
        case 'EDGE_DELETED': {
          const { id } = message.payload as { id: string };
          setGraph((prev) => ({
            ...prev,
            edges: prev.edges.filter((e) => e.id !== id),
          }));
          break;
        }
      }
    });
    return () => {
      unsubscribe();
    };
  }, [mapId]);

  return { graph, setGraph, loading, error, reload: loadGraph };
};
