package com.historymap.application.dto;

import com.historymap.domain.entity.EdgeDirection;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class EdgeDto {
    private String id;
    private String fromNodeId;
    private String toNodeId;
    private String description;
    private EdgeDirection direction;
    private String mapId;
}
