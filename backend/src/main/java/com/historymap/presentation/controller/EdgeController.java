package com.historymap.presentation.controller;

import com.historymap.application.dto.*;
import com.historymap.application.service.EdgeApplicationService;
import com.historymap.infrastructure.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maps/{mapId}/edges")
@RequiredArgsConstructor
public class EdgeController {

    private final EdgeApplicationService edgeApplicationService;
    private final JwtService jwtService;

    @PostMapping
    public ResponseEntity<EdgeDto> createEdge(@PathVariable String mapId,
                                              @Valid @RequestBody CreateEdgeRequest request,
                                              @RequestHeader("Authorization") String authHeader) {
        String ownerId = extractUserId(authHeader).toString();
        return ResponseEntity.ok(edgeApplicationService.createEdge(mapId, request, ownerId));
    }

    @GetMapping
    public ResponseEntity<List<EdgeDto>> getEdges(@PathVariable String mapId) {
        return ResponseEntity.ok(edgeApplicationService.getEdgesByMap(mapId));
    }

    @PutMapping("/{edgeId}")
    public ResponseEntity<EdgeDto> updateEdge(@PathVariable String mapId,
                                              @PathVariable String edgeId,
                                              @RequestBody UpdateEdgeRequest request,
                                              @RequestHeader("Authorization") String authHeader) {
        String ownerId = extractUserId(authHeader).toString();
        return ResponseEntity.ok(edgeApplicationService.updateEdge(edgeId, request, ownerId));
    }

    @DeleteMapping("/{edgeId}")
    public ResponseEntity<Void> deleteEdge(@PathVariable String mapId,
                                           @PathVariable String edgeId,
                                           @RequestHeader("Authorization") String authHeader) {
        String ownerId = extractUserId(authHeader).toString();
        edgeApplicationService.deleteEdge(edgeId, ownerId);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}
