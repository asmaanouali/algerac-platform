# Mise à Jour du Workflow d'Accréditation ALGERAC

## 📋 Résumé des Changements

Cette mise à jour implémente le workflow complet d'accréditation selon le processus PRO 12, incluant toutes les phases depuis la recevabilité jusqu'à la surveillance périodique.

---

## 🔄 Modifications Principales

### 1. Système de Recevabilité Amélioré

**Changement clé**: Lorsque le RA décide qu'une demande est NON RECEVABLE, l'OEC reçoit maintenant une notification dans l'application et peut corriger et resoumettre sa demande.

#### Backend (Java)
- ✅ `AccreditationRequest` : Ajout de champs pour suivre les corrections
  - `isReceivable`: Boolean  
  - `receivabilityCorrectionNeeded`: String (détails des corrections)
  - `correctionDeadline`: LocalDateTime (30 jours par défaut)
  - `correctionSubmittedDate`: LocalDateTime
  - `receivabilityAttempts`: Integer

- ✅ `RequestService` : Nouvelles méthodes
  - `makeReceivabilityDecision()` : Mise à jour pour permettre les corrections
  - `submitReceivabilityCorrections()` : OEC soumet les corrections

- ✅ `NotificationService` : Nouvelle notification
  - `notifyRANewCorrections()` : Notifie le RA quand l'OEC soumet des corrections

#### Frontend (TypeScript)
- ✅ `MyRequestsPage.tsx` : Interface OEC complètement mise à jour
  - Affichage de tous les nouveaux statuts (70+ statuts supportés)
  - Bouton "Corriger et resoumettre" pour demandes non recevables
  - Alertes contextuelles selon l'état de la demande
  - Affichage du workflow (phase, étape, prochaine action)

---

## 🆕 Nouvelles Entités Backend

### Visite Préliminaire
- `PreliminaryVisit` : Gère la visite préliminaire optionnelle
- `PreliminaryVisitService` : Logique métier complète
  - Proposer la visite
  - OEC accepte/refuse
  - Programmer la visite
  - Soumettre le rapport (FOR 12)
  - Gérer les obstacles bloquants

### Équipe d'Évaluation
- `EvaluationTeam` : Équipe d'évaluateurs
- `TeamMember` : Membres individuels (REE, ET, EXP, EQ, etc.)
- `TeamRole` : Enum pour les rôles (REE, ET, EXP, EQ, SUP, OBS, EF)
- `TeamStatus` : Statuts (DRAFT, SENT_TO_OEC, RECUSED, VALIDATED)
- `RecusationDecision` : Gestion des récusations
- `EvaluationTeamService` : Logique complète
  - Créer l'équipe
  - Ajouter des membres
  - Signer engagements (FOR 01-1)
  - Envoyer à l'OEC pour validation
  - Gérer les récusations (PRO 22)

### Revue Documentaire
- `DocumentaryReview` : Revue documentaire (FOR 56)
- `DocumentaryReviewStatus` : Statuts de la revue
- États: PENDING, IN_PROGRESS, DEFICIENCIES_FOUND, AWAITING_OEC_RESPONSE, etc.

### Plan d'Évaluation
- `EvaluationPlan` : Plan d'évaluation (FOR 32)
- `EvaluationPlanStatus` : DRAFT, SUBMITTED_TO_CD, VALIDATED, etc.

### Gestion des Écarts
- `Gap` : Représente un écart (FOR 02)
  - Type: CRITIQUE ou NON_CRITIQUE
  - Règles de requalification automatique
- `GapType` : CRITIQUE, NON_CRITIQUE
- `GapStatus` : IDENTIFIED, PLAN_SUBMITTED, PLAN_ACCEPTED, RESOLVED, etc.
- `ActionPlan` : Plan d'action pour chaque écart
- `ActionPlanStatus` : PENDING, SUBMITTED, ACCEPTED, REJECTED, VERIFIED, etc.
- `GapManagementService` : Logique complète
  - Créer écarts
  - Vérifier règles de requalification
  - OEC soumet plans d'actions (délai 10 jours)
  - Équipe évalue les plans (délai 5 jours)
  - OEC fournit preuves de mise en œuvre
  - Équipe vérifie les preuves
  - Détection automatique besoin évaluation complémentaire

