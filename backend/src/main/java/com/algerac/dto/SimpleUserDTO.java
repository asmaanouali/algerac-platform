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
    // Set during /oecregister inscription. Non-null/non-empty => OEC came through
    // the public registration flow (i.e. "Nouveau OEC"). Null/empty => pre-existing
    // OEC account (i.e. "OEC existant").
    private String typeDemande;
}
