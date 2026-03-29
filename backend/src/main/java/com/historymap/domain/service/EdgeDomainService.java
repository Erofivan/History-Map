package com.historymap.domain.service;

import com.historymap.domain.entity.EdgeDirection;
import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import org.springframework.stereotype.Service;

@Service
public class EdgeDomainService {

    public void validateEdge(HistoricalEdge edge) {
        if (edge.getFrom() == null || edge.getTo() == null) {
            throw new IllegalArgumentException("Edge must have source and target nodes");
        }
        if (edge.getMapId() == null || edge.getMapId().isBlank()) {
            throw new IllegalArgumentException("Edge must belong to a map");
        }
        if (edge.getDirection() == null) {
            throw new IllegalArgumentException("Edge must have a direction");
        }
    }

    public boolean isSelfLoop(HistoricalEdge edge) {
        return edge.getFrom() != null && edge.getTo() != null &&
                edge.getFrom().getId().equals(edge.getTo().getId());
    }

    public HistoricalEdge createEdge(HistoricalNode from, HistoricalNode to,
                                     String description, EdgeDirection direction,
                                     String mapId, String ownerId) {
        HistoricalEdge edge = HistoricalEdge.builder()
                .from(from)
                .to(to)
                .description(description)
                .direction(direction != null ? direction : EdgeDirection.BIDIRECTIONAL)
                .mapId(mapId)
                .ownerId(ownerId)
                .build();
        validateEdge(edge);
        return edge;
    }
}
