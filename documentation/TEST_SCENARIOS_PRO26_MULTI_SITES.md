# Scénarios de test — PRO 26 : Accréditation Multi-sites
> Révision 03 · 24/01/2023 · Toutes les étapes du cycle complet

---

## Prérequis

- Backend démarré (`mvn spring-boot:run` depuis `backend/`)
- Frontend démarré (`npm run dev` depuis la racine)
- Connecté en tant que **CD** (Chef de Département) pour les actions de revue/décision
- Connecté en tant que **OEC** ou **administrateur** pour la création de demandes

---

## 1. Vérification des critères de qualification (§5.1)

### Scénario 1.1 — Tous les critères satisfaits ✅

**Objectif :** Créer une configuration multi-site où les 6 critères §5.1 sont cochés.

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Aller sur `/cd/multi-sites` | Page chargée, tableau vide ou avec des configs existantes |
| 2 | Cliquer **Nouvelle configuration** | Dialog s'ouvre |
| 3 | Entrer ID demande: `1` | Champ rempli |
| 4 | Entrer nom siège: `Laboratoire Central SARL` | Champ rempli |
| 5 | Entrer adresse: `10 Rue de l'Industrie, Alger` | Champ rempli |
| 6 | **Cocher les 6 critères §5.1** | Toutes les cases cochées |
| 7 | Entrer `4` satellites | Champ rempli |
| 8 | Voir l'aperçu calcul | **Initial: 5 sites** (n+1), **Surveillance: 3 sites/an** (1+⌈√4⌉=3) |
| 9 | Cliquer **Créer la configuration** | Toast "Configuration multi-site créée" ✅ |
| 10 | Vérifier dans le tableau | Config apparaît avec statut **Brouillon** |

### Scénario 1.2 — Un critère §5.1 non satisfait ❌

**Objectif :** Tenter de créer sans cocher le critère "Lien juridique".

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Ouvrir dialog Nouvelle configuration | Dialog ouvert |
| 2 | Remplir les champs obligatoires | OK |
| 3 | **Ne pas cocher** "Lien juridique" | 5 critères cochés seulement |
| 4 | Voir le message d'avertissement | `1 critère(s) non satisfait(s) — demande refusée (§5.2.1)` en orange |
| 5 | Cliquer **Créer** | Toast rouge "Critères §5.1 non satisfaits — Cochez tous les critères" ❌ |
| 6 | Config **non créée** dans le tableau | Comportement correct |

---

## 2. Création et cycle DRAFT → SUBMITTED

### Scénario 2.1 — Gestion des sites satellites dynamique

**Objectif :** Tester l'ajout/suppression de sites satellites dans le formulaire.

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Créer nouvelle config avec `3` satellites | 3 sites dans la liste |
| 2 | Remplir Site #1: `Annaba`, `Rue Hussein Dey`, `Analyses chimiques`, `2 techniciens` | Formulaire rempli |
| 3 | Remplir Site #2: `Oran`, `Zone industrielle`, `Métrologie`, `3 experts` | OK |
| 4 | Cliquer **Ajouter un site satellite** | Site #4 apparaît |
| 5 | Supprimer Site #4 avec le bouton poubelle | Site #4 retiré |
| 6 | Finaliser et créer | Config créée avec 3 satellites |
| 7 | Cliquer **Voir** sur la config | Dialog détail, section Sites satellites affiche les 3 sites |

### Scénario 2.2 — Soumettre pour revue CD

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **Brouillon** | Bouton **Soumettre** visible |
| 2 | Cliquer **Soumettre** | Toast "Soumis pour revue CD" ✅ |
| 3 | Statut → **Soumis** (badge bleu) | Boutons **Modifier** et **Soumettre** remplacés par **Prendre en charge** |

---

## 3. Cycle CD_REVIEW → Décision §5.2.1

