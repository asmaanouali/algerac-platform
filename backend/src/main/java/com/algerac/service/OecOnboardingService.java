package com.algerac.service;

import com.algerac.model.AccreditationRequest;
import com.algerac.model.RequestStatus;
import com.algerac.model.User;
import com.algerac.model.UserRole;
import com.algerac.model.UserStatus;
import com.algerac.repository.RequestRepository;
import com.algerac.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Inscription OEC en deux temps : l'OEC envoie les étapes 1 à 3 du DOC 1, l'admin crée son compte,
 * puis l'OEC dispose de {@value #DOSSIER_DEADLINE_DAYS} jours pour compléter le reste du formulaire,
 * faute de quoi son compte est suspendu.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class OecOnboardingService {

    public static final int DOSSIER_DEADLINE_DAYS = 15;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final String PASSWORD_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!";
    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final RequestRepository requestRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final NotificationService notificationService;

    /**
     * Crée le compte d'un OEC inscrit (PENDING → APPROVED), génère son mot de passe et lui envoie ses
     * identifiants. Pour une inscription en deux temps, démarre le délai de complétion du dossier.
     */
    @Transactional
    public User activateAccount(User oec) {
        if (oec.getRole() != UserRole.OEC) {
            throw new IllegalArgumentException("Cet utilisateur n'est pas un OEC");
        }
        if (oec.getStatus() != UserStatus.PENDING) {
            throw new IllegalStateException("Ce compte est déjà actif ou a été rejeté");
        }

        List<AccreditationRequest> awaiting = requestRepository.findByOec_Id(oec.getId()).stream()
                .filter(r -> r.getStatus() == RequestStatus.PENDING_ACCOUNT_CREATION)
                .toList();

        String rawPassword = generateSecurePassword();
        oec.setPassword(passwordEncoder.encode(rawPassword));
        oec.setStatus(UserStatus.APPROVED);

        LocalDateTime deadline = null;
        if (!awaiting.isEmpty()) {
            deadline = LocalDateTime.now().plusDays(DOSSIER_DEADLINE_DAYS);
            oec.setDossierDeadline(deadline);
            oec.setDossierCompletedAt(null);
            for (AccreditationRequest request : awaiting) {
                markAwaitingCompletion(request, deadline);
            }
        }
        userRepository.save(oec);

        try {
            emailService.sendOECAccountCredentials(oec, rawPassword, deadline);
        } catch (Exception e) {
            log.warn("Envoi email de bienvenue OEC {} échoué : {}", oec.getEmail(), e.getMessage());
        }
        return oec;
    }

    /** Réactive un compte OEC suspendu pour dossier incomplet et relance un délai complet. */
    @Transactional
    public User reactivateSuspendedAccount(User oec) {
        if (oec.getRole() != UserRole.OEC || oec.getStatus() != UserStatus.SUSPENDED || oec.getDossierDeadline() == null) {
            throw new IllegalStateException("Ce compte n'est pas un compte OEC suspendu pour dossier incomplet");
        }
        LocalDateTime deadline = LocalDateTime.now().plusDays(DOSSIER_DEADLINE_DAYS);
        oec.setStatus(UserStatus.APPROVED);
        oec.setDossierDeadline(deadline);
        oec.setDossierCompletedAt(null);
        userRepository.save(oec);

        requestRepository.findByOec_Id(oec.getId()).stream()
                .filter(r -> r.getStatus() == RequestStatus.PENDING_DOSSIER_COMPLETION)
                .forEach(r -> markAwaitingCompletion(r, deadline));

        try {
            emailService.sendOECAccountReactivated(oec, deadline);
        } catch (Exception e) {
            log.warn("Envoi email de réactivation OEC {} échoué : {}", oec.getEmail(), e.getMessage());
        }
        return oec;
    }

    /** Suspend le compte si le délai de complétion est dépassé. Retourne true si le compte a été suspendu. */
    @Transactional
    public boolean suspendIfDossierOverdue(User user) {
        if (user.getStatus() != UserStatus.APPROVED || !user.isDossierOverdue()) {
            return false;
        }
        suspend(user);
        return true;
    }

    @Scheduled(cron = "0 0 * * * *") // toutes les heures
    @Transactional
    public void suspendOverdueAccounts() {
        List<User> overdue = userRepository.findByRoleAndStatusAndDossierCompletedAtIsNullAndDossierDeadlineBefore(
                UserRole.OEC, UserStatus.APPROVED, LocalDateTime.now());
        for (User user : overdue) {
            suspend(user);
        }
    }

    private void suspend(User user) {
        user.setStatus(UserStatus.SUSPENDED);
        userRepository.save(user);

        requestRepository.findByOec_Id(user.getId()).stream()
                .filter(r -> r.getStatus() == RequestStatus.PENDING_DOSSIER_COMPLETION)
                .forEach(r -> {
                    r.setCurrentStep("Compte suspendu - délai de complétion du dossier dépassé");
                    r.setNextAction("Contactez ALGERAC pour réactiver votre compte.");
                    requestRepository.save(r);
                });

        log.warn("Compte OEC {} suspendu : dossier non complété avant le {}", user.getEmail(), user.getDossierDeadline());
        try {
            emailService.sendOECAccountSuspended(user);
        } catch (Exception e) {
            log.warn("Envoi email de suspension OEC {} échoué : {}", user.getEmail(), e.getMessage());
        }
        notifyAdminsOfSuspension(user);
    }

    private void notifyAdminsOfSuspension(User oec) {
        for (User admin : userRepository.findByRole(UserRole.ADMIN)) {
            notificationService.createNotification(
                    admin.getId(),
                    "Compte OEC suspendu",
                    "Le compte de " + oec.getOrganizationName() + " (" + oec.getEmail()
                            + ") a été suspendu : dossier non complété dans le délai de " + DOSSIER_DEADLINE_DAYS + " jours.",
                    "warning",
                    "/users");
        }
    }

    private void markAwaitingCompletion(AccreditationRequest request, LocalDateTime deadline) {
        request.setStatus(RequestStatus.PENDING_DOSSIER_COMPLETION);
        request.setCurrentStep("Compte créé - dossier à compléter");
        request.setNextAction("Complétez votre dossier (étapes 4 à 10) avant le " + deadline.format(DATE_FMT)
                + ", sinon votre compte sera suspendu.");
        request.setPendingWith("OEC");
        requestRepository.save(request);
    }

    private static String generateSecurePassword() {
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
        return sb.toString();
    }
}
