package com.historymap.application;

import com.historymap.domain.model.HistoryEntity;
import com.historymap.domain.repository.HistoryGraphRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class GraphService {
    private final HistoryGraphRepository repository;

    public HistoryEntity saveEntity(HistoryEntity entity) {
        // При сохранении или обновлении связей пересчитываем размер
        // В реальном проекте это лучше делать через слушатели событий БД
        return repository.save(entity);
    }

    public HistoryEntity getEntityWithCalculatedSize(String id) {
        HistoryEntity entity = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Entity not found"));
        
        long connections = repository.countConnections(entity.getId());
        entity.calculateVisualSize(connections);
        return entity;
    }
}