package com.historymap.application.dto;

import com.historymap.domain.entity.EdgeDirection;
import lombok.Data;

@Data
public class UpdateEdgeRequest {
    private String description;
    private EdgeDirection direction;
}
