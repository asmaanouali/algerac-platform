package com.algerac.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Opaque random selector handed to the client via an httpOnly cookie; looked up by exact match only.
    @Column(nullable = false, unique = true)
    private String token;

    // Keyed hash of the OTP (see AuthService#hashOtp) - the plaintext code is never persisted.
    @Column(nullable = false)
    private String otpHash;

    // Set once verifyOtp() succeeds; resetPassword() refuses to run until this is true.
    @Column(nullable = false)
    private boolean verified;

    // Failed OTP guesses against this token; verifyOtp() locks the token out past a threshold.
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
