package com.historymap.application.service;

import com.historymap.application.dto.*;
import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import com.historymap.domain.entity.NodeType;
import com.historymap.domain.repository.EdgeRepository;
import com.historymap.domain.repository.NodeRepository;
import com.historymap.domain.service.NodeDomainService;
import com.historymap.infrastructure.cache.GraphCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class NodeApplicationService {

    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;
    private final NodeDomainService nodeDomainService;
    private final GraphCacheService graphCacheService;
    private final SimpMessagingTemplate messagingTemplate;

    public GraphDto getGraph(String mapId) {
        List<HistoricalNode> nodes = graphCacheService.getMapNodes(mapId);
        if (nodes == null) {
            nodes = nodeRepository.findByMapId(mapId);
            graphCacheService.cacheMapNodes(mapId, nodes);
        }

        List<HistoricalEdge> edges = graphCacheService.getMapEdges(mapId);
        if (edges == null) {
            edges = edgeRepository.findByMapId(mapId);
            graphCacheService.cacheMapEdges(mapId, edges);
        }

        List<HistoricalEdge> finalEdges = edges;
        List<NodeDto> nodeDtos = nodes.stream()
                .map(node -> {
                    List<HistoricalEdge> nodeEdges = finalEdges.stream()
                            .filter(e -> (e.getFrom() != null && node.getId().equals(e.getFrom().getId())) ||
                                    (e.getTo() != null && node.getId().equals(e.getTo().getId())))
                            .toList();
                    double size = nodeDomainService.calculateNodeSizeFromEdges(node, nodeEdges);
                    return toNodeDto(node, size);
                })
                .toList();

        List<EdgeDto> edgeDtos = edges.stream()
                .map(this::toEdgeDto)
                .toList();

        return GraphDto.builder()
                .nodes(nodeDtos)
                .edges(edgeDtos)
                .build();
    }

    public NodeDto createNode(String mapId, CreateNodeRequest request, String ownerId) {
        HistoricalNode node = HistoricalNode.builder()
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType() != null ? request.getType() : NodeType.CUSTOM)
                .imageUrl(request.getImageUrl())
                .article(request.getArticle())
                .tags(request.getTags() != null ? request.getTags() : new ArrayList<>())
                .attributes(request.getAttributes() != null ? request.getAttributes() : new HashMap<>())
                .mapId(mapId)
                .ownerId(ownerId)
                .positionX(request.getPositionX() != null ? request.getPositionX() : 0.0)
                .positionY(request.getPositionY() != null ? request.getPositionY() : 0.0)
                .birthYear(request.getBirthYear())
                .deathYear(request.getDeathYear())
                .year(request.getYear())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build();

        nodeDomainService.validateNode(node);
        HistoricalNode saved = nodeRepository.save(node);
        graphCacheService.invalidateMap(mapId);

        NodeDto dto = toNodeDto(saved, 50.0);
        broadcastNodeChange(mapId, "NODE_CREATED", dto);
        return dto;
    }

    public NodeDto updateNode(String nodeId, UpdateNodeRequest request, String ownerId) {
        HistoricalNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new NoSuchElementException("Node not found"));

        node.update(request.getName(), request.getDescription(), request.getType(),
                request.getImageUrl(), request.getArticle(), request.getTags(),
                request.getAttributes(), request.getBirthYear(), request.getDeathYear(),
                request.getYear(), request.getStartDate(), request.getEndDate());

        if (request.getPositionX() != null && request.getPositionY() != null) {
            node.updatePosition(request.getPositionX(), request.getPositionY());
        }

        HistoricalNode saved = nodeRepository.save(node);
        graphCacheService.invalidateMap(node.getMapId());
        graphCacheService.cacheNode(saved);

        NodeDto dto = toNodeDto(saved, 50.0);
        broadcastNodeChange(node.getMapId(), "NODE_UPDATED", dto);
        return dto;
    }

    public NodeDto updateNodePosition(String nodeId, UpdateNodePositionRequest request, String ownerId) {
        HistoricalNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new NoSuchElementException("Node not found"));

        node.updatePosition(request.getX(), request.getY());
        HistoricalNode saved = nodeRepository.save(node);
        graphCacheService.cacheNode(saved);

        List<HistoricalEdge> nodeEdges = edgeRepository.findByMapId(saved.getMapId()).stream()
                .filter(e -> (e.getFrom() != null && saved.getId().equals(e.getFrom().getId())) ||
                             (e.getTo() != null && saved.getId().equals(e.getTo().getId())))
                .toList();
        double size = nodeDomainService.calculateNodeSizeFromEdges(saved, nodeEdges);

        NodeDto dto = toNodeDto(saved, size);
        broadcastNodeChange(node.getMapId(), "NODE_MOVED", dto);
        return dto;
    }

    public void deleteNode(String nodeId, String ownerId) {
        HistoricalNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new NoSuchElementException("Node not found"));

        String mapId = node.getMapId();
        edgeRepository.deleteByNodeId(nodeId);
        nodeRepository.deleteById(nodeId);
        graphCacheService.invalidateMap(mapId);
        graphCacheService.invalidateNode(nodeId);

        broadcastNodeChange(mapId, "NODE_DELETED", NodeDto.builder().id(nodeId).build());
    }

    public List<NodeDto> getNodesByTag(String mapId, String tag) {
        return nodeRepository.findByMapIdAndTag(mapId, tag).stream()
                .map(node -> toNodeDto(node, 50.0))
                .toList();
    }

    public NodeDto getNode(String nodeId) {
        HistoricalNode cached = graphCacheService.getNode(nodeId);
        if (cached != null) {
            return toNodeDto(cached, 50.0);
        }
        HistoricalNode node = nodeRepository.findById(nodeId)
                .orElseThrow(() -> new NoSuchElementException("Node not found"));
        graphCacheService.cacheNode(node);
        return toNodeDto(node, 50.0);
    }

    private void broadcastNodeChange(String mapId, String type, NodeDto payload) {
        WebSocketMessage message = WebSocketMessage.builder()
                .type(type)
                .payload(payload)
                .mapId(mapId)
                .build();
        messagingTemplate.convertAndSend("/topic/map/" + mapId, message);
    }

    private NodeDto toNodeDto(HistoricalNode node, double size) {
        return NodeDto.builder()
                .id(node.getId())
                .name(node.getName())
                .description(node.getDescription())
                .type(node.getType())
                .imageUrl(node.getImageUrl())
                .article(node.getArticle())
                .tags(node.getTags())
                .attributes(node.getAttributes())
                .mapId(node.getMapId())
                .positionX(node.getPositionX())
                .positionY(node.getPositionY())
                .size(size)
                .birthYear(node.getBirthYear())
                .deathYear(node.getDeathYear())
                .year(node.getYear())
                .startDate(node.getStartDate())
                .endDate(node.getEndDate())
                .build();
    }

    private EdgeDto toEdgeDto(HistoricalEdge edge) {
        return EdgeDto.builder()
                .id(edge.getId())
                .fromNodeId(edge.getFrom() != null ? edge.getFrom().getId() : null)
                .toNodeId(edge.getTo() != null ? edge.getTo().getId() : null)
                .description(edge.getDescription())
                .direction(edge.getDirection())
                .mapId(edge.getMapId())
                .build();
    }
}
