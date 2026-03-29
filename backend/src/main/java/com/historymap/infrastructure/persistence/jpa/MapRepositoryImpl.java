package com.historymap.infrastructure.persistence.jpa;

import com.historymap.domain.entity.MapEntity;
import com.historymap.domain.repository.MapRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class MapRepositoryImpl implements MapRepository {

    private final MapJpaRepository jpaRepository;

    @Override
    public MapEntity save(MapEntity map) {
        return jpaRepository.save(map);
    }

    @Override
    public Optional<MapEntity> findById(Long id) {
        return jpaRepository.findById(id);
    }

    @Override
    public List<MapEntity> findByOwnerId(Long ownerId) {
        return jpaRepository.findByOwnerId(ownerId);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsByIdAndOwnerId(Long id, Long ownerId) {
        return jpaRepository.existsByIdAndOwnerId(id, ownerId);
    }
}
