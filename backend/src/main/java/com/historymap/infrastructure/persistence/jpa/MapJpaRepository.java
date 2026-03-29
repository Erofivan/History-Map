package com.historymap.infrastructure.persistence.jpa;

import com.historymap.domain.entity.MapEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MapJpaRepository extends JpaRepository<MapEntity, Long> {
    List<MapEntity> findByOwnerId(Long ownerId);
    boolean existsByIdAndOwnerId(Long id, Long ownerId);
}
