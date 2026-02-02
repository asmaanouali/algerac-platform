package com.algerac.dto;

import com.algerac.model.AccreditationRequest;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccreditationRequestDTO {
    private Long id;
    private String referenceNumber;
    private Long oecId;
    private String type; // lowercase
    private String domain;
    private String status; // lowercase
    private Integer progress;
    private LocalDateTime submissionDate;
    private LocalDateTime nextActionDate;
    private LocalDateTime createdAt;
    
    public static AccreditationRequestDTO fromRequest(AccreditationRequest request) {
        return AccreditationRequestDTO.builder()
                .id(request.getId())
                .referenceNumber(request.getReferenceNumber())
                .oecId(request.getOecId())
                .type(request.getType().name().toLowerCase())
                .domain(request.getDomain())
                .status(request.getStatus().name().toLowerCase())
                .progress(request.getProgress())
                .submissionDate(request.getSubmissionDate())
                .nextActionDate(request.getNextActionDate())
                .createdAt(request.getCreatedAt())
                .build();
    }
}
