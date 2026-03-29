package com.historymap.application.service;

import com.historymap.application.dto.CreateMapRequest;
import com.historymap.application.dto.MapDto;
import com.historymap.domain.entity.MapEntity;
import com.historymap.domain.entity.User;
import com.historymap.domain.repository.EdgeRepository;
import com.historymap.domain.repository.MapRepository;
import com.historymap.domain.repository.NodeRepository;
import com.historymap.domain.repository.UserRepository;
import com.historymap.infrastructure.cache.GraphCacheService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class MapApplicationService {

    private final MapRepository mapRepository;
    private final UserRepository userRepository;
    private final NodeRepository nodeRepository;
    private final EdgeRepository edgeRepository;
    private final GraphCacheService graphCacheService;

    @Transactional
    public MapDto createMap(CreateMapRequest request, Long ownerId) {
        User owner = userRepository.findById(ownerId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));

        MapEntity map = owner.createMap(request.getName());
        MapEntity saved = mapRepository.save(map);
        return toDto(saved);
    }

    public List<MapDto> getUserMaps(Long ownerId) {
        return mapRepository.findByOwnerId(ownerId).stream()
                .map(this::toDto)
                .toList();
    }

    public MapDto getMap(Long mapId, Long ownerId) {
        MapEntity map = mapRepository.findById(mapId)
                .orElseThrow(() -> new NoSuchElementException("Map not found"));
        if (!map.getOwner().getId().equals(ownerId)) {
            throw new SecurityException("Access denied");
        }
        return toDto(map);
    }

    @Transactional
    public MapDto renameMap(Long mapId, String newName, Long ownerId) {
        MapEntity map = mapRepository.findById(mapId)
                .orElseThrow(() -> new NoSuchElementException("Map not found"));
        if (!map.getOwner().getId().equals(ownerId)) {
            throw new SecurityException("Access denied");
        }
        map.rename(newName);
        return toDto(mapRepository.save(map));
    }

    @Transactional
    public void deleteMap(Long mapId, Long ownerId) {
        MapEntity map = mapRepository.findById(mapId)
                .orElseThrow(() -> new NoSuchElementException("Map not found"));
        if (!map.getOwner().getId().equals(ownerId)) {
            throw new SecurityException("Access denied");
        }
        String mapIdStr = mapId.toString();
        edgeRepository.deleteByMapId(mapIdStr);
        nodeRepository.deleteByMapId(mapIdStr);
        graphCacheService.invalidateMap(mapIdStr);
        mapRepository.deleteById(mapId);
    }

    private MapDto toDto(MapEntity map) {
        return MapDto.builder()
                .id(map.getId())
                .name(map.getName())
                .ownerId(map.getOwner().getId())
                .createdAt(map.getCreatedAt())
                .updatedAt(map.getUpdatedAt())
                .build();
    }
}
