package com.algerac.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "app")
@Getter
@Setter
public class AppProperties {

    private EmailProperties notification = new EmailProperties();
    private EmailProperties dt = new EmailProperties();
    private GesCompetencesProperties ges = new GesCompetencesProperties();
    private EmailProperties dag = new EmailProperties();

    @Getter
    @Setter
    public static class EmailProperties {
        private String email;
    }

    @Getter
    @Setter
    public static class GesCompetencesProperties {
        private CompetencesEmail competences = new CompetencesEmail();
    }

    @Getter
    @Setter
    public static class CompetencesEmail {
        private String email;
    }
}
