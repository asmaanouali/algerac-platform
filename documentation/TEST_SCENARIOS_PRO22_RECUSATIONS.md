# Scénarios de Test — PRO 22 : Traitement des Récusations ALGERAC

> **Procédure de référence :** PRO_22 Procédure de Traitement des Récusations — Rev 02 — 03/06/2025  
> **Scope :** Récusation d'un ou plusieurs membres d'une équipe d'évaluation par un OEC.  
> **Acteurs :** OEC (Organisme d'Évaluation de la Conformité), RA (Responsable Accréditation), CD (Comité de Direction), Experts/Évaluateurs désignés.

---

## Prérequis généraux

- Un dossier d'accréditation en statut `TEAM_DESIGNATION` ou `TEAM_VALIDATED` avec une équipe d'évaluation composée d'au moins 2 membres.
- Les membres de l'équipe ont un expert assigné avec `fullName` et `email` renseignés.
- L'OEC est connecté avec le rôle `OEC`.
- Le RA est connecté avec le rôle `RA`.
- Des experts supplémentaires existent dans la base (pour les remplacements) avec le statut `APPROVED`.

---

## Scénario 1 — Récusation valide : premier dépôt, RA accepte, membre remplacé

**Objectif :** Tester le flux complet et nominal de PRO 22 (première récusation recevable).

### Étapes

1. **Connexion OEC** → Naviguer vers `Validation Équipe d'Évaluation` du dossier concerné.
2. Observer la section "Décision sur les membres de l'équipe" :
   - Le bouton **"Récuser un ou des membres (PRO 22)"** doit être **actif**.
   - Aucune alerte de limite n'est affichée (`recusationCount = 0`).
3. Cliquer sur **"Récuser un ou des membres"** → la boîte de dialogue s'ouvre.
4. Vérifier le titre : "Récusation de membres (PRO 22)" et le sous-titre "Récusation 1 sur 2 autorisées".
5. Vérifier l'alerte amber : critères PRO 22 (conflit d'intérêt) et "2 récusation(s) restante(s)".
6. Cocher un membre (ex. Expert A).
7. Saisir une raison : `"L'évaluateur M. Dupont a travaillé au sein de notre organisme de 2019 à 2021 en tant que responsable qualité."`.
8. Joindre un fichier de preuve (ex. contrat PDF).
9. Cliquer **"Confirmer la récusation"**.

**Résultats attendus :**
- Toast de confirmation : "Récusation soumise (PRO 22)".
- Le statut de la demande passe à `TEAM_MEMBER_RECUSED` (ou `MEMBER_RECUSED`).
- Le dossier est now `pendingWith = "RA"`.
- `team.recusationCount` passe à 1.

---

### Suite Scénario 1 — RA reçoit et examine la récusation

10. **Connexion RA** → Naviguer vers `Analyse des Récusations`.
11. Vérifier que le dossier apparaît dans la table avec :
    - Colonne "Nb. récus." : badge `1/2`.
    - Statut : "En attente".
12. Cliquer sur le bouton **"Détails"** :
    - Vérifier l'alerte PRO 22 (critères de recevabilité).
    - Vérifier que la raison OEC est affichée.
    - Vérifier que les documents de preuve sont listés.
    - Vérifier le sous-titre "Récusation 1/2".
13. Fermer la boîte de détails.
14. Cliquer sur **"Décider"** → la boîte de décision s'ouvre.
15. Vérifier l'alerte amber (critères PRO 22) et le motif OEC.
16. Pour Expert A (le membre récusé), sélectionner un expert de remplacement depuis la liste (ex. Expert B).
17. Saisir la justification : `"La récusation est fondée : conflit d'intérêt avéré — travail antérieur confirmé par le document joint."`.
18. Cliquer **"Accepter — Remplacer"**.

**Résultats attendus :**
- Toast de succès.
- Statut de la demande : `TEAM_DESIGNATION` (équipe retourne en draft pour le nouveau membre).
- Expert A retiré de l'équipe, Expert B intégré.
- Expert B notifié (notification dans la base).
- `confidentialityAgreementSigned` et `impartialityAgreementSigned` de Expert B remis à `false`.
- Dans la liste des récusations : statut passe à "Acceptée".

---

## Scénario 2 — Récusation non fondée : RA rejette, équipe maintenue

**Objectif :** Tester le rejet d'une récusation sans fondement valide (PRO 22 §5.2).

### Étapes

