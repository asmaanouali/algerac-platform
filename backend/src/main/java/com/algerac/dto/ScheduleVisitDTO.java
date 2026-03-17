package com.algerac.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleVisitDTO {
    @NotNull(message = "La date de visite est requise")
    @Future(message = "La date de visite doit être dans le futur")
    private LocalDateTime visitDate;
}
