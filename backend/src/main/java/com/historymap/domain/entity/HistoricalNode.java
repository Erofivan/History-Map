package com.historymap.domain.entity;

import com.arangodb.springframework.annotation.ArangoId;
import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.PersistentIndex;
import lombok.*;
import org.springframework.data.annotation.Id;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Document("nodes")
@PersistentIndex(fields = {"mapId"})
@PersistentIndex(fields = {"ownerId"})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HistoricalNode {

    @Id
    private String id;

    @ArangoId
    private String arangoId;

    private String name;
    private String description;
    private NodeType type;
    private String imageUrl;
    private String article;

    @Builder.Default
    private List<String> tags = new ArrayList<>();

    @Builder.Default
    private Map<String, Object> attributes = new HashMap<>();

    private String mapId;
    private String ownerId;

    private Double positionX;
    private Double positionY;

    private Integer birthYear;
    private Integer deathYear;
    private Integer year;
    private String startDate;
    private String endDate;

    public void updatePosition(double x, double y) {
        this.positionX = x;
        this.positionY = y;
    }

    public void addTag(String tag) {
        if (tag != null && !tag.isBlank() && !this.tags.contains(tag)) {
            this.tags.add(tag);
        }
    }

    public void removeTag(String tag) {
        this.tags.remove(tag);
    }

    public void setAttribute(String key, Object value) {
        this.attributes.put(key, value);
    }

    public void removeAttribute(String key) {
        this.attributes.remove(key);
    }

    public void update(String name, String description, NodeType type, String imageUrl, String article,
                       List<String> tags, Map<String, Object> attributes,
                       Integer birthYear, Integer deathYear, Integer year,
                       String startDate, String endDate) {
        if (name != null && !name.isBlank()) {
            this.name = name;
        }
        this.description = description;
        this.type = type;
        this.imageUrl = imageUrl;
        this.article = article;
        if (tags != null) {
            this.tags = tags;
        }
        if (attributes != null) {
            this.attributes = attributes;
        }
        this.birthYear = birthYear;
        this.deathYear = deathYear;
        this.year = year;
        this.startDate = startDate;
        this.endDate = endDate;
    }
}
