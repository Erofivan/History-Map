import React, { useState, useEffect, useRef } from 'react';
import { NodeDto, NodeType } from '../types/api';
import './Sidebar.css';

interface Props {
  node: NodeDto;
  autoEdit?: boolean;
  onClose: () => void;
  onUpdate: (nodeId: string, updates: Partial<NodeDto>) => void;
  onDelete: (nodeId: string) => void;
  relatedNodes: NodeDto[];
}

const NODE_TYPES: NodeType[] = ['PERSON', 'EVENT', 'ARTWORK', 'DOCUMENT', 'ORGANIZATION', 'BUILDING', 'IDEA', 'STYLE', 'CUSTOM'];

const NodeSidebar: React.FC<Props> = ({ node, autoEdit, onClose, onUpdate, onDelete, relatedNodes }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ ...node });
  const [newTag, setNewTag] = useState('');
  const [newAttrKey, setNewAttrKey] = useState('');
  const [newAttrVal, setNewAttrVal] = useState('');
  const [showArticle, setShowArticle] = useState(false);

  // Keep latest autoEdit value accessible inside effects without re-running them
  const autoEditRef = useRef(autoEdit);
  autoEditRef.current = autoEdit;

  useEffect(() => {
    setForm({ ...node });
    setEditing(!!autoEditRef.current);
    setShowArticle(false);
  }, [node.id]);

  const handleSave = () => {
    onUpdate(node.id, form);
    setEditing(false);
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    const updated = [...(form.tags || []), newTag.trim()];
    setForm((f) => ({ ...f, tags: updated }));
    setNewTag('');
  };

  const removeTag = (tag: string) => {
    setForm((f) => ({ ...f, tags: (f.tags || []).filter((t) => t !== tag) }));
  };

  const addAttr = () => {
    if (!newAttrKey.trim()) return;
    setForm((f) => ({ ...f, attributes: { ...f.attributes, [newAttrKey.trim()]: newAttrVal } }));
    setNewAttrKey('');
    setNewAttrVal('');
  };

  const removeAttr = (key: string) => {
    const attrs = { ...form.attributes };
    delete attrs[key];
    setForm((f) => ({ ...f, attributes: attrs }));
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>{editing ? 'Edit Entity' : node.name}</h3>
        <div className="sidebar-header-actions">
          {!editing && (
            <button className="btn btn-ghost" onClick={() => setEditing(true)} title="Edit">✏️</button>
          )}
          <button className="btn btn-ghost" onClick={onClose} title="Close">✕</button>
        </div>
      </div>

      {showArticle ? (
        <div className="sidebar-article">
          <button className="btn btn-ghost sidebar-back" onClick={() => setShowArticle(false)}>← Back</button>
          <h4>{node.name}</h4>
          <div className="article-content">{node.article || 'No article.'}</div>
          {relatedNodes.length > 0 && (
            <div className="article-related">
              <h5>Related entities</h5>
              {relatedNodes.map((n) => (
                <div key={n.id} className="related-item">{n.name}</div>
              ))}
            </div>
          )}
        </div>
      ) : editing ? (
        <div className="sidebar-form">
          <div className="form-group">
            <label>Name</label>
            <input value={form.name || ''} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Type</label>
            <select value={form.type || 'CUSTOM'} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as NodeType }))}>
              {NODE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea rows={3} value={form.description || ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Image URL</label>
            <input value={form.imageUrl || ''} onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))} />
          </div>
          <div className="form-group">
            <label>Article</label>
            <textarea rows={4} value={form.article || ''} onChange={(e) => setForm((f) => ({ ...f, article: e.target.value }))} />
          </div>
          {(form.type === 'PERSON') && (
            <div className="form-row">
              <div className="form-group">
                <label>Birth Year</label>
                <input type="number" value={form.birthYear || ''} onChange={(e) => setForm((f) => ({ ...f, birthYear: parseInt(e.target.value) || undefined }))} />
              </div>
              <div className="form-group">
                <label>Death Year</label>
                <input type="number" value={form.deathYear || ''} onChange={(e) => setForm((f) => ({ ...f, deathYear: parseInt(e.target.value) || undefined }))} />
              </div>
            </div>
          )}
          {(form.type === 'ARTWORK') && (
            <div className="form-group">
              <label>Year</label>
              <input type="number" value={form.year || ''} onChange={(e) => setForm((f) => ({ ...f, year: parseInt(e.target.value) || undefined }))} />
            </div>
          )}
          {(form.type === 'EVENT') && (
            <div className="form-row">
              <div className="form-group">
                <label>Start Date</label>
                <input value={form.startDate || ''} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input value={form.endDate || ''} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-list">
              {(form.tags || []).map((t) => (
                <span key={t} className="tag">
                  {t} <button onClick={() => removeTag(t)}>✕</button>
                </span>
              ))}
            </div>
            <div className="tag-input">
              <input placeholder="Add tag..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && addTag()} />
              <button className="btn btn-secondary" onClick={addTag}>+</button>
            </div>
          </div>
          <div className="form-group">
            <label>Custom Attributes</label>
            {Object.entries(form.attributes || {}).map(([k, v]) => (
              <div key={k} className="attr-row">
                <span className="attr-key">{k}:</span>
                <span className="attr-val">{String(v)}</span>
                <button className="btn btn-ghost" onClick={() => removeAttr(k)}>✕</button>
              </div>
            ))}
            <div className="attr-input">
              <input placeholder="Key" value={newAttrKey} onChange={(e) => setNewAttrKey(e.target.value)} />
              <input placeholder="Value" value={newAttrVal} onChange={(e) => setNewAttrVal(e.target.value)} />
              <button className="btn btn-secondary" onClick={addAttr}>+</button>
            </div>
          </div>
          <div className="sidebar-actions">
            <button className="btn btn-primary" onClick={handleSave}>Save</button>
            <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="sidebar-view">
          <div className="node-type-badge" style={{ background: getTypeColor(node.type) }}>
            {node.type || 'CUSTOM'}
          </div>

          {node.imageUrl && (
            <img src={node.imageUrl} alt={node.name} className="node-image" />
          )}

          {node.description && (
            <p className="node-description">{node.description}</p>
          )}

          <div className="node-meta">
            {node.birthYear && <div><span>Born:</span> {node.birthYear}{node.deathYear ? ` — ${node.deathYear}` : ''}</div>}
            {node.year && <div><span>Year:</span> {node.year}</div>}
            {node.startDate && <div><span>Period:</span> {node.startDate}{node.endDate ? ` — ${node.endDate}` : ''}</div>}
          </div>

          {(node.tags || []).length > 0 && (
            <div className="tags-list">
              {(node.tags || []).map((t) => <span key={t} className="tag">{t}</span>)}
            </div>
          )}

          {Object.entries(node.attributes || {}).length > 0 && (
            <div className="attrs-section">
              {Object.entries(node.attributes || {}).map(([k, v]) => (
                <div key={k} className="attr-row">
                  <span className="attr-key">{k}:</span>
                  <span className="attr-val">{String(v)}</span>
                </div>
              ))}
            </div>
          )}

          {node.article && (
            <button className="btn btn-secondary sidebar-article-btn" onClick={() => setShowArticle(true)}>
              📄 Read Article
            </button>
          )}

          {relatedNodes.length > 0 && (
            <div className="related-section">
              <h5>Connected entities ({relatedNodes.length})</h5>
              {relatedNodes.map((n) => (
                <div key={n.id} className="related-item">{n.name}</div>
              ))}
            </div>
          )}

          <div className="sidebar-actions">
            <button className="btn btn-danger" onClick={() => onDelete(node.id)}>Delete Entity</button>
          </div>
        </div>
      )}
    </div>
  );
};

function getTypeColor(type?: string): string {
  const colors: Record<string, string> = {
    PERSON: '#e8a87c', EVENT: '#82c0cc', ARTWORK: '#c3a6d4',
    DOCUMENT: '#f4d06f', ORGANIZATION: '#7fb685', BUILDING: '#b5ead7',
    IDEA: '#ff9aa2', STYLE: '#c7ceea', CUSTOM: '#a0c4ff',
  };
  return colors[type || 'CUSTOM'] || '#a0c4ff';
}

export default NodeSidebar;