### Scénario 3.1 — Prise en charge par le CD

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **Soumis** | Bouton **Prendre en charge** visible |
| 2 | Cliquer **Prendre en charge** | Toast "Prise en charge par le CD" |
| 3 | Statut → **En revue CD** (badge violet) | Bouton **Décision §5.2.1** visible |

### Scénario 3.2 — Validation par le CD (§5.2.1)

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **En revue CD** | Bouton **Décision §5.2.1** |
| 2 | Cliquer le bouton | Dialog décision s'ouvre avec info siège + nb satellites |
| 3 | Sélectionner **Valider** | Case verte sélectionnée |
| 4 | Optionnel: saisir commentaire | Champ libre |
| 5 | Cliquer **✓ Valider** | Toast "✓ Configuration validée" |
| 6 | Statut → **Validé** (badge vert) | Bouton **Activer** visible |

### Scénario 3.3 — Modifications demandées (§5.2.1)

**Cas : le critère "SM géré centralement" n'est pas démontré**

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **En revue CD** | OK |
| 2 | Ouvrir Dialog Décision | Dialog ouvert |
| 3 | Sélectionner **Demander modifications** | Case orange sélectionnée |
| 4 | **Ne pas remplir les commentaires** | Cliquer Confirmer |
| 5 | Résultat | Toast rouge "Commentaires requis — Précisez les modifications demandées" ❌ |
| 6 | Saisir: `"Le SM centralisé n'est pas démontré. Fournir le plan d'audit interne couvrant tous les sites."` | Champ rempli |
| 7 | Cliquer **Demander modifications** | Toast "Modifications demandées" |
| 8 | Statut → **Modifications requises** (badge orange) | Commentaire CD visible dans le détail |

---

## 4. Cycle CHANGES_REQUESTED → DRAFT → SUBMITTED (boucle)

### Scénario 4.1 — Mise à jour après modifications demandées

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **Modifications requises** | Boutons **Modifier** + **Soumettre** visibles |
| 2 | Cliquer **Modifier** | Dialog ouvert avec données pré-remplies |
| 3 | Corriger la description du SM: `"Audit interne trimestriel couvrant les 4 sites + revue de direction biannuelle"` | Modifié |
| 4 | Cliquer **Enregistrer** | Toast "Configuration mise à jour" |
| 5 | Statut → **Brouillon** (reset automatique) | Bouton Soumettre disponible |
| 6 | Soumettre à nouveau | Toast "Soumis pour revue CD" |
| 7 | CD prend en charge + valide | Statut → **Validé** |

---

## 5. Activation et archivage

### Scénario 5.1 — Activation de la configuration

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **Validé** | Bouton **Activer** (vert) visible |
| 2 | Cliquer **Activer** | Toast "Configuration activée" |
| 3 | Statut → **Actif** (badge émeraude) | Boutons **Constatations** + icône **Archive** visibles |

### Scénario 5.2 — Archivage

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **Actif** | Icône archive visible |
| 2 | Cliquer l'icône archive | Toast "Configuration archivée" |
| 3 | Statut → **Archivé** (badge gris) | Aucun bouton d'action |

---

## 6. Vérification des formules d'échantillonnage

### Scénario 6.1 — Formule initiale : TOUS les sites (§5.3.2-a)

> PRO 26 §5.3.2-a : lors de l'évaluation initiale, **tous les sites sont évalués sans échantillonnage**.

| n (satellites) | Initial attendu | Surveillance attendu |
|---|---|---|
| 0 | 1 (siège seul) | 1 |
| 1 | 2 (siège + 1) | 2 (1+⌈√1⌉=2) |
| 3 | 4 (siège + 3) | 3 (1+⌈√3⌉=1+2=3) |
| 4 | 5 (siège + 4) | 3 (1+⌈√4⌉=1+2=3) |
| 9 | 10 (siège + 9) | 4 (1+⌈√9⌉=1+3=4) |
| 16 | 17 (siège + 16) | 5 (1+⌈√16⌉=1+4=5) |
| 25 | 26 (siège + 25) | 6 (1+⌈√25⌉=1+5=6) |

