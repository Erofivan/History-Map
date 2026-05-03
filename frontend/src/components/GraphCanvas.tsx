import React, { useEffect, useRef, useCallback, useState } from 'react';
import cytoscape, { Core, NodeSingular, EventObject } from 'cytoscape';
import { EdgeDto, NodeDto } from '../types/api';
import { LayoutType } from '../pages/MapEditorPage';
import './GraphCanvas.css';

// @ts-ignore
import cola from 'cytoscape-cola';
cytoscape.use(cola);

interface Props {
  nodes: NodeDto[];
  edges: EdgeDto[];
  layout: LayoutType;
  layoutVersion: number;
  fitTrigger: number;
  mapId?: string;
  selectedNodeId?: string;
  selectedEdgeId?: string;
  pendingEdgeFrom: string | null;
  onNodeSelect: (node: NodeDto) => void;
  onEdgeSelect: (edge: EdgeDto) => void;
  onCanvasDoubleClick: (x: number, y: number) => void;
  onNodeMove: (nodeId: string, x: number, y: number) => void;
  onNodeDelete: (nodeId: string) => void;
  onEdgeDelete: (edgeId: string) => void;
  onNodeShiftClick: (nodeId: string) => void;
  onNodeRightClick: (node: NodeDto) => void;
  onClearPendingEdge: () => void;
  onInlineRename: (id: string, value: string, type: 'node' | 'edge') => void;
}

const NODE_TYPE_COLORS: Record<string, string> = {
  PERSON: '#e8a87c',
  EVENT: '#82c0cc',
  ARTWORK: '#c3a6d4',
  DOCUMENT: '#f4d06f',
  ORGANIZATION: '#7fb685',
  BUILDING: '#b5ead7',
  IDEA: '#ff9aa2',
  STYLE: '#c7ceea',
  CUSTOM: '#a0c4ff',
};

