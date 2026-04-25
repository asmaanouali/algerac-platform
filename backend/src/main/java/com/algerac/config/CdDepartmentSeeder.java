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
 * Assigns CD users to departments based on the domain number in their email.
 *
 * Matching rule (same convention as RaDepartmentSeeder):
 *   - Email contains "domaine1" → department index 1 (1st by ID = CERT_SM)
 *   - Email contains "domaine2" → department index 2 (METRO)
 *   - Email contains "domaine3" → department index 3 (INSPECTION)
 *   - Email contains "domaine4" → department index 4 (ESSAIS)
 *   - Email contains "domaine5" → department index 5 (BIOMEDICAL)
 *
 * Departments are ordered by ID (insertion order) — same as RaDepartmentSeeder —
 * so a CD with "domaineN" ends up in the same department as a RA with ".dN.".
 *
 * Runs on every startup and always applies the mapping so that any previously
 * wrong assignment is corrected automatically.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2) // after DepartmentSeeder
public class CdDepartmentSeeder implements CommandLineRunner {

    private static final Pattern DOMAIN_PATTERN = Pattern.compile("domaine(\\d+)", Pattern.CASE_INSENSITIVE);

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        // Sort departments by ID — same ordering used by RaDepartmentSeeder
        List<Department> departments = departmentRepository.findAll()
                .stream()
                .sorted(Comparator.comparing(Department::getId))
                .toList();

        if (departments.isEmpty()) {
            log.warn("CdDepartmentSeeder: no departments found, skipping.");
            return;
        }

        List<User> cds = userRepository.findByRole(UserRole.CD);
        if (cds.isEmpty()) {
            log.debug("CdDepartmentSeeder: no CD users found, nothing to do.");
            return;
        }

        for (User cd : cds) {
            String email = cd.getEmail();
            if (email == null) continue;

            Matcher m = DOMAIN_PATTERN.matcher(email);
            if (!m.find()) {
                log.warn("CdDepartmentSeeder: cannot extract domain number from CD email '{}', skipping.", email);
                continue;
            }

            int domainNumber = Integer.parseInt(m.group(1));
            int index = domainNumber - 1; // convert 1-based to 0-based

            if (index < 0 || index >= departments.size()) {
                log.warn("CdDepartmentSeeder: domain number {} out of range for CD '{}', skipping.", domainNumber, email);
                continue;
            }

            Department dept = departments.get(index);
            // Always apply — corrects previously wrong assignments
            cd.setDepartment(dept);
            userRepository.save(cd);
            log.info("CdDepartmentSeeder: CD {} → département {} ({})", email, dept.getName(), dept.getCode());
        }
    }
}
