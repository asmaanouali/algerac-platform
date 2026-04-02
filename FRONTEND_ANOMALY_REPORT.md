# ALGERAC Platform — Frontend Business Procedure Anomaly Report

> Generated from comprehensive analysis of all page files, hooks, routing, sidebar navigation, shared schema, and shared routes.

---

## CATEGORY 1: HARDCODED URLs (CRITICAL — Production-Breaking)

All `http://localhost:8082` URLs will fail in any non-local environment.

| # | File | Description | Severity |
|---|------|-------------|----------|
| 1 | `pages/ges_competences/Dashboard.tsx` | 3 hardcoded `http://localhost:8082/api/candidatures/experts*` URLs (lines 44, 47, 48) | **CRITICAL** |
| 2 | `pages/ges_competences/CandidaturesPage.tsx` | 7+ hardcoded `http://localhost:8082/api/candidatures/experts*` URLs (lines 87, 169, 197, 207, 230, 290, 314) | **CRITICAL** |
| 3 | `pages/ges_competences/InterviewPlanningPage.tsx` | 5 hardcoded `http://localhost:8082` URLs (lines 80, 83, 84, 201, 227) | **CRITICAL** |
| 4 | `pages/ges_competences/InterviewEvaluationPage.tsx` | 10+ hardcoded `http://localhost:8082` URLs (lines 110, 111, 181, 209, 217, 236, 244, 272, 280, 308, 410) | **CRITICAL** |
| 5 | `pages/dt/CandidaturesOECPage.tsx` | 4 hardcoded `http://localhost:8082/api/oec-applications*` URLs (lines 91, 121, 167, 505) | **CRITICAL** |
| 6 | `pages/dt/CandidaturesPage.tsx` | 3 hardcoded `http://localhost:8082/api/candidatures/experts*` URLs (lines 43, 106, 137) | **CRITICAL** |
| 7 | `pages/admin/UsersManagementPage.tsx` | 5 hardcoded `http://localhost:8082` URLs (lines 150, 181, 182, 246, 247) | **CRITICAL** |
| 8 | `pages/admin/UtilisateursPendingPage.tsx` | 4 hardcoded `http://localhost:8082` URLs (lines 86, 87, 108, 109) | **CRITICAL** |
| 9 | `pages/admin/UsersPage.tsx` | 1 hardcoded `http://localhost:8082/api/users` URL (line 64) | **CRITICAL** |
| 10 | `components/AddUserDialog.tsx` | 1 hardcoded `http://localhost:8082/api/users/create` URL (line 41) | **CRITICAL** |
| 11 | `pages/auth/OECRegister.tsx` | 1 hardcoded `http://localhost:8082/api/auth/signup/oec` URL (line 633) | **CRITICAL** |

**Total: 44+ hardcoded localhost URLs across 11 files. ALL will break in production/staging.**

---

## CATEGORY 2: UNRESOLVED GIT MERGE CONFLICT (CRITICAL)

| # | File | Description | Severity |
|---|------|-------------|----------|
| 12 | `shared/schema.ts` | Unresolved git merge conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) at ~line 260. Duplicates type definitions for `User`, `Document`, `Notification` etc. This file likely fails to compile or produces incorrect types. | **CRITICAL** |

---

## CATEGORY 3: SCHEMA MISMATCHES — Missing Roles & Statuses

### 3a. Missing User Roles in `shared/schema.ts`

| # | File | Description | Severity |
|---|------|-------------|----------|
| 13 | `shared/schema.ts` (line 5) | `userRoles` only includes `["ADMIN", "RA", "CD", "DT", "OEC", "EXPERT"]`. **Missing roles actively used by the frontend**: `REE`, `ET`, `EQ`, `CAS_MEMBER`, `CAS_PRESIDENT`, `DG`, `DAG`, `GES_COMPETENCES`, `RQ`. These roles have dedicated pages, dashboards, and sidebar entries but cannot be validated against the schema. | **HIGH** |

### 3b. Missing Request Statuses in `shared/schema.ts`

