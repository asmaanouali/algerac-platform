import { jsPDF } from "jspdf";

interface PdfDocumentContext {
  request: any;
  oecProfile?: any;
  parsed?: any;
}

const GREEN = "#00A63E";

const ro = (value: any) => String(value || "—");
const fmtDate = (value: any) => (value ? new Date(value).toLocaleDateString("fr-FR") : "—");

// Cell/field text: lists joined, booleans as Oui/Non, empty as a dash
const fmtCell = (value: any): string => {
  if (value === true) return "Oui";
  if (value === false) return "Non";
  if (Array.isArray(value)) return value.map(fmtCell).filter((v) => v !== "—").join(", ") || "—";
  const s = String(value ?? "").trim();
  return s || "—";
};

const TYPES_DEMANDE_LABELS: Record<string, string> = {
  initiale: "Accréditation initiale", extension: "Extension", renouvellement: "Renouvellement", transfert: "Transfert",
};
const SITE_TYPE_LABELS: Record<string, string> = { monosite: "Monosite", multisites: "Multisites" };
const ACTIVITES_LABELS: Record<string, string> = {
  inspection: "Inspection", essais: "Essais", etalonnage: "Étalonnage", examens_medicaux: "Examens médicaux",
  essais_aptitude: "Essais d'aptitude", cert_sm: "Certification SM",
  cert_produits: "Certification produits/procédés/services", cert_personnes: "Certification personnes",
};
const PRESTATION_LABELS: Record<string, string> = {
  accompagnement: "Accompagnement", formation: "Formation", audit_interne: "Audit interne", autre: "Autre",
};
// PRO 26 §5.1 qualification criteria, in form order
const MS_CRITERIA: [string, string][] = [
  ["legalLink", "Lien juridique entre les sites et le siège"],
  ["centralSM", "Système de management centralisé"],
  ["commonSM", "Système de management commun à tous les sites"],
  ["internalAudit", "Programme d'audit interne couvrant tous les sites"],
  ["centralMgmt", "Gestion centralisée (revue de direction, ressources)"],
  ["dataCapacity", "Capacité de collecte et d'analyse des données de tous les sites"],
];

/**
 * Flattens the stored request description into one DOC1 object. The public OEC registration wraps the
 * form as { type, domain, description: {...}, multisite: {...} } whereas the new-request flow stores the
 * form directly and keeps its multisite data on the request entity.
 */
export function normalizeDoc1Payload(parsed: any, request?: any): any {
  const raw = parsed || {};
  const inner = raw.description && typeof raw.description === "object" ? raw.description : null;
  const p: any = inner ? { ...inner } : { ...raw };
  const ms = raw.multisite && typeof raw.multisite === "object" ? raw.multisite : null;
  const fill = (key: string, ...candidates: any[]) => {
    if (p[key] !== undefined && p[key] !== null && p[key] !== "") return;
    const found = candidates.find((c) => c !== undefined && c !== null && c !== "");
    if (found !== undefined) p[key] = found;
  };
  fill("msMainSiteName", ms?.mainSiteName, request?.mainSiteName);
  fill("msMainSiteAddress", ms?.mainSiteAddress, request?.mainSiteAddress);
  fill("msMainSiteContactName", ms?.mainSiteContactName, request?.mainSiteContactName);
  fill("msMainSiteContactEmail", ms?.mainSiteContactEmail, request?.mainSiteContactEmail);
  fill("msCentralizedSM", ms?.centralizedManagementSystem, request?.centralizedManagementSystem);
  fill("msSMDescription", ms?.managementSystemDescription, request?.managementSystemDescription);
  fill("msInterSiteExchangesDoc", ms?.interSiteExchangesDoc, request?.interSiteExchangesDoc);
  fill("msCriteriaJson", ms?.qualificationCriteriaJson, request?.qualificationCriteriaJson);
  fill("satelliteSites", ms?.satelliteSites, request?.satelliteSites);
  if (!p.siteType && (raw.isMultisite || request?.isMultisite)) p.siteType = "multisites";
  return p;
}

