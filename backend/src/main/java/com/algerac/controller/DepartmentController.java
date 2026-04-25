package com.algerac.controller;

import com.algerac.dto.ApiResponse;
import com.algerac.model.Department;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.repository.DepartmentRepository;
import com.algerac.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments")
@RequiredArgsConstructor
public class DepartmentController {

    private final DepartmentRepository departmentRepository;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<List<Department>> list() {
        return ResponseEntity.ok(departmentRepository.findAllByActiveTrueOrderByNameAsc());
    }

    /**
     * List CDs belonging to a department — used by the DT when assigning a
     * validated accreditation request to the correct departmental CD.
     */
    @GetMapping("/{id}/cds")
    public ResponseEntity<?> listCdsByDepartment(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        }
        Department d = departmentRepository.findById(id).orElse(null);
        if (d == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> cds = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.CD || u.hasRole(UserRole.CD))
                .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(id))
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("fullName", u.getFullName());
                    m.put("email", u.getEmail());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(cds);
    }

    /**
     * List RAs belonging to a department. Used by CDs to see only their own team
     * and by RA assignment UIs.
     */
    @GetMapping("/{id}/ras")
    public ResponseEntity<?> listRasByDepartment(@PathVariable Long id, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        }
        Department d = departmentRepository.findById(id).orElse(null);
        if (d == null) return ResponseEntity.notFound().build();

        List<Map<String, Object>> ras = userRepository.findAll().stream()
                .filter(u -> u.getRole() == UserRole.RA || u.hasRole(UserRole.RA))
                .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(id))
                .map(u -> {
                    Map<String, Object> m = new java.util.LinkedHashMap<>();
                    m.put("id", u.getId());
                    m.put("fullName", u.getFullName());
                    m.put("email", u.getEmail());
                    return m;
                })
                .toList();
        return ResponseEntity.ok(ras);
    }

    /**
     * Admin-only: create a new department (future scalability requirement).
     */
    @PostMapping
    public ResponseEntity<?> create(@RequestBody Department body, HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(ApiResponse.error("Non authentifié"));
        User caller = userRepository.findById(userId).orElse(null);
        if (caller == null || caller.getRole() != UserRole.ADMIN) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ApiResponse.error("Réservé aux administrateurs"));
        }
        if (body.getCode() == null || body.getCode().isBlank() || body.getName() == null || body.getName().isBlank()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Code et nom requis"));
        }
        if (departmentRepository.existsByCode(body.getCode())) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Code déjà utilisé"));
        }
        body.setId(null);
        if (body.getActive() == null) body.setActive(true);
        return ResponseEntity.ok(departmentRepository.save(body));
    }
}
