package com.algerac.config;

import com.algerac.model.Department;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.DepartmentRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Assigns RA users to departments based on the domain number in their email.
 *
 * Matching rule:
 *   - Email contains ".d1." → department index 1 (1st by creation order)
 *   - Email contains ".d2." → department index 2
 *   - ...
 *   - Email contains ".d5." → department index 5
 *
 * Departments are ordered by their ID (ascending) — i.e. the order they
 * were inserted by DepartmentSeeder:
 *   1 → CERT_SM   (Certification SM)
 *   2 → METRO     (Métrologie)
 *   3 → INSPECTION
 *   4 → ESSAIS
 *   5 → BIOMEDICAL
 *
 * Idempotent: skips RAs that already have a department assigned.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(3) // after DepartmentSeeder (1) and CdDepartmentSeeder (2)
public class RaDepartmentSeeder implements CommandLineRunner {

    private static final Pattern DOMAIN_PATTERN = Pattern.compile("\\.d(\\d+)\\.", Pattern.CASE_INSENSITIVE);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Load departments sorted by ID to preserve insertion order
        List<Department> departments = departmentRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Department::getId))
                .toList();

        if (departments.isEmpty()) {
            log.warn("RaDepartmentSeeder: no departments found, skipping.");
            return;
        }

        List<User> ras = userRepository.findByRole(UserRole.RA);

        if (ras.isEmpty()) {
            log.debug("RaDepartmentSeeder: no RA users found, nothing to do.");
            return;
        }

        for (User ra : ras) {
            String email = ra.getEmail();
            if (email == null) continue;

            Matcher m = DOMAIN_PATTERN.matcher(email);
            if (!m.find()) {
                log.warn("RaDepartmentSeeder: cannot extract domain number from RA email '{}', skipping.", email);
                continue;
            }

            int domainNumber = Integer.parseInt(m.group(1));
            int index = domainNumber - 1; // convert 1-based to 0-based

            if (index < 0 || index >= departments.size()) {
                log.warn("RaDepartmentSeeder: domain number {} out of range for RA '{}', skipping.", domainNumber, email);
                continue;
            }

            Department dept = departments.get(index);
            ra.setDepartment(dept);
            userRepository.save(ra);
            log.info("RaDepartmentSeeder: RA {} → département {} ({})", email, dept.getName(), dept.getCode());
        }
    }
}
