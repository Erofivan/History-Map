import React, { useState, useMemo } from 'react';
import { EdgeDto, NodeDto } from '../types/api';
import './Catalog.css';

interface Props {
  nodes: NodeDto[];
  edges: EdgeDto[];
  onSelectNode: (node: NodeDto) => void;
  onFilterByTag: (tag: string) => void;
  activeTag: string | null;
}

const Catalog: React.FC<Props> = ({ nodes, edges, onSelectNode, onFilterByTag, activeTag }) => {
  const [expandedTags, setExpandedTags] = useState<Set<string>>(new Set());
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  const tagGroups = useMemo(() => {
    const groups: Record<string, NodeDto[]> = { All: nodes };
    nodes.forEach((node) => {
      (node.tags || []).forEach((tag) => {
        if (!groups[tag]) groups[tag] = [];
        groups[tag].push(node);
      });
    });
    return groups;
  }, [nodes]);

  const getChildNodes = (nodeId: string) =>
    edges
      .filter((e) => e.direction === 'UNIDIRECTIONAL' && e.fromNodeId === nodeId)
      .map((e) => nodes.find((n) => n.id === e.toNodeId))
      .filter(Boolean) as NodeDto[];

  const toggleTag = (tag: string) => {
    setExpandedTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });
  };

  const toggleNodeExpand = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
      return next;
    });
  };

  const filtered = useMemo(() => {
    if (!search) return nodes;
    return nodes.filter((n) => n.name.toLowerCase().includes(search.toLowerCase()));
  }, [nodes, search]);

  const tags = Object.keys(tagGroups).filter((t) => t !== 'All');

  return (
    <div className="catalog">
      <div className="catalog-header">
        <h3>Catalog</h3>
      </div>
      <div className="catalog-search">
        <input
          placeholder="Search entities..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search ? (
        <div className="catalog-results">
          {filtered.map((node) => (
            <div key={node.id} className="catalog-node" onClick={() => onSelectNode(node)}>
              {node.name}
            </div>
          ))}
          {filtered.length === 0 && <div className="catalog-empty">No results</div>}
        </div>
      ) : (
        <div className="catalog-groups">
          {tags.length === 0 && (
            <div className="catalog-empty">No tags yet. Add tags to entities to organize the catalog.</div>
          )}
          {tags.map((tag) => (
            <div key={tag} className="catalog-group">
              <div
                className={`catalog-tag ${activeTag === tag ? 'active' : ''}`}
                onClick={() => {
                  toggleTag(tag);
                  onFilterByTag(tag);
                }}
              >
                <span className="catalog-tag-toggle">{expandedTags.has(tag) ? '▼' : '▶'}</span>
                <span className="catalog-tag-name">{tag}</span>
                <span className="catalog-tag-count">{tagGroups[tag].length}</span>
              </div>

              {expandedTags.has(tag) && (
                <div className="catalog-tag-nodes">
                  {tagGroups[tag].map((node) => {
                    const children = getChildNodes(node.id);
                    return (
                      <div key={node.id}>
                        <div
                          className="catalog-node"
                          onClick={() => onSelectNode(node)}
                        >
                          {children.length > 0 && (
                            <button
                              className="catalog-expand-btn"
                              onClick={(e) => toggleNodeExpand(node.id, e)}
                            >
                              {expandedNodes.has(node.id) ? '▼' : '▶'}
                            </button>
                          )}
                          <span>{node.name}</span>
                        </div>
                        {expandedNodes.has(node.id) && children.map((child) => (
                          <div
                            key={child.id}
                            className="catalog-node catalog-node-child"
                            onClick={() => onSelectNode(child)}
                          >
                            └ {child.name}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Catalog;
