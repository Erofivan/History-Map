package com.historymap.domain.repository;

import com.historymap.domain.entity.HistoricalEdge;

import java.util.List;
import java.util.Optional;

public interface EdgeRepository {
    HistoricalEdge save(HistoricalEdge edge);
    Optional<HistoricalEdge> findById(String id);
    List<HistoricalEdge> findByMapId(String mapId);
    List<HistoricalEdge> findByNodeId(String nodeId);
    void deleteById(String id);
    void deleteByNodeId(String nodeId);
    void deleteByMapId(String mapId);
}