| # | File | Description | Severity |
|---|------|-------------|----------|
| 14 | `shared/schema.ts` | Schema defines lowercase statuses (`draft`, `submitted`...) but ALL page files use UPPERCASE (`DRAFT`, `SUBMITTED`, `ASSIGNED_TO_RA`...). This creates a fundamental mismatch — Zod validation on request status will fail for any status from the backend. | **HIGH** |
| 15 | `pages/ra/FeasibilityPage.tsx` | Uses statuses not in schema: `RESOURCE_CHECK`, `FOREIGN_EXPERT_PROPOSED`, `PENDING_DG_VALIDATION`, `DG_VALIDATED`, `RECEIVABILITY_PENDING_CD_REVIEW`, `FEASIBILITY_APPROVED` | **HIGH** |
| 16 | `pages/ra/TeamCompositionPage.tsx` | Uses statuses not in schema: `TEAM_SENT_TO_CD`, `TEAM_CD_APPROVED`, `TEAM_CD_CHANGES_REQUESTED`, `TEAM_DATE_REFUSED`, `TEAM_MEMBER_RECUSED`, `TEAM_RECUSATION_INVALID` | **HIGH** |
| 17 | `pages/ra/DocumentaryReviewPage.tsx` | Uses statuses not in schema: `DOC_REVIEW_IN_PROGRESS`, `DOC_REVIEW_RESULTS_SUBMITTED`, `DOC_REVIEW_RESULTS_SENT_TO_CD`, `DOC_REVIEW_RESULTS_SENT_TO_OEC`, `DOC_REVIEW_CD_DECISION` | **HIGH** |
| 18 | `pages/ra/EvaluationPrepPage.tsx` | Uses statuses not in schema: `MANDATES_PREPARATION`, `MANDATES_PENDING_CD`, `MANDATES_CD_MODIFICATION`, `MANDATES_SENT_TO_TEAM`, `MISSION_ORDERS_PENDING`, `MISSION_ORDERS_PENDING_DT`, `MISSION_ORDERS_PENDING_DG`, `MISSION_ORDERS_SENT` | **HIGH** |
| 19 | `pages/ra/ReportValidationPage.tsx` | Uses statuses not in schema: `REPORT_DT_VALIDATED`, `REPORT_CONSOLIDATION` | **HIGH** |
| 20 | `pages/ree/EvaluationPlanPage.tsx` | Uses inline status flow `DRAFT→SUBMITTED_TO_RA→RA_APPROVED→PENDING_CD→CD_VALIDATED→SENT_TO_OEC` — these evaluation plan sub-statuses are not in the schema | **MEDIUM** |
| 21 | `pages/oec/MyRequestsPage.tsx` | Defines its own `STATUS_CONFIG` with ~45 statuses including `OBSTACLES_IDENTIFIED`, `CERTIFICATE_PREPARATION`, `DAG_APPROVED` etc. — many don't match schema | **HIGH** |
| 22 | `pages/oec/GapResponsePage.tsx` | Uses statuses `EVALUATION_OEC_ALL_ACCEPTED`, `ACTION_PLANS_EVALUATION` not in schema | **MEDIUM** |
| 23 | `pages/oec/OECGapReviewPage.tsx` | Uses statuses `EVALUATION_GAPS_SENT_TO_OEC`, `EVALUATION_OEC_REVIEW`, `EVALUATION_CLOSING_MEETING` not in schema | **MEDIUM** |
| 24 | `pages/cd/Dashboard.tsx` | References `TEAM_COMPOSITION` status not in schema | **MEDIUM** |
| 25 | `pages/ra/PlanningPage.tsx` | Uses lowercase statuses (`team_proposed`, `evaluation_in_progress`) inconsistent with other pages that use UPPERCASE — dual casing inconsistency | **MEDIUM** |

---

## CATEGORY 4: MISSING/INCOMPLETE API ROUTE DEFINITIONS

