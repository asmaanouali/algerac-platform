import { useEffect } from "react";
import { useLocation } from "wouter";

const APP_NAME = "ALGERAC";

const routeTitles: Array<[RegExp, string]> = [
  [/^\/$/, "Connexion"],
  [/^\/auth\/register$/, "Inscription"],
  [/^\/auth\/register\/expert$/, "Inscription Expert"],
  [/^\/auth\/register\/oec$/, "Inscription OEC"],
  [/^\/auth\/forgot-password$/, "Mot de passe oublié"],
  [/^\/auth\/verify-otp$/, "Vérification OTP"],
  [/^\/auth\/new-password$/, "Nouveau mot de passe"],
  [/^\/auth\/success$/, "Inscription réussie"],
  [/^\/for28\/.+$/, "Soumission FOR 28"],

  [/^\/complaints\/public$/, "Déposer une plainte"],
  [/^\/complaints\/track$/, "Suivi de plainte"],
  [/^\/complaints\/internal$/, "Plaintes internes"],

  [/^\/notifications$/, "Notifications"],
  [/^\/dashboard$/, "Tableau de bord"],
  [/^\/users$/, "Utilisateurs"],

  [/^\/admin$/, "Administration"],
  [/^\/admin\/utilisateurs$/, "Utilisateurs"],
  [/^\/admin\/utilisateurs-pending$/, "Utilisateurs en attente"],
  [/^\/admin\/comites-cas$/, "Comités CAS"],

  [/^\/oec\/?$/, "Tableau de bord OEC"],
  [/^\/oec\/dashboard$/, "Tableau de bord OEC"],
  [/^\/oec\/(new-request|nouvelle-demande)$/, "Nouvelle demande"],
  [/^\/oec\/mes-demandes$/, "Mes demandes"],
  [/^\/oec\/payments$/, "Paiements"],
  [/^\/oec\/(payment|paiement)\/.+$/, "Paiement"],
  [/^\/oec\/demandes\/[^/]+\/validation$/, "Validation devis"],
  [/^\/oec\/demandes\/[^/]+\/corriger$/, "Corriger la demande"],
  [/^\/oec\/demandes\/[^/]+\/equipe$/, "Validation équipe"],
  [/^\/oec\/demandes\/[^/]+\/reponse-documentaire$/, "Réponse documentaire"],
  [/^\/oec\/demandes\/[^/]+\/plans-actions$/, "Plans d'action"],
  [/^\/oec\/demandes\/[^/]+\/lever-obstacles$/, "Lever obstacles"],
  [/^\/oec\/demandes\/[^/]+$/, "Détail demande"],
  [/^\/oec\/reponse-ecarts$/, "Réponse aux écarts"],
  [/^\/oec\/revue-ecarts$/, "Revue des écarts"],
  [/^\/oec\/documents$/, "Documents"],
  [/^\/oec\/certificates$/, "Certificats"],
  [/^\/oec\/transfert$/, "Transfert d'accréditation"],
  [/^\/oec\/transfert\/nouveau$/, "Nouveau transfert"],
  [/^\/oec\/surveillance$/, "Surveillance"],
  [/^\/oec\/profile$/, "Profil"],

  [/^\/ra\/?$/, "Tableau de bord RA"],
  [/^\/ra\/dashboard$/, "Tableau de bord RA"],
  [/^\/ra\/faisabilite$/, "Recevabilité"],
  [/^\/ra\/demandes\/[^/]+\/devis$/, "Convention & Devis"],
  [/^\/ra\/equipes$/, "Équipes d'évaluation"],
  [/^\/ra\/recusations$/, "Récusations"],
  [/^\/ra\/revue-documentaire$/, "Revue documentaire"],
  [/^\/ra\/preparation-evaluation$/, "Préparation évaluation"],
  [/^\/ra\/gestion-ecarts$/, "Gestion des écarts"],
  [/^\/ra\/rapports$/, "Validation rapports"],
  [/^\/ra\/preparation-cas$/, "Préparation CAS"],
  [/^\/ra\/decision-accreditation$/, "Décision d'accréditation"],
  [/^\/ra\/surveillance$/, "Surveillance"],
  [/^\/ra\/experts$/, "Annuaire experts"],
  [/^\/ra\/quotes$/, "Devis"],
  [/^\/ra\/dossiers$/, "Dossiers"],
  [/^\/ra\/planning$/, "Planning"],
  [/^\/ra\/entretiens-candidats$/, "Entretiens candidats"],

  [/^\/cd\/?$/, "Tableau de bord CD"],
  [/^\/cd\/dashboard$/, "Tableau de bord CD"],
  [/^\/cd\/(manage-requests|gerer-demandes)$/, "Gérer les demandes"],
  [/^\/cd\/(ra-workload|responsables)$/, "Charge des RA"],
  [/^\/cd\/accreditations$/, "Accréditations"],
  [/^\/cd\/pilotage-evaluation$/, "Pilotage évaluation"],
  [/^\/cd\/revue-documentaire$/, "Revue documentaire"],
  [/^\/cd\/preparation-evaluation$/, "Préparation évaluation"],
  [/^\/cd\/traitement-ecarts$/, "Traitement des écarts"],
  [/^\/cd\/echantillonnage$/, "Échantillonnage"],
  [/^\/cd\/developpement-domaines$/, "Développement des domaines"],
  [/^\/cd\/regles-reference$/, "Règles de référence"],
  [/^\/cd\/multi-sites$/, "Multi-sites"],
  [/^\/cd\/evaluation-distance$/, "Évaluation à distance"],
  [/^\/cd\/transferts$/, "Transferts d'accréditation"],
  [/^\/cd\/surveillance$/, "Surveillance"],
  [/^\/cd\/entretiens-candidats$/, "Entretiens candidats"],

  [/^\/dag\/?$/, "Tableau de bord DAG"],
  [/^\/dag\/dashboard$/, "Tableau de bord DAG"],
  [/^\/dag\/paiements$/, "Suivi des paiements"],
  [/^\/dag\/frais-enregistrement$/, "Frais d'enregistrement"],
  [/^\/dag\/fixation-devis$/, "Fixation des devis"],
  [/^\/dag\/candidatures-oec$/, "Candidatures OEC"],
  [/^\/dag\/tarifs$/, "Tarifs"],

  [/^\/dt\/?$/, "Tableau de bord DT"],
  [/^\/dt\/dashboard$/, "Tableau de bord DT"],
  [/^\/dt\/demandes-accreditation$/, "Demandes d'accréditation"],
  [/^\/dt\/demandes-accreditation-legacy$/, "Demandes d'accréditation"],
  [/^\/dt\/demande\/.+$/, "Détail demande"],
  [/^\/dt\/candidature-oec\/.+$/, "Candidature OEC"],
  [/^\/dt\/candidatures-oec$/, "Candidatures OEC"],
  [/^\/dt\/candidatures$/, "Candidatures"],
  [/^\/dt\/ordres-mission$/, "Ordres de mission"],
  [/^\/dt\/certificats$/, "Certificats"],
  [/^\/dt\/entretiens-candidats$/, "Entretiens candidats"],

  [/^\/expert\/?$/, "Tableau de bord Expert"],
  [/^\/expert\/dashboard$/, "Tableau de bord Expert"],
  [/^\/expert\/planning$/, "Planning"],
  [/^\/expert\/engagements$/, "Engagements"],
  [/^\/expert\/revue-documentaire$/, "Revue documentaire"],
  [/^\/expert\/evaluation$/, "Évaluation sur site"],
  [/^\/expert\/rapports$/, "Rapports"],
  [/^\/expert\/mandatements$/, "Mandatements & Réunions"],

  [/^\/ree\/?$/, "Tableau de bord REE"],
  [/^\/ree\/dashboard$/, "Tableau de bord REE"],
  [/^\/ree\/planning$/, "Planning"],
  [/^\/ree\/engagements$/, "Engagements"],
  [/^\/ree\/revue-documentaire$/, "Revue documentaire"],
  [/^\/ree\/mandatements$/, "Mandatements & Réunions"],
  [/^\/ree\/plan-evaluation$/, "Plan d'évaluation"],
  [/^\/ree\/rapports$/, "Rapports"],
  [/^\/ree\/evaluation-site$/, "Évaluation sur site"],
  [/^\/ree\/traitement-ecarts$/, "Traitement des écarts"],
  [/^\/ree\/redaction-rapport$/, "Rédaction du rapport"],

  [/^\/et\/?$/, "Tableau de bord ET"],
  [/^\/et\/dashboard$/, "Tableau de bord ET"],
  [/^\/et\/planning$/, "Planning"],
  [/^\/et\/engagements$/, "Engagements"],
  [/^\/et\/revue-documentaire$/, "Revue documentaire"],
  [/^\/et\/mandatements$/, "Mandatements & Réunions"],
  [/^\/et\/evaluation$/, "Évaluation sur site"],
  [/^\/et\/traitement-ecarts$/, "Traitement des écarts"],
  [/^\/et\/evaluation-plans$/, "Évaluation des écarts"],

  [/^\/eq\/?$/, "Tableau de bord EQ"],
  [/^\/eq\/dashboard$/, "Tableau de bord EQ"],
  [/^\/eq\/planning$/, "Planning"],
  [/^\/eq\/engagements$/, "Engagements"],
  [/^\/eq\/revue-documentaire$/, "Revue documentaire"],
  [/^\/eq\/mandatements$/, "Mandatements & Réunions"],
  [/^\/eq\/evaluation$/, "Évaluation sur site"],
  [/^\/eq\/traitement-ecarts$/, "Traitement des écarts"],

  [/^\/cas\/?$/, "Tableau de bord CAS"],
  [/^\/cas\/dashboard$/, "Tableau de bord CAS"],
  [/^\/cas\/reunions$/, "Réunions CAS"],
  [/^\/cas\/transferts$/, "Décisions de transfert"],

  [/^\/cas-president\/?$/, "Tableau de bord Président CAS"],
  [/^\/cas-president\/dashboard$/, "Tableau de bord Président CAS"],
  [/^\/cas-president\/reunions$/, "Réunions CAS"],
  [/^\/cas-president\/decisions$/, "Décisions CAS"],
  [/^\/cas-president\/transferts$/, "Décisions de transfert"],
  [/^\/cas-president\/comites$/, "Comités CAS"],

  [/^\/dg\/?$/, "Tableau de bord DG"],
  [/^\/dg\/dashboard$/, "Tableau de bord DG"],
  [/^\/dg\/ordres-mission$/, "Ordres de mission"],
  [/^\/dg\/certificats$/, "Certificats"],
  [/^\/dg\/transferts$/, "Transferts"],

  [/^\/ges-competences\/?$/, "Tableau de bord Gestion compétences"],
  [/^\/ges-competences\/dashboard$/, "Tableau de bord Gestion compétences"],
  [/^\/ges-competences\/candidatures$/, "Candidatures"],
  [/^\/ges-competences\/entretiens$/, "Planning entretiens"],
  [/^\/ges-competences\/entretien\/.+$/, "Évaluation entretien"],
  [/^\/ges-competences\/qualifications$/, "Qualifications"],
  [/^\/ges-competences\/commission$/, "Commission CQ"],
  [/^\/ges-competences\/observations$/, "Observations FOR 71"],
  [/^\/ges-competences\/surveillance$/, "Surveillance & KPI"],

  [/^\/rq\/?$/, "Tableau de bord RQ"],
  [/^\/rq\/dashboard$/, "Tableau de bord RQ"],
  [/^\/rq\/plaintes$/, "Plaintes"],
  [/^\/rq\/entretiens-candidats$/, "Entretiens candidats"],
];

export function resolvePageTitle(pathname: string): string {
  for (const [pattern, title] of routeTitles) {
    if (pattern.test(pathname)) return title;
  }
  return "";
}

export function usePageTitle() {
  const [location] = useLocation();

  useEffect(() => {
    const title = resolvePageTitle(location);
    document.title = title ? `${title} · ${APP_NAME}` : `${APP_NAME} - Plateforme d'Accréditation`;
  }, [location]);
}
