import { jsPDF } from "jspdf";

interface PdfDocumentContext {
  request: any;
  oecProfile?: any;
  parsed?: any;
}

const GREEN = "#00A63E";

const ro = (value: any) => String(value || "—");
const fmtDate = (value: any) => (value ? new Date(value).toLocaleDateString("fr-FR") : "—");

export function openAccreditationDoc1Pdf({ request, oecProfile, parsed }: PdfDocumentContext) {
  if (!request || !parsed) return;

  const req = request;
  const oec = oecProfile || {};
  const p = parsed || {};
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
      const rowH = 10;
      checkPage(rowH);
      field(pairs[i][0], pairs[i][1], margin, colW);
      if (pairs[i + 1]) {
        const savedY = y;
        y -= rowH > 0 ? rowH : 8;
        field(pairs[i + 1][0], pairs[i + 1][1], margin + colW + 6, colW);
        y = Math.max(y, savedY);
      }
    }
  };

  const table = (title: string, cols: { key: string; label: string }[], rows?: any[]) => {
    if (!rows || rows.length === 0) return;
    const hasContent = rows.some((r) => cols.some((c) => r[c.key]));
    if (!hasContent) return;
    checkPage(12);
    if (title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(GREEN);
      doc.text(title, margin, y);
      y += 5;
      doc.setTextColor("#111111");
    }
    const colW = usableW / (cols.length + 1);
    doc.setFillColor("#e8f5e9");
    doc.rect(margin, y, usableW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor("#333333");
    doc.text("#", margin + 1, y + 4);
    cols.forEach((c, ci) => doc.text(c.label, margin + colW + ci * colW + 1, y + 4));
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#111111");
    rows.forEach((r, ri) => {
      checkPage(7);
      if (ri % 2 === 1) {
        doc.setFillColor("#f9fafb");
        doc.rect(margin, y, usableW, 6, "F");
      }
      doc.setDrawColor("#e2e8f0");
      doc.rect(margin, y, usableW, 6);
      doc.text(String(ri + 1), margin + 1, y + 4);
      cols.forEach((c, ci) => {
        const val = doc.splitTextToSize(ro(r[c.key]), colW - 2);
        doc.text(val[0] || "—", margin + colW + ci * colW + 1, y + 4);
      });
      y += 6;
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
  doc.text("DOC 01 — Demande d'accréditation", margin, y + 6);
  doc.text(`Réf : ${req.referenceNumber || `#${req.id}`}   Statut : ${ro(req.status?.replace(/_/g, " "))}`, margin, y + 11);
  doc.setDrawColor("#cccccc");
  doc.line(margin, y + 14, margin + usableW, y + 14);
  y += 20;

  section("Informations générales");
  fields2col([
    ["Type de demande", ro(p.typeDemande || req.type)],
    ["Domaine", ro(req.domain)],
    ["Date de soumission", fmtDate(req.submissionDate)],
    ["Date d'évaluation souhaitée", fmtDate(p.dateEvaluation)],
  ]);

  section("Informations de l'organisme");
  fields2col([
    ["Nom légal", ro(p.nomLegal || oec.organizationName)],
    ["Abréviation / Sigle", ro([p.abreviation, p.sigle].filter(Boolean).join(" / "))],
    ["Statut juridique", ro(p.statutJuridique || oec.typeOrganisme)],
    ["N° Registre de commerce", ro(p.registreCommerce)],
    ["Codes d'activité", ro(p.codesActivite)],
    ["Email organisme", ro(p.emailOrg || oec.email)],
    ["Site web", ro(p.siteWeb)],
    ["Type de site", ro(p.siteType)],
    ["Adresse siège", ro(p.adresseSiege || oec.adresseSiege)],
    ["Adresse de facturation", ro(p.adresseFacturation)],
  ]);
  if (p.appartientGroupe === "oui") {
    checkPage(8);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor("#333333");
    doc.text("Groupe d'appartenance", margin, y);
    y += 5;
    fields2col([
      ["Nom", ro(p.groupeNom)],
      ["Relation", ro(p.groupeRelation)],
      ["Adresse", ro(p.groupeAdresse)],
      ["Impact sur activités", ro(p.groupeImpact)],
    ]);
  }

  section("Personne à contacter");
  fields2col([
    ["Nom complet", ro(p.contactNom || oec.nomRepresentant)],
    ["Fonction", ro(p.contactFonction || oec.fonction)],
    ["Téléphone", ro(p.contactTelephone || oec.telephoneDirect)],
    ["Fax", ro(p.contactFax)],
    ["Email", ro(p.contactEmail || oec.emailProfessionnel)],
    ["Adresse", ro(p.contactAdresse)],
  ]);

  if (Array.isArray(p.sites) && p.sites.length > 0) {
    section("Sites");
    table("", [
      { key: "localisation", label: "Localisation" },
      { key: "adresse", label: "Adresse" },
      { key: "activites", label: "Activités" },
      { key: "soustraitance", label: "Sous-traitance" },
    ], p.sites);
  }

  if (Array.isArray(p.personnelSites) || Array.isArray(p.responsablesTechniques) || p.responsableQualiteNom) {
    section("Personnel");
    table("Personnel par site", [
      { key: "site", label: "Site" },
      { key: "permanents", label: "Permanents" },
      { key: "vacataires", label: "Vacataires" },
    ], p.personnelSites);
    table("Responsables techniques", [
      { key: "nom", label: "Nom" },
      { key: "qualifications", label: "Qualifications" },
      { key: "experience", label: "Exp. (ans)" },
    ], p.responsablesTechniques);
    if (p.responsableQualiteNom) {
      fields2col([
        ["Responsable qualité — Nom", ro(p.responsableQualiteNom)],
        ["Qualifications", ro(p.responsableQualiteQualif)],
        ["Expérience", ro(p.responsableQualiteExp)],
        ["", ""],
      ]);
    }
  }

  if (Array.isArray(p.activites) && p.activites.length > 0) {
    section("Activités demandées");
    checkPage(8);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor("#111111");
    const actLine = p.activites.map((a: string) => a.replace(/_/g, " ")).join("   •   ");
    const lines = doc.splitTextToSize(actLine, usableW);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 3;
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

  if (p.demandeurNom || p.signature) {
    section("Déclaration");
    fields2col([
      ["Organisme autorisant", ro(p.organismeSoumission)],
      ["Demandeur", ro(p.demandeurNom)],
      ["Fonction", ro(p.demandeurFonction)],
      ["Date", fmtDate(p.demandeurDate)],
      ["Signature", ro(p.signature)],
      ["", ""],
    ]);
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

export function openAccreditationTechnicalFormPdf({ request, oecProfile, parsed }: PdfDocumentContext) {
  if (!request || !parsed?.technicalForms) return;

  const req = request;
  const oec = oecProfile || {};
  const p = parsed || {};
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
    if (!rows || rows.length === 0) return;
    const hasContent = rows.some((r) => cols.some((c) => r[c.key]));
    if (!hasContent) return;
    checkPage(12);
    if (title) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(GREEN);
      doc.text(title, margin, y);
      y += 5;
      doc.setTextColor("#111111");
    }
    const colW = usableW / (cols.length + 1);
    doc.setFillColor("#e8f5e9");
    doc.rect(margin, y, usableW, 6, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor("#333333");
    doc.text("#", margin + 1, y + 4);
    cols.forEach((c, ci) => doc.text(c.label, margin + colW + ci * colW + 1, y + 4));
    y += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor("#111111");
    rows.forEach((r, ri) => {
      checkPage(7);
      if (ri % 2 === 1) {
        doc.setFillColor("#f9fafb");
        doc.rect(margin, y, usableW, 6, "F");
      }
      doc.setDrawColor("#e2e8f0");
      doc.rect(margin, y, usableW, 6);
      doc.text(String(ri + 1), margin + 1, y + 4);
      cols.forEach((c, ci) => {
        const val = doc.splitTextToSize(ro(r[c.key]), colW - 2);
        doc.text(val[0] || "—", margin + colW + ci * colW + 1, y + 4);
      });
      y += 6;
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

  if (p.technicalForms.for04) {
    section("FOR 04 — Organisme d'inspection");
    field("Type d'organisme", ro(p.technicalForms.for04.typeOrganisme));
    table("Domaines d'inspection", [
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
      { key: "experience", label: "Exp. (ans)" },
      { key: "statut", label: "Statut" },
    ], p.technicalForms.for04.inspecteurs);
    table("Équipements", [
      { key: "designation", label: "Désignation" },
      { key: "marqueModele", label: "Marque/Modèle" },
      { key: "gamme", label: "Gamme" },
      { key: "dateEtalonnage", label: "Étalonnage" },
    ], p.technicalForms.for04.equipements);
  }
  if (p.technicalForms.for05) {
    section("FOR 05 — Laboratoire d'essais (ISO/IEC 17025)");
    table("Portée des essais", [
      { key: "domaine", label: "Domaine" },
      { key: "sousDomaine", label: "Sous-domaine" },
      { key: "produitMatrice", label: "Produit/Matrice" },
      { key: "essaiAnalyse", label: "Essai" },
      { key: "methodeRef", label: "Méthode" },
    ], p.technicalForms.for05.domaines);
    table("Personnel", [
      { key: "nom", label: "Nom" },
      { key: "diplome", label: "Diplôme" },
      { key: "specialite", label: "Spécialité" },
      { key: "fonction", label: "Fonction" },
    ], p.technicalForms.for05.personnel);
  }
  if (p.technicalForms.for06) {
    section("FOR 06 — Laboratoire d'étalonnage");
    table("Grandeurs mesurées", [
      { key: "grandeur", label: "Grandeur" },
      { key: "domaineMesure", label: "Domaine de mesure" },
      { key: "gamme", label: "Gamme" },
      { key: "cmc", label: "CMC" },
      { key: "methode", label: "Méthode" },
    ], p.technicalForms.for06.grandeurs);
  }
  if (p.technicalForms.for07) {
    section("FOR 07 — Organisme de certification de systèmes de management");
    if (p.technicalForms.for07.referentiels?.length > 0) {
      checkPage(8);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor("#111111");
      doc.text("Référentiels : " + p.technicalForms.for07.referentiels.join(", "), margin, y);
      y += 6;
    }
    table("Secteurs d'activité (IAF)", [
      { key: "codeIAF", label: "Code IAF" },
      { key: "description", label: "Description" },
      { key: "sousSecteurs", label: "Sous-secteurs" },
      { key: "nbAuditeurs", label: "Nb auditeurs" },
    ], p.technicalForms.for07.secteurs);
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
