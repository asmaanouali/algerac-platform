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

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Pairs existing CD users to departments one-to-one when CDs don't yet have a
 * department assigned. Runs once on startup after DepartmentSeeder.
 *
 * Matching strategy, in order:
 *   1. Name-based hint — if the CD's fullName/specialite/domaineExpertise
 *      contains the department name (e.g. "CD Métrologie"), use that department.
 *   2. Round-robin over departments that are still unassigned, sorted by CD id
 *      for a stable mapping.
 *
 * Idempotent: never overrides a CD who already has a department.
 */
@Component
@RequiredArgsConstructor
@Slf4j
@Order(2) // after DepartmentSeeder
public class CdDepartmentSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final DepartmentRepository departmentRepository;

    @Override
    @Transactional
    public void run(String... args) {
        List<Department> departments = departmentRepository.findAllByActiveTrueOrderByNameAsc();
        if (departments.isEmpty()) {
            log.warn("CdDepartmentSeeder: no active departments found, skipping.");
            return;
        }

        List<User> cds = userRepository.findByRole(UserRole.CD).stream()
                .filter(u -> u.getDepartment() == null)
                .sorted(Comparator.comparing(User::getId))
                .toList();
        if (cds.isEmpty()) {
            log.debug("CdDepartmentSeeder: every CD already has a department, nothing to do.");
            return;
        }

        // Track which departments still need a CD so round-robin doesn't reuse
        // one that was already claimed by name-based matching in this run.
        List<Department> pool = new ArrayList<>(departments);

        for (User cd : cds) {
            Department chosen = matchByHint(cd, pool);
            if (chosen == null) {
                if (pool.isEmpty()) {
                    log.info("CdDepartmentSeeder: no department left for CD {} (id={}). Leaving unset.",
                            cd.getFullName(), cd.getId());
                    continue;
                }
                chosen = pool.get(0);
            }
            pool.remove(chosen);
            cd.setDepartment(chosen);
            userRepository.save(cd);
            log.info("CdDepartmentSeeder: CD {} (id={}) → département {} ({})",
                    cd.getFullName(), cd.getId(), chosen.getName(), chosen.getCode());
        }
    }

    private Department matchByHint(User cd, List<Department> pool) {
        String haystack = String.join(" ",
                nullToEmpty(cd.getFullName()),
                nullToEmpty(cd.getSpecialite()),
                nullToEmpty(cd.getDomaineExpertise()),
                nullToEmpty(cd.getSousDomaineExpertise()),
                nullToEmpty(cd.getFonction())
        ).toLowerCase();
        if (haystack.isBlank()) return null;
        for (Department d : pool) {
            String name = d.getName() == null ? "" : d.getName().toLowerCase();
            String code = d.getCode() == null ? "" : d.getCode().toLowerCase();
            if (!name.isBlank() && haystack.contains(name)) return d;
            if (!code.isBlank() && haystack.contains(code)) return d;
            // Shortcuts for common French synonyms
            if ("cert_sm".equals(code) && (haystack.contains("certification") || haystack.contains("sm"))) return d;
            if ("metro".equals(code) && (haystack.contains("métrologie") || haystack.contains("metrologie"))) return d;
            if ("inspection".equals(code) && haystack.contains("inspection")) return d;
            if ("essais".equals(code) && haystack.contains("essais")) return d;
            if ("biomedical".equals(code) && (haystack.contains("biomédical") || haystack.contains("biomedical"))) return d;
        }
        return null;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }
}
