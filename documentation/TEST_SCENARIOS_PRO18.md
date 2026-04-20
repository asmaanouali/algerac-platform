# Scénarios de test — PRO_18 / PRO_18-1 (Tarifs & Paiements)

> Référence procédurale : PRO_18 Ver09 (nationaux) · PRO_18-1 Ver02 (étrangers)

---

## Pré-requis communs

| Compte | Rôle | Utilisation |
|--------|------|-------------|
| dag@algerac.dz | DAG | Gérer grilles, créer factures, valider paiements |
| oec_lab@test.dz | OEC (national) | Payer en DZD via CPA |
| oec_foreign@test.com | OEC (étranger) | Payer en EUR/USD via BEA SWIFT |
| admin@algerac.dz | ADMIN | Vérifier données en base |

---

## SCÉNARIO 1 — Création et activation d'une grille tarifaire nationale

**Objectif** : Créer une grille pour un laboratoire d'essais (ISO 17025) conforme à PRO_18 Annexe 1.

**Acteur** : DAG

### Étapes
1. Se connecter en DAG → naviguer vers **Grilles Tarifaires**
2. Cliquer **Nouvelle grille**
3. Remplir :
   - Nom : `Tarif Labo Essais – Accréditation initiale 2025`
   - Catégorie : `Accréditation initiale (§5.2)`
   - Devise : `DZD`
   - Domaine : `Laboratoires d'essais`
   - Type OEC : `LAB`
   - Cocher **OEC Nationaux (PRO_18) — CPA Banque**
   - Frais d'inscription dossier : `15 000`
   - Frais d'évaluation / j·h : `25 000`
   - Revue documentaire : `10 000`
   - Redevance annuelle base 12 mois : `120 000`
   - Délivrance certificat : `5 000`
   - Frais administratifs : `3 000`
   - Durée éval. min : `2` · max : `5`
   - Date d'entrée en vigueur : aujourd'hui + 1 jour
   - Notes : `Conforme Annexe 1 PRO_18 Ver09`
4. Cliquer **Créer (Brouillon)**

**Résultat attendu** :
- Toast « Grille tarifaire créée — statut Brouillon »
- La grille apparaît dans l'onglet **Tous** avec badge **Brouillon**

5. Cliquer l'icône ✏️ → modifier le montant d'évaluation → **Sauvegarder**

**Résultat attendu** : Modification enregistrée, toast de confirmation

6. Cliquer **Activer** sur la grille

**Résultat attendu** : Badge passe à **Actif**, grille visible dans onglet **Actifs**

---

## SCÉNARIO 2 — Création d'une grille pour OEC étranger (EUR)

**Objectif** : Grille EUR pour organismes d'inspection étrangers, PRO_18-1.

**Acteur** : DAG

### Étapes
1. Nouvelle grille :
   - Nom : `Tarif INSP Étranger – EUR 2025`
   - Catégorie : `Accréditation initiale (§5.2)`
   - Devise : `EUR`
   - Domaine : `Organismes d'inspection`
   - Type OEC : `INSP`
   - Cocher **OEC Étrangers (PRO_18-1) — BEA / EUR / USD** UNIQUEMENT
   - Frais d'inscription : `500`
   - Frais évaluation / j·h : `1 500`
   - Supplément déplacement : `800`
   - Redevance annuelle : `6 000`
   - Traduction certificat (§5.16) : `300`
2. Créer → Activer

**Résultat attendu** :
- Onglet **Étrangers** affiche la grille avec devise **EUR**
- Les cartes bank info montrent les coordonnées BEA SWIFT (`BEXADZAL038`)

---

## SCÉNARIO 3 — Calculateur : redevance annuelle proratée (§5.5)

**Objectif** : Calculer la redevance pour un OEC dont l'accréditation prend effet en juillet.

**Acteur** : DAG

### Étapes
1. Grilles Tarifaires → **Calculateur** → onglet **Redevance §5.5**
2. Saisir :
   - Redevance annuelle de base : `120 000`
   - Mois de prise d'effet : **Juillet** (M = 6)
3. Cliquer **Calculer**