1. **Connexion OEC** → Soumettre une récusation avec raison : `"Je n'aime pas la façon dont cet évaluateur s'est comporté lors d'une précédente réunion."` (motif non recevable — pas un conflit d'intérêt).
2. **Connexion RA** → Ouvrir la boîte de décision.
3. Vérifier l'alerte amber rappelant les critères valides.
4. Ne pas sélectionner de remplaçant (aucun remplacement requis pour un rejet).
5. Saisir : `"La récusation n'est pas recevable : le motif invoqué ne constitue pas un conflit d'intérêt au sens de PRO 22. L'équipe est maintenue."`.
6. Cliquer **"Rejeter — Maintenir l'équipe"**.

**Résultats attendus :**
- Toast de succès.
- Statut : `TEAM_RECUSATION_INVALID`.
- `oecValidated = true`, `hasRecusation = false`.
- Les membres récusés ont leur flag `recusedByOEC` réinitialisé.
- L'OEC est notifié du rejet.
- Dans la liste des récusations : statut "Rejetée".
- Le dossier avance normalement vers l'évaluation sur site (PRO 12 / PRO 25).

---

## Scénario 3 — Deuxième récusation (après un premier rejet)

**Objectif :** Vérifier que l'OEC peut soumettre une 2e récusation après un premier rejet (compteur = 1).

### Prérequis
- Scénario 2 complété : `recusationCount = 1`.

### Étapes

1. **Connexion OEC** → Revenir sur la page de validation de l'équipe.
2. Vérifier que le bouton "Récuser" est toujours **actif** (limite = 2, déjà utilisé = 1).
3. Vérifier l'alerte amber dans la boîte : "1 récusation(s) restante(s)".
4. Vérifier le sous-titre : "Récusation 2 sur 2 autorisées".
5. Récuser un autre membre (Expert C) avec un motif valide.
6. Soumettre la récusation.

**Résultats attendus :**
- Récusation acceptée par le système.
- `recusationCount = 2`.
- La demande retourne chez le RA pour décision.

---

## Scénario 4 — Tentative d'une 3e récusation (limite PRO 22 atteinte)

**Objectif :** Vérifier que le système bloque toute récusation après 2 tentatives.

### Prérequis
- `recusationCount = 2` sur l'équipe.

### Étapes

**Test frontend :**
1. **Connexion OEC** → Ouvrir la page de validation de l'équipe.
2. Observer la section "Décision sur les membres" :
   - Alerte rouge : "Limite atteinte : Vous avez utilisé vos 2 récusations autorisées (PRO 22)."
   - Bouton "Récuser un ou des membres" est **grisé** (disabled).
3. Vérifier que le clic sur le bouton n'a aucun effet.

**Test backend (API directe) :**
4. Envoyer manuellement un `POST /api/workflow/teams/{teamId}/oec-response` avec `validated: false`.
5. Vérifier la réponse : **HTTP 400** ou **500** avec message `"Limite de récusations atteinte (max 2 par PRO 22)"`.

**Résultats attendus :**
- Frontend : bouton désactivé + alerte rouge visible.
- Backend : exception levée, aucune modification de la base de données.

---

## Scénario 5 — Acceptation sans expert de remplacement sélectionné

**Objectif :** Vérifier la validation de formulaire côté frontend (PRO 22 — le remplacement est obligatoire en cas d'acceptation).

### Étapes

1. **Connexion RA** → Ouvrir la boîte de décision d'une récusation en attente.
2. Saisir une justification mais **ne pas sélectionner** de remplaçant.
3. Cliquer **"Accepter — Remplacer"**.

**Résultats attendus :**
- Le backend retourne une erreur : `"Replacements are required when accepting a recusation"`.
- Toast d'erreur affiché à l'utilisateur.
- Aucune modification de la base de données.

---

## Scénario 6 — Acceptation sans justification

**Objectif :** Vérifier que la décision sans texte de justification est bloquée.

### Étapes

1. **Connexion RA** → Ouvrir la boîte de décision.
2. Sélectionner un expert de remplacement.
3. Laisser le champ de justification **vide**.
4. Vérifier que le bouton **"Accepter — Remplacer"** est **grisé** (disabled tant que `raDecisionNote` est vide).

**Résultats attendus :**
- Bouton désactivé, aucune soumission possible.
- Idem pour "Rejeter — Maintenir l'équipe" : bouton aussi désactivé sans justification.

---

## Scénario 7 — Récusation de plusieurs membres simultanément

**Objectif :** Tester la récusation de 2 membres en une seule soumission.

### Étapes

1. **Connexion OEC** → Boîte de récusation.
2. Cocher **2 membres** (Expert A et Expert B).
3. Saisir un motif valide commun.
4. Soumettre.
5. **Connexion RA** → Ouvrir la décision.
6. Vérifier que **2 lignes de remplacement** apparaissent dans la boîte de décision (une par membre récusé).
7. Sélectionner un expert différent pour chacun (Expert C pour A, Expert D pour B).
8. Justifier et accepter.

**Résultats attendus :**
- Expert A remplacé par Expert C.
- Expert B remplacé par Expert D.
- Experts C et D notifiés individuellement.
- Chacun doit re-signer confidentialité et impartialité.
- `recusationCount` incrémenté de 1 (pas de 2 — une récusation = une soumission).

---

## Scénario 8 — Consultation de l'historique des récusations décidées

**Objectif :** Vérifier que la liste `GET /api/workflow/recusations` retourne aussi les récusations déjà traitées.

### Étapes

1. **Connexion RA** → Naviguer vers `Analyse des Récusations`.
2. Vérifier que des dossiers avec statut "Acceptée" et "Rejetée" apparaissent dans la table (si des décisions antérieures existent).
3. Cliquer sur **"Détails"** d'une récusation déjà décidée.
4. Vérifier :
   - Le statut de la récusation (Acceptée / Rejetée).
   - La date de décision (`decidedAt`).
   - La décision du RA (`raDecision`) affichée.

**Résultats attendus :**
- Les récusations décidées sont visibles avec leur statut correct.
- Les détails complets (motif, membres, décision) sont accessibles en lecture seule.

---

## Scénario 9 — Récusation et suite du processus (FOR 26, FOR 44)

**Objectif :** Vérifier la continuité du workflow après remplacement (PRO 22 → PRO 12 / PRO 25).

### Étapes

1. Récusation acceptée par RA (Expert A → Expert B).
2. **Connexion RA / CD** → Vérifier que la demande est en statut `TEAM_DESIGNATION`.
3. Expert B reçoit une notification pour signer les engagements.
4. Expert B signe confidentialité et impartialité.
5. RA re-valide la composition de l'équipe (nouvel FOR 26 généré).
6. OEC reçoit la mise à jour et peut re-valider l'équipe.

**Résultats attendus :**
- Le workflow reprend normalement après le remplacement.
- L'OEC peut voir le nouveau membre dans la liste de l'équipe.
- Une fois l'équipe validée par l'OEC, l'évaluation sur site peut commencer (PRO 12 / PRO 25).

---

## Scénario 10 — Vérification des experts disponibles pour remplacement

**Objectif :** Tester l'endpoint `GET /api/workflow/teams/{id}/available-replacements`.

### Étapes

1. **RA** clique "Décider" sur une récusation.
2. Observer la liste d'experts dans le select.

**Résultats attendus :**
- Seuls les experts avec statut `APPROVED` apparaissent.
- Les membres **actuels** de l'équipe (non récusés) **n'apparaissent pas** dans la liste.
- Chaque expert affiche : nom complet, spécialité, nombre de dossiers actifs (`activeDossiers`).
- Les rôles filtrés incluent : `EXPERT`, `REE`, `ET`, `EQ`, `EVALUATEUR`.

---

## Résumé des cas limites

| Cas | Comportement attendu |
|-----|---------------------|
| `recusationCount = 0` | Bouton actif, alerte "2 restante(s)" dans la boîte |
| `recusationCount = 1` | Bouton actif, alerte "1 restante(s)" dans la boîte, titre "Récusation 2 sur 2" |
| `recusationCount = 2` | Bouton grisé, alerte rouge "Limite atteinte", backend rejette aussi |
| Récusation sans motif | Bouton "Confirmer" désactivé |
| Accepter sans remplacement | Bouton désactivé + erreur backend |
| Décider sans justification RA | Boutons "Accepter" et "Rejeter" désactivés |
| 0 expert disponible | Message "Aucun expert disponible" dans le select |

---

## Vérification des données en base

Après chaque scénario, vérifier dans PostgreSQL :

```sql
-- État de l'équipe après récusation
SELECT id, team_code, status, has_recusation, recusation_count,
       recusation_reason, recusation_decision, recusation_decision_reason,
       recusation_decision_date, proof_documents
FROM evaluation_teams
WHERE request_id = <ID_DOSSIER>;

-- Membres de l'équipe (vérifier le remplacement)
SELECT tm.id, tm.role, tm.recused_by_oec,
       tm.confidentiality_agreement_signed, tm.impartiality_agreement_signed,
       u.full_name as expert_name
FROM team_members tm
JOIN users u ON tm.expert_id = u.id
WHERE tm.team_id = <ID_EQUIPE>;

-- Notifications envoyées
SELECT * FROM notifications
WHERE related_request_id = <ID_DOSSIER>
ORDER BY created_at DESC
LIMIT 10;
```

---

*Document généré pour la procédure PRO 22 — ALGERAC — Implémentation production-ready.*
