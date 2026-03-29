import React from 'react';
import { LayoutType } from '../pages/MapEditorPage';
import './Toolbar.css';

interface Props {
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onToggleCatalog: () => void;
  onBack: () => void;
  nodeCount: number;
  edgeCount: number;
  pendingEdgeFrom: string | null;
  onCancelEdge: () => void;
}

const Toolbar: React.FC<Props> = ({
  layout, onLayoutChange, onToggleCatalog, onBack,
  nodeCount, edgeCount, pendingEdgeFrom, onCancelEdge,
}) => {
  return (
    <div className="toolbar">
      <div className="toolbar-left">
        <button className="btn btn-ghost toolbar-back" onClick={onBack} title="Back to maps">
          ← Maps
        </button>
        <div className="toolbar-divider" />
        <button className="btn btn-ghost" onClick={onToggleCatalog} title="Toggle catalog">
          📋 Catalog
        </button>
      </div>

      <div className="toolbar-center">
        {pendingEdgeFrom ? (
          <div className="toolbar-status pending">
            <span>🔗 Click target node to create edge (Shift+click)</span>
            <button className="btn btn-ghost" onClick={onCancelEdge}>Cancel</button>
          </div>
        ) : (
          <div className="toolbar-status hint">
            <span>Double-click canvas to create • Shift+click to connect • Delete to remove</span>
          </div>
        )}
      </div>

      <div className="toolbar-right">
        <span className="toolbar-stat">{nodeCount} nodes · {edgeCount} edges</span>
        <div className="toolbar-divider" />
        <span className="toolbar-label">Layout:</span>
        <select
          value={layout}
          onChange={(e) => onLayoutChange(e.target.value as LayoutType)}
          className="toolbar-select"
        >
          <option value="cose">Force-directed</option>
          <option value="breadthfirst">Tree</option>
          <option value="grid">Grid</option>
          <option value="circle">Circle</option>
          <option value="concentric">Concentric</option>
        </select>
      </div>
    </div>
  );
};

export default Toolbar;
