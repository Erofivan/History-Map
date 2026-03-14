package com.historymap.infrastructure.persistence;

import com.arangodb.springframework.core.ArangoOperations;
import com.historymap.domain.model.HistoryEntity;
import com.historymap.domain.model.HistoryLink;
import com.historymap.domain.repository.HistoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Repository
@RequiredArgsConstructor
public class ArangoHistoryRepository implements HistoryRepository {

    private final ArangoOperations arango;

    @Override
    public HistoryEntity save(HistoryEntity entity) {
        return arango.save(entity);
    }

    @Override
    public Optional<HistoryEntity> findById(String id) {
        return arango.findById(id, HistoryEntity.class);
    }

    @Override
    public void deleteById(String id) {
        arango.delete(id, HistoryEntity.class);
    }

    @Override
    public HistoryLink addLink(String fromId, String toId, String description, boolean directed) {
        HistoryLink link = new HistoryLink();
        link.setFrom(arango.findById(fromId, HistoryEntity.class).get());
        link.setTo(arango.findById(toId, HistoryEntity.class).get());
        link.setDescription(description);
        link.setDirected(directed);
        return arango.save(link);
    }

    @Override
    public long countConnections(String entityId) {
        // AQL запрос: считаем входящие и исходящие ребра для узла
        String aql = "FOR v, e IN 1..1 ANY @id GRAPH 'historyGraph' RETURN e";
        return StreamSupport.stream(
            arango.query(aql, Collections.singletonMap("id", entityId), HistoryLink.class).spliterator(), 
            false
        ).count();
    }

    @Override
    public List<HistoryEntity> findByTag(String tag) {
        String aql = "FOR e IN entities FILTER @tag IN e.tags RETURN e";
        return StreamSupport.stream(
            arango.query(aql, Collections.singletonMap("tag", tag), HistoryEntity.class).spliterator(),
            false
        ).collect(Collectors.toList());
    }

    @Override
    public List<HistoryEntity> findAll() {
        return StreamSupport.stream(arango.findAll(HistoryEntity.class).spliterator(), false)
                .collect(Collectors.toList());
    }
}