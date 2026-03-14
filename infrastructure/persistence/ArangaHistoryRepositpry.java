package com.historymap.domain.repository;

import com.historymap.domain.model.HistoryEntity;
import com.historymap.domain.model.HistoryLink;
import com.arangodb.springframework.repository.ArangoRepository;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoryGraphRepository extends ArangoRepository<HistoryEntity, String> {
    // AQL запрос для получения количества связей узла
    @org.springframework.data.jdbc.repository.query.Query(
        "RETURN LENGTH(FOR v, e IN 1..1 ANY @id GRAPH 'historyGraph' RETURN e)"
    )
    long countConnections(@Param("id") String id);
}