package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Short-lived challenge issued after password validation when 2FA is required;
 * a session is only created once the OTP matching `otpHash` is verified.
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

    // Opaque random challenge handed to the client via an httpOnly cookie; looked up by exact match only.
    @Column(nullable = false, unique = true)
    private String token;

    // Keyed hash of the OTP (see AuthService#hashOtp) - the plaintext code is never persisted.
    @Column(nullable = false)
    private String otpHash;

    // Failed OTP guesses against this challenge; verifyLoginOtp() locks the challenge out past a threshold.
    @Column(nullable = false)
    private int attempts;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDateTime expiryDate;

    public boolean isExpired() {
        return expiryDate.isBefore(LocalDateTime.now());
    }
}
