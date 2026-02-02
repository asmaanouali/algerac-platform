package com.algerac.dto;

import com.algerac.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String email;
    private String fullName;
    private String role; // lowercase: "oec", "ra", "admin", "expert"
    private String organizationName;
    private String phone;
    private LocalDateTime createdAt;
    
    public static UserDTO fromUser(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole().name().toLowerCase())
                .organizationName(user.getOrganizationName())
                .phone(user.getPhone())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
