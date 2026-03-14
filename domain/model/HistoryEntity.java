package com.historymap.domain.model;

import com.arangodb.springframework.annotation.Document;
import com.arangodb.springframework.annotation.ArangoId;
import org.springframework.data.annotation.Id;
import java.util.Map;
import java.util.HashMap;
import java.util.Set;

@Document("entities")
public class HistoryEntity {
    @Id
    private String id; // Внутренний ID Arango

    private String name;
    private String template; // Личность, Событие, Картина и т.д.
    
    // Динамические атрибуты (годы жизни, город, техника и т.д.)
    private Map<String, Object> attributes = new HashMap<>();
    
    private Set<String> tags;
    private String articleContent;

    // Расчетный визуальный вес для фронтенда
    private double visualSize;

    // Геттеры и сеттеры...
    
    public void calculateVisualSize(long connectionsCount) {
        // Формула из ТЗ: базовый_размер * (1 + log(количество_связей + 1))
        this.visualSize = 100 * (1 + Math.log(connectionsCount + 1));
    }
}