**Test :** Créer des configs avec n=4, n=9, n=16. Vérifier colonnes **Initial (tous)** et **Surveillance (√n)** dans le tableau.

### Scénario 6.2 — Vérification via API

```
GET /api/multi-site
```
Vérifier dans la réponse JSON pour chaque config :
- `sitesToEvaluateInitial == totalSatelliteSites + 1`  
- `sitesToEvaluateAnnual == 1 + ceil(sqrt(totalSatelliteSites))`

---

## 7. Enregistrement des constatations §5.4

### Scénario 7.1 — Non-conformité critique sur un site

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Config au statut **Actif** | Bouton **Constatations** visible |
| 2 | Cliquer **Constatations** | Dialog s'ouvre |
| 3 | Voir l'alerte §5.4-a | "En cas d'écart systémique, le CD peut décider d'une évaluation complémentaire..." |
| 4 | Saisir : `[Siège] NC-001: Procédure de maîtrise documentaire non appliquée. [Annaba] EC-001: Formulaire de calibration obsolète.` | Texte saisi |
| 5 | Cliquer **Enregistrer** | Toast "Constatations enregistrées" |
| 6 | Ouvrir le détail (Voir) | Section "Constatations d'évaluation (§5.4)" affichée avec le texte |

### Scénario 7.2 — Écart systémique (tous les sites)

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Ouvrir Dialog Constatations | OK |
| 2 | Saisir: `Écart systémique: Tous les sites présentent des défaillances dans le programme d'audit interne. Évaluation complémentaire requise sur l'ensemble des 4 sites (§5.4-a).` | Saisi |
| 3 | Enregistrer | Constatations enregistrées |
| 4 | Action CD : lancer une évaluation complémentaire (hors périmètre PRO 26, géré via PRO 13-1) | Manuel |

---

## 8. Certificat §5.5

### Scénario 8.1 — Informations du certificat dans le détail

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Ouvrir Dialog Détail d'une config | OK |
| 2 | Scroller jusqu'à la section verte **Certificat (§5.5)** | Section visible |
| 3 | Vérifier le texte | "Un certificat unique sera émis (FOR 16-1 si portée reconnue EA, FOR 16-3 sinon), incluant le nom du siège et la liste de tous les sites en annexe technique." |

> Note : FOR 16-1 = portée internationale EA ; FOR 16-3 = portée nationale uniquement.

---

## 9. Filtres et statistiques

### Scénario 9.1 — Onglets de filtrage

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Avoir ≥3 configs avec statuts variés | Au moins 1 SUBMITTED, 1 ACTIVE, 1 CHANGES_REQUESTED |
| 2 | Cliquer onglet **En revue** | Uniquement SUBMITTED + CD_REVIEW |
| 3 | Cliquer onglet **Actives** | Uniquement ACTIVE |
| 4 | Cliquer onglet **Modifications** | Uniquement CHANGES_REQUESTED |
| 5 | Cliquer onglet **Toutes** | Toutes les configs |

### Scénario 9.2 — Cartes de statistiques

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Créer 3 configs: 1 ACTIVE, 1 SUBMITTED, 1 CHANGES_REQUESTED | Statuts corrects |
| 2 | Observer les cartes en haut | **Total: 3**, **En attente revue: 1**, **Actives: 1**, **Modifications requises: 1** |

---

## 10. Tests API directs (Postman / curl)

### 10.1 — Créer une configuration

```http
POST /api/multi-site
Content-Type: application/json

{
  "requestId": 1,
  "mainSiteName": "Laboratoire National Test",
  "mainSiteAddress": "123 Rue Test, Alger",
  "mainSiteContact": "Dr. Ahmed Benali",
  "mainSiteEmail": "contact@lnt.dz",
  "centralizedSystem": true,
  "managementSystemDesc": "SM ISO 17025 centralisé depuis le siège",
  "totalSatellites": 4,
  "satelliteSites": "[{\"name\":\"Annaba\",\"address\":\"Zone ind.\",\"activities\":\"Analyses\",\"personnel\":\"3\"},{\"name\":\"Oran\",\"address\":\"Bir El Djir\",\"activities\":\"Métrologie\",\"personnel\":\"2\"}]",
  "selectionCriteria": "Sélection basée sur le volume d'activité et les écarts historiques",
  "siteSamplingJustification": "Formule PRO 13-1 : 1+√n sites par an"
}
```

