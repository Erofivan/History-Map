package com.historymap.presentation.controller;

import com.historymap.application.dto.*;
import com.historymap.application.service.NodeApplicationService;
import com.historymap.infrastructure.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/maps/{mapId}/nodes")
@RequiredArgsConstructor
public class NodeController {

    private final NodeApplicationService nodeApplicationService;
    private final JwtService jwtService;

    @GetMapping
    public ResponseEntity<GraphDto> getGraph(@PathVariable String mapId) {
        return ResponseEntity.ok(nodeApplicationService.getGraph(mapId));
    }

    @PostMapping
    public ResponseEntity<NodeDto> createNode(@PathVariable String mapId,
                                              @Valid @RequestBody CreateNodeRequest request,
                                              @RequestHeader("Authorization") String authHeader) {
        String ownerId = extractUserId(authHeader).toString();
        return ResponseEntity.ok(nodeApplicationService.createNode(mapId, request, ownerId));
    }

    @GetMapping("/{nodeId}")
    public ResponseEntity<NodeDto> getNode(@PathVariable String mapId,
                                           @PathVariable String nodeId) {
        return ResponseEntity.ok(nodeApplicationService.getNode(nodeId));
    }

    @PutMapping("/{nodeId}")
    public ResponseEntity<NodeDto> updateNode(@PathVariable String mapId,
                                              @PathVariable String nodeId,
                                              @RequestBody UpdateNodeRequest request,
                                              @RequestHeader("Authorization") String authHeader) {
        String ownerId = extractUserId(authHeader).toString();
        return ResponseEntity.ok(nodeApplicationService.updateNode(nodeId, request, ownerId));
    }

    @PatchMapping("/{nodeId}/position")
    public ResponseEntity<NodeDto> updateNodePosition(@PathVariable String mapId,
                                                      @PathVariable String nodeId,
                                                      @RequestBody UpdateNodePositionRequest request,
                                                      @RequestHeader("Authorization") String authHeader) {
        String ownerId = extractUserId(authHeader).toString();
        return ResponseEntity.ok(nodeApplicationService.updateNodePosition(nodeId, request, ownerId));
    }

    @DeleteMapping("/{nodeId}")
    public ResponseEntity<Void> deleteNode(@PathVariable String mapId,
                                           @PathVariable String nodeId,
                                           @RequestHeader("Authorization") String authHeader) {
        String ownerId = extractUserId(authHeader).toString();
        nodeApplicationService.deleteNode(nodeId, ownerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/by-tag/{tag}")
    public ResponseEntity<List<NodeDto>> getNodesByTag(@PathVariable String mapId,
                                                       @PathVariable String tag) {
        return ResponseEntity.ok(nodeApplicationService.getNodesByTag(mapId, tag));
    }

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}
