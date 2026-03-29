package com.historymap.domain.repository;

import com.historymap.domain.entity.HistoricalNode;

import java.util.List;
import java.util.Optional;

public interface NodeRepository {
    HistoricalNode save(HistoricalNode node);
    Optional<HistoricalNode> findById(String id);
    List<HistoricalNode> findByMapId(String mapId);
    List<HistoricalNode> findByMapIdAndTag(String mapId, String tag);
    void deleteById(String id);
    void deleteByMapId(String mapId);
}
