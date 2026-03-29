import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { MapDto } from '../types/api';
import { useAuth } from '../contexts/AuthContext';
import './MapsPage.css';

const MapsPage: React.FC = () => {
  const [maps, setMaps] = useState<MapDto[]>([]);
  const [newMapName, setNewMapName] = useState('');
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const { username, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    apiService.getMaps().then(setMaps).finally(() => setLoading(false));
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim()) return;
    setCreating(true);
    try {
      const map = await apiService.createMap(newMapName.trim());
      setMaps((prev) => [...prev, map]);
      setNewMapName('');
      navigate(`/maps/${map.id}`);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (mapId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this map?')) return;
    await apiService.deleteMap(mapId);
    setMaps((prev) => prev.filter((m) => m.id !== mapId));
  };

  return (
    <div className="maps-page">
      <header className="maps-header">
        <div className="maps-header-logo">
          <span>🗺</span>
          <h1>History Map</h1>
        </div>
        <div className="maps-header-user">
          <span>{username}</span>
          <button className="btn btn-ghost" onClick={logout}>Sign out</button>
        </div>
      </header>

      <main className="maps-main">
        <h2>My Maps</h2>

        <form className="create-map-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="New map name..."
            value={newMapName}
            onChange={(e) => setNewMapName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={creating || !newMapName.trim()}>
            {creating ? 'Creating...' : '+ Create'}
          </button>
        </form>

        {loading ? (
          <div className="maps-loading">Loading...</div>
        ) : maps.length === 0 ? (
          <div className="maps-empty">
            <p>No maps yet. Create your first historical map!</p>
          </div>
        ) : (
          <div className="maps-grid">
            {maps.map((map) => (
              <div
                key={map.id}
                className="map-card"
                onClick={() => navigate(`/maps/${map.id}`)}
              >
                <div className="map-card-icon">🗺</div>
                <div className="map-card-info">
                  <h3>{map.name}</h3>
                  <p>{new Date(map.updatedAt).toLocaleDateString()}</p>
                </div>
                <button
                  className="map-card-delete btn btn-ghost"
                  onClick={(e) => handleDelete(map.id, e)}
                  title="Delete map"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default MapsPage;
