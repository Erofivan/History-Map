package com.historymap.application.service;

import com.historymap.application.dto.*;
import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import com.historymap.domain.repository.EdgeRepository;
import com.historymap.domain.repository.NodeRepository;
import com.historymap.domain.service.EdgeDomainService;
import com.historymap.infrastructure.cache.GraphCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class EdgeApplicationService {

    private final EdgeRepository edgeRepository;
    private final NodeRepository nodeRepository;
    private final EdgeDomainService edgeDomainService;
    private final GraphCacheService graphCacheService;
    private final SimpMessagingTemplate messagingTemplate;

    public EdgeDto createEdge(String mapId, CreateEdgeRequest request, String ownerId) {
        HistoricalNode fromNode = nodeRepository.findById(request.getFromNodeId())
                .orElseThrow(() -> new NoSuchElementException("Source node not found"));
        HistoricalNode toNode = nodeRepository.findById(request.getToNodeId())
                .orElseThrow(() -> new NoSuchElementException("Target node not found"));

        HistoricalEdge edge = edgeDomainService.createEdge(
                fromNode, toNode, request.getDescription(),
                request.getDirection(), mapId, ownerId);

        HistoricalEdge saved = edgeRepository.save(edge);
        graphCacheService.invalidateMap(mapId);

        EdgeDto dto = toDto(saved);
        broadcastEdgeChange(mapId, "EDGE_CREATED", dto);
        return dto;
    }

    public EdgeDto updateEdge(String edgeId, UpdateEdgeRequest request, String ownerId) {
        HistoricalEdge edge = edgeRepository.findById(edgeId)
                .orElseThrow(() -> new NoSuchElementException("Edge not found"));

        if (request.getDescription() != null) {
            edge.updateDescription(request.getDescription());
        }
        if (request.getDirection() != null) {
            edge.updateDirection(request.getDirection());
        }

        HistoricalEdge saved = edgeRepository.save(edge);
        graphCacheService.invalidateMap(edge.getMapId());

        EdgeDto dto = toDto(saved);
        broadcastEdgeChange(edge.getMapId(), "EDGE_UPDATED", dto);
        return dto;
    }

    public void deleteEdge(String edgeId, String ownerId) {
        HistoricalEdge edge = edgeRepository.findById(edgeId)
                .orElseThrow(() -> new NoSuchElementException("Edge not found"));

        String mapId = edge.getMapId();
        edgeRepository.deleteById(edgeId);
        graphCacheService.invalidateMap(mapId);

        broadcastEdgeChange(mapId, "EDGE_DELETED", EdgeDto.builder().id(edgeId).build());
    }

    public List<EdgeDto> getEdgesByMap(String mapId) {
        return edgeRepository.findByMapId(mapId).stream()
                .map(this::toDto)
                .toList();
    }

    private void broadcastEdgeChange(String mapId, String type, EdgeDto payload) {
        WebSocketMessage message = WebSocketMessage.builder()
                .type(type)
                .payload(payload)
                .mapId(mapId)
                .build();
        messagingTemplate.convertAndSend("/topic/map/" + mapId, message);
    }

    private EdgeDto toDto(HistoricalEdge edge) {
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
