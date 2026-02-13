package com.algerac.repository;

import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.model.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);

    long countByUserTypeIgnoreCase(String userType);
    
    List<User> findByStatusOrderByCreatedAtDesc(UserStatus status);
    
    List<User> findByStatus(UserStatus status);
    
    List<User> findByRoleAndStatusOrderByCreatedAtDesc(UserRole role, UserStatus status);
    
    List<User> findByRole(UserRole role);
    
    List<User> findByRoleOrderByCreatedAtDesc(UserRole role);
}
