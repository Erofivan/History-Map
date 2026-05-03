package com.historymap.domain.service;

import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class NodeDomainService {

    public double calculateNodeSize(int edgeCount, double baseSize) {
        return baseSize * (1 + Math.log(edgeCount + 1));
    }

    public double calculateNodeSizeFromEdges(HistoricalNode node, List<HistoricalEdge> edges) {
        // Bug 5: deduplicate multi-edges by pair, but use log-scale weight so nodes
        // with more multi-edges are still visually larger, just not proportionally.
        // Group edges by the unordered pair {from, to}.
        Map<String, List<HistoricalEdge>> byPair = edges.stream().collect(
                Collectors.groupingBy(e -> {
                    String a = e.getFrom() != null ? e.getFrom().getId() : "";
                    String b = e.getTo() != null ? e.getTo().getId() : "";
                    return a.compareTo(b) <= 0 ? a + "|" + b : b + "|" + a;
                })
        );

        double effectiveEdgeCount = byPair.values().stream().mapToDouble(group -> {
            // Base weight = 1 for the pair, plus log-scale bonus for multi-edges (much less than linear)
            double base = 1.0;
            double multiBonus = Math.log(group.size()) * 0.3; // ln(1)=0, ln(2)≈0.2, ln(3)≈0.33
            // Directional weight: unidirectional edges count slightly less
            boolean anyBidirectional = group.stream().anyMatch(e ->
                    e.getDirection() == com.historymap.domain.entity.EdgeDirection.BIDIRECTIONAL);
            double dirWeight = anyBidirectional ? 1.0 : 0.7;
            return (base + multiBonus) * dirWeight;
        }).sum();

        return calculateNodeSize((int) Math.round(effectiveEdgeCount), 50.0);
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
