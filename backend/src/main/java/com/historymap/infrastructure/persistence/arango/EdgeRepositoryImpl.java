package com.historymap.infrastructure.persistence.arango;

import com.arangodb.springframework.core.ArangoOperations;
import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.repository.EdgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class EdgeRepositoryImpl implements EdgeRepository {

    private final EdgeArangoRepository arangoRepository;
    private final ArangoOperations arangoOperations;

    @Override
    public HistoricalEdge save(HistoricalEdge edge) {
        return arangoRepository.save(edge);
    }

    @Override
    public Optional<HistoricalEdge> findById(String id) {
        return arangoRepository.findById(id);
    }

    @Override
    public List<HistoricalEdge> findByMapId(String mapId) {
        return arangoRepository.findByMapId(mapId);
    }

    @Override
    public List<HistoricalEdge> findByNodeId(String nodeId) {
        String query = "FOR e IN edges FILTER e._from == CONCAT('nodes/', @id) OR e._to == CONCAT('nodes/', @id) RETURN e";
        var bindVars = new java.util.HashMap<String, Object>();
        bindVars.put("id", nodeId);
        var cursor = arangoOperations.query(query, bindVars, HistoricalEdge.class);
        List<HistoricalEdge> results = new ArrayList<>();
        cursor.forEach(results::add);
        return results;
    }

    @Override
    public void deleteById(String id) {
        arangoRepository.deleteById(id);
    }

    @Override
    public void deleteByNodeId(String nodeId) {
        String query = "FOR e IN edges FILTER e._from == CONCAT('nodes/', @id) OR e._to == CONCAT('nodes/', @id) REMOVE e IN edges";
        var bindVars = new java.util.HashMap<String, Object>();
        bindVars.put("id", nodeId);
        arangoOperations.query(query, bindVars, Void.class);
    }

    @Override
    public void deleteByMapId(String mapId) {
        String query = "FOR e IN edges FILTER e.mapId == @mapId REMOVE e IN edges";
        var bindVars = new java.util.HashMap<String, Object>();
        bindVars.put("mapId", mapId);
        arangoOperations.query(query, bindVars, Void.class);
    }
}
