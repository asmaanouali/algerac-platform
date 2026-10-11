package com.algerac.repository;

import com.algerac.model.LoginTwoFactorToken;
import com.algerac.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface LoginTwoFactorTokenRepository extends JpaRepository<LoginTwoFactorToken, Long> {
    Optional<LoginTwoFactorToken> findByToken(String token);
    void deleteByUser(User user);
}