| # | File | Description | Severity |
|---|------|-------------|----------|
| 26 | `shared/routes.ts` | Only defines ~15 routes (auth, users.list, requests CRUD, documents, notifications, stats). The frontend pages call **100+ distinct API endpoints** that are completely undefined in routes.ts. No type safety for any workflow endpoints. | **HIGH** |
| 27 | `shared/routes.ts` | Missing entire endpoint families: `/api/workflow/*`, `/api/quotations/*`, `/api/conventions/*`, `/api/payments/*`, `/api/oec-applications/*`, `/api/candidatures/*`, `/api/complaints/*`, `/api/workflow/cas/*`, `/api/workflow/teams/*`, `/api/workflow/documentary-review/*`, `/api/workflow/mission-orders/*`, `/api/workflow/mandates/*`, `/api/workflow/surveillance/*`, `/api/workflow/site-evaluation/*`, `/api/workflow/gaps/*`, `/api/workflow/gap-treatment/*`, `/api/workflow/evaluation/*`, `/api/workflow/accreditation/*`, `/api/sampling/*`, `/api/multi-site/*`, `/api/remote-evaluation/*`, `/api/reference-rules/*`, `/api/risks/*`, `/api/tariffs/*` | **HIGH** |
| 28 | `hooks/use-stats.ts` | References `api.stats.admin.path` and `api.stats.ra.path` from routes.ts. These ARE defined in routes.ts but the response schemas may not match actual backend responses. | **LOW** |
| 29 | `hooks/use-documents.ts` | References `api.documents.list.path` — defined in routes.ts, but no other document endpoints (upload, delete, download) are defined. | **LOW** |

---

## CATEGORY 5: MOCK/HARDCODED FALLBACK DATA

| # | File | Description | Severity |
|---|------|-------------|----------|
| 30 | `pages/rq/ComplaintsDashboard.tsx` (line 94) | Falls back to **hardcoded mock complaints** with fabricated names (Ahmed Bensalem, Fatima Khelifi, Karim Meziane, Sara Belhadj), emails, and tracking codes when API fails. This means RQ role always sees fake data if backend is unavailable. Comment says "Mock data for development". | **HIGH** |
| 31 | `pages/ra/RecusationAnalysisPage.tsx` (line 72) | Falls back to **hardcoded mock recusation entries** with fabricated names (Dr. Amani Saidi, M. Karim Benali, Dr. Salim Ouafik), team/request IDs, and decision data when API fails. Also mocks `loadAvailableExperts()` with 3 fake experts. | **HIGH** |

---

## CATEGORY 6: SECURITY ISSUES

| # | File | Description | Severity |
|---|------|-------------|----------|
| 32 | `pages/admin/UtilisateursPendingPage.tsx` (line 122) | **Logs generated password to browser console**: `console.log("Mot de passe généré :", result.generatedPassword)`. This exposes credentials in browser dev tools. | **CRITICAL** |
| 33 | `App.tsx` | **No route guards/protected routes**. All 120+ routes are accessible without authentication checks at the router level. Any unauthenticated user can navigate to any page URL directly. Individual pages check `user` but render briefly before redirecting. | **HIGH** |
| 34 | `pages/ges_competences/InterviewEvaluationPage.tsx` (lines 129-130) | Debug `console.log` statements left in production code exposing candidate IDs and types. | **LOW** |

---

## CATEGORY 7: ROUTING & NAVIGATION ANOMALIES

### 7a. Duplicate Routes

| # | File | Description | Severity |
|---|------|-------------|----------|
| 35 | `App.tsx` (lines 208, 210) | Route `/admin/utilisateurs-pending` is registered **twice** pointing to the same `UtilisateursPendingPage`. Second route is dead code, first always matches. | **MEDIUM** |

### 7b. Route-Page Mismatches

| # | File | Description | Severity |
|---|------|-------------|----------|
| 36 | `App.tsx` | CAS routes (`/cas/reunions`, `/cas-president/reunions`, `/cas-president/decisions`) all point to Dashboard components instead of dedicated pages. No actual "Réunions" or "Décisions" page exists — the dashboard handles everything. | **MEDIUM** |
| 37 | `App.tsx` | REE has both `/ree/redaction-rapport` → `ReportDraftingPage` AND `/ree/rapports` → `ExpertReportDraftingPage` — two separate report pages for the same role with unclear distinction. | **MEDIUM** |
| 38 | `App.tsx` | REE/ET/EQ routes reuse Expert components (e.g., `/ree/planning` → `ExpertPlanningPage`), but the Expert components may not account for REE/ET/EQ-specific role logic since `userRoles` schema only knows "EXPERT". | **MEDIUM** |

### 7c. Sidebar-Route Misalignment  

