import React, { useState, useEffect } from 'react';
import { EdgeDirection, EdgeDto, NodeDto } from '../types/api';
import './Sidebar.css';

interface Props {
  edge: EdgeDto;
  fromNode?: NodeDto;
  toNode?: NodeDto;
  onClose: () => void;
  onUpdate: (edgeId: string, updates: { description?: string; direction?: EdgeDirection }) => void;
  onDelete: (edgeId: string) => void;
}

const EdgeSidebar: React.FC<Props> = ({ edge, fromNode, toNode, onClose, onUpdate, onDelete }) => {
  const [description, setDescription] = useState(edge.description || '');
  const [direction, setDirection] = useState<EdgeDirection>(edge.direction);

  useEffect(() => {
    setDescription(edge.description || '');
    setDirection(edge.direction);
  }, [edge.id]);

  const handleSave = () => {
    onUpdate(edge.id, { description, direction });
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Connection</h3>
        <button className="btn btn-ghost" onClick={onClose}>✕</button>
      </div>

      <div className="sidebar-form">
        <div className="edge-nodes">
          <span className="edge-node">{fromNode?.name || edge.fromNodeId}</span>
          <span className="edge-arrow">{direction === 'UNIDIRECTIONAL' ? '→' : '↔'}</span>
          <span className="edge-node">{toNode?.name || edge.toNodeId}</span>
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the relationship..."
          />
        </div>

        <div className="form-group">
          <label>Direction</label>
          <select value={direction} onChange={(e) => setDirection(e.target.value as EdgeDirection)}>
            <option value="BIDIRECTIONAL">Bidirectional (↔)</option>
            <option value="UNIDIRECTIONAL">Unidirectional (→)</option>
          </select>
        </div>

        <div className="sidebar-actions">
          <button className="btn btn-primary" onClick={handleSave}>Save</button>
          <button className="btn btn-danger" onClick={() => onDelete(edge.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
};

export default EdgeSidebar;
