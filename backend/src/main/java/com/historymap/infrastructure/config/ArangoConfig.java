package com.historymap.infrastructure.config;

import com.arangodb.ArangoCollection;
import com.arangodb.springframework.annotation.EnableArangoRepositories;
import com.arangodb.springframework.config.ArangoConfiguration;
import com.arangodb.ArangoDB;
import com.arangodb.entity.CollectionType;
import com.arangodb.model.CollectionCreateOptions;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableArangoRepositories(basePackages = "com.historymap.infrastructure.persistence.arango")
public class ArangoConfig implements ArangoConfiguration {

    private static final Logger log = LoggerFactory.getLogger(ArangoConfig.class);

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

    @Bean
    public CommandLineRunner ensureArangoSchema() {
        return args -> {
            ArangoDB client = arango().build();
            try {
                if (!client.db(database).exists()) {
                    client.createDatabase(database);
                    log.info("Created ArangoDB database: {}", database);
                }

                ArangoCollection nodes = client.db(database).collection("nodes");
                if (!nodes.exists()) {
                    client.db(database).createCollection("nodes");
                    log.info("Created ArangoDB collection: nodes");
                }

                ArangoCollection edges = client.db(database).collection("edges");
                if (!edges.exists()) {
                    client.db(database).createCollection(
                            "edges",
                            new CollectionCreateOptions().type(CollectionType.EDGES)
                    );
                    log.info("Created ArangoDB collection: edges");
                }
            } finally {
                client.shutdown();
            }
        };
    }
}