| # | File | Description | Severity |
|---|------|-------------|----------|
| 39 | `layout-sidebar.tsx` | `RA` sidebar nav is missing links for `/ra/surveillance` (SurveillanceManagementPage) and `/ra/recusations` (RecusationAnalysisPage) — these pages exist and have routes but aren't navigable from sidebar. | **MEDIUM** |
| 40 | `layout-sidebar.tsx` | `CD` sidebar nav is missing link for `/cd/pilotage-evaluation` (EvaluationOversightPage) — route exists in App.tsx but not in nav items. | **MEDIUM** |

---

## CATEGORY 8: INCONSISTENT API CALL PATTERNS

| # | File | Description | Severity |
|---|------|-------------|----------|
| 41 | Multiple pages | Most pages bypass the `use-requests.ts` hook entirely, using direct `fetch()` or `apiRequest()` calls. The hook only provides `useRequests()`, `useRequest(id)`, `useCreateRequest()` — too limited for workflow operations. Creates inconsistency in error handling and caching. | **MEDIUM** |
| 42 | `pages/ra/TeamCompositionPage.tsx` | Uses raw `fetch()` without `apiRequest()` wrapper, missing centralized error handling and auth credential forwarding. | **MEDIUM** |
| 43 | `pages/ra/QuotationConventionPage.tsx` | Uses raw `fetch()` without `apiRequest()` wrapper for quotation/convention creation. | **MEDIUM** |
| 44 | `pages/ra/DossiersPage.tsx` | Calls `/api/accreditation-requests` while all other pages call `/api/requests`. Different base path for the same entity — possible endpoint mismatch. | **MEDIUM** |

---

## CATEGORY 9: RESPONSE FORMAT INCONSISTENCIES

| # | File | Description | Severity |
|---|------|-------------|----------|
| 45 | Multiple pages | Inconsistent response unwrapping: some pages expect `{ success, data, message }` wrapper (e.g., `GapResponsePage`, `OECGapReviewPage`, `DocumentaryResponsePage`), others expect raw arrays (e.g., `CertificateSigningPage` does `data.data || data`), and others destructure differently. No consistent API response contract. | **MEDIUM** |
| 46 | `pages/ree/ReportDraftingPage.tsx` | Expects `data.success` response wrapper — if backend returns raw array, the page will silently fail to process the response. | **MEDIUM** |
| 47 | `pages/shared/CertificateSigningPage.tsx` | Uses `any` type extensively — `useState<any[]>([])` for items, no type safety on certificate data structure. | **LOW** |

---

## CATEGORY 10: ROLE-BASED RENDERING / CROSS-ROLE ISSUES

| # | File | Description | Severity |
|---|------|-------------|----------|
| 48 | `pages/dt/MissionOrdersPage.tsx` | Contains `handleDGApproval` function — a DG-level action embedded inside a DT page. DT users should not have DG approval capability. | **HIGH** |
| 49 | `pages/ree/GapTreatmentPage.tsx` | Shared by REE and CD — checks `user?.role === "CD"` to determine behavior. Yet both roles access the same component through different routes without clear separation. | **MEDIUM** |
| 50 | `pages/shared/CertificateSigningPage.tsx` | Checks `roleUpper === "DT"` or `roleUpper === "DG"` for signature eligibility. Accesses role via `(user as any)?.role || (user as any)?.typeRole` — fragile role detection with type assertion. | **MEDIUM** |
| 51 | `pages/admin/Dashboard.tsx` | Counts expert users by checking `["EXPERT", "EVALUATEUR", "FORMATEUR", "ET", "EQ", "REE"].includes(u.role)` — but `userRoles` in schema doesn't include ET/EQ/REE, so this filter may not match backend role values. | **MEDIUM** |

---

## CATEGORY 11: MISSING FORM VALIDATIONS

| # | File | Description | Severity |
|---|------|-------------|----------|
| 52 | `pages/oec/NewRequestPage.tsx` | Complex multi-step form (request type, domain, activity type, documents) without Zod schema validation. Relies on manual client-side checks only. | **MEDIUM** |
| 53 | `pages/complaints/PublicComplaintPage.tsx` | File upload accepts files up to 10MB with `file.size > 10 * 1024 * 1024` check but no file type validation — any file type can be uploaded. | **MEDIUM** |
| 54 | `pages/oec/LiftObstaclesPage.tsx` | Single textarea for obstacle resolution — no structured form, no file upload for evidence, minimal validation (only checks non-empty). | **LOW** |
| 55 | `pages/oec/ActionPlansPage.tsx` | Validates completeness of action plans but no date format/range validation on `deadline` field. | **LOW** |
| 56 | `pages/oec/PaymentPage.tsx` | Transaction ID is validated as non-empty only — no format validation (alphanumeric, length, etc.). | **LOW** |

