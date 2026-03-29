package com.historymap.application.dto;

import com.historymap.domain.entity.NodeType;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class NodeDto {
    private String id;
    private String name;
    private String description;
    private NodeType type;
    private String imageUrl;
    private String article;
    private List<String> tags;
    private Map<String, Object> attributes;
    private String mapId;
    private Double positionX;
    private Double positionY;
    private Double size;
    private Integer birthYear;
    private Integer deathYear;
    private Integer year;
    private String startDate;
    private String endDate;
}
