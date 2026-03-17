package com.algerac.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VisitReportDTO {
    @NotBlank(message = "Le contenu du rapport est requis")
    private String reportContent;

    private Integer estimatedDuration;
    private String obstaclesIdentified;
    private Boolean hasBlockingElements;
}
