package com.historymap.infrastructure.cache;

import com.historymap.domain.entity.HistoricalEdge;
import com.historymap.domain.entity.HistoricalNode;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

@Service
@RequiredArgsConstructor
public class GraphCacheService {

    private static final String NODE_KEY_PREFIX = "node:";
    private static final String MAP_NODES_KEY_PREFIX = "map:nodes:";
    private static final String MAP_EDGES_KEY_PREFIX = "map:edges:";
    private static final Duration CACHE_TTL = Duration.ofMinutes(30);

    private final RedisTemplate<String, Object> redisTemplate;

    public void cacheNode(HistoricalNode node) {
        redisTemplate.opsForValue().set(NODE_KEY_PREFIX + node.getId(), node, CACHE_TTL);
    }

    public HistoricalNode getNode(String nodeId) {
        return (HistoricalNode) redisTemplate.opsForValue().get(NODE_KEY_PREFIX + nodeId);
    }

    public void invalidateNode(String nodeId) {
        redisTemplate.delete(NODE_KEY_PREFIX + nodeId);
    }

    public void cacheMapNodes(String mapId, List<HistoricalNode> nodes) {
        redisTemplate.opsForValue().set(MAP_NODES_KEY_PREFIX + mapId, nodes, CACHE_TTL);
    }

    @SuppressWarnings("unchecked")
    public List<HistoricalNode> getMapNodes(String mapId) {
        return (List<HistoricalNode>) redisTemplate.opsForValue().get(MAP_NODES_KEY_PREFIX + mapId);
    }

    public void invalidateMap(String mapId) {
        redisTemplate.delete(MAP_NODES_KEY_PREFIX + mapId);
        redisTemplate.delete(MAP_EDGES_KEY_PREFIX + mapId);
    }

    public void cacheMapEdges(String mapId, List<HistoricalEdge> edges) {
        redisTemplate.opsForValue().set(MAP_EDGES_KEY_PREFIX + mapId, edges, CACHE_TTL);
    }

    @SuppressWarnings("unchecked")
    public List<HistoricalEdge> getMapEdges(String mapId) {
        return (List<HistoricalEdge>) redisTemplate.opsForValue().get(MAP_EDGES_KEY_PREFIX + mapId);
    }
}