**Résultat attendu** :
- Formule affichée : `(120000 / 12) × 6`
- Montant : **60 000**
- M = 6

**Vérification** : Si mois = Janvier (M=12) → 120 000. Si mois = Décembre (M=1) → 10 000.

---

## SCÉNARIO 4 — Calculateur : extension simultanée + surveillance (§5.8 — 50/50 + 30%)

**Objectif** : Calcul de la répartition 50/50 + remise 30% sur revue documentaire.

**Acteur** : DAG

### Étapes
1. Calculateur → onglet **Ext.+Surv. §5.8**
2. Saisir :
   - Frais totaux équipe d'évaluation : `80 000`
   - Revue documentaire (extension) : `20 000`
3. Calculer

**Résultat attendu** :
- Part surveillance (50%) : **40 000**
- Part extension (50%) : **40 000**
- Revue doc. extension (−30%) : **14 000** (20 000 × 0,70)
- Total facturable extension : **54 000** (40 000 + 14 000)
- Total facturable surveillance : **40 000**

---

## SCÉNARIO 5 — Flux complet accréditation initiale OEC national (DZD)

**Objectif** : Tracer le cycle complet de paiement d'un OEC national.

**Acteurs** : OEC (lab@test.dz) + DAG

### Étapes
1. OEC soumet une demande d'accréditation initiale LAB
2. DAG reçoit la notification → **Gestion des Paiements** → onglet **Frais à fixer**
3. DAG clique **Fixer les frais** sur le dossier → saisir `15 000` DA → **Fixer et envoyer**

**Résultat attendu** :
- OEC reçoit une notification email
- Statut paiement passe à **PENDING**
- OEC connecté : **Mes Paiements** affiche la facture avec montant 15 000 DA, devise DZD, coordonnées CPA

4. OEC navigue vers la facture → saisit ID transaction `VIR-2025-00001` → joint preuve PDF → **Soumettre**

**Résultat attendu** : Statut → **Preuve envoyée**

5. DAG → onglet **Preuves** → **Vérifier** → valide

**Résultat attendu** : Statut → **Validé** · Dossier continue le workflow

---

## SCÉNARIO 6 — Rejet et re-soumission de preuve de paiement

**Objectif** : Tester le cycle rejet DAG → nouvelle soumission OEC.

1. OEC soumet preuve avec faux ID transaction
2. DAG → onglet **Preuves** → **Vérifier** → saisit motif → **Rejeter**

**Résultat attendu** :
- Statut → **Rejeté**
- OEC reçoit notification
- Sur **PaymentPage** : alerte rouge avec motif du rejet visible

3. OEC corrige → soumet une nouvelle preuve valide
4. DAG valide

---

## SCÉNARIO 7 — Création facture redevance annuelle (§5.5)

**Objectif** : DAG émet la facture de redevance annuelle proratée après décision d'accréditation.

**Acteur** : DAG

### Étapes
1. **Gestion des Paiements** → **Créer une facture**
2. Remplir :
   - ID Demande : `[ID de la demande de l'OEC]`
   - Type de frais : `Redevance annuelle (§5.5 — 60j)`
   - Montant : `60 000` (calculé au scénario 3 pour juillet)
   - Devise : `DZD`
   - Délai : `60` (jours)
   - N° Facture : laisser vide (auto-généré)
3. **Émettre la facture**

**Résultat attendu** :
- Toast de confirmation
- OEC notifié
- Facture visible dans **Mes Paiements** avec :
  - N° Facture auto-généré (FACT-2025-NNNNN)
  - Échéance = date d'émission + 60 jours
  - Devise DZD · Coordonnées CPA

---

## SCÉNARIO 8 — Paiement en retard (dépassement d'échéance)

**Objectif** : Vérifier la détection et l'affichage des paiements en retard.

1. DAG crée une facture avec délai = 1 jour pour un OEC
2. Attendre 2 jours (ou modifier la date en base pour simuler)
3. DAG → **Gestion des Paiements** → onglet **En retard**

**Résultat attendu** :
- Facture apparaît dans l'onglet **En retard**
- Badge rouge « N jours de retard » affiché
- Compteur **En retard** dans les stats

