package com.algerac.config;

import com.algerac.model.Department;
import com.algerac.repository.DepartmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.List;

/**
 * Seeds the 5 canonical ALGERAC departments on startup if they don't exist.
 * New departments can still be added at runtime by admins — this seeder is
 * idempotent (findByCode before insert).
 */
//@Component // disabled: only the users table should be pre-populated on deploy
@RequiredArgsConstructor
@Slf4j
@Order(1) // run before other seeders that may reference departments
public class DepartmentSeeder implements CommandLineRunner {

    private final DepartmentRepository departmentRepository;

    private static final List<Department> CANONICAL = List.of(
            Department.builder().code("CERT_SM").name("Certification SM").description("Certification des systèmes de management").active(true).build(),
            Department.builder().code("METRO").name("Métrologie").description("Étalonnage et métrologie").active(true).build(),
            Department.builder().code("INSPECTION").name("Inspection").description("Organismes d'inspection").active(true).build(),
            Department.builder().code("ESSAIS").name("Essais").description("Laboratoires d'essais").active(true).build(),
            Department.builder().code("BIOMEDICAL").name("Biomédicale").description("Laboratoires de biologie médicale").active(true).build()
    );

    @Override
    public void run(String... args) {
        for (Department d : CANONICAL) {
            if (!departmentRepository.existsByCode(d.getCode())) {
                departmentRepository.save(d);
                log.info("Seeded department: {} ({})", d.getName(), d.getCode());
            }
        }
    }
}