**Attendu :**
```json
{
  "success": true,
  "data": {
    "id": ...,
    "configCode": "MSC-...",
    "sitesToEvaluateInitial": 5,
    "sitesToEvaluateAnnual": 3,
    "status": "DRAFT"
  }
}
```

### 10.2 — Workflow complet via API

```http
PUT /api/multi-site/{id}/submit
PUT /api/multi-site/{id}/cd-review
PUT /api/multi-site/{id}/decide
Body: { "approved": true, "comments": "Tous les critères §5.1 satisfaits" }
PUT /api/multi-site/{id}/activate
PUT /api/multi-site/{id}/archive
```

### 10.3 — Transitions interdites

| Action | Statut actuel | Résultat attendu |
|--------|---------------|-----------------|
| `PUT /submit` | ACTIVE | Erreur 400 "Transition interdite" |
| `PUT /cd-review` | DRAFT | Erreur 400 |
| `PUT /decide` | SUBMITTED | Erreur 400 (doit d'abord passer en CD_REVIEW) |
| `PUT /activate` | DRAFT | Erreur 400 |

### 10.4 — GET par demande

```http
GET /api/multi-site/request/{requestId}
```

**Attendu :** Liste de toutes les configs liées à cette demande.

---

## 11. Cas limites

### Scénario 11.1 — Config avec 0 satellite

| n | Initial | Surveillance |
|---|---------|-------------|
| 0 | 1 (siège seul) | 1 |

Créer une config avec `totalSatellites = 0`. Vérifier que les colonnes affichent **1 site** pour initial et surveillance.

### Scénario 11.2 — Demande inexistante

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Créer config avec `requestId: 99999` | Erreur 400 "Demande introuvable" ou "Request 99999 not found" |

### Scénario 11.3 — Champs obligatoires manquants

| Étape | Action | Résultat attendu |
|-------|--------|-----------------|
| 1 | Soumettre le formulaire sans `mainSiteName` | Toast rouge "Champs requis" |
| 2 | Soumettre sans `requestId` | Toast rouge "Champs requis" |

---

## Récapitulatif des transitions de statut

```
DRAFT ──[submit]──► SUBMITTED ──[cd-review]──► CD_REVIEW ──[decide: approve]──► VALIDATED ──[activate]──► ACTIVE ──[archive]──► ARCHIVED
  ▲                                                        │
  │                                                        └──[decide: reject]──► CHANGES_REQUESTED ──[update]──► DRAFT
  │                                                                                         │
  └─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Checklist finale de validation PRO 26

- [ ] Critères §5.1 : refus si au moins 1 critère manquant
- [ ] §5.2.1 : admissibilité par le CD avec commentaire obligatoire si rejet
- [ ] §5.3.2-a : initial = TOUS les sites (n+1)
- [ ] PRO 13-1 : surveillance = 1+⌈√n⌉ sites/an
- [ ] §5.4 : constatations enregistrées, visible dans le détail
- [ ] §5.5 : mention du certificat unique (FOR 16-1 / FOR 16-3) dans le détail
- [ ] DOC 02 : convention avec le siège social mentionnée dans le dialog de validation
- [ ] Cycle complet DRAFT → SUBMITTED → CD_REVIEW → VALIDATED → ACTIVE → ARCHIVED
- [ ] Boucle CHANGES_REQUESTED → DRAFT après modification
- [ ] Statut reset à DRAFT automatiquement après `updateConfig` quand statut = CHANGES_REQUESTED
