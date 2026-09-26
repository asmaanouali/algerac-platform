package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Short-lived challenge issued after password validation when 2FA is required;
 * a session is only created once the OTP carried in `token` (format "uuid:otp") is verified.
 */
@Entity
@Table(name = "login_two_factor_tokens")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginTwoFactorToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    public boolean isExpired() {
        return expiryDate.isBefore(LocalDateTime.now());
    }
}
