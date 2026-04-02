# PRO 12 — Procédure d'Accréditation ALGERAC (Version 13 / 03-06-2025)

## Workflow Détaillé Complet

---

## Contexte : Qu'est-ce qu'ALGERAC ?

**ALGERAC** (Organisme Algérien d'Accréditation / الهيئة الجزائرية للاعتماد) est l'organisme national d'accréditation en Algérie. Il accrédite les **Organismes d'Évaluation de la Conformité (OEC)** selon les normes internationales (ISO/IEC 17011). ALGERAC est membre de :
- **EA** (European co-operation for Accreditation)
- **ILAC** (International Laboratory Accreditation Cooperation)
- **AFRAC** (African Accreditation Cooperation)
- **ARAC** (Arab Accreditation Cooperation)
- **SMIIC** (Standards and Metrology Institute for Islamic Countries)

### Types d'OEC accrédités :
| Type d'OEC | Norme de référence |
|---|---|
| Laboratoires d'essais et d'analyses | ISO/IEC 17025 |
| Laboratoires d'étalonnage | ISO/IEC 17025 |
| Laboratoires de biologie médicale | ISO 15189 |
| Organismes d'inspection | ISO/IEC 17020 |
| Organismes de certification de produits | ISO/IEC 17065 |
| Organismes de certification de systèmes de management (OCSM) | ISO/IEC 17021-1 |
| Organismes de certification de personnes | ISO/IEC 17024 |
| Organisateurs d'essais d'aptitude | ISO/IEC 17043 |

---

## Acteurs du Processus

| Sigle FR | Sigle EN | Rôle |
|---|---|---|
| **DG** | GM | Direction Générale |
| **DT** | TD | Directrice Technique |
| **DAM** | ARD | Direction Administration et Moyens |
| **CD** | HD | Chef de Département |
| **RA** | AO | Responsable d'Accréditation |
| **REE** | TL | Responsable de l'Equipe d'Evaluation (Team Leader) |
| **ET** | TA | Evaluateur Technique |
| **EXP** | EXP | Expert |
| **OEC** | CAB | Organisme d'Évaluation de la Conformité (candidat) |
| **CAS** | SAC | Comité d'Accréditation et de Surveillance |
| **CDSI** | ISHD | Chef Département Systèmes d'Information |
| **DOC** | COD | Département des Opérations de Consolidation |

---

## Classification des Écarts

| Type | Description |
|---|---|
| **Écart critique** | Affecte directement et immédiatement la qualité des services d'évaluation de la conformité |
| **Écart non critique** | N'affecte pas directement la qualité, mais peut devenir critique si récurrent |

### Règles de requalification :
- Une **accumulation** d'écarts non critiques pour la même exigence → **reclassé critique**
- Un écart non critique affectant **systématiquement plusieurs départements/activités/personnel** → **reclassé critique**
- Un écart non critique **récurrent** (identifié lors de 2 évaluations successives) → **peut être reclassé critique** (après analyse de risques)

---

## PHASE I — Réception et Étude de Recevabilité

```
┌─────────────────────────────────────────────────────────────────────┐
│                    ÉTAPE 1 : RÉCEPTION DE LA DEMANDE                │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.1 — Soumission de la demande (OEC → CD/RA)

| Élément | Détail |
|---|---|
| **Qui** | OEC (candidat) |
| **Action** | Soumet la demande d'accréditation |
| **Document** | **DOC 01** (Demande d'accréditation) |
| **Pièces jointes** | Documents requis selon l'activité (voir annexe) + paiement des frais de dépôt |
| **Documents techniques selon type** | FOR 04 (Inspection), FOR 05 (Labo essais), FOR 05-1 (Labo bio médicale), FOR 06 (Labo étalonnage), FOR 07 (Certif SM), FOR 07-5 (Certif Produits) |

```
OEC ──[soumission DOC 01 + documents + paiement]──► CD/RA
```

---

### 1.2 — Étude de recevabilité administrative (CD/RA)

| Élément | Détail |
|---|---|
| **Qui** | RA / CD |
| **Action** | Affecte un numéro de dossier, évalue la recevabilité administrative |
| **Document** | **FOR 55** (Rapport sur la revue documentaire administrative) |
| **Vérifications** | Complétude du dossier, paiement effectué |

```
CD/RA ──[attribution n° dossier]──► Dossier créé
CD/RA ──[étude FOR 55]──► Résultat recevabilité
```

#### Si pièces manquantes :
```
CD/RA ──[notification pièces manquantes]──► OEC
OEC ──[complément de dossier]──► CD/RA
⏰ Délai max complétion : 6 MOIS → Au-delà = dossier classé
```

---

### 1.3 — Vérification des ressources (CD/RA)

| Élément | Détail |
|---|---|
| **Qui** | CD/RA |
| **Action** | Consulte la base de données des évaluateurs et experts |
| **Outils** | FOR 29 / GPAC (base de données évaluateurs), GEN 14 (matrice des compétences) |
| **Vérifications** | Disponibilité d'évaluateurs/experts qualifiés dans la portée demandée |
| **Délais** | S'assure que l'évaluation peut être réalisée dans les délais prévus |

#### Si manque de compétences :
```
CD ──[informe OEC : possibilité évaluateur étranger + incidences financières]──► OEC
OEC ──[accepte ou refuse]──► CD
```

---

### 1.4 — Visite préliminaire (OPTIONNELLE)

| Élément | Détail |
|---|---|
| **Qui** | CD ou RA + évaluateur/expert si nécessaire |
| **Quand** | Sur proposition d'ALGERAC et avec accord de l'OEC |
| **Objectifs** | S'assurer de l'absence d'obstacles, estimer les hommes/jours |
| **Durée** | Minimum 1 journée/site |
| **Coût** | Payant par l'OEC |
| **Limite** | 1 seule visite préliminaire par demande |
| **Document** | **FOR 12** (Rapport de visite préliminaire) |
| **Conseil** | ⚠️ Pas de prestation de conseil pendant ou après la visite |
| **Délai rapport** | CD valide et transmet le compte-rendu après 10 jours |

```
ALGERAC ──[proposition visite]──► OEC
OEC ──[accepte]──► ALGERAC
                   │
                   ├── Visite sur site (min 1 jour/site)
                   │
                   ├── Rapport FOR 12 (sous 10 jours)
                   │
                   └── Si obstacle bloquant identifié:
                       Évaluation suspendue jusqu'à levée de l'obstacle
```

---

### 1.5 — Validation de la demande (DG)

```
Dossier jugé recevable ──► DOC 01 validé par la DG
```

---

## PHASE I (suite) — Contractualisation

```
┌─────────────────────────────────────────────────────────────────────┐
│              ÉTAPE 3 : CONVENTION ET DEVIS ESTIMATIF                │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.1 — Établissement du devis

| Élément | Détail |
|---|---|
| **Qui** | CD/RA → Département Opérations de Consolidation |
| **Action** | Prépare la demande de devis basée sur l'équipe d'évaluation et la durée |
| **Document** | **FOR 48** (Demande d'établissement de devis) |
| **Référence** | Annexe 03 (durées H/j) |
| **Note** | Le CD peut faire appel à un expert pour estimer la durée dans un domaine spécifique |

```
CD/RA ──[FOR 48 (composition équipe + durée H/j)]──► Dept. Opérations Consolidation
Dept. Opérations ──[devis estimatif FOR 44]──► CD/RA
```

### 3.2 — Convention et transmission à l'OEC

| Élément | Détail |
|---|---|
| **Qui** | CD/RA |
| **Action** | Établit la convention d'accréditation + devis estimatif |
| **Documents** | **DOC 02** (Convention d'accréditation) + **FOR 44** (Devis estimatif) |

```
CD/RA ──[DOC 02 + FOR 44]──► OEC
```

### 3.3 — Validation par l'OEC

| Délai | Action |
|---|---|
| **10 jours** | L'OEC doit retourner les documents validés |
| **+5 jours** | Si dépassement → rappel avec 5 jours supplémentaires |
| **Au-delà** | Si pas de validation → **dossier classé** |

```
OEC ──[documents validés dans ≤10j]──► CD/RA ✅
     ou
OEC ──[pas de réponse après 10j]──► CD/RA ──[rappel +5j]──► OEC
     ou
OEC ──[pas de réponse après 15j total]──► ❌ Dossier classé
```

---

## PHASE I (suite) — Constitution de l'Équipe d'Évaluation

```
┌─────────────────────────────────────────────────────────────────────┐
│           ÉTAPES 4-5-6 : ÉQUIPE, ENGAGEMENTS, RÉCUSATIONS          │
└─────────────────────────────────────────────────────────────────────┘
```

### 4 — Engagements de confidentialité et d'impartialité

| Élément | Détail |
|---|---|
| **Qui** | CD/RA → Équipe d'évaluation désignée |
| **Action** | Envoi par email des engagements à signer |
| **Document** | **FOR 01-1** (Engagement de confidentialité et d'impartialité) |
| **Objectif** | S'assurer de l'absence de tout conflit d'intérêt |

```
CD/RA ──[FOR 01-1 par email]──► REE, ET, EXP (membres de l'équipe)
Membres ──[FOR 01-1 signés]──► CD/RA
```

### 5 — Transmission de la composition de l'équipe à l'OEC

| Élément | Détail |
|---|---|
| **Document** | **FOR 26** (Fiche composition de l'équipe d'évaluation) |
| **Action** | CD/RA transmet à l'OEC pour validation |

```
CD/RA ──[FOR 26]──► OEC
```

### 6 — Récusations (OEC → ALGERAC)

| Élément | Détail |
|---|---|
| **Délai** | **3 jours** après réception de FOR 26 |
| **Droit** | L'OEC peut récuser un ou plusieurs membres avec motif |
| **Procédure** | ALGERAC examine les récusations (cf. **PRO 22**) |

```
OEC ──[récusation motivée dans ≤3j]──► ALGERAC
ALGERAC ──[examen selon PRO 22]──► Décision
     │
     ├── Récusation acceptée → CD/RA reprend étapes 4 et 5
     │                         (nouvelle équipe, nouveaux engagements)
     │
     └── Récusation rejetée → Équipe maintenue
```

---

## PHASE I (suite) — Revue Documentaire

```
┌─────────────────────────────────────────────────────────────────────┐
│                ÉTAPES 9-11 : REVUE DOCUMENTAIRE                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 9 — Transmission des documents de l'OEC à l'équipe

| Élément | Détail |
|---|---|
| **Qui** | CD/RA → Équipe d'évaluation |
| **Action** | Transmet les documents de l'OEC pour revue qualité et technique |
| **Documents** | **FOR 56** (Rapport revue documentaire qualité et technique) et/ou **FOR 56-1** (Recevabilité méthode/processus analytique) |

### 10 — Réalisation de la revue documentaire

| Élément | Détail |
|---|---|
| **Qui** | Équipe d'évaluation |
| **Délai** | **15 jours maximum** pour soumettre les résultats |
| **Résultat** | OEC informé des résultats |

```
Équipe ──[revue FOR 56 / FOR 56-1 dans ≤15j]──► CD/RA
CD/RA ──[notification résultats]──► OEC
```

### 11 — Réponse de l'OEC aux manquements

| Élément | Détail |
|---|---|
| **Qui** | OEC |
| **Options** | (a) Poursuivre et réaliser l'évaluation, (b) Corriger les manquements d'abord |
| **Délai correction** | **3 mois** maximum à compter de la notification |

```
OEC ──[choix: poursuivre ou corriger]──► CD
     │
     ├── Poursuivre → Passage à l'étape II
     │
     └── Corriger (≤3 mois) → Soumettre corrections → CD décide
                                │
                                ├── OK → Passage à l'étape II
                                └── NOK / Délai dépassé → CD arrête le processus
```

---

## PHASE II — Préparation et Évaluation sur Site

```
┌─────────────────────────────────────────────────────────────────────┐
│          ÉTAPE 12-16 : PRÉPARATION DE L'ÉVALUATION                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 12 — Mandatement de l'équipe

| Élément | Détail |
|---|---|
| **Qui** | CD/RA |
| **Action** | Envoi e-mail de mandatement avec tâches et missions |
| **Réunion** | Optionnelle : réunion de préparation (FOR 47), dans les locaux ALGERAC ou autre lieu |

```
CD/RA ──[email mandatement + FOR 47 si réunion]──► Équipe d'évaluation
```

### 13 — Ordres de mission

| Élément | Détail |
|---|---|
| **Qui** | CD/RA établit → **DT/DG valide** |
| **Document** | **FOR 18** (Ordre de mission) |

```
CD/RA ──[demandes ordres de mission]──► DT/DG
DT/DG ──[validation]──► CD/RA
CD/RA ──[FOR 18 transmis]──► Équipe d'évaluation
```

### 14 — Plan d'évaluation

| Élément | Détail |
|---|---|
| **Qui** | REE (en concertation avec l'équipe) |
| **Document** | **FOR 32** (Plan d'évaluation) |
| **Action** | REE élabore le plan et le soumet au CD/RA |

### 15 — Validation du plan

| Élément | Détail |
|---|---|
| **Qui** | CD/RA |
| **Vérification** | Alignement FOR 32 avec la norme d'accréditation et exigences applicables |
| **Note** | Si CD est mandaté comme REE → la **DT** valide les plans et rapports |

```
REE ──[FOR 32]──► CD/RA
CD/RA ──[vérification + ajustements si nécessaire]──► Validation ✅
```

### 16 — Transmission du plan à l'OEC

| Élément | Détail |
|---|---|
| **Délai** | **Au moins 5 jours** avant l'évaluation sur site |
| **Document** | FOR 32 validé |

```
REE ──[FOR 32 validé]──► OEC (≥5 jours avant évaluation)
```

---

```
┌─────────────────────────────────────────────────────────────────────┐
│             ÉTAPE 17-18 : ÉVALUATION SUR SITE                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 17 — Réalisation de l'évaluation sur site

#### Réunion d'ouverture (REE anime) :
- Présentation des participants et rôles
- Rappel des objectifs de l'évaluation
- Confirmation du plan d'évaluation avec l'OEC
- Présentation du déroulement
- Rappel des référentiels d'évaluation
- Confirmation confidentialité et sûreté des informations
- Confirmation de la langue utilisée
- Information sur les écarts et classifications
- Confirmation validité de la documentation
- Méthodes d'évaluation et stratégie d'échantillonnage
- Ressources et logistique
- Procédures santé/sécurité/urgence
- Modalités de traitement des constats
- Droit de recours

#### Évaluation proprement dite :
```
Équipe d'évaluation ──[évaluation selon FOR 32]──► Constats relevés
```

### 18 — Réunion de clôture

#### Avant la réunion :
```
REE ──[concertation avec l'équipe]──► Consensus sur les constats
     Si désaccord → REE fait appel au département concerné pour avis
```

#### Réunion de clôture (REE anime) :
- Présentation générale des résultats (historique si applicable)
- Points forts de l'organisme
- Points d'amélioration
- Informations complémentaires sur les non-conformités
- Appréciation générale (confiance en la compétence de l'OEC)
- **Présentation des constats + remise des fiches d'écart (FOR 02)**
- Modalités et délais de suivi des écarts
- Information sur la prise de décision (CAS)
- Droit de recours

#### Si un écart n'est pas accepté par l'OEC :
```
OEC ──[conteste l'écart]──► REE ──[informe CD]──► Personne non impliquée traite
     │
     ├── Résolu → Écart maintenu ou annulé
     │
     └── OEC maintient sa position → Dossier transmis au CAS (cf. PRO 16)
```

#### Documents transmis par le REE au CD/RA après l'évaluation :
- Feuilles de présence (réunions d'ouverture et de clôture)
- Ordres de mission
- Fiches d'écart (FOR 02)

---

## PHASE II (suite) — Traitement des Écarts

```
┌─────────────────────────────────────────────────────────────────────┐
│                  ÉTAPE 19 : TRAITEMENT DES ÉCARTS                   │
└─────────────────────────────────────────────────────────────────────┘
```

### 19.1 — Soumission des plans d'action par l'OEC

```
OEC ──[FOR 02 renseignées + plan d'actions]──► REE
⏰ Délai : 10 JOURS maximum
```

#### Si délai dépassé :
```
REE ──[rappel]──► OEC
⏰ Délai supplémentaire : 5 JOURS
```

### 19.2 — Évaluation des plans d'action par l'équipe

```
Équipe d'évaluation ──[évalue la pertinence des plans]──► Avis
⏰ Délai : 5 JOURS
```

### 19.3 — Suivi des écarts

```
Équipe d'évaluation ──[suivi continu]──► jusqu'à expiration du délai
```

### 19.4 — Évaluation complémentaire (*) (si nécessaire)

> Peut être initiée par le CD à la demande de l'équipe, pour vérifier la levée des écarts critiques.

**Processus de l'évaluation complémentaire :**
1. Transmission du devis
2. Transmission de la fiche composition de l'équipe
3. Établissement d'un plan d'évaluation
4. Validation et transmission du plan à l'OEC
5. Établissement et transmission des ordres de mission
6. Transmission du rapport d'évaluation (délai max 15 jours)

### 19.5 — Délais de résolution des écarts

| Type d'évaluation | Délai max résolution | Conséquence du dépassement |
|---|---|---|
| **Évaluation initiale** | **6 mois** à compter de la réunion de clôture | Dossier soumis au CAS pour décision |

### 19.6 — Conditions de passage au CAS

| Condition | Règle |
|---|---|
| **Écarts critiques** | **Tous** doivent être soldés |
| **Écarts non critiques** | Un plan d'action **pertinent** est accepté |
| **Vérification efficacité** | Réalisée lors de l'évaluation suivante |

> ⚠️ Même si les écarts non critiques ne sont pas tous soldés, le REE poursuit le traitement avec l'OEC après le CAS.

---

## PHASE III — Prise de Décision

```
┌─────────────────────────────────────────────────────────────────────┐
│            ÉTAPES 20-24 : RAPPORT, CAS, CERTIFICAT                  │
└─────────────────────────────────────────────────────────────────────┘
```

### 20 — Rapport d'évaluation

| Élément | Détail |
|---|---|
| **Qui** | REE |
| **Action** | Transmet le rapport d'évaluation au CD/RA |
| **Délai** | **30 jours** suivant la réunion de clôture |
| **Documents** | FOR 08 (Inspection), FOR 09 (Labo), FOR 09-1 (Labo bio méd.), FOR 10 (Certification) |

```
REE ──[rapport d'évaluation dans ≤30j]──► CD/RA
```

### 21 — Validation du rapport

| Élément | Détail |
|---|---|
| **Qui** | CD (+ échanges avec REE et DT si nécessaire) |
| **Délai** | **15 jours** (incluant les échanges) |
| **Action** | CD renseigne la fiche d'appréciation **FOR 23** |
| **Transmission** | Rapport → Département des Opérations de Consolidation |

```
CD/RA ──[validation rapport + FOR 23]──► Dept. Opérations de Consolidation
⏰ Délai total validation : 15 JOURS
```

### 22 — Convocation du CAS (Comité d'Accréditation et de Surveillance)

| Élément | Détail |
|---|---|
| **Qui** | CD/RA |
| **Base de décision** | Appréciation des écarts + délais de traitement + rapport d'évaluation validé |
| **Procédure** | cf. **PRO 16** (Procédure de prise de décision) |

```
CD/RA ──[convocation CAS]──► Membres du CAS
CAS ──[examen du dossier]──► DÉCISION
```

#### Décisions possibles du CAS :

| Décision | Description |
|---|---|
| ✅ **Octroi** | Accréditation accordée (totale, réduite, ou avec réserves) |
| ❌ **Refus** | Accréditation refusée |
| ⏸️ **Ajournement** | Décision reportée |
| 📋 **Maintien** | Accréditation maintenue (surveillance) |
| ⚠️ **Suspension** | Accréditation suspendue |
| 🔻 **Réduction** | Réduction de la portée |
| ❌ **Retrait** | Retrait de l'accréditation |

### 23 — Suite d'une décision favorable (CD/RA → OEC)

Documents transmis à l'OEC :

| Document | Description |
|---|---|
| **Notification** | Lettre de notification de la décision d'octroi (FOR 63, FOR 63-1, ..., FOR 63-12) |
| **Certificat** | Certificat d'accréditation + annexe technique |
| **Plan surveillance** | Plan de surveillance (cf. PRO 13, FOR 66) |
| **Satisfaction** | Fiche de satisfaction (FOR 22) à compléter et retourner |

```
CD/RA ──[notification + certificat + plan surveillance + FOR 22]──► OEC
```

### 24 — Diffusion et publication

```
Dept. Opérations Consolidation ──[rapports + certificats]──► OEC (assure le paiement)
Certificats + Annexe technique ──► CDSI ──[publication site web + mise à jour LIS 4]
```

---

## PHASE IV — Évaluation de Surveillance

```
┌─────────────────────────────────────────────────────────────────────┐
│             SURVEILLANCE PÉRIODIQUE (tout le cycle)                  │
└─────────────────────────────────────────────────────────────────────┘
```

> L'évaluation de surveillance est réalisée conformément au plan de surveillance pour tout le cycle d'accréditation (4 ans).

### Chronologie de la surveillance :

| Étape | Délai | Action | Document |
|---|---|---|---|
| **01** | **2 mois avant** surveillance | Transmission formulaire analyse des risques pour déterminer si la portée sera modifiée | **FOR 77-1** |
| **02** | **1 mois avant** surveillance | Transmission liste des documents à fournir | **FOR 68** |
| **03** | — | Réception de la documentation de l'OEC | — |
| **04** | — | Établissement et transmission du devis à l'OEC | FOR 44 |
| **05** | — | Transmission et signature des engagements de confidentialité/impartialité | FOR 01-1 |
| **06** | — | Transmission fiche composition équipe à l'OEC pour validation | FOR 26 |
| **07** | — | Réalisation de l'évaluation (Phase II ci-dessus) avec délais PRO 25 | — |
| **08** | — | L'OEC est notifiée pour chaque décision prise | — |

#### Si l'OEC ne transmet pas les documents :
```
⚠️ Dispositions de PRO 23 (Suspension, Réduction, Retrait) sont d'application
```

---

## Schéma Récapitulatif du Flux Complet

```
╔══════════════════════════════════════════════════════════════════════╗
║                      FLUX PRO 12 — VUE D'ENSEMBLE                  ║
╠══════════════════════════════════════════════════════════════════════╣
║                                                                      ║
║  ① OEC soumet demande (DOC 01 + docs + paiement)                   ║
║     │                                                                ║
║  ② CD/RA → N° dossier + étude recevabilité (FOR 55)                ║
║     │         ├── Pièces manquantes → OEC (délai 6 mois)           ║
║     │         └── Vérification ressources (FOR 29/GPAC/GEN 14)     ║
║     │                                                                ║
║  ③ [Optionnel] Visite préliminaire (FOR 12)                        ║
║     │         └── Si obstacle → suspension                          ║
║     │                                                                ║
║  ④ DG valide la demande                                             ║
║     │                                                                ║
║  ⑤ CD/RA → Devis (FOR 48) → Dept. Consolidation → FOR 44          ║
║     │    Convention DOC 02 + FOR 44 → OEC                           ║
║     │         └── Validation OEC (10j + rappel 5j ou classé)       ║
║     │                                                                ║
║  ⑥ CD/RA → Engagements FOR 01-1 → Équipe signe                    ║
║     │                                                                ║
║  ⑦ CD/RA → Fiche équipe FOR 26 → OEC valide                       ║
║     │         └── Récusation possible (3j) → PRO 22                ║
║     │              └── Si acceptée → retour étape ⑥                ║
║     │                                                                ║
║  ⑧ CD/RA → Documents OEC → Équipe pour revue (FOR 56)             ║
║     │         └── Résultats sous 15j → OEC informé                 ║
║     │         └── OEC répond/corrige (3 mois max)                  ║
║     │                                                                ║
║  ⑨ CD/RA → Email mandatement + [réunion FOR 47]                   ║
║     │                                                                ║
║  ⑩ CD/RA → Ordres mission → DT/DG valide → FOR 18 → Équipe       ║
║     │                                                                ║
║  ⑪ REE → Plan FOR 32 → CD/RA valide → OEC (5j avant)             ║
║     │                                                                ║
║  ⑫ ÉVALUATION SUR SITE                                             ║
║     │    ├── Réunion d'ouverture                                    ║
║     │    ├── Évaluation selon FOR 32                                ║
║     │    ├── Consensus équipe                                       ║
║     │    └── Réunion de clôture + remise FOR 02                    ║
║     │                                                                ║
║  ⑬ TRAITEMENT DES ÉCARTS                                           ║
║     │    ├── OEC → plan d'actions (10j) + rappel (5j)              ║
║     │    ├── Équipe évalue pertinence (5j)                         ║
║     │    ├── Suivi continu par l'équipe                            ║
║     │    ├── [Si nécessaire] Évaluation complémentaire             ║
║     │    └── Délai max résolution : 6 mois (initiale)              ║
║     │                                                                ║
║  ⑭ REE → Rapport d'évaluation (30j) → CD/RA                      ║
║     │         └── CD valide + FOR 23 (15j) → Dept. Consolidation   ║
║     │                                                                ║
║  ⑮ CD/RA → Convocation CAS → DÉCISION (PRO 16)                    ║
║     │    ├── ✅ Octroi → Certificat + plan surveillance            ║
║     │    ├── ❌ Refus                                               ║
║     │    └── ⏸️ Ajournement                                         ║
║     │                                                                ║
║  ⑯ PUBLICATION                                                      ║
║     │    ├── Certificat + annexe → OEC                              ║
║     │    └── CDSI → Site web + mise à jour LIS 4                   ║
║     │                                                                ║
║  ⑰ SURVEILLANCE (cycle 4 ans, cf. PRO 25)                          ║
║         ├── Analyse risques (FOR 77-1, 2 mois avant)               ║
║         ├── Documents (FOR 68, 1 mois avant)                       ║
║         └── Évaluation surveillance → Décision CAS                 ║
║                                                                      ║
╚══════════════════════════════════════════════════════════════════════╝
```

---

## Référentiel des Formulaires et Documents

| Code | Nom | Étape |
|---|---|---|
| DOC 01 | Demande d'accréditation | 1 |
| DOC 02 | Convention d'accréditation | 3 |
| FOR 01-1 | Engagement de confidentialité et d'impartialité | 4 |
| FOR 02 | Fiche d'écart | 18, 19 |
| FOR 04 | Renseignements techniques - Inspection | 1 |
| FOR 05 | Renseignements techniques - Labo essais | 1 |
| FOR 05-1 | Renseignements techniques - Labo bio médicale | 1 |
| FOR 06 | Renseignements techniques - Labo étalonnage | 1 |
| FOR 07 | Renseignements techniques - Certif SM | 1 |
| FOR 07-5 | Renseignements techniques - Certif Produits | 1 |
| FOR 08 | Rapport d'évaluation - Inspection | 20 |
| FOR 09 | Rapport d'évaluation - Laboratoires | 20 |
| FOR 09-1 | Rapport d'évaluation - Labo bio médicale | 20 |
| FOR 10 | Rapport d'évaluation - Certification | 20 |
| FOR 12 | Rapport de visite préliminaire | 1.4 |
| FOR 18 | Ordre de mission | 13 |
| FOR 22 | Fiche de satisfaction | 23 |
| FOR 23 | Fiche d'appréciation du rapport d'évaluation | 21 |
| FOR 26 | Fiche composition de l'équipe d'évaluation | 5 |
| FOR 29 | Base de données des évaluateurs | 2 |
| FOR 32 | Plan d'évaluation | 14 |
| FOR 44 | Devis estimatif | 3 |
| FOR 47 | Réunion de préparation d'évaluation | 12 |
| FOR 48 | Demande d'établissement d'un devis | 3 |
| FOR 55 | Rapport revue documentaire administrative | 2 |
| FOR 56 | Rapport revue documentaire qualité et technique | 9 |
| FOR 56-1 | Rapport recevabilité méthode/processus analytique | 9 |
| FOR 63 (série) | Lettres de notification | 23 |
| FOR 66 | Plan de surveillance | 23 |
| FOR 68 | Liste documents surveillance | IV |
| FOR 77-1 | Analyse des risques - programmation évaluations | IV |
| GEN 14 | Matrice des compétences | 2 |
| GPAC | Base de données évaluateurs/experts | 2 |
| LIS 4 | Liste des OEC accrédités | 24 |

---

## Procédures Liées

| Code | Nom | Lien avec PRO 12 |
|---|---|---|
| PRO 06 | Gestion des compétences évaluateurs/experts | Sélection de l'équipe |
| PRO 07 | Gestion des Comités (CAS) | Décision d'accréditation |
| PRO 13-1 | Échantillonnage | Plan de surveillance |
| PRO 16 | Prise de décision | Décision CAS |
| PRO 18 | Tarifs et frais (OEC nationaux) | Devis |
| PRO 18-1 | Tarifs et frais (OEC étrangers) | Devis |
| PRO 22 | Traitement des récusations | Récusation équipe |
| PRO 23 | Suspension, Réduction, Retrait | Non-conformité surveillance |
| PRO 25 | Surveillance, Renouvellement, Extension | Phase IV |
| PRO 29 | Évaluation à distance | Alternative sur site |
| PRO 30 | Gestion des risques et opportunités | Analyse de risques |
| PRO 31 | Transfert d'accréditation | Transfert |
| GEN 23 | Règles d'accréditation OCSM | Règles spécifiques OCSM |

---

## Délais Résumés

| Étape | Délai | Conséquence du dépassement |
|---|---|---|
| Complément dossier | **6 mois** | Dossier classé |
| Validation convention/devis par OEC | **10 jours** (+5j rappel) | Dossier classé |
| Récusation par OEC | **3 jours** | Pas de récusation possible |
| Revue documentaire par l'équipe | **15 jours** | — |
| Correction manquements par OEC | **3 mois** | CD décide arrêt/poursuite |
| Transmission plan évaluation à OEC | **≥5 jours** avant évaluation | — |
| Plan d'actions OEC (écarts) | **10 jours** (+5j rappel) | — |
| Évaluation plans d'actions (équipe) | **5 jours** | — |
| Résolution écarts (évaluation initiale) | **6 mois** depuis clôture | Dossier soumis au CAS |
| Rapport REE → CD/RA | **30 jours** depuis clôture | — |
| Validation rapport par CD | **15 jours** | — |
| Analyse risques avant surveillance | **2 mois** avant | — |
| Documents surveillance | **1 mois** avant | PRO 23 applicable |
