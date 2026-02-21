package com.algerac.config;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Truncates all tables except 'users' on every startup.
 * Keeps the dev database clean without losing user accounts.
 */
@Component
@Slf4j
public class DataInitializer implements ApplicationRunner {

    @PersistenceContext
    private EntityManager em;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("DataInitializer: truncating all tables except 'users'...");

        @SuppressWarnings("unchecked")
        List<String> tables = em.createNativeQuery(
            "SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename != 'users'"
        ).getResultList();

        if (tables.isEmpty()) {
            log.info("DataInitializer: no tables to truncate.");
            return;
        }

        String tableList = String.join(", ", tables);
        em.createNativeQuery("TRUNCATE TABLE " + tableList + " CASCADE").executeUpdate();

        log.info("DataInitializer: truncated {} tables: {}", tables.size(), tableList);
    }
}