### Rapport d'Évaluation
- `EvaluationReport` : Rapport complet (FOR 08, FOR 09, FOR 09-1, FOR 10)
- `ReportType` : FOR_08_INSPECTION, FOR_09_LABORATORY, etc.
- `EvaluationReportStatus` : DRAFT, SUBMITTED_TO_CD, VALIDATED, etc.
- `EvaluationReportService` : Logique complète
  - REE rédige le rapport (délai 30 jours)
  - CD/DT valide le rapport (délai 15 jours)
  - Gestion des corrections
  - FOR 23 (Appréciation)

### Décision CAS
- `CASDecision` : Décision du Comité d'Accréditation et de Surveillance
- `CASDecisionType` : 
  - GRANT_FULL, GRANT_REDUCED, GRANT_WITH_RESERVES
  - REFUSAL, POSTPONEMENT, REPORT_DECISION
  - MAINTAIN, SUSPENSION, WITHDRAWAL, SCOPE_REDUCTION
- `CASDecisionService` : Logique complète
  - Programmer la réunion CAS
  - Enregistrer la décision
  - Générer les notifications appropriées

### Certificat d'Accréditation
- `AccreditationCertificate` : Certificat d'accréditation
  - Numéro unique
  - Dates d'émission et expiration (+4 ans)
  - Portée détaillée, domaines techniques
  - Signatures DG et DT
  - Publication sur site web

### Surveillance Périodique
- `SurveillancePlan` : Plan de surveillance (FOR 66)
  - Calendrier des évaluations (annuel)
  - Échantillonnage de la portée
  - Prochaine date de surveillance

---

## 📊 Nouveaux Statuts de Demande (RequestStatus)

Le système supporte maintenant **70+ statuts** couvrant toutes les phases:

### Phase Initiale
- DRAFT, SUBMITTED, PENDING_PAYMENT, PAYMENT_COMPLETED, ASSIGNED_TO_RA

### Phase Recevabilité
- RECEIVABILITY_STUDY, RECEIVABLE, NOT_RECEIVABLE
- RECEIVABILITY_CORRECTION, RECEIVABILITY_RESUBMITTED

### Visite Préliminaire (Optionnel)
- PRELIMINARY_VISIT_PROPOSED, PRELIMINARY_VISIT_ACCEPTED
- PRELIMINARY_VISIT_DECLINED, PRELIMINARY_VISIT_SCHEDULED
- PRELIMINARY_VISIT_COMPLETED, PROCESS_SUSPENDED_OBSTACLES

### Contractualisation (ÉTAPE 3)
- QUOTATION_PREPARATION, QUOTATION_SENT_TO_DAG, QUOTATION_APPROVED_BY_DAG
- QUOTATION_SENT_TO_DEPT, QUOTATION_RECEIVED_FROM_DEPT
- QUOTATION_SENT_TO_OEC, QUOTATION_VALIDATED, QUOTATION_EXPIRED

### Constitution Équipe (ÉTAPE 4)
- TEAM_DESIGNATION, TEAM_SENT_TO_OEC, TEAM_RECUSED, TEAM_VALIDATED

### Revue Documentaire (ÉTAPE 5)
- DOCUMENTARY_REVIEW, DOCUMENTARY_REVIEW_DEFICIENCIES
- AWAITING_OEC_DOC_RESPONSE, DOCUMENTARY_REVIEW_COMPLETED

### Préparation Évaluation (ÉTAPE 6)
- EVALUATION_PLAN_PREPARATION, EVALUATION_PLAN_VALIDATION, EVALUATION_PLANNED

### Évaluation sur Site (ÉTAPE 7 - hors système)
- EVALUATION_IN_PROGRESS, EVALUATION_COMPLETED

