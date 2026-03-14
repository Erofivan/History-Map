package com.historymap.infrastructure.web;

import com.historymap.application.GraphService;
import com.historymap.domain.model.HistoryEntity;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/graph")
@RequiredArgsConstructor
public class GraphController {
    private final GraphService graphService;

    @PostMapping("/entities")
    public HistoryEntity createEntity(@RequestBody HistoryEntity entity) {
        return graphService.saveEntity(entity);
    }

    @PatchMapping("/entities/{id}/attributes")
    public HistoryEntity updateAttributes(
            @PathVariable String id, 
            @RequestBody Map<String, Object> newAttributes) {
        
        HistoryEntity entity = graphService.getEntityWithCalculatedSize(id);
        entity.getAttributes().putAll(newAttributes);
        return graphService.saveEntity(entity);
    }

    @GetMapping("/entities/{id}")
    public HistoryEntity getEntity(@PathVariable String id) {
        return graphService.getEntityWithCalculatedSize(id);
    }
}