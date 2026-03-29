package com.historymap.infrastructure.persistence.arango;

import com.historymap.domain.entity.HistoricalEdge;
import com.arangodb.springframework.repository.ArangoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EdgeArangoRepository extends ArangoRepository<HistoricalEdge, String> {
    List<HistoricalEdge> findByMapId(String mapId);
}
