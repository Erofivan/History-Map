import axios, { AxiosInstance } from 'axios';
import { AuthResponse, CreateEdgeRequest, CreateNodeRequest, EdgeDto, GraphDto, MapDto, NodeDto, UpdateEdgeRequest, UpdateNodeRequest } from '../types/api';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class ApiService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: BASE_URL });
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  async register(username: string, email: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/api/auth/register', { username, email, password });
    return data;
  }

  async login(username: string, password: string): Promise<AuthResponse> {
    const { data } = await this.client.post<AuthResponse>('/api/auth/login', { username, password });
    return data;
  }

  async getMaps(): Promise<MapDto[]> {
    const { data } = await this.client.get<MapDto[]>('/api/maps');
    return data;
  }

  async createMap(name: string): Promise<MapDto> {
    const { data } = await this.client.post<MapDto>('/api/maps', { name });
    return data;
  }

  async renameMap(mapId: number, name: string): Promise<MapDto> {
    const { data } = await this.client.put<MapDto>(`/api/maps/${mapId}`, { name });
    return data;
  }

  async deleteMap(mapId: number): Promise<void> {
    await this.client.delete(`/api/maps/${mapId}`);
  }

  async getGraph(mapId: string): Promise<GraphDto> {
    const { data } = await this.client.get<GraphDto>(`/api/maps/${mapId}/nodes`);
    return data;
  }

  async createNode(mapId: string, req: CreateNodeRequest): Promise<NodeDto> {
    const { data } = await this.client.post<NodeDto>(`/api/maps/${mapId}/nodes`, req);
    return data;
  }

  async updateNode(mapId: string, nodeId: string, req: UpdateNodeRequest): Promise<NodeDto> {
    const { data } = await this.client.put<NodeDto>(`/api/maps/${mapId}/nodes/${nodeId}`, req);
    return data;
  }

  async updateNodePosition(mapId: string, nodeId: string, x: number, y: number): Promise<NodeDto> {
    const { data } = await this.client.patch<NodeDto>(`/api/maps/${mapId}/nodes/${nodeId}/position`, { x, y });
    return data;
  }

  async deleteNode(mapId: string, nodeId: string): Promise<void> {
    await this.client.delete(`/api/maps/${mapId}/nodes/${nodeId}`);
  }

  async createEdge(mapId: string, req: CreateEdgeRequest): Promise<EdgeDto> {
    const { data } = await this.client.post<EdgeDto>(`/api/maps/${mapId}/edges`, req);
    return data;
  }

  async updateEdge(mapId: string, edgeId: string, req: UpdateEdgeRequest): Promise<EdgeDto> {
    const { data } = await this.client.put<EdgeDto>(`/api/maps/${mapId}/edges/${edgeId}`, req);
    return data;
  }

  async deleteEdge(mapId: string, edgeId: string): Promise<void> {
    await this.client.delete(`/api/maps/${mapId}/edges/${edgeId}`);
  }

  async getNodesByTag(mapId: string, tag: string): Promise<NodeDto[]> {
    const { data } = await this.client.get<NodeDto[]>(`/api/maps/${mapId}/nodes/by-tag/${tag}`);
    return data;
  }
}

export const apiService = new ApiService();
