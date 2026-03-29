package com.historymap.domain.entity;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Edge;
import com.arangodb.springframework.annotation.From;
import com.arangodb.springframework.annotation.To;
import lombok.*;
import org.springframework.data.annotation.Id;

@Edge("edges")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricalEdge {

    @Id
    private String id;

    @ArangoId
    private String arangoId;

    @From
    private HistoricalNode from;

    @To
    private HistoricalNode to;

    private String description;
    private EdgeDirection direction;
    private String mapId;
    private String ownerId;

    public void updateDescription(String description) {
        this.description = description;
    }

    public void updateDirection(EdgeDirection direction) {
        this.direction = direction;
    }
}
