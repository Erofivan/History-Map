package com.historymap;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class HistoryMapApplication {
    public static void main(String[] args) {
        SpringApplication.run(HistoryMapApplication.class, args);
    }
}
