package com.historymap.infrastructure.persistence.arango;

import com.arangodb.springframework.core.ArangoOperations;
import com.historymap.domain.entity.HistoricalNode;
import com.historymap.domain.repository.NodeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class NodeRepositoryImpl implements NodeRepository {

    private final NodeArangoRepository arangoRepository;
    private final ArangoOperations arangoOperations;

    @Override
    public HistoricalNode save(HistoricalNode node) {
        return arangoRepository.save(node);
    }

    @Override
    public Optional<HistoricalNode> findById(String id) {
        return arangoRepository.findById(id);
    }

    @Override
    public List<HistoricalNode> findByMapId(String mapId) {
        return arangoRepository.findByMapId(mapId);
    }

    @Override
    public List<HistoricalNode> findByMapIdAndTag(String mapId, String tag) {
        String query = "FOR n IN nodes FILTER n.mapId == @mapId AND @tag IN n.tags RETURN n";
        var bindVars = new java.util.HashMap<String, Object>();
        bindVars.put("mapId", mapId);
        bindVars.put("tag", tag);
        var cursor = arangoOperations.query(query, bindVars, HistoricalNode.class);
        List<HistoricalNode> results = new ArrayList<>();
        cursor.forEach(results::add);
        return results;
    }

    @Override
    public void deleteById(String id) {
        arangoRepository.deleteById(id);
    }

    @Override
    public void deleteByMapId(String mapId) {
        arangoRepository.deleteByMapId(mapId);
    }
}