---

## CATEGORY 12: MISSING WORKFLOW STEPS

| # | File | Description | Severity |
|---|------|-------------|----------|
| 57 | `pages/ra/AccreditationDecisionPage.tsx` | Handles reports, CAS scheduling, certificate preparation, and surveillance setup all in one page. PRO_07 (CAS procedure) and PRO_16 (surveillance) are separate procedures that should have dedicated workflow pages. | **MEDIUM** |
| 58 | No dedicated page exists | **Missing surveillance follow-up pages for OEC**: After accreditation is granted, the OEC should have pages to view surveillance schedules, prepare for surveillance visits — these pages don't exist under `pages/oec/`. | **MEDIUM** |
| 59 | No dedicated page exists | **Missing DG receivability validation page**: DG validates receivability (status `PENDING_DG_VALIDATION` → `DG_VALIDATED`), but the DG Dashboard handles this inline. No dedicated workflow page. | **LOW** |
| 60 | No dedicated page exists | **Missing OEC profile/document management**: `pages/oec/ProfilePage.tsx` and `pages/oec/DocumentsPage.tsx` exist but were referenced — not checked for completeness of the OEC self-service workflow. | **LOW** |

---

## CATEGORY 13: i18n / LOCALIZATION ISSUES

| # | File | Description | Severity |
|---|------|-------------|----------|
| 61 | `pages/complaints/InternalComplaintsPage.tsx` | Hardcodes French category labels (`"Qualité du service"`, `"Délais de traitement"` etc.) instead of using `t()` translations — inconsistent with `PublicComplaintPage.tsx` which uses `t('complaints.categories.quality')`. | **MEDIUM** |
| 62 | Multiple pages | Most pages hardcode French status labels in `statusLabel` maps or `STATUS_CONFIG` objects instead of using i18n keys. Status translations not centralized. | **LOW** |
| 63 | `pages/ges_competences/*` | All GES_COMPETENCES pages use hardcoded French without any `useTranslation()` hook — no i18n support at all. | **LOW** |

---

## CATEGORY 14: MISCELLANEOUS CODE QUALITY

| # | File | Description | Severity |
|---|------|-------------|----------|
| 64 | `pages/ges_competences/CandidaturesPage.tsx.bak` | Backup file left in source tree with hardcoded localhost URLs. Should not be in repository. | **LOW** |
| 65 | `pages/auth/ExpertRegister.tsx.bak`, `ExpertRegister.backup.txt` | Backup files with hardcoded localhost URLs left in source tree. | **LOW** |
| 66 | `pages/ra/DocumentaryReviewPage.tsx` (line 71) | Empty catch block `catch (_) {}` — silently swallows errors during data loading. | **LOW** |
| 67 | `pages/exp/DocumentaryAnalysisPage.tsx` (line 75) | Empty catch block `catch (_) {}` — silently swallows errors. | **LOW** |

---

## SUMMARY

| Severity | Count |
|----------|-------|
| **CRITICAL** | 13 (11 hardcoded URL files + 1 merge conflict + 1 password leak) |
| **HIGH** | 15 (missing roles, missing statuses, mock data, no route guards, cross-role action) |
| **MEDIUM** | 27 (nav misalignment, form validation, i18n, inconsistent patterns) |
| **LOW** | 12 (debug logs, backup files, minor validation gaps) |
| **TOTAL** | **67 anomalies** |

### Top Priority Fixes:
1. **Replace all 44+ `http://localhost:8082` URLs** with relative paths (`/api/...`)
2. **Resolve git merge conflict** in `shared/schema.ts`
3. **Remove `console.log` of generated password** in `UtilisateursPendingPage.tsx`
4. **Add missing roles** to `userRoles` in `shared/schema.ts`
5. **Align status casing** — either make schema UPPERCASE or pages lowercase
6. **Remove mock/fallback data** from `ComplaintsDashboard.tsx` and `RecusationAnalysisPage.tsx`
7. **Add route guards** in `App.tsx` for authenticated/role-based access
