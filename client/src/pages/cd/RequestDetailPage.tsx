import { useEffect, useState } from "react";
import { jsPDF } from "jspdf";
import { useLocation, useParams } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2, ArrowLeft, FileText, Download, Printer,
  Building2, User, Mail, Phone, MapPin, Globe, Briefcase, Calendar, ClipboardList, Users, Shield, FileDown,
} from "lucide-react";

interface ParsedRow { [k: string]: any }

const Info = ({ icon: Icon, label, value }: { icon?: any; label: string; value?: string | null }) => (
  <div className="space-y-0.5">
    <p className="text-xs text-muted-foreground flex items-center gap-1">
      {Icon && <Icon className="w-3 h-3" />}{label}
    </p>
    <p className="text-sm font-medium break-words">{value || "—"}</p>
  </div>
);

const TableBlock = ({ title, cols, rows }: { title: string; cols: { key: string; label: string }[]; rows?: ParsedRow[] }) => {
  if (!rows || rows.length === 0) return null;
  const hasContent = rows.some((r) => cols.some((c) => r[c.key]));
  if (!hasContent) return null;
  return (
    <div className="space-y-2">
      {title && <h4 className="font-medium text-sm text-[#00A63E]">{title}</h4>}
      <div className="border rounded-lg overflow-x-auto bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 w-10">#</th>
              {cols.map((c) => <th key={c.key} className="px-3 py-2 text-left text-xs font-medium text-slate-600">{c.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 text-xs text-slate-500">{i + 1}</td>
                {cols.map((c) => <td key={c.key} className="px-3 py-2 text-sm">{r[c.key] || "—"}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PAYMENT_COMPLETED:    { label: "Paiement validé",             color: "bg-amber-100 text-amber-700" },
  PENDING_CD_ASSIGNMENT:{ label: "En attente d'assignation",    color: "bg-amber-100 text-amber-700" },
  ASSIGNED_TO_RA:       { label: "Assignée au RA",              color: "bg-blue-100 text-blue-700" },
  RECEIVABILITY_STUDY:  { label: "Étude de recevabilité",        color: "bg-indigo-100 text-indigo-700" },
  RECEIVABLE:           { label: "Recevable",                   color: "bg-emerald-100 text-emerald-700" },
  NOT_RECEIVABLE:       { label: "Non recevable",               color: "bg-red-100 text-red-700" },
  TEAM_COMPOSITION:     { label: "Composition d'équipe",        color: "bg-purple-100 text-purple-700" },
  QUOTATION_PREPARATION:{ label: "Préparation du devis",        color: "bg-cyan-100 text-cyan-700" },
  QUOTATION_SENT_TO_OEC:{ label: "Devis envoyé à l'OEC",       color: "bg-teal-100 text-teal-700" },
  EVALUATION_IN_PROGRESS:{ label: "Évaluation en cours",        color: "bg-violet-100 text-violet-700" },
  CAS_DECISION_GRANT:   { label: "Décision CAS accordée",       color: "bg-emerald-100 text-emerald-700" },
  CERTIFICATE_ISSUED:   { label: "Certificat émis",             color: "bg-green-100 text-green-800" },
};

export default function CDRequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const requestId = params.requestId;
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [parsed, setParsed] = useState<any>(null);

  useEffect(() => { if (requestId) load(); }, [requestId]);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", `/api/requests/${requestId}/full-details`);
      const j = await res.json();
      setData(j);
      const desc = j?.request?.description;
      if (desc) { try { setParsed(JSON.parse(desc)); } catch { setParsed(null); } }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar /><div className="md:ml-64"><Navbar />
          <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" /></div>
        </div>
      </div>
    );
  }

  if (!data?.request) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar /><div className="md:ml-64"><Navbar />
          <main className="p-8">
            <Button variant="outline" onClick={() => setLocation("/cd/manage-requests")}>
              <ArrowLeft className="w-4 h-4 mr-2" />Retour
            </Button>
            <p className="text-center text-muted-foreground py-10">Demande introuvable</p>
          </main>
        </div>
      </div>
    );
  }

  const req = data.request;
  const oec = data.oecProfile || {};
  const p = parsed || {};
  const st = STATUS_LABELS[req.status] || { label: req.status?.replace(/_/g, " ") || "—", color: "bg-slate-100 text-slate-700" };

  const printDoc1 = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ro = (v: any) => String(v || "—");
    const fmtDate = (v: any) => v ? new Date(v).toLocaleDateString("fr-FR") : "—";
    const GREEN = "#00A63E";
    const pageW = 210;
    const margin = 14;
    const usableW = pageW - margin * 2;
    let y = 14;

    const checkPage = (needed = 8) => { if (y + needed > 280) { doc.addPage(); y = 14; } };

    const section = (title: string) => {
      checkPage(12);
      doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(GREEN);
      doc.text(title, margin, y); doc.setDrawColor(GREEN);
      doc.line(margin, y + 1, margin + usableW, y + 1); doc.setTextColor("#111111"); y += 7;
    };

    const field = (label: string, value: string, x = margin, w = usableW) => {
      checkPage(8);
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor("#777777"); doc.text(label, x, y);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor("#111111");
      const lines = doc.splitTextToSize(value, w - 2); doc.text(lines, x, y + 4); y += 4 + lines.length * 4;
    };

    const fields2col = (pairs: [string, string][]) => {
      const colW = (usableW - 6) / 2;
      for (let i = 0; i < pairs.length; i += 2) {
        const rowH = 10; checkPage(rowH);
        field(pairs[i][0], pairs[i][1], margin, colW);
        if (pairs[i + 1]) { const savedY = y; y -= rowH > 0 ? rowH : 8; field(pairs[i + 1][0], pairs[i + 1][1], margin + colW + 6, colW); y = Math.max(y, savedY); }
      }
    };

    const table = (title: string, cols: { key: string; label: string }[], rows?: any[]) => {
      if (!rows || rows.length === 0) return;
      const hasContent = rows.some((r) => cols.some((c) => r[c.key])); if (!hasContent) return;
      checkPage(12);
      if (title) { doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(GREEN); doc.text(title, margin, y); y += 5; doc.setTextColor("#111111"); }
      const colW = usableW / (cols.length + 1);
      doc.setFillColor("#e8f5e9"); doc.rect(margin, y, usableW, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor("#333333"); doc.text("#", margin + 1, y + 4);
      cols.forEach((c, ci) => doc.text(c.label, margin + colW + ci * colW + 1, y + 4)); y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor("#111111");
      rows.forEach((r, ri) => {
        checkPage(7);
        if (ri % 2 === 1) { doc.setFillColor("#f9fafb"); doc.rect(margin, y, usableW, 6, "F"); }
        doc.setDrawColor("#e2e8f0"); doc.rect(margin, y, usableW, 6); doc.text(String(ri + 1), margin + 1, y + 4);
        cols.forEach((c, ci) => { const val = doc.splitTextToSize(ro(r[c.key]), colW - 2); doc.text(val[0] || "—", margin + colW + ci * colW + 1, y + 4); }); y += 6;
      }); y += 3;
    };

    // Header
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(GREEN); doc.text("ALGERAC", margin, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor("#555555");
    doc.text("DOC 01 — Demande d'accréditation", margin, y + 6);
    doc.text(`Réf : ${req.referenceNumber || `#${req.id}`}   Statut : ${ro(req.status?.replace(/_/g, " "))}`, margin, y + 11);
    doc.setDrawColor("#cccccc"); doc.line(margin, y + 14, margin + usableW, y + 14); y += 20;

    section("Informations générales");
    fields2col([
      ["Type de demande", ro(p.typeDemande || req.type)], ["Domaine", ro(req.domain)],
      ["Date de soumission", fmtDate(req.submissionDate)], ["Date d'évaluation souhaitée", fmtDate(p.dateEvaluation)],
    ]);

    section("Informations de l'organisme");
    fields2col([
      ["Nom légal", ro(p.nomLegal || oec.organizationName)], ["Abréviation / Sigle", ro([p.abreviation, p.sigle].filter(Boolean).join(" / "))],
      ["Statut juridique", ro(p.statutJuridique || oec.typeOrganisme)], ["N° Registre de commerce", ro(p.registreCommerce)],
      ["Codes d'activité", ro(p.codesActivite)], ["Email organisme", ro(p.emailOrg || oec.email)],
      ["Site web", ro(p.siteWeb)], ["Type de site", ro(p.siteType)],
      ["Adresse siège", ro(p.adresseSiege || oec.adresseSiege)], ["Adresse de facturation", ro(p.adresseFacturation)],
    ]);
    if (p.appartientGroupe === "oui") {
      checkPage(8); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor("#333333");
      doc.text("Groupe d'appartenance", margin, y); y += 5;
      fields2col([["Nom", ro(p.groupeNom)], ["Relation", ro(p.groupeRelation)], ["Adresse", ro(p.groupeAdresse)], ["Impact sur activités", ro(p.groupeImpact)]]);
    }

    section("Personne à contacter");
    fields2col([
      ["Nom complet", ro(p.contactNom || oec.nomRepresentant)], ["Fonction", ro(p.contactFonction || oec.fonction)],
      ["Téléphone", ro(p.contactTelephone || oec.telephoneDirect)], ["Fax", ro(p.contactFax)],
      ["Email", ro(p.contactEmail || oec.emailProfessionnel)], ["Adresse", ro(p.contactAdresse)],
    ]);

    if (Array.isArray(p.sites) && p.sites.length > 0) {
      section("Sites");
      table("", [{ key: "localisation", label: "Localisation" }, { key: "adresse", label: "Adresse" }, { key: "activites", label: "Activités" }, { key: "soustraitance", label: "Sous-traitance" }], p.sites);
    }

    if (Array.isArray(p.personnelSites) || Array.isArray(p.responsablesTechniques) || p.responsableQualiteNom) {
      section("Personnel");
      table("Personnel par site", [{ key: "site", label: "Site" }, { key: "permanents", label: "Permanents" }, { key: "vacataires", label: "Vacataires" }], p.personnelSites);
      table("Responsables techniques", [{ key: "nom", label: "Nom" }, { key: "qualifications", label: "Qualifications" }, { key: "experience", label: "Exp. (ans)" }], p.responsablesTechniques);
      if (p.responsableQualiteNom) fields2col([["Responsable qualité — Nom", ro(p.responsableQualiteNom)], ["Qualifications", ro(p.responsableQualiteQualif)], ["Expérience", ro(p.responsableQualiteExp)], ["", ""]]);
    }

    if (Array.isArray(p.activites) && p.activites.length > 0) {
      section("Activités demandées"); checkPage(8);
      doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor("#111111");
      const actLine = p.activites.map((a: string) => a.replace(/_/g, " ")).join("   •   ");
      const lines = doc.splitTextToSize(actLine, usableW); doc.text(lines, margin, y); y += lines.length * 5 + 3;
    }

    if (p.technicalForms) {
      section("Formulaires techniques");
      if (p.technicalForms.for04) {
        checkPage(8); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor("#333333"); doc.text("FOR 04 — Inspection", margin, y); y += 5;
        field("Type d'organisme", ro(p.technicalForms.for04.typeOrganisme));
        table("Domaines", [{ key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" }, { key: "objetInspecte", label: "Objet" }, { key: "norme", label: "Norme" }, { key: "typeInspection", label: "Type" }], p.technicalForms.for04.domaines);
        table("Inspecteurs", [{ key: "nom", label: "Nom" }, { key: "qualification", label: "Qualification" }, { key: "domaineHabilitation", label: "Habilitation" }, { key: "experience", label: "Exp." }, { key: "statut", label: "Statut" }], p.technicalForms.for04.inspecteurs);
      }
      if (p.technicalForms.for05) {
        checkPage(8); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor("#333333"); doc.text("FOR 05 — Essais (ISO/IEC 17025)", margin, y); y += 5;
        table("Portée", [{ key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" }, { key: "produitMatrice", label: "Produit/Matrice" }, { key: "essaiAnalyse", label: "Essai" }, { key: "methodeRef", label: "Méthode" }], p.technicalForms.for05.domaines);
      }
      if (p.technicalForms.for06) {
        checkPage(8); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor("#333333"); doc.text("FOR 06 — Étalonnage", margin, y); y += 5;
        table("Grandeurs", [{ key: "grandeur", label: "Grandeur" }, { key: "domaineMesure", label: "Domaine" }, { key: "gamme", label: "Gamme" }, { key: "cmc", label: "CMC" }, { key: "methode", label: "Méthode" }], p.technicalForms.for06.grandeurs);
      }
      if (p.technicalForms.for07) {
        checkPage(8); doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor("#333333"); doc.text("FOR 07 — Certification SM", margin, y); y += 5;
        if (p.technicalForms.for07.referentiels?.length > 0) { doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor("#111111"); doc.text(p.technicalForms.for07.referentiels.join("   •   "), margin, y); y += 5; }
        table("Secteurs", [{ key: "codeIAF", label: "IAF" }, { key: "description", label: "Description" }, { key: "sousSecteurs", label: "Sous-secteurs" }, { key: "nbAuditeurs", label: "Nb auditeurs" }], p.technicalForms.for07.secteurs);
      }
    }

    if (p.demandeurNom || p.signature) {
      section("Déclaration");
      fields2col([["Organisme autorisant", ro(p.organismeSoumission)], ["Demandeur", ro(p.demandeurNom)], ["Fonction", ro(p.demandeurFonction)], ["Date", fmtDate(p.demandeurDate)], ["Signature", ro(p.signature)], ["", ""]]);
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor("#aaaaaa");
      doc.text(`Page ${i} / ${totalPages}`, pageW - margin, 290, { align: "right" });
    }
    const blob = doc.output("blob"); const url = URL.createObjectURL(blob); window.open(url, "_blank");
  };

  const printTechnicalForm = () => {
    if (!p.technicalForms) return;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const ro = (v: any) => String(v || "—");
    const GREEN = "#00A63E";
    const pageW = 210;
    const margin = 14;
    const usableW = pageW - margin * 2;
    let y = 14;

    const checkPage = (needed = 8) => { if (y + needed > 280) { doc.addPage(); y = 14; } };
    const section = (title: string) => {
      checkPage(12); doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(GREEN);
      doc.text(title, margin, y); doc.setDrawColor(GREEN); doc.line(margin, y + 1, margin + usableW, y + 1); doc.setTextColor("#111111"); y += 7;
    };
    const field = (label: string, value: string) => {
      checkPage(8); doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor("#777777"); doc.text(label, margin, y);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor("#111111");
      const lines = doc.splitTextToSize(value, usableW - 2); doc.text(lines, margin, y + 4); y += 4 + lines.length * 4;
    };
    const table = (title: string, cols: { key: string; label: string }[], rows?: any[]) => {
      if (!rows || rows.length === 0) return;
      const hasContent = rows.some((r) => cols.some((c) => r[c.key])); if (!hasContent) return;
      checkPage(12);
      if (title) { doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(GREEN); doc.text(title, margin, y); y += 5; doc.setTextColor("#111111"); }
      const colW = usableW / (cols.length + 1);
      doc.setFillColor("#e8f5e9"); doc.rect(margin, y, usableW, 6, "F");
      doc.setFont("helvetica", "bold"); doc.setFontSize(7); doc.setTextColor("#333333"); doc.text("#", margin + 1, y + 4);
      cols.forEach((c, ci) => doc.text(c.label, margin + colW + ci * colW + 1, y + 4)); y += 6;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor("#111111");
      rows.forEach((r, ri) => {
        checkPage(7);
        if (ri % 2 === 1) { doc.setFillColor("#f9fafb"); doc.rect(margin, y, usableW, 6, "F"); }
        doc.setDrawColor("#e2e8f0"); doc.rect(margin, y, usableW, 6); doc.text(String(ri + 1), margin + 1, y + 4);
        cols.forEach((c, ci) => { const val = doc.splitTextToSize(ro(r[c.key]), colW - 2); doc.text(val[0] || "—", margin + colW + ci * colW + 1, y + 4); }); y += 6;
      }); y += 3;
    };

    // Header
    doc.setFont("helvetica", "bold"); doc.setFontSize(14); doc.setTextColor(GREEN); doc.text("ALGERAC", margin, y);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor("#555555");
    doc.text("Formulaire technique — Demande d'accréditation", margin, y + 6);
    doc.text(`Réf : ${req.referenceNumber || `#${req.id}`}   Organisme : ${ro(p.nomLegal || oec.organizationName)}`, margin, y + 11);
    doc.setDrawColor("#cccccc"); doc.line(margin, y + 14, margin + usableW, y + 14); y += 20;

    if (p.technicalForms.for04) {
      section("FOR 04 — Organisme d'inspection");
      field("Type d'organisme", ro(p.technicalForms.for04.typeOrganisme));
      table("Domaines d'inspection", [{ key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" }, { key: "objetInspecte", label: "Objet" }, { key: "norme", label: "Norme" }, { key: "typeInspection", label: "Type" }], p.technicalForms.for04.domaines);
      table("Inspecteurs", [{ key: "nom", label: "Nom" }, { key: "qualification", label: "Qualification" }, { key: "domaineHabilitation", label: "Habilitation" }, { key: "experience", label: "Exp. (ans)" }, { key: "statut", label: "Statut" }], p.technicalForms.for04.inspecteurs);
      table("Équipements", [{ key: "designation", label: "Désignation" }, { key: "marqueModele", label: "Marque/Modèle" }, { key: "gamme", label: "Gamme" }, { key: "dateEtalonnage", label: "Étalonnage" }], p.technicalForms.for04.equipements);
    }
    if (p.technicalForms.for05) {
      section("FOR 05 — Laboratoire d'essais (ISO/IEC 17025)");
      table("Portée des essais", [{ key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" }, { key: "produitMatrice", label: "Produit/Matrice" }, { key: "essaiAnalyse", label: "Essai" }, { key: "methodeRef", label: "Méthode" }], p.technicalForms.for05.domaines);
      table("Personnel", [{ key: "nom", label: "Nom" }, { key: "diplome", label: "Diplôme" }, { key: "specialite", label: "Spécialité" }, { key: "fonction", label: "Fonction" }], p.technicalForms.for05.personnel);
    }
    if (p.technicalForms.for06) {
      section("FOR 06 — Laboratoire d'étalonnage");
      table("Grandeurs mesurées", [{ key: "grandeur", label: "Grandeur" }, { key: "domaineMesure", label: "Domaine de mesure" }, { key: "gamme", label: "Gamme" }, { key: "cmc", label: "CMC" }, { key: "methode", label: "Méthode" }], p.technicalForms.for06.grandeurs);
    }
    if (p.technicalForms.for07) {
      section("FOR 07 — Organisme de certification de systèmes de management");
      if (p.technicalForms.for07.referentiels?.length > 0) {
        checkPage(8); doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor("#111111");
        doc.text("Référentiels : " + p.technicalForms.for07.referentiels.join(", "), margin, y); y += 6;
      }
      table("Secteurs d'activité (IAF)", [{ key: "codeIAF", label: "Code IAF" }, { key: "description", label: "Description" }, { key: "sousSecteurs", label: "Sous-secteurs" }, { key: "nbAuditeurs", label: "Nb auditeurs" }], p.technicalForms.for07.secteurs);
    }

    const totalPages = doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i); doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor("#aaaaaa");
      doc.text(`Page ${i} / ${totalPages}`, pageW - margin, 290, { align: "right" });
    }
    const blob = doc.output("blob"); const url = URL.createObjectURL(blob); window.open(url, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6 max-w-6xl mx-auto">

          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 justify-between">
            <Button variant="outline" size="sm" onClick={() => setLocation("/cd/manage-requests")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Retour
            </Button>
            <Badge className="text-sm" variant="outline">{req.referenceNumber || `#${req.id}`}</Badge>
          </div>

          {/* Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Building2 className="w-5 h-5" />
                    {oec.organizationName || req.oec?.organizationName || "Demande d'accréditation"}
                  </CardTitle>
                </div>
                <Badge className={`${st.color} text-sm`}>{st.label}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-4 gap-4">
                <Info icon={ClipboardList} label="Type de demande" value={p.typeDemande || req.type} />
                <Info icon={Briefcase} label="Domaine" value={req.domain} />
                <Info icon={Calendar} label="Date de soumission" value={req.submissionDate ? new Date(req.submissionDate).toLocaleDateString("fr-FR") : "—"} />
                <Info icon={Calendar} label="Date d'évaluation souhaitée" value={p.dateEvaluation ? new Date(p.dateEvaluation).toLocaleDateString("fr-FR") : "—"} />
              </div>
            </CardContent>
          </Card>

          {/* Official PDFs */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FileDown className="w-4 h-4" /> Documents officiels générés
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={printDoc1} disabled={!parsed}>
                <Printer className="w-4 h-4 mr-2" />DOC 01 (PDF)
              </Button>
              <Button variant="outline" onClick={printTechnicalForm} disabled={!parsed || !p.technicalForms}>
                <Download className="w-4 h-4 mr-2" />Formulaire technique (PDF)
              </Button>
            </CardContent>
          </Card>

          {/* Assigned RA */}
          <Card className={req.assignedRa ? "border-blue-200 bg-blue-50/40" : "border-amber-200 bg-amber-50/40"}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="w-4 h-4" /> Responsable d'accréditation (RA)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {req.assignedRa ? (
                <div className="grid md:grid-cols-3 gap-4">
                  <Info icon={User} label="Nom complet" value={req.assignedRa.fullName} />
                  <Info icon={Mail} label="Email" value={req.assignedRa.email} />
                  {req.assignedRa.domaineExpertise && <Info icon={Briefcase} label="Expertise" value={req.assignedRa.domaineExpertise} />}
                </div>
              ) : (
                <p className="text-sm text-amber-700 font-medium">Aucun RA assigné — action requise</p>
              )}
            </CardContent>
          </Card>

          {/* OEC */}
          <Card>
            <CardHeader><CardTitle>Informations de l'organisme</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Info label="Nom légal" value={p.nomLegal || oec.organizationName} />
                <Info label="Abréviation / Sigle" value={[p.abreviation, p.sigle].filter(Boolean).join(" / ")} />
                <Info label="Statut juridique" value={p.statutJuridique || oec.typeOrganisme} />
                <Info label="N° Registre de commerce" value={p.registreCommerce} />
                <Info label="Codes d'activité" value={p.codesActivite} />
                <Info icon={Mail} label="Email organisme" value={p.emailOrg || oec.email} />
                <Info icon={Globe} label="Site web" value={p.siteWeb} />
                <Info icon={MapPin} label="Adresse siège" value={p.adresseSiege || oec.adresseSiege} />
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Personne à contacter</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <Info label="Nom complet" value={p.contactNom || oec.nomRepresentant} />
                <Info label="Fonction" value={p.contactFonction || oec.fonction} />
                <Info icon={Phone} label="Téléphone" value={p.contactTelephone || oec.telephoneDirect} />
                <Info icon={Mail} label="Email" value={p.contactEmail || oec.emailProfessionnel} />
                <Info icon={MapPin} label="Adresse" value={p.contactAdresse} />
              </div>
            </CardContent>
          </Card>

          {/* Sites */}
          {Array.isArray(p.sites) && p.sites.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Sites</CardTitle></CardHeader>
              <CardContent>
                <TableBlock title="" cols={[
                  { key: "localisation", label: "Localisation" },
                  { key: "adresse", label: "Adresse" },
                  { key: "activites", label: "Activités" },
                  { key: "soustraitance", label: "Sous-traitance" },
                ]} rows={p.sites} />
              </CardContent>
            </Card>
          )}

          {/* Personnel */}
          {(Array.isArray(p.personnelSites) || Array.isArray(p.responsablesTechniques) || p.responsableQualiteNom) && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="w-4 h-4" /> Personnel</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <TableBlock title="Personnel par site" cols={[
                  { key: "site", label: "Site" },
                  { key: "permanents", label: "Permanents" },
                  { key: "vacataires", label: "Vacataires" },
                ]} rows={p.personnelSites} />
                <TableBlock title="Responsables techniques" cols={[
                  { key: "nom", label: "Nom" },
                  { key: "qualifications", label: "Qualifications" },
                  { key: "experience", label: "Expérience (ans)" },
                ]} rows={p.responsablesTechniques} />
                {p.responsableQualiteNom && (
                  <div className="grid md:grid-cols-3 gap-3 p-3 rounded-lg bg-slate-50 border">
                    <Info label="Responsable qualité — Nom" value={p.responsableQualiteNom} />
                    <Info label="Qualifications" value={p.responsableQualiteQualif} />
                    <Info label="Expérience" value={p.responsableQualiteExp} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Activités */}
          {Array.isArray(p.activites) && p.activites.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Activités demandées</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {p.activites.map((a: string) => (
                  <Badge key={a} variant="outline" className="capitalize">{a.replace(/_/g, " ")}</Badge>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Formulaires techniques */}
          {p.technicalForms && (
            <Card>
              <CardHeader><CardTitle>Formulaires techniques</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {p.technicalForms.for04 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 04 — Inspection</h3>
                    <TableBlock title="Domaines" cols={[
                      { key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" },
                      { key: "objetInspecte", label: "Objet" }, { key: "norme", label: "Norme" },
                    ]} rows={p.technicalForms.for04.domaines} />
                    <TableBlock title="Personnel" cols={[
                      { key: "nom", label: "Nom" }, { key: "qualification", label: "Qualification" },
                      { key: "experience", label: "Expérience" },
                    ]} rows={p.technicalForms.for04.inspecteurs} />
                    <TableBlock title="Équipements" cols={[
                      { key: "designation", label: "Désignation" }, { key: "marqueModele", label: "Marque/Modèle" },
                      { key: "gamme", label: "Gamme" }, { key: "dateEtalonnage", label: "Étalonnage" },
                    ]} rows={p.technicalForms.for04.equipements} />
                  </div>
                )}
                {p.technicalForms.for05 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 05 — Essais (ISO/IEC 17025)</h3>
                    <TableBlock title="Portée" cols={[
                      { key: "domaine", label: "Domaine" }, { key: "sousDomaine", label: "Sous-domaine" },
                      { key: "produitMatrice", label: "Produit/Matrice" }, { key: "essaiAnalyse", label: "Essai" },
                      { key: "methodeRef", label: "Méthode" },
                    ]} rows={p.technicalForms.for05.domaines} />
                    <TableBlock title="Personnel" cols={[
                      { key: "nom", label: "Nom" }, { key: "diplome", label: "Diplôme" },
                      { key: "specialite", label: "Spécialité" }, { key: "fonction", label: "Fonction" },
                    ]} rows={p.technicalForms.for05.personnel} />
                  </div>
                )}
                {p.technicalForms.for06 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 06 — Étalonnage</h3>
                    <TableBlock title="Grandeurs" cols={[
                      { key: "grandeur", label: "Grandeur" }, { key: "domaineMesure", label: "Domaine" },
                      { key: "cmc", label: "CMC" }, { key: "methode", label: "Méthode" },
                    ]} rows={p.technicalForms.for06.grandeurs} />
                  </div>
                )}
                {p.technicalForms.for07 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold">FOR 07 — Certification SM</h3>
                    {p.technicalForms.for07.referentiels?.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {p.technicalForms.for07.referentiels.map((r: string) => <Badge key={r} variant="outline">{r}</Badge>)}
                      </div>
                    )}
                    <TableBlock title="Secteurs" cols={[
                      { key: "codeIAF", label: "IAF" }, { key: "description", label: "Description" },
                      { key: "nbAuditeurs", label: "Nb auditeurs" },
                    ]} rows={p.technicalForms.for07.secteurs} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Documents */}
          {Array.isArray(p.documents) && p.documents.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Documents joints ({p.documents.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {p.documents.map((d: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="text-sm truncate">{d.name}</span>
                      </div>
                      {d.base64 ? (
                        <Button variant="ghost" size="sm" onClick={() => {
                          const mime = d.mimeType || "application/octet-stream";
                          const bc = atob(d.base64);
                          const ba = new Uint8Array(bc.length);
                          for (let j = 0; j < bc.length; j++) ba[j] = bc.charCodeAt(j);
                          const blob = new Blob([ba], { type: mime });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url; a.download = d.name; a.click();
                          URL.revokeObjectURL(url);
                        }}>
                          <Download className="w-3.5 h-3.5 mr-1" /> Télécharger
                        </Button>
                      ) : (
                        <span className="text-xs text-slate-400 italic">sans fichier</span>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Déclaration */}
          {(p.demandeurNom || p.signature) && (
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-4 h-4" /> Déclaration</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Info label="Organisme autorisant" value={p.organismeSoumission} />
                  <Info label="Demandeur" value={p.demandeurNom} />
                  <Info label="Fonction" value={p.demandeurFonction} />
                  <Info label="Date" value={p.demandeurDate ? new Date(p.demandeurDate).toLocaleDateString("fr-FR") : "—"} />
                </div>
              </CardContent>
            </Card>
          )}

        </main>
      </div>
    </div>
  );
}
