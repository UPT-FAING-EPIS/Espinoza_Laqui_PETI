package com.strategicti.infrastructure.persistence;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@Profile("mysql")
public class DatabaseTextColumnInitializer implements ApplicationRunner {
    private final JdbcTemplate jdbcTemplate;

    public DatabaseTextColumnInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        jdbcTemplate.execute("ALTER TABLE plan_change_requests MODIFY COLUMN proposed_content_json LONGTEXT NOT NULL");
        jdbcTemplate.execute("ALTER TABLE plan_phase_versions MODIFY COLUMN content_json LONGTEXT NOT NULL");
        jdbcTemplate.execute("ALTER TABLE plan_change_entries MODIFY COLUMN previous_value LONGTEXT");
        jdbcTemplate.execute("ALTER TABLE plan_change_entries MODIFY COLUMN proposed_value LONGTEXT");
    }
}
