package com.algerac;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AlgeracPlatformApplication {
    
    public static void main(String[] args) {
        SpringApplication.run(AlgeracPlatformApplication.class, args);
    }
}