const GraphCanvas: React.FC<Props> = ({
  nodes, edges, layout, layoutVersion, fitTrigger, mapId, selectedNodeId, selectedEdgeId,
  pendingEdgeFrom, onNodeSelect, onEdgeSelect,
  onCanvasDoubleClick, onNodeMove, onNodeDelete, onEdgeDelete, onNodeShiftClick,
  onNodeRightClick, onClearPendingEdge, onInlineRename,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  type InlineEdit = { id: string; type: 'node' | 'edge'; x: number; y: number; value: string };
  const [inlineEdit, setInlineEdit] = useState<InlineEdit | null>(null);
  const inlineEditRef = useRef<InlineEdit | null>(null);
  inlineEditRef.current = inlineEdit;

  nodesRef.current = nodes;
  edgesRef.current = edges;

  // Layout ref — allows the [nodes,edges] effect to read current layout without stale closure
  const layoutRef = useRef(layout);
  layoutRef.current = layout;

  // Callback refs — always hold the latest version, avoiding stale closures in cy handlers
  const onNodeSelectRef = useRef(onNodeSelect);
  const onEdgeSelectRef = useRef(onEdgeSelect);
  const onCanvasDoubleClickRef = useRef(onCanvasDoubleClick);
  const onNodeMoveRef = useRef(onNodeMove);
  const onNodeDeleteRef = useRef(onNodeDelete);
  const onEdgeDeleteRef = useRef(onEdgeDelete);
  const onNodeShiftClickRef = useRef(onNodeShiftClick);
  const onNodeRightClickRef = useRef(onNodeRightClick);
  const onClearPendingEdgeRef = useRef(onClearPendingEdge);
  const onInlineRenameRef = useRef(onInlineRename);
  const selectedNodeIdRef = useRef(selectedNodeId);
  const selectedEdgeIdRef = useRef(selectedEdgeId);

  onNodeSelectRef.current = onNodeSelect;
  onEdgeSelectRef.current = onEdgeSelect;
  onCanvasDoubleClickRef.current = onCanvasDoubleClick;
  onNodeMoveRef.current = onNodeMove;
  onNodeDeleteRef.current = onNodeDelete;
  onEdgeDeleteRef.current = onEdgeDelete;
  onNodeShiftClickRef.current = onNodeShiftClick;
  onNodeRightClickRef.current = onNodeRightClick;
  onClearPendingEdgeRef.current = onClearPendingEdge;
  onInlineRenameRef.current = onInlineRename;
  selectedNodeIdRef.current = selectedNodeId;
  selectedEdgeIdRef.current = selectedEdgeId;

  const buildCyElements = useCallback((ns: NodeDto[], es: EdgeDto[]) => {
    const cyNodes = ns.map((n) => ({
      data: {
        id: n.id,
        label: n.name,
        nodeData: n,
        color: NODE_TYPE_COLORS[n.type || 'CUSTOM'] || '#a0c4ff',
        size: n.size || 50,
      },
      position: n.positionX != null && n.positionY != null
        ? { x: n.positionX, y: n.positionY }
        : undefined,
    }));

    const cyEdges = es.map((e) => ({
      data: {
        id: e.id,
        source: e.fromNodeId,
        target: e.toNodeId,
        edgeData: e,
        directed: e.direction === 'UNIDIRECTIONAL',
      },
    }));

    return [...cyNodes, ...cyEdges];
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: buildCyElements(nodes, edges),
      style: [
        {
          selector: 'node',
          style: {
            'background-color': 'data(color)',
            label: 'data(label)',
            'text-valign': 'center',
            'text-halign': 'center',
            'font-size': '11px',
            'font-weight': 600,
            color: '#1a1a2e',
            width: 'data(size)',
            height: 'data(size)',
            'text-wrap': 'wrap',
            'text-max-width': '80px',
            'border-width': 2,
            'border-color': '#2a2a4a',
            'transition-property': 'border-color, border-width, background-color',
            'transition-duration': 150,
          } as cytoscape.Css.Node,
        },
        {
          selector: 'node:selected',
          style: {
            'border-color': '#e94560',
            'border-width': 3,
            'background-color': 'data(color)',
            'transition-duration': 0,
          } as cytoscape.Css.Node,
        },
        {
          selector: 'node.pending-source',
          style: {
            'border-color': '#ffd700',
            'border-width': 3,
          } as cytoscape.Css.Node,
        },
        {
          selector: 'edge',
          style: {
            width: 2,
            'line-color': '#4a4a7a',
            'target-arrow-color': '#4a4a7a',
            'target-arrow-shape': 'none',
            'curve-style': 'bezier',
            // Bug 20: reduce gap between parallel (multi) edges
            'control-point-step-size': 20,
            label: 'data(label)',
            'font-size': '10px',
            color: '#a0a0b0',
            'text-background-opacity': 0.7,
            'text-background-color': '#1a1a2e',
            'text-background-padding': '2px',
            'transition-property': 'line-color, width',
            'transition-duration': 150,
          } as cytoscape.Css.Edge,
        },
        {
          selector: 'edge[?directed]',
          style: {
            'target-arrow-shape': 'triangle',
          } as cytoscape.Css.Edge,
        },
        {
          selector: 'edge:selected',
          style: {
            'line-color': '#e94560',
            'target-arrow-color': '#e94560',
            width: 3,
          } as cytoscape.Css.Edge,
        },
      ],
      layout: { name: 'preset' },
      wheelSensitivity: 0.3,
    });

    cyRef.current = cy;

    // Disable active-bg tap highlight (prevents canvas darkening on double-click/tapstart)
    (cy.style() as any).selector('core').css({ 'active-bg-opacity': 0 }).update();

    if (mapId) {
      const saved = localStorage.getItem(`map_viewport_${mapId}`);
      if (saved) {
        try {
          const { zoom, pan } = JSON.parse(saved);
          if (zoom) cy.zoom(zoom);
          if (pan) cy.pan(pan);
        } catch(e) {}
      }
      cy.on("viewport", () => {
        localStorage.setItem(`map_viewport_${mapId}`, JSON.stringify({
          zoom: cy.zoom(),
          pan: cy.pan()
        }));
      });
    }

    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData: NodeDto = evt.target.data('nodeData');
      if (evt.originalEvent?.shiftKey) {
        onNodeShiftClickRef.current(nodeData.id);
      } else {
        onClearPendingEdgeRef.current();
        onNodeSelectRef.current(nodeData);
      }
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      const edgeData: EdgeDto = evt.target.data('edgeData');
      onEdgeSelectRef.current(edgeData);
    });

    // Clear pending edge when clicking on empty canvas (without Shift); also commit inline edit
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        const ie = inlineEditRef.current;
        if (ie) {
          onInlineRenameRef.current(ie.id, ie.value, ie.type);
          setInlineEdit(null);
        }
        if (!evt.originalEvent?.shiftKey) {
          onClearPendingEdgeRef.current();
        }
      }
    });

    // Prevent dbltap on nodes/edges from bubbling to canvas handler
    cy.on('dbltap', 'node, edge', (evt: EventObject) => {
      evt.stopPropagation();
    });

    cy.on('dbltap', (evt: EventObject) => {
      if (evt.target === cy) {
        const pos = evt.position;
        onCanvasDoubleClickRef.current(pos.x, pos.y);
      }
    });

    cy.on('cxttap', 'node', (evt: EventObject) => {
      const nodeData: NodeDto = evt.target.data('nodeData');
      onNodeRightClickRef.current(nodeData);
    });

    // Right-click detection via mousedown button===2 (capture phase).
    // More reliable than contextmenu on Mac trackpad because cytoscape
    // cannot block mousedown before it reaches the capture listener.
    const findNodeAtPoint = (clientX: number, clientY: number): NodeSingular | null => {
      const cy = cyRef.current;
      const container = containerRef.current;
      if (!cy || !container) return null;
      const rect = container.getBoundingClientRect();
      const pan = cy.pan();
      const zoom = cy.zoom();
      const graphX = (clientX - rect.left - pan.x) / zoom;
      const graphY = (clientY - rect.top - pan.y) / zoom;
      let closest: NodeSingular | null = null;
      let minDist = Infinity;
      cy.nodes().forEach((n: NodeSingular) => {
        const pos = n.position();
        const radius = ((n.data('size') as number) || 50) / 2 + 10;
        const dist = Math.sqrt((pos.x - graphX) ** 2 + (pos.y - graphY) ** 2);
        if (dist <= radius && dist < minDist) { minDist = dist; closest = n; }
      });
      return closest;
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 2) return;
      const node = findNodeAtPoint(e.clientX, e.clientY);
      if (node) {
        e.preventDefault();
        e.stopPropagation();
        onNodeRightClickRef.current(node.data('nodeData') as NodeDto);
      }
    };

    // Suppress browser context menu over the canvas
    const handleContextMenu = (e: MouseEvent) => { e.preventDefault(); };

    containerRef.current?.addEventListener('mousedown', handleMouseDown, true);
    containerRef.current?.addEventListener('contextmenu', handleContextMenu, true);

    cy.on('dragfree', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      const pos = node.position();
      const nodeData: NodeDto = node.data('nodeData');
      onNodeMoveRef.current(nodeData.id, pos.x, pos.y);
    });

    cy.on('keydown', (evt: EventObject) => {
      const e = evt.originalEvent as unknown as KeyboardEvent;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = cy.$('node:selected');
        const selectedEdges = cy.$('edge:selected');
        selectedNodes.forEach((n: NodeSingular) => {
          onNodeDeleteRef.current(n.data('nodeData').id);
        });
        selectedEdges.forEach((edge: cytoscape.EdgeSingular) => {
          onEdgeDeleteRef.current(edge.data('edgeData').id);
        });
      }
    });

    containerRef.current?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        // Start inline edit for selected node or edge
        if (inlineEditRef.current) return; // already editing
        const nodeId = selectedNodeIdRef.current;
        const edgeId = selectedEdgeIdRef.current;
        if (nodeId) {
          const n = cy.getElementById(nodeId);
          if (n.length) {
            const pos = n.renderedPosition();
            setInlineEdit({ id: nodeId, type: 'node', x: pos.x, y: pos.y, value: n.data('label') as string });
          }
        } else if (edgeId) {
          const edge = cy.getElementById(edgeId);
          if (edge.length) {
            const bb = edge.renderedBoundingBox({});
            setInlineEdit({ id: edgeId, type: 'edge', x: (bb.x1 + bb.x2) / 2, y: (bb.y1 + bb.y2) / 2, value: edge.data('label') as string || '' });
          }
        }
        return;
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = cy.$('node:selected');
        const selectedEdges = cy.$('edge:selected');
        selectedNodes.forEach((n: NodeSingular) => {
          onNodeDeleteRef.current(n.data('nodeData').id);
        });
        selectedEdges.forEach((edge: cytoscape.EdgeSingular) => {
          onEdgeDeleteRef.current(edge.data('edgeData').id);
        });
      }
    });

    return () => {
      containerRef.current?.removeEventListener('mousedown', handleMouseDown, true);
      containerRef.current?.removeEventListener('contextmenu', handleContextMenu, true);
      cy.destroy();
      cyRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;

    const existingNodeIds = new Set(cy.nodes().map((n: NodeSingular) => n.id()));
    const newNodeIds = new Set(nodes.map((n) => n.id));
    let addedNewElements = false;

    nodes.forEach((n) => {
      if (!existingNodeIds.has(n.id)) {
        cy.add({
          data: {
            id: n.id,
            label: n.name,
            nodeData: n,
            color: NODE_TYPE_COLORS[n.type || 'CUSTOM'] || '#a0c4ff',
            size: n.size || 50,
          },
          position: n.positionX != null ? { x: n.positionX, y: n.positionY! } : { x: 0, y: 0 },
        });
        addedNewElements = true;
      } else {
        const cyNode = cy.getElementById(n.id);
        cyNode.data('label', n.name);
        cyNode.data('nodeData', n);
        cyNode.data('color', NODE_TYPE_COLORS[n.type || 'CUSTOM'] || '#a0c4ff');
        // Preserve existing size if server returns null (e.g. after rename-only update)
        const existingSize = cyNode.data('size') as number | undefined;
        const newSize = n.size || existingSize || 50;
        cyNode.data('size', newSize);
        // Bug 6: explicitly set style so size updates without reload
        cyNode.style({ width: newSize, height: newSize });
      }
    });

    cy.nodes().forEach((cyNode: NodeSingular) => {
      if (!newNodeIds.has(cyNode.id())) {
        cyNode.remove();
      }
    });

    const existingEdgeIds = new Set(cy.edges().map((e: cytoscape.EdgeSingular) => e.id()));
    const newEdgeIds = new Set(edges.map((e) => e.id));

    edges.forEach((e) => {
      if (!existingEdgeIds.has(e.id)) {
        try {
          cy.add({
            data: {
              id: e.id,
              source: e.fromNodeId,
              target: e.toNodeId,
              edgeData: e,
              directed: e.direction === 'UNIDIRECTIONAL',
              label: e.description || '',
            },
          });
          addedNewElements = true;
        } catch {
          // ignore if nodes not found
        }
      } else {
        const cyEdge = cy.getElementById(e.id);
        cyEdge.data('edgeData', e);
        cyEdge.data('directed', e.direction === 'UNIDIRECTIONAL');
        cyEdge.data('label', e.description || '');
      }
    });

    cy.edges().forEach((cyEdge: cytoscape.EdgeSingular) => {
      if (!newEdgeIds.has(cyEdge.id())) {
        cyEdge.remove();
      }
    });
  }, [nodes, edges]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.nodes().removeClass('pending-source');
    if (pendingEdgeFrom) {
      cy.getElementById(pendingEdgeFrom).addClass('pending-source');
    }
  }, [pendingEdgeFrom]);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy) return;
    cy.$(':selected').unselect();
    if (selectedNodeId) {
      cy.getElementById(selectedNodeId).select();
    }
    if (selectedEdgeId) {
      cy.getElementById(selectedEdgeId).select();
    }
  }, [selectedNodeId, selectedEdgeId]);

  // Bug 14: track first mount so initial cose-with-positions doesn't re-run on explicit re-select
  const isInitialMountRef = useRef(true);

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !nodes.length) return;

    // On the very first mount, if positions already exist and layout is cose — keep preset
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      const hasPositions = nodes.some((n) => n.positionX != null);
      if (hasPositions && layout === 'cose') return;
    }

    // Build multi-edge pair counts for cose idealEdgeLength (Bug 19)
    const pairCount: Record<string, number> = {};
    edges.forEach((e) => {
      const key = [e.fromNodeId, e.toNodeId].sort().join('|');
      pairCount[key] = (pairCount[key] || 0) + 1;
    });

    if (layout === 'cose') {
      cy.layout({
        name: 'cose',
        animate: true,
        animationDuration: 500,
        idealEdgeLength: (edge: cytoscape.EdgeSingular) => {
          const key = [edge.source().id(), edge.target().id()].sort().join('|');
          const count = pairCount[key] || 1;
          return 100 + (count - 1) * 40;
        },
      } as cytoscape.LayoutOptions).run();
      return;
    }

    // Bug 15: run layout per disconnected component for non-cose layouts
    const components = (cy.elements() as any).components() as cytoscape.Collection[];
    if (components.length <= 1) {
      const layoutConfig = layout === 'breadthfirst'
        ? { name: 'breadthfirst', directed: true, animate: true } as cytoscape.LayoutOptions
        : { name: layout, animate: true } as cytoscape.LayoutOptions;
      cy.layout(layoutConfig).run();
    } else {
      const margin = 100;
      let offsetX = 0;
      components.forEach((component) => {
        const compNodes = component.nodes();
        if (compNodes.length === 0) return;
        const layoutConfig = layout === 'breadthfirst'
          ? { name: 'breadthfirst', directed: true, animate: false, fit: false } as cytoscape.LayoutOptions
          : { name: layout, animate: false, fit: false } as cytoscape.LayoutOptions;
        compNodes.layout(layoutConfig).run();
        const bb = compNodes.boundingBox({});
        const shiftX = offsetX - bb.x1;
        compNodes.forEach((n: NodeSingular) => { n.shift({ x: shiftX, y: 0 }); });
        offsetX += bb.w + margin;
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout, layoutVersion]);

  // Bug 7: fit graph on demand
  useEffect(() => {
    if (fitTrigger === 0) return;
    const cy = cyRef.current;
    if (!cy) return;
    cy.fit(cy.elements(), 50);
  }, [fitTrigger]);

  const commitInlineEdit = useCallback((value: string) => {
    const ie = inlineEditRef.current;
    if (!ie) return;
    onInlineRenameRef.current(ie.id, value, ie.type);
    setInlineEdit(null);
    containerRef.current?.focus();
  }, []);

  return (
    <div className="graph-canvas-wrapper">
      <div
        className="graph-canvas"
        ref={containerRef}
        tabIndex={0}
      />
      {inlineEdit && (
        <input
          className="inline-edit-input"
          style={{ left: inlineEdit.x, top: inlineEdit.y }}
          value={inlineEdit.value}
          onChange={(e) => setInlineEdit((prev) => prev ? { ...prev, value: e.target.value } : null)}
          onKeyDown={(e) => {
            e.stopPropagation();
            if (e.key === 'Enter') commitInlineEdit(inlineEdit.value);
            if (e.key === 'Escape') { setInlineEdit(null); containerRef.current?.focus(); }
          }}
          onBlur={() => commitInlineEdit(inlineEdit.value)}
          // eslint-disable-next-line jsx-a11y/no-autofocus
          autoFocus
        />
      )}
    </div>
  );
};

export default GraphCanvas;
