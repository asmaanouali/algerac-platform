package com.algerac.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Value("${app.cors.allowed-origins:http://localhost:5173,http://localhost:3000}")
    private String[] allowedOrigins;
    
    /**
     * Note: This application uses custom cookie-based authentication (not Spring Security sessions).
     * Role-based access control is enforced at the service layer.
     * Spring Security is configured here only for CORS, CSRF, and HTTP headers.
     * TODO: Migrate to Spring Security authentication (JWT or session-based) for proper endpoint protection.
     */
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Disabled for REST API with cookie-based custom auth
            .cors(cors -> cors.configurationSource(request -> {
                var corsConfig = new org.springframework.web.cors.CorsConfiguration();
                for (String origin : allowedOrigins) {
                    corsConfig.addAllowedOrigin(origin.trim());
                }
                corsConfig.addAllowedMethod("*");
                corsConfig.addAllowedHeader("*");
                corsConfig.setAllowCredentials(true);
                corsConfig.setMaxAge(3600L);
                return corsConfig;
            }))
            .headers(headers -> headers
                .frameOptions(frame -> frame.deny())
                .contentTypeOptions(content -> {})
                .httpStrictTransportSecurity(hsts -> hsts.maxAgeInSeconds(31536000).includeSubDomains(true))
            )
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            .authorizeHttpRequests(auth -> auth
                .anyRequest().permitAll() // Auth enforced at service layer via custom session mechanism
            );
        
        return http.build();
    }
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
