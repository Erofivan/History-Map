package com.historymap.domain.entity;

import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.HashMap;

import static org.assertj.core.api.Assertions.*;

class HistoricalNodeTest {

    @Test
    void addTag_withNewTag_addsTag() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("Test")
                .tags(new ArrayList<>())
                .build();

        // Act
        node.addTag("artist");

        // Assert
        assertThat(node.getTags()).contains("artist");
    }

    @Test
    void addTag_withDuplicateTag_doesNotAdd() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("Test")
                .tags(new ArrayList<>())
                .build();
        node.addTag("artist");

        // Act
        node.addTag("artist");

        // Assert
        assertThat(node.getTags()).hasSize(1);
    }

    @Test
    void removeTag_removesExistingTag() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("Test")
                .tags(new ArrayList<>())
                .build();
        node.addTag("artist");

        // Act
        node.removeTag("artist");

        // Assert
        assertThat(node.getTags()).isEmpty();
    }

    @Test
    void setAttribute_addsCustomAttribute() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("Test")
                .attributes(new HashMap<>())
                .build();

        // Act
        node.setAttribute("birthplace", "Moscow");

        // Assert
        assertThat(node.getAttributes()).containsEntry("birthplace", "Moscow");
    }

    @Test
    void updatePosition_updatesCoordinates() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder().name("Test").build();

        // Act
        node.updatePosition(100.0, 200.0);

        // Assert
        assertThat(node.getPositionX()).isEqualTo(100.0);
        assertThat(node.getPositionY()).isEqualTo(200.0);
    }

    @Test
    void update_withNewName_updatesName() {
        // Arrange
        HistoricalNode node = HistoricalNode.builder()
                .name("Old Name")
                .tags(new ArrayList<>())
                .attributes(new HashMap<>())
                .build();

        // Act
        node.update("New Name", null, null, null, null, null, null, null, null, null, null, null);

        // Assert
        assertThat(node.getName()).isEqualTo("New Name");
    }
}