export function openAccreditationDoc1Pdf({ request, oecProfile, parsed }: PdfDocumentContext) {
  if (!request || !parsed) return;

  const req = request;
  const oec = oecProfile || {};
  const p = normalizeDoc1Payload(parsed, req);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 14;
  const usableW = pageW - margin * 2;
  let y = 14;

  const checkPage = (needed = 8) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 14;
    }
  };

  const section = (title: string) => {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(GREEN);
    doc.text(title, margin, y);
    doc.setDrawColor(GREEN);
    doc.line(margin, y + 1, margin + usableW, y + 1);
    doc.setTextColor("#111111");
    y += 7;
  };

  const field = (label: string, value: string, x = margin, w = usableW) => {
    checkPage(8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#777777");
    doc.text(label, x, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor("#111111");
    const lines = doc.splitTextToSize(value, w - 2);
    doc.text(lines, x, y + 4);
    y += 4 + lines.length * 4;
  };

  const fields2col = (pairs: [string, string][]) => {
    const colW = (usableW - 6) / 2;
    for (let i = 0; i < pairs.length; i += 2) {
      const cells = [pairs[i], pairs[i + 1]].filter(Boolean) as [string, string][];
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      const wrapped = cells.map(([, value]) => doc.splitTextToSize(value, colW - 2) as string[]);
      const rowH = 4 + Math.max(...wrapped.map((l) => l.length), 1) * 4 + 1;
      checkPage(rowH);
      cells.forEach(([label], ci) => {
        const x = margin + ci * (colW + 6);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(7.5);
        doc.setTextColor("#777777");
        doc.text(label, x, y);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor("#111111");
        doc.text(wrapped[ci], x, y + 4);
      });
      y += rowH;
    }
  };

  const table = (title: string, cols: { key: string; label: string }[], rows?: any[]) => {
    const filled = (rows || []).filter((r) => cols.some((c) => fmtCell(r[c.key]) !== "—"));
    if (filled.length === 0) return;
    checkPage(18);
    if (title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(GREEN);
      doc.text(title, margin, y);
      y += 5;
      doc.setTextColor("#111111");
    }
    const numW = 8;
    const colW = (usableW - numW) / cols.length;
    doc.setFillColor("#e8f5e9");
    doc.rect(margin, y, usableW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor("#333333");
    doc.text("#", margin + 1, y + 4);
    cols.forEach((c, ci) => doc.text(c.label, margin + numW + ci * colW + 1, y + 4));
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#111111");
    filled.forEach((r, ri) => {
      // Wrap every cell so long values are shown in full instead of being cut to one line
      const wrapped = cols.map((c) => doc.splitTextToSize(fmtCell(r[c.key]), colW - 2) as string[]);
      const rowH = Math.max(...wrapped.map((l) => l.length), 1) * 3.6 + 3;
      checkPage(rowH);
      if (ri % 2 === 1) {
        doc.setFillColor("#f9fafb");
        doc.rect(margin, y, usableW, rowH, "F");
      }
      doc.setDrawColor("#e2e8f0");
      doc.rect(margin, y, usableW, rowH);
      doc.text(String(ri + 1), margin + 1, y + 4);
      wrapped.forEach((lines, ci) => doc.text(lines, margin + numW + ci * colW + 1, y + 4));
      y += rowH;
    });
    y += 3;
  };

  const paragraph = (text: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(8.5);
    doc.setTextColor("#111111");
    const lines = doc.splitTextToSize(text, usableW) as string[];
    checkPage(lines.length * 4 + 2);
    doc.text(lines, margin, y);
    y += lines.length * 4 + 2;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(GREEN);
  doc.text("ALGERAC", margin, y);
  if (oec.logoBase64) {
    // jsPDF cannot embed SVG; a logo it cannot read must not break the PDF
    const mime = String(oec.logoMimeType || "image/png");
    const format = mime.includes("jpeg") ? "JPEG" : mime.includes("webp") ? "WEBP" : mime.includes("png") ? "PNG" : null;
    if (format) {
      try {
        doc.addImage(`data:${mime};base64,${oec.logoBase64}`, format, pageW - margin - 30, y - 6, 30, 18, undefined, "FAST");
      } catch {
        /* logo skipped */
      }
    }
  }
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#555555");
  doc.text("DOC 01 — Demande d'accréditation", margin, y + 6);
  doc.text(`Réf : ${req.referenceNumber || `#${req.id}`}   Statut : ${ro(req.status?.replace(/_/g, " "))}`, margin, y + 11);
  doc.setDrawColor("#cccccc");
  doc.line(margin, y + 14, margin + usableW, y + 14);
  y += 20;

  section("1. Type de demande");
  const activitesLabels = (Array.isArray(p.activites) ? p.activites : []).map((a: string) => ACTIVITES_LABELS[a] || a.replace(/_/g, " "));
  fields2col([
    ["Type de demande", ro(TYPES_DEMANDE_LABELS[p.typeDemande] || p.typeDemande || req.type)],
    ["Type de site", ro(SITE_TYPE_LABELS[p.siteType] || p.siteType)],
    ["Types d'activités", ro(activitesLabels.join(", "))],
    ["Date d'évaluation souhaitée", fmtDate(p.dateEvaluation)],
    ["Domaine", ro(req.domain)],
    ["Date de soumission", fmtDate(req.submissionDate)],
    ...(p.typeDemande === "transfert" ? [["Motif de transfert", ro(p.motifTransfert)] as [string, string]] : []),
  ]);

  section("2. Informations sur l'organisme");
  fields2col([
    ["Dénomination légale", ro(p.nomLegal || oec.organizationName)],
    ["Abréviation", ro(p.abreviation)],
    ["Statut juridique", ro(p.statutJuridique || oec.typeOrganisme)],
    ["N° registre du commerce", ro(p.registreCommerce)],
    ["Codes activité", ro(p.codesActivite)],
    ["Email de l'organisme", ro(p.emailOrg || oec.email)],
    ["Site web", ro(p.siteWeb)],
    ["Appartient à un groupe", p.appartientGroupe === "oui" ? "Oui" : "Non"],
    ["Adresse du siège", ro(p.adresseSiege || oec.adresseSiege)],
    ["Adresse de facturation", ro(p.adresseFacturation)],
  ]);
  if (p.appartientGroupe === "oui") {
    fields2col([
      ["Nom du groupe", ro(p.groupeNom)],
      ["Adresse du groupe", ro(p.groupeAdresse)],
      // groupeImpact only exists on requests submitted before the two fields were merged
      ["Relation avec le groupe (interventions du groupe dans l'activité)", ro([p.groupeRelation, p.groupeImpact].filter(Boolean).join(" — "))],
    ]);
  }

  section("3. Personne à contacter");
  fields2col([
    ["Nom complet", ro(p.contactNom || oec.nomRepresentant)],
    ["Fonction", ro(p.contactFonction || oec.fonction)],
    ["Téléphone", ro(p.contactTelephone || oec.telephoneDirect)],
    ["Fax", ro(p.contactFax)],
    ["Email", ro(p.contactEmail || oec.emailProfessionnel)],
    ["Adresse", ro(p.contactAdresse)],
  ]);

  if (p.siteType === "multisites") {
    section("4. Sites — configuration multisites (PRO 26)");
    fields2col([
      ["Siège central — nom", ro(p.msMainSiteName)],
      ["Siège central — adresse", ro(p.msMainSiteAddress)],
      ["Contact siège — nom", ro(p.msMainSiteContactName)],
      ["Contact siège — email", ro(p.msMainSiteContactEmail)],
      ["Système de management centralisé", fmtCell(p.msCentralizedSM)],
      ["Document d'échanges inter-sites", ro(p.msInterSiteExchangesDoc)],
      ["Description du système de management", ro(p.msSMDescription)],
    ]);
    table("Sites satellites", [
      { key: "name", label: "Nom" },
      { key: "address", label: "Adresse" },
      { key: "activities", label: "Activités" },
      { key: "personnel", label: "Personnel" },
      { key: "isInScope", label: "Dans la portée" },
    ], p.satelliteSites);
    try {
      const criteria = typeof p.msCriteriaJson === "string" ? JSON.parse(p.msCriteriaJson) : p.msCriteriaJson;
      if (criteria) {
        table("Critères de qualification des sites (PRO 26 §5.1)", [
          { key: "critere", label: "Critère" },
          { key: "satisfait", label: "Satisfait" },
          { key: "justification", label: "Justification" },
        ], MS_CRITERIA.filter(([k]) => criteria[k]).map(([k, label]) => ({
          critere: label, satisfait: !!criteria[k].checked, justification: criteria[k].justification,
        })));
      }
    } catch {
      /* unreadable criteria are skipped */
    }
  } else {
    section("4. Site unique");
    const site = Array.isArray(p.sites) ? p.sites[0] : null;
    if (site) {
      fields2col([
        ["Adresse", ro(site.adresse)],
        ["Activités réalisées", ro(site.activites)],
        ["Sous-traitance", ro(site.soustraitance)],
      ]);
    }
  }

  section("5. Personnel");
  table("Personnel par site", [
    { key: "site", label: "Site" },
    { key: "permanents", label: "Permanents" },
    { key: "vacataires", label: "Vacataires" },
  ], p.personnelSites);
  table("Responsables techniques", [
    { key: "nom", label: "Nom" },
    { key: "qualifications", label: "Qualifications" },
    { key: "experience", label: "Expérience (ans)" },
  ], p.responsablesTechniques);
  if (p.responsableQualiteNom || p.responsableQualiteQualif || p.responsableQualiteExp) {
    paragraph("Responsable qualité (cas échéant)", true);
    fields2col([
      ["Nom complet", ro(p.responsableQualiteNom)],
      ["Diplômes", ro(p.responsableQualiteQualif)],
      ["Années d'expérience", ro(p.responsableQualiteExp)],
    ]);
  }

  if (p.prestationConseil) {
    section("6. Prestations externes");
    fields2col([["Avez-vous bénéficié de prestations externes ?", p.prestationConseil === "oui" ? "Oui" : "Non"]]);
    if (p.prestationConseil === "oui") {
      table("", [
        { key: "types", label: "Types" },
        { key: "autrePrecision", label: "Précision" },
        { key: "prestataire", label: "Prestataire" },
        { key: "date", label: "Date" },
        { key: "description", label: "Description" },
      ], (p.prestations || []).map((pr: any) => ({
        ...pr,
        types: (pr.types || []).map((ty: string) => PRESTATION_LABELS[ty] || ty),
        date: pr.date ? fmtDate(pr.date) : "",
      })));
    }
  }

  section("7. Reconnaissances / Agréments");
  const hasReconnaissance = (p.reconnaissances || []).some((r: any) => r.organisation || r.domaine || r.validite);
  if (hasReconnaissance) {
    table("", [
      { key: "organisation", label: "Organisme d'accréditation" },
      { key: "domaine", label: "Domaine" },
      { key: "validite", label: "Date de validité" },
    ], p.reconnaissances);
  } else {
    paragraph("Aucune.");
  }
  if (p.technicalForms) {
    section("Formulaires techniques");
    if (p.technicalForms.for04) {
      checkPage(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      doc.text("FOR 04 — Inspection", margin, y);
      y += 5;
      field("Type d'organisme", ro(p.technicalForms.for04.typeOrganisme));
      table("Domaines", [
        { key: "domaine", label: "Domaine" },
        { key: "sousDomaine", label: "Sous-domaine" },
        { key: "objetInspecte", label: "Objet" },
        { key: "norme", label: "Norme" },
        { key: "typeInspection", label: "Type" },
      ], p.technicalForms.for04.domaines);
      table("Inspecteurs", [
        { key: "nom", label: "Nom" },
        { key: "qualification", label: "Qualification" },
        { key: "domaineHabilitation", label: "Habilitation" },
        { key: "experience", label: "Exp." },
        { key: "statut", label: "Statut" },
      ], p.technicalForms.for04.inspecteurs);
    }
    if (p.technicalForms.for05) {
      checkPage(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      doc.text("FOR 05 — Essais (ISO/IEC 17025)", margin, y);
      y += 5;
      table("Portée", [
        { key: "domaine", label: "Domaine" },
        { key: "sousDomaine", label: "Sous-domaine" },
        { key: "produitMatrice", label: "Produit/Matrice" },
        { key: "essaiAnalyse", label: "Essai" },
        { key: "methodeRef", label: "Méthode" },
      ], p.technicalForms.for05.domaines);
    }
    if (p.technicalForms.for06) {
      checkPage(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      doc.text("FOR 06 — Étalonnage", margin, y);
      y += 5;
      table("Grandeurs", [
        { key: "grandeur", label: "Grandeur" },
        { key: "domaineMesure", label: "Domaine" },
        { key: "gamme", label: "Gamme" },
        { key: "cmc", label: "CMC" },
        { key: "methode", label: "Méthode" },
      ], p.technicalForms.for06.grandeurs);
    }
    if (p.technicalForms.for07) {
      checkPage(8);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor("#333333");
      doc.text("FOR 07 — Certification SM", margin, y);
      y += 5;
      if (p.technicalForms.for07.referentiels?.length > 0) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor("#111111");
        doc.text(p.technicalForms.for07.referentiels.join("   •   "), margin, y);
        y += 5;
      }
      table("Secteurs", [
        { key: "codeIAF", label: "IAF" },
        { key: "description", label: "Description" },
        { key: "sousSecteurs", label: "Sous-secteurs" },
        { key: "nbAuditeurs", label: "Nb auditeurs" },
      ], p.technicalForms.for07.secteurs);
    }
  }

  const attachedDocs = (Array.isArray(p.documents) ? p.documents : []).map((d: any) => {
    const key = String(d.key || "");
    const label = key.startsWith("admin-") ? key.slice(6) : key;
    return { document: label, fichier: d.name && d.name !== label ? d.name : "Non joint" };
  });
  if (attachedDocs.length > 0) {
    section("8. Documents joints");
    table("", [
      { key: "document", label: "Document" },
      { key: "fichier", label: "Fichier" },
    ], attachedDocs);
  }

  section("9. Déclaration");
  paragraph("Je déclare que les informations fournies sont exactes et complètes.");
  paragraph("Je m'engage à :", true);
  paragraph("- informer ALGERAC de tout changement affectant la portée d'accréditation ;");
  paragraph("- transmettre tous les documents complémentaires demandés ;");
  paragraph("- respecter les normes et règlements en vigueur ainsi que les procédures ALGERAC.");
  paragraph("Je reconnais avoir pris connaissance des droits et obligations liés à l'accréditation.");
  paragraph(`Je certifie être dûment autorisé par l'organisme « ${p.organismeSoumission || p.nomLegal || oec.organizationName || "—"} » à soumettre la présente demande.`);
  fields2col([
    ["Demandeur", ro(p.demandeurNom)],
    ["Fonction", ro(p.demandeurFonction)],
    ["Date", fmtDate(p.demandeurDate)],
  ]);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#aaaaaa");
    doc.text(`Page ${i} / ${totalPages}`, pageW - margin, 290, { align: "right" });
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

export function openAccreditationTechnicalFormPdf({ request, oecProfile, parsed }: PdfDocumentContext) {
  const p = normalizeDoc1Payload(parsed, request);
  if (!request || !p.technicalForms) return;

  const req = request;
  const oec = oecProfile || {};
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 14;
  const usableW = pageW - margin * 2;
  let y = 14;

  const checkPage = (needed = 8) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 14;
    }
  };

  const section = (title: string) => {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(GREEN);
    doc.text(title, margin, y);
    doc.setDrawColor(GREEN);
    doc.line(margin, y + 1, margin + usableW, y + 1);
    doc.setTextColor("#111111");
    y += 7;
  };

  const field = (label: string, value: string) => {
    checkPage(8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#777777");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor("#111111");
    const lines = doc.splitTextToSize(value, usableW - 2);
    doc.text(lines, margin, y + 4);
    y += 4 + lines.length * 4;
  };

  const table = (title: string, cols: { key: string; label: string }[], rows?: any[]) => {
    const filled = (rows || []).filter((r) => cols.some((c) => fmtCell(r[c.key]) !== "—"));
    if (filled.length === 0) return;
    checkPage(18);
    if (title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(GREEN);
      doc.text(title, margin, y);
      y += 5;
      doc.setTextColor("#111111");
    }
    const numW = 8;
    const colW = (usableW - numW) / cols.length;
    doc.setFillColor("#e8f5e9");
    doc.rect(margin, y, usableW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor("#333333");
    doc.text("#", margin + 1, y + 4);
    cols.forEach((c, ci) => doc.text(c.label, margin + numW + ci * colW + 1, y + 4));
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#111111");
    filled.forEach((r, ri) => {
      // Wrap every cell so long values are shown in full instead of being cut to one line
      const wrapped = cols.map((c) => doc.splitTextToSize(fmtCell(r[c.key]), colW - 2) as string[]);
      const rowH = Math.max(...wrapped.map((l) => l.length), 1) * 3.6 + 3;
      checkPage(rowH);
      if (ri % 2 === 1) {
        doc.setFillColor("#f9fafb");
        doc.rect(margin, y, usableW, rowH, "F");
      }
      doc.setDrawColor("#e2e8f0");
      doc.rect(margin, y, usableW, rowH);
      doc.text(String(ri + 1), margin + 1, y + 4);
      wrapped.forEach((lines, ci) => doc.text(lines, margin + numW + ci * colW + 1, y + 4));
      y += rowH;
    });
    y += 3;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(GREEN);
  doc.text("ALGERAC", margin, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#555555");
  doc.text("Formulaire technique — Demande d'accréditation", margin, y + 6);
  doc.text(`Réf : ${req.referenceNumber || `#${req.id}`}   Organisme : ${ro(p.nomLegal || oec.organizationName)}`, margin, y + 11);
  doc.setDrawColor("#cccccc");
  doc.line(margin, y + 14, margin + usableW, y + 14);
  y += 20;

  type Col = { key: string; label: string };
  const col = (key: string, label: string): Col => ({ key, label });
  const FORMS: { id: string; title: string; fields: Col[]; tables: { key: string; title: string; cols: Col[] }[] }[] = [
    {
      id: "for04", title: "FOR 04 — Organisme d'inspection",
      fields: [col("typeOrganisme", "Type d'organisme")],
      tables: [
        { key: "domaines", title: "Domaines d'inspection", cols: [col("domaine", "Domaine"), col("sousDomaine", "Sous-domaine"), col("objetInspecte", "Objet"), col("norme", "Norme"), col("typeInspection", "Type")] },
        { key: "inspecteurs", title: "Inspecteurs", cols: [col("nom", "Nom"), col("qualification", "Qualification"), col("domaineHabilitation", "Habilitation"), col("experience", "Exp. (ans)"), col("statut", "Statut")] },
        { key: "equipements", title: "Équipements", cols: [col("designation", "Désignation"), col("marqueModele", "Marque/Modèle"), col("noSerie", "N° série"), col("gamme", "Gamme"), col("dateEtalonnage", "Étalonnage")] },
      ],
    },
    {
      id: "for05", title: "FOR 05 — Laboratoire d'essais (ISO/IEC 17025)",
      fields: [col("participationEIL", "Participation EIL"), col("procedureIncertitudes", "Procédure incertitudes")],
      tables: [
        { key: "domaines", title: "Portée des essais", cols: [col("domaine", "Domaine"), col("sousDomaine", "Sous-domaine"), col("produitMatrice", "Produit/Matrice"), col("essaiAnalyse", "Essai"), col("methodeRef", "Méthode"), col("norme", "Norme")] },
        { key: "methodes", title: "Méthodes", cols: [col("reference", "Référence"), col("titre", "Titre"), col("type", "Type"), col("statutValidation", "Validation")] },
        { key: "equipements", title: "Équipements", cols: [col("designation", "Désignation"), col("marqueModele", "Marque/Modèle"), col("gamme", "Gamme"), col("resolution", "Résolution"), col("dateEtalonnage", "Étalonnage"), col("noCertificat", "N° certificat")] },
        { key: "personnel", title: "Personnel", cols: [col("nom", "Nom"), col("diplome", "Diplôme"), col("specialite", "Spécialité"), col("fonction", "Fonction"), col("experience", "Exp."), col("habilitations", "Habilitations")] },
      ],
    },
    {
      id: "for06", title: "FOR 06 — Laboratoire d'étalonnage",
      fields: [col("conditionsEnvironnementales", "Conditions environnementales")],
      tables: [
        { key: "grandeurs", title: "Grandeurs mesurées", cols: [col("grandeur", "Grandeur"), col("domaineMesure", "Domaine de mesure"), col("gamme", "Gamme"), col("cmc", "CMC"), col("methode", "Méthode"), col("norme", "Norme")] },
        { key: "etalons", title: "Étalons de référence", cols: [col("designation", "Désignation"), col("noIdentification", "N° identification"), col("grandeur", "Grandeur"), col("gamme", "Gamme"), col("incertitude", "Incertitude"), col("tracabilite", "Traçabilité"), col("dateEtalonnage", "Étalonnage")] },
        { key: "equipements", title: "Équipements", cols: [col("designation", "Désignation"), col("marqueModele", "Marque/Modèle"), col("gamme", "Gamme"), col("resolution", "Résolution"), col("dateEtalonnage", "Étalonnage")] },
        { key: "personnel", title: "Personnel", cols: [col("nom", "Nom"), col("diplome", "Diplôme"), col("specialite", "Spécialité"), col("experience", "Exp."), col("habilitations", "Habilitations")] },
      ],
    },
    {
      id: "for07", title: "FOR 07 — Organisme de certification de systèmes de management",
      fields: [col("referentiels", "Référentiels"), col("nbClientsCertifies", "Nombre de clients certifiés")],
      tables: [
        { key: "secteurs", title: "Secteurs d'activité (IAF)", cols: [col("codeIAF", "Code IAF"), col("description", "Description"), col("sousSecteurs", "Sous-secteurs"), col("nbAuditeurs", "Nb auditeurs")] },
        { key: "auditeurs", title: "Auditeurs", cols: [col("nom", "Nom"), col("qualification", "Qualification"), col("secteursQualifies", "Secteurs qualifiés"), col("experienceAudits", "Exp. audits"), col("statut", "Statut")] },
        { key: "comite", title: "Comité de décision", cols: [col("nom", "Nom"), col("fonction", "Fonction"), col("domaineCompetence", "Domaine de compétence"), col("representation", "Représentation")] },
      ],
    },
    {
      id: "for051", title: "FOR 05-1 — Laboratoire de biologie médicale",
      fields: [col("participationEEQ", "Participation EEQ")],
      tables: [
        { key: "disciplines", title: "Disciplines", cols: [col("discipline", "Discipline"), col("typeExamen", "Type d'examen"), col("methode", "Méthode"), col("automate", "Automate")] },
        { key: "personnel", title: "Personnel", cols: [col("nom", "Nom"), col("qualification", "Qualification"), col("specialite", "Spécialité"), col("fonction", "Fonction"), col("experience", "Exp.")] },
      ],
    },
    {
      id: "for055", title: "FOR 05-5 — Essais d'aptitude",
      fields: [],
      tables: [
        { key: "programmes", title: "Programmes", cols: [col("domaine", "Domaine"), col("typeProgramme", "Type de programme"), col("frequence", "Fréquence"), col("nbParticipants", "Nb participants"), col("methodeStatistique", "Méthode statistique")] },
        { key: "personnel", title: "Personnel", cols: [col("nom", "Nom"), col("qualification", "Qualification"), col("role", "Rôle"), col("experience", "Exp.")] },
      ],
    },
    {
      id: "for075", title: "FOR 07-5 — Certification de produits, procédés et services",
      fields: [],
      tables: [
        { key: "produits", title: "Produits", cols: [col("categorie", "Catégorie"), col("normeApplicable", "Norme applicable"), col("schemaCertification", "Schéma de certification"), col("programme", "Programme")] },
        { key: "evaluateurs", title: "Évaluateurs", cols: [col("nom", "Nom"), col("qualification", "Qualification"), col("domaine", "Domaine"), col("experience", "Exp.")] },
      ],
    },
    {
      id: "for078", title: "FOR 07-8 — Certification de personnes",
      fields: [],
      tables: [
        { key: "schemas", title: "Schémas", cols: [col("domaine", "Domaine"), col("referentiel", "Référentiel"), col("niveau", "Niveau"), col("criteresEligibilite", "Critères d'éligibilité")] },
        { key: "evaluateurs", title: "Évaluateurs", cols: [col("nom", "Nom"), col("qualification", "Qualification"), col("domaineCertifie", "Domaine certifié"), col("experience", "Exp.")] },
      ],
    },
  ];

  FORMS.forEach((form) => {
    const data = p.technicalForms[form.id];
    if (!data) return;
    section(form.title);
    form.fields.forEach((f) => {
      if (fmtCell(data[f.key]) !== "—") field(f.label, fmtCell(data[f.key]));
    });
    form.tables.forEach((t) => table(t.title, t.cols, data[t.key]));
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#aaaaaa");
    doc.text(`Page ${i} / ${totalPages}`, pageW - margin, 290, { align: "right" });
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}

interface ComplaintReviewPdfContext {
  complaint: any;
  reviewReport: string;
  reviewedBy?: string;
}

export function openComplaintReviewPdf({ complaint, reviewReport, reviewedBy }: ComplaintReviewPdfContext) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = 210;
  const margin = 14;
  const usableW = pageW - margin * 2;
  let y = 16;

  const checkPage = (needed = 8) => {
    if (y + needed > 280) {
      doc.addPage();
      y = 16;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(GREEN);
  doc.text("Bilan d'examen de plainte", margin, y);
  y += 6;
  doc.setDrawColor(GREEN);
  doc.line(margin, y, margin + usableW, y);
  y += 8;

  const section = (title: string) => {
    checkPage(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(GREEN);
    doc.text(title, margin, y);
    doc.setDrawColor("#dddddd");
    doc.line(margin, y + 1, margin + usableW, y + 1);
    doc.setTextColor("#111111");
    y += 7;
  };

  const field = (label: string, value: string) => {
    checkPage(8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#777777");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor("#111111");
    const lines = doc.splitTextToSize(value, usableW);
    doc.text(lines, margin, y + 4);
    y += 4 + lines.length * 4 + 2;
  };

  section("Identification de la plainte");
  field("Code de suivi", ro(complaint.trackingCode));
  field("Objet", ro(complaint.subject));
  field("Plaignant", ro(complaint.complainantName));
  field("Catégorie", ro(complaint.category));
  field("Date de dépôt", fmtDate(complaint.createdAt));
  field("Description de la plainte", ro(complaint.description));

  section("Bilan d'examen rédigé par le Responsable Qualité");
  field("Rédigé par", ro(reviewedBy));
  field("Date d'édition", fmtDate(new Date()));
  checkPage(8);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor("#111111");
  const bodyLines = doc.splitTextToSize(reviewReport || "—", usableW);
  for (const line of bodyLines) {
    checkPage(6);
    doc.text(line, margin, y);
    y += 5;
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor("#aaaaaa");
    doc.text(`Page ${i} / ${totalPages}`, pageW - margin, 290, { align: "right" });
  }

  const blob = doc.output("blob");
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
}
