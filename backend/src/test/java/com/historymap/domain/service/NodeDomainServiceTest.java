package com.historymap.domain.service;

import com.historymap.domain.entity.EdgeDirection;
import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import com.historymap.domain.entity.NodeType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.*;

class NodeDomainServiceTest {

    private NodeDomainService service;

    @BeforeEach
    void setUp() {
        service = new NodeDomainService();
    }

    @Test
    void calculateNodeSize_withZeroEdges_returnsBaseSize() {
        // Arrange
        double baseSize = 50.0;

        // Act
        double size = service.calculateNodeSize(0, baseSize);

        // Assert
        assertThat(size).isEqualTo(50.0);
    }

    @Test
    void calculateNodeSize_withEdges_returnsBiggerSize() {
        // Arrange
        double baseSize = 50.0;

        // Act
        double size = service.calculateNodeSize(5, baseSize);

        // Assert
        assertThat(size).isGreaterThan(50.0);
    }

    @Test
    void validateNode_withBlankName_throwsException() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("")
                .mapId("map1")
                .build();

        // Act & Assert
        assertThatThrownBy(() -> service.validateNode(node))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("name");
    }

    @Test
    void validateNode_withNullMapId_throwsException() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("Test Node")
                .mapId(null)
                .build();

        // Act & Assert
        assertThatThrownBy(() -> service.validateNode(node))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("map");
    }

    @Test
    void validateNode_withValidNode_doesNotThrow() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("Valid Node")
                .mapId("map1")
                .build();

        // Act & Assert
        assertThatCode(() -> service.validateNode(node)).doesNotThrowAnyException();
    }

    @Test
    void calculateNodeSizeFromEdges_countsUnidirectionalWithHalfWeight() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder().id("n1").build();
        HistoricalNode other = HistoricalNode.builder().id("n2").build();
        HistoricalEdge bidirectional = HistoricalEdge.builder()
                .from(node).to(other).direction(EdgeDirection.BIDIRECTIONAL).build();
        HistoricalEdge unidirectional = HistoricalEdge.builder()
                .from(node).to(other).direction(EdgeDirection.UNIDIRECTIONAL).build();

        // Act
        double sizeWithBidi = service.calculateNodeSizeFromEdges(node, List.of(bidirectional));
        double sizeWithUni = service.calculateNodeSizeFromEdges(node, List.of(unidirectional));

        // Assert
        assertThat(sizeWithBidi).isGreaterThan(sizeWithUni);
    }
}