### Traitement Écarts (ÉTAPE 8)
- AWAITING_ACTION_PLANS, ACTION_PLANS_EVALUATION
- ACTION_PLANS_IMPLEMENTATION, COMPLEMENTARY_EVALUATION_NEEDED
- COMPLEMENTARY_EVALUATION_PLANNED, GAPS_RESOLVED

### Rapport et Décision CAS (ÉTAPES 9-12)
- REPORT_DRAFTING, REPORT_VALIDATION, REPORT_VALIDATED
- CAS_PREPARATION, CAS_SCHEDULED
- CAS_DECISION_GRANT, CAS_DECISION_REFUSAL, CAS_DECISION_POSTPONEMENT
- CERTIFICATE_PREPARATION, CERTIFICATE_ISSUED

### Statuts Finaux
- ACTIVE, SUSPENDED, WITHDRAWN, CLOSED

### Surveillance (PHASE IV)
- SURVEILLANCE_SCHEDULED, SURVEILLANCE_IN_PROGRESS, SURVEILLANCE_COMPLETED

---

## 🔔 Système de Notifications Enrichi

Plus de **35 nouveaux types de notifications** couvrant :

### Visite Préliminaire
- `notifyOECPreliminaryVisitProposed`
- `notifyCDPreliminaryVisitResponse`
- `notifyOECPreliminaryVisitScheduled`
- `notifyOECPreliminaryVisitReport`
- `notifyCDObstaclesLifted`

### Équipe d'Évaluation
- `notifyExpertTeamDesignation`
- `notifyCDAgreementSigned`
- `notifyOECTeamComposition`
- `notifyCDTeamResponse`
- `notifyOECRecusationDecision`

### Écarts et Plans d'Actions
- `notifyOECActionPlansRequired`
- `notifyTeamActionPlanSubmitted`
- `notifyOECActionPlanAccepted`
- `notifyOECActionPlanRejected`
- `notifyTeamEvidenceSubmitted`
- `notifyOECEvidenceInsufficient`
- `notifyCDComplementaryEvalDecision`

### Rapport et CAS
- `notifyCDReportSubmitted`
- `notifyREECorrectionsNeeded`
- `notifyCDReportCorrected`
- `notifyCASMembersScheduled`

### Décisions CAS
- `notifyOECAccreditationGranted`
- `notifyOECAccreditationRefused`
- `notifyOECAccreditationPostponed`
- `notifyOECAccreditationMaintained`
- `notifyOECAccreditationSuspended`
- `notifyOECAccreditationWithdrawn`
- `notifyOECScopeReduced`
- `notifyOECCertificateIssued`

---

## 📦 Repositories Créés

Tous les repositories JPA nécessaires ont été créés:
- `PreliminaryVisitRepository`
- `EvaluationTeamRepository`
- `TeamMemberRepository`
- `DocumentaryReviewRepository`
- `EvaluationPlanRepository`
- `GapRepository` (avec méthodes de comptage pour règles de requalification)
- `ActionPlanRepository`
- `EvaluationReportRepository`
- `CASDecisionRepository`
- `AccreditationCertificateRepository`
- `SurveillancePlanRepository`

---

## 🎨 Améliorations Frontend

### Page "Mes Demandes" (OEC)
✅ Support complet de tous les nouveaux statuts
✅ Affichage des informations de workflow:
- Phase actuelle
- Étape courante
- Prochaine action
- En attente de qui (OEC, RA, CD, etc.)

✅ Alertes contextuelles selon l'état
✅ Boutons d'action dynamiques:
- Corriger et resoumettre (NOT_RECEIVABLE)
- Accepter/Refuser visite préliminaire
- Valider devis et convention
- Valider l'équipe d'évaluation
- Répondre aux manquements documentaires
- Soumettre plans d'actions
- Notifier levée d'obstacles

### Schéma TypeScript (shared/schema.ts)
✅ Mise à jour complète des enums
✅ Extension de la structure `AccreditationRequest` avec tous les nouveaux champs

---

## 🔧 Points d'Extension Futurs

### Pour les prochaines itérations:

