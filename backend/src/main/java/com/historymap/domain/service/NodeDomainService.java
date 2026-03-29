package com.historymap.domain.service;

import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NodeDomainService {

    public double calculateNodeSize(int edgeCount, double baseSize) {
        return baseSize * (1 + Math.log(edgeCount + 1));
    }

    public double calculateNodeSizeFromEdges(HistoricalNode node, List<HistoricalEdge> edges) {
        long unidirectionalCount = edges.stream()
                .filter(e -> e.getDirection() != null &&
                        e.getDirection() == com.historymap.domain.entity.EdgeDirection.UNIDIRECTIONAL)
                .count();
        long bidirectionalCount = edges.size() - unidirectionalCount;
        double effectiveEdgeCount = bidirectionalCount + unidirectionalCount * 0.5;
        return calculateNodeSize((int) effectiveEdgeCount, 50.0);
    }

    public void validateNode(HistoricalNode node) {
        if (node.getName() == null || node.getName().isBlank()) {
            throw new IllegalArgumentException("Node name cannot be blank");
        }
        if (node.getMapId() == null || node.getMapId().isBlank()) {
            throw new IllegalArgumentException("Node must belong to a map");
        }
    }
}
