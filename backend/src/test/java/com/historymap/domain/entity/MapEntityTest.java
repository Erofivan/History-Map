package com.historymap.domain.entity;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

class MapEntityTest {

    @Test
    void rename_withValidName_updatesName() {
        // Arrange
        MapEntity map = MapEntity.builder().name("Old Name").build();

        // Act
        map.rename("New Name");

        // Assert
        assertThat(map.getName()).isEqualTo("New Name");
    }

    @Test
    void rename_withBlankName_throwsException() {
        // Arrange
        MapEntity map = MapEntity.builder().name("Old Name").build();

        // Act & Assert
        assertThatThrownBy(() -> map.rename(""))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void createMap_addsMapToUserMaps() {
        // Arrange
        User user = User.builder()
                .id(1L)
                .username("user")
                .email("user@example.com")
                .build();

        // Act
        MapEntity map = user.createMap("My Map");

        // Assert
        assertThat(user.getMaps()).contains(map);
        assertThat(map.getName()).isEqualTo("My Map");
        assertThat(map.getOwner()).isEqualTo(user);
    }
}
