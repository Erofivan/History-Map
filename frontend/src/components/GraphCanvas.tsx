import React, { useEffect, useRef, useCallback } from 'react';
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
  nodes, edges, layout, selectedNodeId, selectedEdgeId,
  pendingEdgeFrom, onNodeSelect, onEdgeSelect,
  onCanvasDoubleClick, onNodeMove, onNodeDelete, onEdgeDelete, onNodeShiftClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);

  nodesRef.current = nodes;
  edgesRef.current = edges;

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

    cy.on('tap', 'node', (evt: EventObject) => {
      const nodeData: NodeDto = evt.target.data('nodeData');
      if (evt.originalEvent?.shiftKey) {
        onNodeShiftClick(nodeData.id);
      } else {
        onNodeSelect(nodeData);
      }
    });

    cy.on('tap', 'edge', (evt: EventObject) => {
      const edgeData: EdgeDto = evt.target.data('edgeData');
      onEdgeSelect(edgeData);
    });

    cy.on('dbltap', (evt: EventObject) => {
      if (evt.target === cy) {
        const pos = evt.position;
        onCanvasDoubleClick(pos.x, pos.y);
      }
    });

    cy.on('dragfree', 'node', (evt: EventObject) => {
      const node = evt.target as NodeSingular;
      const pos = node.position();
      const nodeData: NodeDto = node.data('nodeData');
      onNodeMove(nodeData.id, pos.x, pos.y);
    });

    cy.on('keydown', (evt: EventObject) => {
      const e = evt.originalEvent as KeyboardEvent;
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = cy.$('node:selected');
        const selectedEdges = cy.$('edge:selected');
        selectedNodes.forEach((n: NodeSingular) => {
          onNodeDelete(n.data('nodeData').id);
        });
        selectedEdges.forEach((edge: cytoscape.EdgeSingular) => {
          onEdgeDelete(edge.data('edgeData').id);
        });
      }
    });

    containerRef.current?.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        const selectedNodes = cy.$('node:selected');
        const selectedEdges = cy.$('edge:selected');
        selectedNodes.forEach((n: NodeSingular) => {
          onNodeDelete(n.data('nodeData').id);
        });
        selectedEdges.forEach((edge: cytoscape.EdgeSingular) => {
          onEdgeDelete(edge.data('edgeData').id);
        });
      }
    });

    return () => {
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
      } else {
        const cyNode = cy.getElementById(n.id);
        cyNode.data('label', n.name);
        cyNode.data('nodeData', n);
        cyNode.data('color', NODE_TYPE_COLORS[n.type || 'CUSTOM'] || '#a0c4ff');
        cyNode.data('size', n.size || 50);
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
            },
          });
        } catch {
          // ignore if nodes not found
        }
      } else {
        const cyEdge = cy.getElementById(e.id);
        cyEdge.data('edgeData', e);
        cyEdge.data('directed', e.direction === 'UNIDIRECTIONAL');
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

  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || !nodes.length) return;

    const hasPositions = nodes.some((n) => n.positionX != null);
    if (hasPositions && layout === 'cose') return;

    const layoutConfig: cytoscape.LayoutOptions = layout === 'cose'
      ? { name: 'cose', animate: true, animationDuration: 500 } as cytoscape.LayoutOptions
      : layout === 'breadthfirst'
      ? { name: 'breadthfirst', directed: true, animate: true } as cytoscape.LayoutOptions
      : { name: layout, animate: true } as cytoscape.LayoutOptions;

    cy.layout(layoutConfig).run();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  return (
    <div
      className="graph-canvas"
      ref={containerRef}
      tabIndex={0}
    />
  );
};

export default GraphCanvas;
