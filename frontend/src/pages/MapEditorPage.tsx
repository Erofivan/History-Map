import React, { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGraph } from '../hooks/useGraph';
import { apiService } from '../services/api';
import { EdgeDto, EdgeDirection, NodeDto, NodeType } from '../types/api';
import GraphCanvas from '../components/GraphCanvas';
import NodeSidebar from '../components/NodeSidebar';
import EdgeSidebar from '../components/EdgeSidebar';
import Catalog from '../components/Catalog';
import Toolbar from '../components/Toolbar';
import './MapEditorPage.css';

export type LayoutType = 'cose' | 'breadthfirst' | 'grid' | 'circle' | 'concentric';

const MapEditorPage: React.FC = () => {
  const { mapId } = useParams<{ mapId: string }>();
  const navigate = useNavigate();
  const { graph, setGraph, loading, error } = useGraph(mapId!);

  const [selectedNode, setSelectedNode] = useState<NodeDto | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<EdgeDto | null>(null);
  const [showCatalog, setShowCatalog] = useState(false);
  const [layout, setLayout] = useState<LayoutType>('cose');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [pendingEdgeFrom, setPendingEdgeFrom] = useState<string | null>(null);

  const handleNodeSelect = useCallback((node: NodeDto) => {
    setSelectedNode(node);
    setSelectedEdge(null);
  }, []);

  const handleEdgeSelect = useCallback((edge: EdgeDto) => {
    setSelectedEdge(edge);
    setSelectedNode(null);
  }, []);

  const handleCanvasDoubleClick = useCallback(async (x: number, y: number) => {
    try {
      const node = await apiService.createNode(mapId!, {
        name: 'New Entity',
        type: 'CUSTOM' as NodeType,
        positionX: x,
        positionY: y,
      });
      setGraph((prev) => ({ ...prev, nodes: [...prev.nodes, node] }));
      setSelectedNode(node);
    } catch (err) {
      console.error('Failed to create node', err);
    }
  }, [mapId, setGraph]);

  const handleNodeMove = useCallback(async (nodeId: string, x: number, y: number) => {
    try {
      await apiService.updateNodePosition(mapId!, nodeId, x, y);
    } catch (err) {
      console.error('Failed to update position', err);
    }
  }, [mapId]);

  const handleNodeDelete = useCallback(async (nodeId: string) => {
    try {
      await apiService.deleteNode(mapId!, nodeId);
      setGraph((prev) => ({
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId),
      }));
      setSelectedNode(null);
    } catch (err) {
      console.error('Failed to delete node', err);
    }
  }, [mapId, setGraph]);

  const handleEdgeDelete = useCallback(async (edgeId: string) => {
    try {
      await apiService.deleteEdge(mapId!, edgeId);
      setGraph((prev) => ({ ...prev, edges: prev.edges.filter((e) => e.id !== edgeId) }));
      setSelectedEdge(null);
    } catch (err) {
      console.error('Failed to delete edge', err);
    }
  }, [mapId, setGraph]);

  const handleNodeShiftClick = useCallback(async (nodeId: string) => {
    if (!pendingEdgeFrom) {
      setPendingEdgeFrom(nodeId);
      return;
    }
    if (pendingEdgeFrom === nodeId) {
      setPendingEdgeFrom(null);
      return;
    }
    try {
      const edge = await apiService.createEdge(mapId!, {
        fromNodeId: pendingEdgeFrom,
        toNodeId: nodeId,
        direction: 'BIDIRECTIONAL' as EdgeDirection,
      });
      setGraph((prev) => ({ ...prev, edges: [...prev.edges, edge] }));
    } catch (err) {
      console.error('Failed to create edge', err);
    }
    setPendingEdgeFrom(null);
  }, [mapId, pendingEdgeFrom, setGraph]);

  const handleNodeUpdate = useCallback(async (nodeId: string, updates: Partial<NodeDto>) => {
    try {
      const updated = await apiService.updateNode(mapId!, nodeId, updates);
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === nodeId ? updated : n)),
      }));
      setSelectedNode(updated);
    } catch (err) {
      console.error('Failed to update node', err);
    }
  }, [mapId, setGraph]);

  const handleEdgeUpdate = useCallback(async (edgeId: string, updates: { description?: string; direction?: EdgeDirection }) => {
    try {
      const updated = await apiService.updateEdge(mapId!, edgeId, updates);
      setGraph((prev) => ({
        ...prev,
        edges: prev.edges.map((e) => (e.id === edgeId ? updated : e)),
      }));
      setSelectedEdge(updated);
    } catch (err) {
      console.error('Failed to update edge', err);
    }
  }, [mapId, setGraph]);

  const filteredNodes = filterTag
    ? graph.nodes.filter((n) => n.tags.includes(filterTag))
    : graph.nodes;
  const filteredEdges = filterTag
    ? graph.edges.filter((e) =>
        filteredNodes.some((n) => n.id === e.fromNodeId) &&
        filteredNodes.some((n) => n.id === e.toNodeId)
      )
    : graph.edges;

  if (loading) {
    return <div className="editor-loading">Loading graph...</div>;
  }

  if (error) {
    return <div className="editor-error">{error}</div>;
  }

  return (
    <div className="editor-layout">
      <Toolbar
        layout={layout}
        onLayoutChange={setLayout}
        onToggleCatalog={() => setShowCatalog((v) => !v)}
        onBack={() => navigate('/maps')}
        nodeCount={graph.nodes.length}
        edgeCount={graph.edges.length}
        pendingEdgeFrom={pendingEdgeFrom}
        onCancelEdge={() => setPendingEdgeFrom(null)}
      />

      <div className="editor-body">
        {showCatalog && (
          <Catalog
            nodes={graph.nodes}
            edges={graph.edges}
            onSelectNode={(node) => { setSelectedNode(node); setSelectedEdge(null); }}
            onFilterByTag={(tag) => setFilterTag(tag === filterTag ? null : tag)}
            activeTag={filterTag}
          />
        )}

        <GraphCanvas
          nodes={filteredNodes}
          edges={filteredEdges}
          layout={layout}
          selectedNodeId={selectedNode?.id}
          selectedEdgeId={selectedEdge?.id}
          pendingEdgeFrom={pendingEdgeFrom}
          onNodeSelect={handleNodeSelect}
          onEdgeSelect={handleEdgeSelect}
          onCanvasDoubleClick={handleCanvasDoubleClick}
          onNodeMove={handleNodeMove}
          onNodeDelete={handleNodeDelete}
          onEdgeDelete={handleEdgeDelete}
          onNodeShiftClick={handleNodeShiftClick}
        />

        {selectedNode && (
          <NodeSidebar
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={handleNodeUpdate}
            onDelete={handleNodeDelete}
            relatedNodes={graph.nodes.filter((n) =>
              graph.edges.some(
                (e) =>
                  (e.fromNodeId === selectedNode.id && e.toNodeId === n.id) ||
                  (e.toNodeId === selectedNode.id && e.fromNodeId === n.id)
              )
            )}
          />
        )}

        {selectedEdge && (
          <EdgeSidebar
            edge={selectedEdge}
            fromNode={graph.nodes.find((n) => n.id === selectedEdge.fromNodeId)}
            toNode={graph.nodes.find((n) => n.id === selectedEdge.toNodeId)}
            onClose={() => setSelectedEdge(null)}
            onUpdate={handleEdgeUpdate}
            onDelete={handleEdgeDelete}
          />
        )}
      </div>
    </div>
  );
};

export default MapEditorPage;
