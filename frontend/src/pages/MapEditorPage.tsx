import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  // Bug 10: persist layout selection across reloads
  const [layout, setLayoutState] = useState<LayoutType>(
    () => (localStorage.getItem(`map_layout_${mapId}`) as LayoutType) || 'cose'
  );
  // Bug 14: increment to force layout re-run even when layout type doesn't change
  const [layoutVersion, setLayoutVersion] = useState(0);
  // Bug 7: increment to trigger fit-to-graph in GraphCanvas
  const [fitTrigger, setFitTrigger] = useState(0);
  // Bug 17: banner when graph changed while on non-cose layout
  const [pendingLayoutRefresh, setPendingLayoutRefresh] = useState(false);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [pendingEdgeFrom, setPendingEdgeFrom] = useState<string | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    localStorage.setItem(`map_layout_${mapId}`, newLayout);
    setLayoutState(newLayout);
    setLayoutVersion((v) => v + 1);
    setPendingLayoutRefresh(false);
  }, [mapId]);

  // Always-fresh ref to selectedNode, used in shift-click handler to avoid stale closures
  const selectedNodeRef = useRef<NodeDto | null>(null);
  selectedNodeRef.current = selectedNode;

  // Undo / redo stacks. Each entry is a function that reverts the action.
  type UndoEntry = { undo: () => Promise<void>; redo: () => Promise<void> };
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);

  const pushUndo = useCallback((entry: UndoEntry) => {
    undoStack.current.push(entry);
    redoStack.current = [];
  }, []);

  // Esc / Ctrl+Z / Ctrl+Shift+Z
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const inInput = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';

      if (e.key === 'Escape') {
        setPendingEdgeFrom(null);
        setSelectedNode(null);
        setEditingNodeId(null);
        return;
      }

      if (inInput) return;

      const isUndo = (e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey;
      const isRedo = (e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey));

      if (isUndo) {
        e.preventDefault();
        const entry = undoStack.current.pop();
        if (entry) { redoStack.current.push(entry); entry.undo(); }
      }
      if (isRedo) {
        e.preventDefault();
        const entry = redoStack.current.pop();
        if (entry) { undoStack.current.push(entry); entry.redo(); }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

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
      if (layout !== 'cose') setPendingLayoutRefresh(true);
      pushUndo({
        undo: async () => {
          await apiService.deleteNode(mapId!, node.id);
          setGraph((prev) => ({
            nodes: prev.nodes.filter((n) => n.id !== node.id),
            edges: prev.edges.filter((e) => e.fromNodeId !== node.id && e.toNodeId !== node.id),
          }));
        },
        redo: async () => {
          const restored = await apiService.createNode(mapId!, {
            name: node.name, type: node.type, positionX: node.positionX, positionY: node.positionY,
          });
          setGraph((prev) => ({ ...prev, nodes: [...prev.nodes, restored] }));
        },
      });
    } catch (err) {
      console.error('Failed to create node', err);
    }
  }, [mapId, setGraph, pushUndo, layout]);

  const handleNodeMove = useCallback(async (nodeId: string, x: number, y: number) => {
    try {
      await apiService.updateNodePosition(mapId!, nodeId, x, y);
    } catch (err) {
      console.error('Failed to update position', err);
    }
  }, [mapId]);

  const handleNodeDelete = useCallback(async (nodeId: string) => {
    try {
      const nodeToDelete = graph.nodes.find((n) => n.id === nodeId);
      const edgesToDelete = graph.edges.filter((e) => e.fromNodeId === nodeId || e.toNodeId === nodeId);
      await apiService.deleteNode(mapId!, nodeId);
      setGraph((prev) => ({
        nodes: prev.nodes.filter((n) => n.id !== nodeId),
        edges: prev.edges.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId),
      }));
      setSelectedNode(null);
      if (nodeToDelete) {
        pushUndo({
          undo: async () => {
            const restored = await apiService.createNode(mapId!, {
              name: nodeToDelete.name, type: nodeToDelete.type,
              positionX: nodeToDelete.positionX, positionY: nodeToDelete.positionY,
            });
            setGraph((prev) => ({ ...prev, nodes: [...prev.nodes, restored] }));
          },
          redo: async () => {
            await apiService.deleteNode(mapId!, nodeId);
            setGraph((prev) => ({
              nodes: prev.nodes.filter((n) => n.id !== nodeId),
              edges: prev.edges.filter((e) => e.fromNodeId !== nodeId && e.toNodeId !== nodeId),
            }));
          },
        });
      }
    } catch (err) {
      console.error('Failed to delete node', err);
    }
  }, [mapId, setGraph, pushUndo, graph.nodes, graph.edges]);

  const handleEdgeDelete = useCallback(async (edgeId: string) => {
    try {
      const edgeToDelete = graph.edges.find((e) => e.id === edgeId);
      await apiService.deleteEdge(mapId!, edgeId);
      setGraph((prev) => ({ ...prev, edges: prev.edges.filter((e) => e.id !== edgeId) }));
      setSelectedEdge(null);
      if (edgeToDelete) {
        pushUndo({
          undo: async () => {
            const restored = await apiService.createEdge(mapId!, {
              fromNodeId: edgeToDelete.fromNodeId,
              toNodeId: edgeToDelete.toNodeId,
              direction: edgeToDelete.direction,
              description: edgeToDelete.description,
            });
            setGraph((prev) => ({ ...prev, edges: [...prev.edges, restored] }));
          },
          redo: async () => {
            await apiService.deleteEdge(mapId!, edgeId);
            setGraph((prev) => ({ ...prev, edges: prev.edges.filter((e) => e.id !== edgeId) }));
          },
        });
      }
    } catch (err) {
      console.error('Failed to delete edge', err);
    }
  }, [mapId, setGraph, pushUndo, graph.edges]);

  const handleNodeRightClick = useCallback((node: NodeDto) => {
    setSelectedNode(node);
    setSelectedEdge(null);
    setEditingNodeId(node.id);
  }, []);

  const handleNodeShiftClick = useCallback(async (nodeId: string) => {
    if (!pendingEdgeFrom) {
      // If a node is already selected (red), create the edge immediately on shift+click
      const currentSelected = selectedNodeRef.current;
      if (currentSelected && currentSelected.id !== nodeId) {
        try {
          const edge = await apiService.createEdge(mapId!, {
            fromNodeId: currentSelected.id,
            toNodeId: nodeId,
            direction: 'BIDIRECTIONAL' as EdgeDirection,
          });
          setGraph((prev) => ({ ...prev, edges: [...prev.edges, edge] }));
          // Clear selection so the next shift+click doesn't reuse the old source
          setSelectedNode(null);
          if (layout !== 'cose') setPendingLayoutRefresh(true);
          pushUndo({
            undo: async () => {
              await apiService.deleteEdge(mapId!, edge.id);
              setGraph((prev) => ({ ...prev, edges: prev.edges.filter((e) => e.id !== edge.id) }));
            },
            redo: async () => {
              const restored = await apiService.createEdge(mapId!, {
                fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId, direction: edge.direction,
              });
              setGraph((prev) => ({ ...prev, edges: [...prev.edges, restored] }));
            },
          });
        } catch (err) {
          console.error('Failed to create edge', err);
        }
        return;
      }
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
      if (layout !== 'cose') setPendingLayoutRefresh(true);
      pushUndo({
        undo: async () => {
          await apiService.deleteEdge(mapId!, edge.id);
          setGraph((prev) => ({ ...prev, edges: prev.edges.filter((e) => e.id !== edge.id) }));
        },
        redo: async () => {
          const restored = await apiService.createEdge(mapId!, {
            fromNodeId: edge.fromNodeId, toNodeId: edge.toNodeId, direction: edge.direction,
          });
          setGraph((prev) => ({ ...prev, edges: [...prev.edges, restored] }));
        },
      });
    } catch (err) {
      console.error('Failed to create edge', err);
    }
    setPendingEdgeFrom(null);
  }, [mapId, pendingEdgeFrom, setGraph, pushUndo, layout]);

  const handleNodeUpdate = useCallback(async (nodeId: string, updates: Partial<NodeDto>) => {
    try {
      const updated = await apiService.updateNode(mapId!, nodeId, updates);
      setGraph((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, ...updated, size: updated.size ?? n.size } : n)),
      }));
      setSelectedNode((prev) => prev ? { ...prev, ...updated, size: updated.size ?? prev.size } : updated);
      setEditingNodeId(null);
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

  const handleInlineRename = useCallback(async (id: string, value: string, type: 'node' | 'edge') => {
    if (type === 'node') {
      await handleNodeUpdate(id, { name: value });
    } else {
      await handleEdgeUpdate(id, { description: value });
    }
  }, [handleNodeUpdate, handleEdgeUpdate]);

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
        onLayoutChange={handleLayoutChange}
        onToggleCatalog={() => setShowCatalog((v) => !v)}
        onBack={() => navigate('/maps')}
        nodeCount={graph.nodes.length}
        edgeCount={graph.edges.length}
        pendingEdgeFrom={pendingEdgeFrom}
        onCancelEdge={() => setPendingEdgeFrom(null)}
        onFitGraph={() => setFitTrigger((v) => v + 1)}
        pendingLayoutRefresh={pendingLayoutRefresh}
        onRefreshLayout={() => {
          setPendingLayoutRefresh(false);
          setLayoutVersion((v) => v + 1);
        }}
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
          layoutVersion={layoutVersion}
          fitTrigger={fitTrigger}
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
          onNodeRightClick={handleNodeRightClick}
          onClearPendingEdge={() => { setPendingEdgeFrom(null); setSelectedNode(null); setEditingNodeId(null); }}
          onInlineRename={handleInlineRename}
          mapId={mapId}
        />

        {selectedNode && (
          <NodeSidebar
            node={selectedNode}
            autoEdit={selectedNode?.id === editingNodeId}
            onClose={() => { setSelectedNode(null); setEditingNodeId(null); }}
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
