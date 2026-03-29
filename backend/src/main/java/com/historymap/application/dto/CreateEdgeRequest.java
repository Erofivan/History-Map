package com.historymap.application.dto;

import com.historymap.domain.entity.EdgeDirection;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreateEdgeRequest {
    @NotBlank
    private String fromNodeId;
    @NotBlank
    private String toNodeId;
    private String description;
    private EdgeDirection direction;
}
