package com.algerac.config;

import com.algerac.model.*;
import com.algerac.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Seeds test accreditation requests on startup (after SQL seed-data.sql runs).
 * Only inserts if the requests don't already exist (idempotent).
 */
@Component
@Order(10) // Run after Spring SQL init
@RequiredArgsConstructor
@Slf4j
public class TestDataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final RequestRepository requestRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        log.info("TestDataSeeder: checking for test accreditation requests...");

        // Find OEC and RA users
        Optional<User> oecOpt = userRepository.findByEmail("lynakdr724@gmail.com");
        Optional<User> raOpt = userRepository.findByEmail("gr.asmaa98@gmail.com");

        if (oecOpt.isEmpty() || raOpt.isEmpty()) {
            log.warn("TestDataSeeder: OEC or RA user not found, skipping request seeding");
            return;
        }

        User oec = oecOpt.get();
        User ra = raOpt.get();

        // Seed request D-2026-001 (QUOTATION_VALIDATED - ready for team creation)
        if (!requestRepository.existsByReferenceNumber("D-2026-001")) {
            AccreditationRequest req1 = AccreditationRequest.builder()
                    .oec(oec)
                    .assignedToRa(ra)
                    .referenceNumber("D-2026-001")
                    .type(RequestType.INITIAL)
                    .domain("Laboratoire d'Essais - Matériaux de Construction")
                    .description("Demande d'accréditation initiale pour laboratoire de test de matériaux de construction selon norme ISO/IEC 17025")
                    .status(RequestStatus.QUOTATION_VALIDATED)
                    .progress(80)
                    .createdAt(LocalDateTime.now().minusDays(30))
                    .submissionDate(LocalDateTime.now().minusDays(30))
                    .assignmentDate(LocalDateTime.now().minusDays(25))
                    .currentPhase("CONSTITUTION_EQUIPE")
                    .currentStep("team_designation")
                    .nextAction("Constituer l'équipe d'évaluation")
                    .pendingWith("RA")
                    .build();
            requestRepository.save(req1);
            log.info("TestDataSeeder: created request D-2026-001 (QUOTATION_VALIDATED)");
        }

        // Seed request D-2026-002 (TEAM_DESIGNATION - team composition in progress)
        if (!requestRepository.existsByReferenceNumber("D-2026-002")) {
            AccreditationRequest req2 = AccreditationRequest.builder()
                    .oec(oec)
                    .assignedToRa(ra)
                    .referenceNumber("D-2026-002")
                    .type(RequestType.EXTENSION)
                    .domain("Organisme d'Inspection - Équipements sous Pression")
                    .description("Extension de portée pour inspection d'équipements sous pression conformément à la norme ISO/IEC 17020")
                    .status(RequestStatus.TEAM_DESIGNATION)
                    .progress(82)
                    .createdAt(LocalDateTime.now().minusDays(20))
                    .submissionDate(LocalDateTime.now().minusDays(20))
                    .assignmentDate(LocalDateTime.now().minusDays(18))
                    .currentPhase("CONSTITUTION_EQUIPE")
                    .currentStep("team_designation")
                    .nextAction("Constituer l'équipe d'évaluation")
                    .pendingWith("RA")
                    .build();
            requestRepository.save(req2);
            log.info("TestDataSeeder: created request D-2026-002 (TEAM_DESIGNATION)");
        }

        // Seed request D-2026-003 (RECEIVABLE - for earlier workflow stages)
        if (!requestRepository.existsByReferenceNumber("D-2026-003")) {
            AccreditationRequest req3 = AccreditationRequest.builder()
                    .oec(oec)
                    .assignedToRa(ra)
                    .referenceNumber("D-2026-003")
                    .type(RequestType.INITIAL)
                    .domain("Laboratoire d'Étalonnage - Métrologie")
                    .description("Demande d'accréditation initiale pour laboratoire d'étalonnage selon ISO/IEC 17025")
                    .status(RequestStatus.RECEIVABLE)
                    .progress(40)
                    .createdAt(LocalDateTime.now().minusDays(10))
                    .submissionDate(LocalDateTime.now().minusDays(10))
                    .assignmentDate(LocalDateTime.now().minusDays(8))
                    .currentPhase("RECEVABILITE")
                    .currentStep("feasibility_approved")
                    .nextAction("Préparer le devis")
                    .pendingWith("RA")
                    .build();
            requestRepository.save(req3);
            log.info("TestDataSeeder: created request D-2026-003 (RECEIVABLE)");
        }

        long total = requestRepository.count();
        log.info("TestDataSeeder: done. Total requests in DB: {}", total);
    }
}
