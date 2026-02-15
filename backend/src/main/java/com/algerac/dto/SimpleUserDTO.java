package com.algerac.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SimpleUserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String organizationName;
}
