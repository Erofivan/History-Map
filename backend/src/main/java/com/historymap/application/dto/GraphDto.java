package com.historymap.application.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class GraphDto {
    private List<NodeDto> nodes;
    private List<EdgeDto> edges;
}