1. **Contrôleurs REST à créer**:
   - `PreliminaryVisitController`
   - `EvaluationTeamController`
   - `DocumentaryReviewController`
   - `EvaluationPlanController`
   - `GapManagementController`
   - `EvaluationReportController`
   - `CASDecisionController`
   - `CertificateController`
   - `SurveillanceController`

2. **DTOs à créer** pour chaque contrôleur

3. **Pages Frontend à créer**:
   - `/oec/demandes/{id}/corriger` - Formulaire de correction
   - `/oec/demandes/{id}/equipe` - Validation équipe
   - `/oec/demandes/{id}/reponse-documentaire` - Réponse manquements
   - `/oec/demandes/{id}/plans-actions` - Soumission plans d'actions
   - `/oec/demandes/{id}/lever-obstacles` - Notification levée obstacles
   - Pages RA/CD pour gérer chaque étape du workflow

4. **Migrations de base de données** à générer pour toutes les nouvelles tables

5. **Tests unitaires et d'intégration** pour tous les nouveaux services

---

## 📝 Notes Importantes

### Règles de Requalification des Écarts
Le système implémente automatiquement les règles de requalification d'un écart NON_CRITIQUE en CRITIQUE:
1. ≥3 écarts NC sur la même exigence → CRITIQUE
2. Écart systématique multi-départements → CRITIQUE
3. Écart récurrent d'une évaluation précédente → CRITIQUE

### Délais Critiques Implémentés
- Plans d'actions OEC: 10 jours après clôture évaluation
- Évaluation plans d'actions: 5 jours par l'équipe
- Validation équipe par OEC: 3 jours
- Réponse manquements documentaires: 3 mois
- Rapport REE: 30 jours après clôture
- Validation rapport CD: 15 jours
- Plan d'évaluation à OEC: minimum 5 jours avant
- Résolution écarts critiques: 6 mois maximum

### Workflow Non Bloquant
- La visite préliminaire est OPTIONNELLE
- Si refusée ou non proposée, le workflow continue vers la contractualisation
- Les écarts NON_CRITIQUES n'empêchent pas l'accréditation (vérification lors surveillance suivante)
- Les écarts CRITIQUES doivent être résolus avant décision CAS

---

## ✨ Bénéfices de Cette Implémentation

1. **Traçabilité complète** : Chaque étape du processus est enregistrée et auditée
2. **Notifications en temps réel** : Toutes les parties prenantes sont informées automatiquement
3. **Conformité PRO 12** : Respect exact du processus d'accréditation ALGERAC
4. **Expérience OEC améliorée** : L'OEC voit l'état exact de sa demande à tout moment
5. **Gestion automatisée** : Règles métier appliquées automatiquement (requalification écarts, etc.)
6. **Flexibilité** : Support de tous les scénarios (octroi, refus, ajournement, suspension, retrait, etc.)
7. **Scalabilité** : Architecture modulaire permettant des extensions futures

---

## 🚀 Prochaines Étapes Recommandées

1. **Compiler et tester le backend Java** pour détecter toute erreur de compilation
2. **Générer les migrations de base de données** pour créer toutes les nouvelles tables
3. **Créer les contrôleurs REST** pour exposer les nouvelles fonctionnalités
4. **Créer les DTOs** pour valider les données entrantes
5. **Créer les pages frontend OEC** pour les nouvelles actions
6. **Créer les pages RA/CD** pour gérer le workflow
7. **Tests end-to-end** du workflow complet
8. **Documentation utilisateur** pour chaque rôle (OEC, RA, CD, DT, Expert)

---

## 📚 Références

- **PRO 12** : Processus de première accréditation
- **PRO 13** : Surveillance périodique
- **PRO 22** : Gestion des récusations
- **PRO 23** : Système de sanctions
- **GEN 14** : Constitution des équipes d'évaluation
- **Annexe 03** : Calcul durée d'évaluation (H/j)

---

*Document généré le: 14 février 2026*
*Auteur: AI Assistant*
*Version: 1.0*
