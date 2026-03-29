package com.historymap.infrastructure.config;

import com.arangodb.springframework.annotation.EnableArangoRepositories;
import com.arangodb.springframework.config.ArangoConfiguration;
import com.arangodb.ArangoDB;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableArangoRepositories(basePackages = "com.historymap.infrastructure.persistence.arango")
public class ArangoConfig implements ArangoConfiguration {

    @Value("${arangodb.host:localhost}")
    private String host;

    @Value("${arangodb.port:8529}")
    private int port;

    @Value("${arangodb.user:root}")
    private String user;

    @Value("${arangodb.password:historymap}")
    private String password;

    @Value("${arangodb.database:historymap}")
    private String database;

    @Override
    public ArangoDB.Builder arango() {
        return new ArangoDB.Builder()
                .host(host, port)
                .user(user)
                .password(password);
    }

    @Override
    public String database() {
        return database;
    }
}
