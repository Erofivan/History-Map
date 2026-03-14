package com.historymap.domain.model;

import com.arangodb.springframework.annotation.Edge;
import com.arangodb.springframework.annotation.From;
import com.arangodb.springframework.annotation.To;
import org.springframework.data.annotation.Id;

@Edge("links")
public class HistoryLink {
    @Id
    private String id;

    @From
    private HistoryEntity from;

    @To
    private HistoryEntity to;

    private String description;
    private boolean directed; // true - односторонняя (стрелка), false - двусторонняя

    // Геттеры и сеттеры...
}