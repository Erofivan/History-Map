export interface AuthResponse {
  token: string;
  userId: number;
  username: string;
}

export interface MapDto {
  id: number;
  name: string;
  ownerId: number;
  createdAt: string;
  updatedAt: string;
}

export type NodeType = 'PERSON' | 'EVENT' | 'ARTWORK' | 'DOCUMENT' | 'ORGANIZATION' | 'BUILDING' | 'IDEA' | 'STYLE' | 'CUSTOM';
export type EdgeDirection = 'BIDIRECTIONAL' | 'UNIDIRECTIONAL';

export interface NodeDto {
  id: string;
  name: string;
  description?: string;
  type?: NodeType;
  imageUrl?: string;
  article?: string;
  tags: string[];
  attributes: Record<string, unknown>;
  mapId: string;
  positionX?: number;
  positionY?: number;
  size?: number;
  birthYear?: number;
  deathYear?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface EdgeDto {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  description?: string;
  direction: EdgeDirection;
  mapId: string;
}

export interface GraphDto {
  nodes: NodeDto[];
  edges: EdgeDto[];
}

export interface CreateNodeRequest {
  name: string;
  description?: string;
  type?: NodeType;
  imageUrl?: string;
  article?: string;
  tags?: string[];
  attributes?: Record<string, unknown>;
  positionX?: number;
  positionY?: number;
  birthYear?: number;
  deathYear?: number;
  year?: number;
  startDate?: string;
  endDate?: string;
}

export interface UpdateNodeRequest extends Partial<CreateNodeRequest> {}

export interface CreateEdgeRequest {
  fromNodeId: string;
  toNodeId: string;
  description?: string;
  direction?: EdgeDirection;
}

export interface UpdateEdgeRequest {
  description?: string;
  direction?: EdgeDirection;
}

export interface WebSocketMessage {
  type: string;
  payload: NodeDto | EdgeDto | { id: string };
  mapId: string;
}
