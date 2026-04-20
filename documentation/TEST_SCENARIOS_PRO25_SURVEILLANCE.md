# PRO 25 — Scénarios de Test Complets
## Surveillance, Renouvellement, Extension d'Accréditation

---

## Prérequis

- Un utilisateur OEC (organisme d'évaluation de la conformité) avec un certificat d'accréditation actif
- Un utilisateur RA (responsable d'accréditation) 
- Un utilisateur CD (chef de département / direction qualité)
- Au moins une demande (request) créée
- Un certificat d'accréditation avec des dates (effectiveDate, expiryDate)

---

## A. SURVEILLANCE RÉGULIÈRE (§5.2.1)

### Scénario A1 — Cycle complet de surveillance (happy path)

**Rôle: RA**
1. Aller sur `/ra/surveillance`
2. Cliquer **"Surveillance"** → Remplir:
   - ID Certificat: (un certificat existant)
   - ID Demande: (une demande existante)
   - Date prévue: dans 3 mois
   - Portée: "Essais mécaniques - ISO 17025"
3. Cliquer **"Programmer"** → Vérifier toast "Surveillance programmée"
4. La surveillance apparaît dans l'onglet **"À venir"** avec statut **PLANNED**
5. Cliquer dessus → Vérifier les actions disponibles
6. Cliquer **"Analyse de risque FOR 77-1"** → Cocher:
   - ✅ "Non-conformités antérieures" → Détails: "NC-01 sur traçabilité métrologique"
   - ✅ "Réclamations reçues" → Détails: "Réclamation client #RC-2024-003"
   - Niveau de risque: **Moyen**
   - Actions: "Évaluation approfondie de la traçabilité"
7. Cliquer **"Enregistrer FOR 77-1"** → Vérifier la carte d'analyse de risque s'affiche
8. Cliquer **"Demander documents FOR 68"** → Saisir:
   - "Manuel qualité v5.2, procédures d'étalonnage, rapport audit interne 2024, revue de direction"
9. Cliquer **"Envoyer FOR 68"** → Statut passe à **DOCUMENTS_REQUESTED**

**Rôle: OEC** (changer de compte)
10. Aller sur `/oec/surveillance`
11. Vérifier qu'une surveillance apparaît dans **"Actions requises"** avec badge orange "Action"
12. Cliquer dessus → Voir le bouton **"Soumettre les documents (FOR 68)"**
13. Cliquer → Saisir "Manuel qualité v5.2 (ref MQ-052), Proc. étalonnage PE-003..."
14. Cliquer **"Soumettre"** → Statut passe à **DOCUMENTS_RECEIVED**

**Rôle: RA**
15. Retour `/ra/surveillance` → Voir le statut **DOCUMENTS_RECEIVED**
16. Cliquer **"Préparer le devis"** → Montant: 250000 DA, Détails: "3 jours, 2 évaluateurs"
17. Cliquer **"Envoyer le devis"** → Statut passe à **QUOTATION_SENT**

**Rôle: OEC**
18. Retour `/oec/surveillance` → Voir "Action" avec "Devis reçu"
19. Cliquer **"Accepter le devis"** → Toast "Devis accepté"
20. Statut passe à **QUOTATION_ACCEPTED**

**Rôle: RA**
21. Cliquer **"Constituer équipe & plan"** → ID Équipe: 1, Plan: "Jour 1: revue doc, Jour 2: audit terrain, Jour 3: restitution"
22. Cliquer **"Valider"** → Statut passe à **TEAM_DESIGNATED**
23. Cliquer **"Démarrer l'évaluation"** → Statut passe à **IN_PROGRESS**
24. Cliquer **"Compléter l'évaluation"** → Saisir:
    - Constats: "Conformité globale satisfaisante. 1 NC mineure sur traçabilité. 0 NC critique."
    - Recommandation: "Maintien de l'accréditation. Surveillance des actions correctives sous 3 mois."
25. Cliquer **"Soumettre le rapport"** → Statut passe à **REPORT_DRAFTING**

**Rôle: CD** (optionnel — validation CD)
26. Aller sur `/cd/surveillance` → Voir l'évaluation dans l'onglet **"Valider"**
27. Cliquer → Cliquer **"Valider le rapport"** → Cocher "validé" → Valider

**Rôle: RA**
28. Cliquer **"Valider le rapport"** → Cocher "Rapport validé et conforme" → Valider
29. Statut passe à **REPORT_VALIDATED**
30. Cliquer **"Programmer réunion CAS"** → Date, Agenda
31. Cliquer **"Programmer"** → Statut passe à **CAS_SUBMITTED**
32. Cliquer **"Décision CAS"** → Sélectionner:
    - **"Maintenir l'accréditation (§5.4.1)"**
    - Justification: "Conformité aux exigences ISO/IEC 17025. NC mineure traitée dans les délais."
33. Cliquer **"Enregistrer"** → Statut passe à **COMPLETED**

**Vérification finale:**
- L'évaluation apparaît dans l'onglet "Fini" côté RA
- L'évaluation apparaît dans "Terminées" côté OEC avec la décision CAS affichée
- L'évaluation apparaît dans "Fini" côté CD

---

### Scénario A2 — Devis refusé par l'OEC

1. RA programme une surveillance (étapes A1.1-17)
2. **OEC** clique **"Refuser le devis"** → Statut passe à **QUOTATION_REJECTED**
3. Vérifier que le statut s'affiche correctement en rouge côté RA et OEC

---

### Scénario A3 — Rapport rejeté (demande de corrections)

1. Suivre A1 jusqu'à l'étape 25 (rapport soumis)
2. RA clique **"Valider le rapport"** → Décocher la case → Saisir: "Compléter la section 4.3 avec les résultats d'aptitude"
3. Cliquer **"Demander corrections"** → Vérifier toast
4. Le statut reste en validation (le RA devra revalider après corrections)

---

### Scénario A4 — Décision CAS avec réserves

1. Suivre A1 jusqu'à l'étape 31
2. Cliquer **"Décision CAS"** → Sélectionner **"Maintenir avec réserves"**
3. Justification: "NC sur système de management documentaire"
4. Réserves: "Mise à jour du manuel qualité sous 60 jours"
5. Conditions: "Vérification documentaire à distance dans 60 jours"
6. Enregistrer → Vérifier que les champs réserves/conditions sont visibles

---

### Scénario A5 — Décision CAS: Réduction de portée

1. Suivre A1 jusqu'à CAS_SUBMITTED
2. Décision: **"Réduire la portée"**
3. Portée réduite: "Retrait de l'étalonnage dimensionnel — laboratoire B"
4. Justification: "Compétences insuffisantes constatées sur le domaine dimensionnel"
5. Enregistrer

---

### Scénario A6 — Décision CAS: Report

1. Suivre A1 jusqu'à CAS_SUBMITTED
2. Décision: **"Reporter la décision"**
3. Justification: "Informations complémentaires nécessaires avant prise de décision"
4. Enregistrer

---

## B. SANCTIONS (PRO 23)

### Scénario B1 — Suspension

1. Suivre A1 jusqu'à CAS_SUBMITTED
2. Cliquer **"Suspendre (PRO 23)"** → Remplir:
   - Motif: "Défaillance critique du système de management qualité"
   - Date fin de suspension: dans 6 mois
   - Exigences correctives: "Audit interne complet, plan d'actions correctives"
3. Cliquer **"Suspendre"** → Vérifier toast
4. Statut passe à **SANCTIONS_APPLIED**
5. Vérifier que le bouton **"Lever la suspension"** apparaît
6. Cliquer **"Lever la suspension"** → Vérifier toast

---

### Scénario B2 — Retrait d'accréditation

1. Suivre A1 jusqu'à CAS_SUBMITTED
2. Cliquer **"Retirer (PRO 23)"** → Motif: "Non-conformités critiques répétées, aucune action corrective"
3. Cliquer **"Confirmer le retrait"** → Vérifier toast

---

## C. EXTENSION D'ACCRÉDITATION (§5.2.2)

### Scénario C1 — Extension même type

**Rôle: RA**
1. Aller sur `/ra/surveillance`
2. Cliquer **"Extension"** → Remplir:
   - ID Certificat, ID Demande
   - Type: **"Même type (essais/étalonnages similaires)"**
   - Date prévue, Portée: "Extension aux essais de traction sur composites"
3. Cliquer **"Programmer l'extension"** → Vérifier badge vert "Extension"
4. Poursuivre le workflow complet (FOR 77-1 → FOR 68 → Devis → Équipe → Évaluation → Rapport → CAS)
5. Décision CAS: **"Maintenir l'accréditation"** (correspond à §5.4.2 — octroi de l'extension)
6. Vérifier que le `findingDeadlineMonths` est à 6 (vs 3 pour surveillance normale)

### Scénario C2 — Extension autre type

1. Comme C1 mais sélectionner **"Autre type (nouvelles catégories)"**
2. Vérifier le badge "Extension" et le type affiché

### Scénario C3 — Extension autre site (PRO 26)

1. Comme C1 mais sélectionner **"Autre site (PRO 26)"**
2. Workflow complet

---

## D. RENOUVELLEMENT (§5.2.3)

### Scénario D1 — Renouvellement avant expiration (Cas 1 Annexe 2)

**Rôle: RA**
1. Cliquer **"Renouvellement"** → Remplir:
   - ID Certificat (certificat qui expire dans > 6 mois)
   - ID Demande
   - Date prévue: avant la date d'expiration
2. Cliquer **"Programmer le renouvellement"** → Badge ambre "Renouvellement"
3. Vérifier la carte informative Annexe 2 dans le dialogue
4. Compléter le workflow complet
5. Vérification: certificat renouvelé expire B+4 ans (depuis date expiration originale)

### Scénario D2 — Renouvellement avec prolongation (Cas 2 Annexe 2)

1. Programmer un renouvellement pour un certificat qui expire bientôt
2. Compléter le workflow dans les 3 mois après expiration
3. Vérification: certificat expire B+4 ans, date d'effet = C (date de fin d'évaluation)

### Scénario D3 — Renouvellement au-delà de 3 mois (Cas 3 Annexe 2)

1. Programmer un renouvellement pour un certificat déjà expiré depuis > 3 mois
2. Le système devrait traiter cela comme une évaluation initiale avec nouveau numéro
3. Vérification: comportement conforme à Annexe 2 Cas 3

---

## E. SURVEILLANCE EXTRAORDINAIRE (§5.2.1)

### Scénario E1 — Réclamation de tiers

**Rôle: RA ou CD**
1. Cliquer **"Extraordinaire"** (RA) ou **"Surveillance extraordinaire"** (CD)
2. ID Certificat, ID Demande
3. Motif: **"Réclamation de tiers"**
4. Justification: "Réclamation #REC-2024-015 d'un client de l'OEC concernant la fiabilité des résultats"
5. Cliquer **"Initier"** → Badge rouge "Extraordinaire"
6. Workflow complet (accéléré si nécessaire)

### Scénario E2 — Réorganisation de l'OEC

1. Motif: **"Réorganisation importante de l'OEC"**
2. Justification: "Fusion avec un autre laboratoire, changement de direction technique"

### Scénario E3 — Transfert d'accréditation

1. Motif: **"Transfert d'accréditation"**
2. Justification: "Transfert depuis un organisme d'accréditation étranger"

---

## F. CYCLE D'ACCRÉDITATION (§5.1)

### Scénario F1 — Visualiser les informations du cycle

1. RA sélectionne une évaluation liée à un certificat
2. Cliquer **"Cycle d'accréditation"** (bouton en haut à droite)
3. Vérifier les informations:
   - Numéro de cycle (1er = 3 ans/2 surv., 2ème+ = 4 ans/3 surv.)
   - Dates d'effet et d'expiration
   - Nombre de surveillances réalisées vs requises
   - Prochaine surveillance
   - Délais max affichés (14, 24/26, 36 mois)
4. Si applicable, vérifier la date limite de dépôt de renouvellement

---

## G. ALERTES ET DÉLAIS

### Scénario G1 — Dépassement de délai de surveillance

1. Créer une surveillance dont la date dépasse les délais max (14/24/26/36 mois)
2. Vérifier que la carte d'alerte rouge apparaît en haut de la page RA
3. Vérifier les détails: mois écoulés, max autorisé, jours de retard
4. Message: "Risque de suspension immédiate (PRO 23 §5.1)"

### Scénario G2 — Écarts non soldés (délai de correction)

1. Compléter une évaluation avec des écarts
2. Si les écarts ne sont pas soldés dans les 3 mois (non-critique) ou 2.5 mois (critique)
3. Vérifier que la carte d'alerte orange apparaît
4. Message: "Dossier à soumettre au CAS"

---

## H. NAVIGATION ET INTERFACE

### Scénario H1 — Sidebar RA

1. Se connecter en tant que RA
2. Vérifier la section "Surveillance" dans le sidebar avec l'icône Eye
3. Cliquer → arrive sur `/ra/surveillance`

### Scénario H2 — Sidebar OEC

1. Se connecter en tant qu'OEC
2. Vérifier "Mes Surveillances" dans le sidebar
3. Cliquer → arrive sur `/oec/surveillance`

### Scénario H3 — Sidebar CD

1. Se connecter en tant que CD
2. Vérifier "Surveillance" dans le sidebar
3. Cliquer → arrive sur `/cd/surveillance`

### Scénario H4 — Compteurs et onglets

1. Pour chaque rôle, vérifier que:
   - Les compteurs en haut reflètent le nombre correct
   - Cliquer sur un compteur filtre la liste (change l'onglet actif)
   - La barre de progression du workflow se met à jour correctement

### Scénario H5 — Workflow progress bar

1. À chaque étape du scénario A1, vérifier que:
   - Le point vert se déplace le long de la barre de progression
   - Le point actuel est en bleu avec un anneau
   - Les étapes passées sont en vert
   - Les étapes futures sont en gris

---

## I. CAS LIMITES

### Scénario I1 — Champs vides

1. Essayer de programmer une surveillance sans ID Certificat → Vérifier erreur backend
2. Essayer de soumettre FOR 77-1 sans cocher aucun risque → Devrait fonctionner (risque faible)
3. Essayer de compléter sans constats → Vérifier le comportement

### Scénario I2 — Actions non disponibles

1. Sélectionner une surveillance en statut PLANNED
2. Vérifier que seul "Analyse de risque" est disponible (pas les autres actions)
3. Sélectionner une surveillance COMPLETED → Vérifier qu'aucune action n'est disponible

### Scénario I3 — OEC sans actions en attente

1. Se connecter OEC quand aucune surveillance n'a de documents/devis à traiter
2. Vérifier que l'onglet "Actions" est vide avec message "Aucune évaluation"
3. Vérifier qu'il n'y a PAS de carte d'alerte jaune

---

## Checklist de validation rapide

| # | Test | RA | OEC | CD | Statut |
|---|------|:--:|:---:|:--:|:------:|
| 1 | Page accessible via sidebar | ☐ | ☐ | ☐ | |
| 2 | Programmer surveillance | ☐ | - | - | |
| 3 | Programmer extension | ☐ | - | - | |
| 4 | Programmer renouvellement | ☐ | - | - | |
| 5 | Programmer extraordinaire | ☐ | - | ☐ | |
| 6 | Analyse de risque FOR 77-1 | ☐ | - | - | |
| 7 | Demander documents FOR 68 | ☐ | - | - | |
| 8 | Soumettre documents | - | ☐ | - | |
| 9 | Préparer devis | ☐ | - | - | |
| 10 | Accepter/refuser devis | ☐ | ☐ | - | |
| 11 | Constituer équipe & plan | ☐ | - | - | |
| 12 | Démarrer évaluation | ☐ | - | - | |
| 13 | Compléter évaluation | ☐ | - | - | |
| 14 | Valider rapport | ☐ | - | ☐ | |
| 15 | Programmer réunion CAS | ☐ | - | - | |
| 16 | Décision CAS (6 options) | ☐ | - | - | |
| 17 | Suspendre (PRO 23) | ☐ | - | - | |
| 18 | Retirer (PRO 23) | ☐ | - | - | |
| 19 | Lever suspension | ☐ | - | - | |
| 20 | Voir cycle d'accréditation | ☐ | - | ☐ | |
| 21 | Alertes délais surveillance | ☐ | - | ☐ | |
| 22 | Alertes écarts non soldés | ☐ | - | ☐ | |
| 23 | Barre progression workflow | ☐ | ☐ | ☐ | |
| 24 | Compteurs/onglets corrects | ☐ | ☐ | ☐ | |
| 25 | Badge type évaluation | ☐ | ☐ | ☐ | |
