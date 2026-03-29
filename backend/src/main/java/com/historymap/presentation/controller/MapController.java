package com.historymap.presentation.controller;

import com.historymap.application.dto.CreateMapRequest;
import com.historymap.application.dto.MapDto;
import com.historymap.application.service.MapApplicationService;
import com.historymap.infrastructure.security.JwtService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
public class MapController {

    private final MapApplicationService mapApplicationService;
    private final JwtService jwtService;

    @PostMapping
    public ResponseEntity<MapDto> createMap(@Valid @RequestBody CreateMapRequest request,
                                            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(mapApplicationService.createMap(request, userId));
    }

    @GetMapping
    public ResponseEntity<List<MapDto>> getUserMaps(@RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(mapApplicationService.getUserMaps(userId));
    }

    @GetMapping("/{mapId}")
    public ResponseEntity<MapDto> getMap(@PathVariable Long mapId,
                                         @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(mapApplicationService.getMap(mapId, userId));
    }

    @PutMapping("/{mapId}")
    public ResponseEntity<MapDto> renameMap(@PathVariable Long mapId,
                                            @RequestBody Map<String, String> body,
                                            @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        return ResponseEntity.ok(mapApplicationService.renameMap(mapId, body.get("name"), userId));
    }

    @DeleteMapping("/{mapId}")
    public ResponseEntity<Void> deleteMap(@PathVariable Long mapId,
                                          @RequestHeader("Authorization") String authHeader) {
        Long userId = extractUserId(authHeader);
        mapApplicationService.deleteMap(mapId, userId);
        return ResponseEntity.noContent().build();
    }

    private Long extractUserId(String authHeader) {
        String token = authHeader.substring(7);
        return jwtService.extractUserId(token);
    }
}
