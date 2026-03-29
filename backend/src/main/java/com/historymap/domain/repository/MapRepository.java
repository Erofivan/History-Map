package com.historymap.domain.repository;

import com.historymap.domain.entity.MapEntity;

import java.util.List;
import java.util.Optional;

public interface MapRepository {
    MapEntity save(MapEntity map);
    Optional<MapEntity> findById(Long id);
    List<MapEntity> findByOwnerId(Long ownerId);
    void deleteById(Long id);
    boolean existsByIdAndOwnerId(Long id, Long ownerId);
}