4. OEC → **Mes Paiements** : ligne colorée en rouge avec « ⚠ En retard »
5. OEC → page de paiement : alerte rouge d'urgence en haut

---

## SCÉNARIO 9 — Levée de suspension (§5.11)

**Objectif** : DAG émet une facture de levée de suspension.

1. DAG → Créer une facture :
   - Type : `Levée de suspension (§5.11)`
   - Montant : selon grille tarifaire active
   - Délai : `20`
2. OEC paie → DAG valide

**Résultat attendu** : Workflow reprend après validation

---

## SCÉNARIO 10 — Transfert d'accréditation forfaitaire (§5.12)

1. DAG → Créer une facture :
   - Type : `Transfert forfaitaire (§5.12)`
   - Montant : tarif forfaitaire de la grille active
2. OEC effectue le virement et soumet la preuve

---

## SCÉNARIO 11 — Multi-sites (§5.13 + Annexe 2)

1. DAG → Créer une facture :
   - Type : `Multi-sites (§5.13)`
   - Montant : tarif de base + (N sites additionnels × supplément/site)
2. Vérifier que le montant correspond à la grille tarifaire configurée (champ `multiSiteAdditionalSiteFee`)

---

## SCÉNARIO 12 — OEC étranger : paiement EUR via BEA SWIFT (PRO_18-1)

**Acteur** : OEC étranger + DAG

1. DAG crée une facture en EUR pour une demande d'OEC étranger :
   - Devise : `EUR`
   - Type : `Frais d'évaluation (§5.2)`
   - Montant : `4 500`
2. OEC étranger → **Mes Paiements** :

**Résultat attendu** :
- Coordonnées bancaires affichées : **BEA 038HBB**, SWIFT **BEXADZAL038**, compte `002000380383000019/97`
- Devise EUR affichée (PAS DZD)

3. OEC soumet preuve de virement SWIFT → DAG valide

---

## SCÉNARIO 13 — Traduction de certificat (§5.16 PRO_18-1)

1. DAG crée une facture :
   - Type : `Délivrance certificat (§5.4/5.14)` ou type dédié
   - Montant : valeur du champ `certificateTranslationFee` de la grille EUR active
2. OEC étranger paie en EUR via BEA

---

## SCÉNARIO 14 — Annulation < 8 jours ouvrables : frais engagés dus

**Contexte** : PRO_18 §6 — annulation tardive

1. Une évaluation est planifiée dans 5 jours
2. OEC demande l'annulation
3. DAG → Créer une facture :
   - Type : `Frais d'évaluation (§5.2)`
   - Montant : frais d'équipe déjà engagés (déplacement, préparation)
   - Note : `Annulation tardive < 8j ouvrables — PRO_18 §6`
4. L'OEC est obligé de payer malgré l'annulation

**Résultat attendu** : Facture créée, OEC notifié, délai 20j

---

## SCÉNARIO 15 — Archivage d'une grille tarifaire obsolète

1. DAG → Grilles Tarifaires → trouver la grille active
2. Cliquer l'icône **Archiver**
3. Confirmer dans la boîte de dialogue

**Résultat attendu** :
- Statut passe à **Archivé**
- La grille n'est plus proposée dans les calculs futurs
- Les paiements existants liés à cette grille restent intacts

---

## Vérifications transversales (pour tous les scénarios)

| Vérification | Attendu |
|---|---|
| Frais d'inscription | Non remboursables quoi qu'il arrive |
| Chaque étape facturée | Payée avant déclenchement de la suivante |
| Redevance annuelle pendant suspension | Toujours due (PRO_18 §6) |
| Factures référencées | FACT-YYYY-NNNNN auto-généré si vide |
| Délai évaluation | 20 jours par défaut (§6 PRO_18) |
| Délai redevance annuelle | 60 jours par défaut (§5.5 / §5.17) |
| Coordonnées CPA | OEC nationaux DZD uniquement |
| Coordonnées BEA SWIFT | OEC étrangers EUR/USD uniquement |
| Onglet **En retard** DAG | Mis à jour en temps réel |
| Couleur rouge lignes OEC | Dès que dueDate < today && status=PENDING |
