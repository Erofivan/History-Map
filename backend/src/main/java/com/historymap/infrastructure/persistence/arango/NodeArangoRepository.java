package com.historymap.infrastructure.persistence.arango;

import com.historymap.domain.entity.HistoricalNode;
import com.arangodb.springframework.repository.ArangoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NodeArangoRepository extends ArangoRepository<HistoricalNode, String> {
    List<HistoricalNode> findByMapId(String mapId);
    void deleteByMapId(String mapId);
}
