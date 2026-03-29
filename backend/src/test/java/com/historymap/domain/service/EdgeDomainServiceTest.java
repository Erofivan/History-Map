package com.historymap.domain.service;

import com.historymap.domain.entity.EdgeDirection;
import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class EdgeDomainServiceTest {

    private EdgeDomainService service;

    @BeforeEach
    void setUp() {
        service = new EdgeDomainService();
    }

    @Test
    void createEdge_withValidParams_createsEdge() {
        // Arrange
        HistoricalNode from = HistoricalNode.builder().id("n1").name("Node 1").build();
        HistoricalNode to = HistoricalNode.builder().id("n2").name("Node 2").build();

        // Act
        HistoricalEdge edge = service.createEdge(from, to, "related to", EdgeDirection.BIDIRECTIONAL, "map1", "user1");

        // Assert
        assertThat(edge.getFrom()).isEqualTo(from);
        assertThat(edge.getTo()).isEqualTo(to);
        assertThat(edge.getDescription()).isEqualTo("related to");
        assertThat(edge.getDirection()).isEqualTo(EdgeDirection.BIDIRECTIONAL);
    }

    @Test
    void createEdge_withNullDirection_defaultsToBidirectional() {
        // Arrange
        HistoricalNode from = HistoricalNode.builder().id("n1").build();
        HistoricalNode to = HistoricalNode.builder().id("n2").build();

        // Act
        HistoricalEdge edge = service.createEdge(from, to, null, null, "map1", "user1");

        // Assert
        assertThat(edge.getDirection()).isEqualTo(EdgeDirection.BIDIRECTIONAL);
    }

    @Test
    void isSelfLoop_withSameNodes_returnsTrue() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder().id("n1").build();
        HistoricalEdge edge = HistoricalEdge.builder().from(node).to(node).build();

        // Act
        boolean result = service.isSelfLoop(edge);

        // Assert
        assertThat(result).isTrue();
    }

    @Test
    void isSelfLoop_withDifferentNodes_returnsFalse() {
        // Arrange
        HistoricalNode from = HistoricalNode.builder().id("n1").build();
        HistoricalNode to = HistoricalNode.builder().id("n2").build();
        HistoricalEdge edge = HistoricalEdge.builder().from(from).to(to).build();

        // Act
        boolean result = service.isSelfLoop(edge);

        // Assert
        assertThat(result).isFalse();
    }

    @Test
    void validateEdge_withNullFrom_throwsException() {
        // Arrange
        HistoricalEdge edge = HistoricalEdge.builder()
                .to(HistoricalNode.builder().id("n2").build())
                .direction(EdgeDirection.BIDIRECTIONAL)
                .mapId("map1")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> service.validateEdge(edge))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
