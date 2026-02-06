package com.algerac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ApiResponse {
    
    private boolean success;
    private String message;
    private Object data;
    private String error;
    private LocalDateTime timestamp;
    
    /**
     * Crée une réponse de succès
     */
    public static ApiResponse success(String message) {
        return ApiResponse.builder()
                .success(true)
                .message(message)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Crée une réponse de succès avec données
     */
    public static ApiResponse success(String message, Object data) {
        return ApiResponse.builder()
                .success(true)
                .message(message)
                .data(data)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Crée une réponse d'erreur
     */
    public static ApiResponse error(String error) {
        return ApiResponse.builder()
                .success(false)
                .error(error)
                .timestamp(LocalDateTime.now())
                .build();
    }
    
    /**
     * Crée une réponse d'erreur avec message
     */
    public static ApiResponse error(String message, String error) {
        return ApiResponse.builder()
                .success(false)
                .message(message)
                .error(error)
                .timestamp(LocalDateTime.now())
                .build();
    }
}