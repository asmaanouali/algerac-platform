import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { WorkflowTimeline } from "@/components/WorkflowTimeline";
import {
  Loader2, ArrowLeft, FileText, Building2, User, Mail, Phone,
  MapPin, Briefcase, Globe, Calendar, Shield, CheckCircle, Clock,
  XCircle, AlertTriangle, Download
} from "lucide-react";

interface OECProfile {
  id: number;
  organizationName: string;
  typeOrganisme: string;
  adresseSiege: string;
  email: string;
  phone: string;
  nomRepresentant: string;
  fonction: string;
  telephoneDirect: string;
  emailProfessionnel: string;
  porteeAccreditation: string;
  typeDemande: string;
  documentsJson: string;
}

interface RequestDetail {
  request: {
    id: number;
    referenceNumber: string;
    type: string;
    domain: string;
    description: string;
    status: string;
    progress: number;
    submissionDate: string;
    createdAt: string;
    currentPhase: string;
    currentStep: string;
    nextAction: string;
    pendingWith: string;
    isReceivable: boolean | null;
    receivabilityComments: string;
    receivabilityCorrectionNeeded: string;
    correctionDeadline: string;
    assignmentDate: string;
    evaluationStartDate: string;
    evaluationEndDate: string;
    certificateIssueDate: string;
    certificateExpirationDate: string;
    oec: { id: number; email: string; fullName: string; organizationName: string };
    assignedToRa: { id: number; email: string; fullName: string } | null;
  };
  oecProfile: OECProfile;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-800" },
  SUBMITTED: { label: "Soumise", color: "bg-blue-100 text-blue-800" },
  AWAITING_REGISTRATION_FEE: { label: "En attente frais", color: "bg-yellow-100 text-yellow-800" },
  PENDING_PAYMENT: { label: "En attente de paiement", color: "bg-yellow-100 text-yellow-800" },
  PAYMENT_COMPLETED: { label: "Paiement validé", color: "bg-green-100 text-green-800" },
  ASSIGNED_TO_RA: { label: "Assignée à un RA", color: "bg-blue-100 text-blue-800" },
  RA_ASSIGNMENT_REFUSED: { label: "Réassignation en cours", color: "bg-amber-100 text-amber-800" },
  RECEIVABILITY_STUDY: { label: "Étude de recevabilité", color: "bg-purple-100 text-purple-800" },
  RECEIVABILITY_PENDING_CD_REVIEW: { label: "En attente validation CD", color: "bg-purple-100 text-purple-800" },
  RECEIVABLE: { label: "Recevable", color: "bg-green-100 text-green-800" },
  NOT_RECEIVABLE: { label: "Non recevable", color: "bg-red-100 text-red-800" },
  QUOTATION_PREPARATION: { label: "Préparation du devis", color: "bg-blue-100 text-blue-800" },
  QUOTATION_SENT_TO_OEC: { label: "Devis reçu - À valider", color: "bg-orange-100 text-orange-800" },
  QUOTATION_VALIDATED: { label: "Devis validé", color: "bg-green-100 text-green-800" },
  TEAM_DESIGNATION: { label: "Constitution équipe", color: "bg-blue-100 text-blue-800" },
  TEAM_SENT_TO_OEC: { label: "Équipe à valider", color: "bg-orange-100 text-orange-800" },
  TEAM_VALIDATED: { label: "Équipe validée", color: "bg-green-100 text-green-800" },
  DOC_REVIEW_IN_PROGRESS: { label: "Revue documentaire en cours", color: "bg-blue-100 text-blue-800" },
  DOC_REVIEW_RESULTS_SENT_TO_OEC: { label: "Résultats de revue disponibles", color: "bg-orange-100 text-orange-800" },
  AWAITING_OEC_DOC_RESPONSE: { label: "Réponse aux manquements requise", color: "bg-orange-100 text-orange-800" },
  DOC_REVIEW_CD_DECISION: { label: "Décision CD en cours", color: "bg-yellow-100 text-yellow-800" },
  DOCUMENTARY_REVIEW_COMPLETED: { label: "Revue documentaire terminée", color: "bg-green-100 text-green-800" },
  EVALUATION_PLANNED: { label: "Évaluation planifiée", color: "bg-blue-100 text-blue-800" },
  EVALUATION_IN_PROGRESS: { label: "Évaluation en cours", color: "bg-blue-100 text-blue-800" },
  EVALUATION_COMPLETED: { label: "Évaluation terminée", color: "bg-green-100 text-green-800" },
  CAS_DECISION_GRANT: { label: "Accréditation accordée", color: "bg-green-100 text-green-800" },
  CAS_DECISION_REFUSAL: { label: "Refusée", color: "bg-red-100 text-red-800" },
  CERTIFICATE_ISSUED: { label: "Certificat délivré", color: "bg-green-100 text-green-800" },
  ACTIVE: { label: "Active", color: "bg-green-100 text-green-800" },
  SUSPENDED: { label: "Suspendue", color: "bg-red-100 text-red-800" },
  CLOSED: { label: "Classée", color: "bg-gray-100 text-gray-800" },
};

const TYPE_LABELS: Record<string, string> = {
  INITIAL: "Accréditation initiale",
  EXTENSION: "Extension",
  RENOUVELLEMENT: "Renouvellement",
  SURVEILLANCE: "Surveillance",
};

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
  } catch { return dateStr; }
}

export default function RequestDetailPage() {
  const params = useParams<{ requestId: string }>();
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<RequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { setLocation("/"); return; }
    if (user && params.requestId) fetchDetails();
  }, [user, authLoading, params.requestId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", `/api/requests/${params.requestId}/full-details`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || "Erreur lors du chargement");
    } finally { setLoading(false); }
  };

  if (authLoading || loading) {
    return <div className="flex h-screen items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <Sidebar />
        <div className="md:ml-64"><Navbar />
          <main className="p-6">
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 mx-auto text-red-500 mb-4" />
              <p className="text-lg font-medium">{error || "Demande introuvable"}</p>
              <Button variant="outline" className="mt-4" onClick={() => setLocation("/oec/mes-demandes")}>
                <ArrowLeft className="h-4 w-4 mr-2" />Retour
              </Button>
            </div>
          </main>
        </div>
      </div>
    );
  }

  const { request: req, oecProfile } = data;
  const statusInfo = STATUS_LABELS[req.status] || { label: req.status, color: "bg-gray-100 text-gray-800" };
  const documents: Array<{ name: string; url?: string }> = [];
  if (oecProfile?.documentsJson) {
    try { 
      const parsed = JSON.parse(oecProfile.documentsJson);
      if (Array.isArray(parsed)) {
        parsed.forEach((doc: any) => documents.push({ name: doc.name || doc.fileName || doc, url: doc.url }));
      } else if (typeof parsed === "object") {
        Object.entries(parsed).forEach(([key, val]: [string, any]) => {
          if (typeof val === "string") documents.push({ name: key, url: val });
          else if (val && typeof val === "object") documents.push({ name: val.name || key, url: val.url });
        });
      }
    } catch {}
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/oec/mes-demandes")}>
              <ArrowLeft className="h-4 w-4 mr-2" />Retour
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-3">
                <FileText className="h-6 w-6" />
                {req.referenceNumber || `Demande #${req.id}`}
              </h1>
              <p className="text-muted-foreground mt-1">
                {TYPE_LABELS[req.type] || req.type} — {req.domain}
              </p>
            </div>
            <Badge className={`${statusInfo.color} text-sm px-3 py-1`}>{statusInfo.label}</Badge>
          </div>

          {/* Progress - Workflow Timeline */}
          <WorkflowTimeline requestId={req.id} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Request Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" />Informations de la demande</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow label="Référence" value={req.referenceNumber || "Non attribuée"} />
                <InfoRow label="Type" value={TYPE_LABELS[req.type] || req.type} />
                <InfoRow label="Domaine / Portée" value={req.domain} />
                <DescriptionDisplay raw={req.description} />
                <Separator />
                <InfoRow label="Date de soumission" value={formatDate(req.submissionDate)} />
                <InfoRow label="Date de création" value={formatDate(req.createdAt)} />
                {req.assignmentDate && <InfoRow label="Date d'assignation" value={formatDate(req.assignmentDate)} />}
                {req.isReceivable !== null && (
                  <InfoRow label="Recevabilité" value={req.isReceivable ? "Recevable" : "Non recevable"} />
                )}
                {req.receivabilityComments && <InfoRow label="Commentaires recevabilité" value={req.receivabilityComments} />}
                {req.receivabilityCorrectionNeeded && <InfoRow label="Corrections demandées" value={req.receivabilityCorrectionNeeded} />}
                {req.correctionDeadline && <InfoRow label="Date limite correction" value={formatDate(req.correctionDeadline)} />}
              </CardContent>
            </Card>

            {/* OEC Profile */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Informations de l'organisme</CardTitle>
                <CardDescription>Données renseignées lors de l'inscription</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <InfoRow icon={<Building2 className="h-4 w-4" />} label="Organisme" value={oecProfile?.organizationName} />
                <InfoRow icon={<Briefcase className="h-4 w-4" />} label="Type" value={oecProfile?.typeOrganisme} />
                <InfoRow icon={<MapPin className="h-4 w-4" />} label="Adresse du siège" value={oecProfile?.adresseSiege} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email" value={oecProfile?.email} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Téléphone" value={oecProfile?.phone} />
                <Separator />
                <p className="text-sm font-medium text-muted-foreground">Représentant légal</p>
                <InfoRow icon={<User className="h-4 w-4" />} label="Nom" value={oecProfile?.nomRepresentant} />
                <InfoRow label="Fonction" value={oecProfile?.fonction} />
                <InfoRow icon={<Phone className="h-4 w-4" />} label="Tél. direct" value={oecProfile?.telephoneDirect} />
                <InfoRow icon={<Mail className="h-4 w-4" />} label="Email professionnel" value={oecProfile?.emailProfessionnel} />
                <Separator />
                <InfoRow icon={<Globe className="h-4 w-4" />} label="Portée d'accréditation" value={oecProfile?.porteeAccreditation} />
                <InfoRow label="Type de demande" value={
                  oecProfile?.typeDemande === "initiale" ? "Accréditation initiale" :
                  oecProfile?.typeDemande === "extension" ? "Extension" :
                  oecProfile?.typeDemande === "renouvellement" ? "Renouvellement" :
                  oecProfile?.typeDemande === "transfert" ? "Transfert" :
                  oecProfile?.typeDemande || "—"
                } />
              </CardContent>
            </Card>
          </div>

          {/* Documents */}
          {documents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Documents joints</CardTitle>
                <CardDescription>Documents soumis lors de l'inscription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {documents.map((doc, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
                      <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                      <span className="text-sm truncate flex-1">{doc.name}</span>
                      {doc.url && (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline / key dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5" />Dates clés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <TimelineItem date={req.createdAt} label="Création de la demande" done />
                <TimelineItem date={req.submissionDate} label="Soumission" done={!!req.submissionDate} />
                <TimelineItem date={req.assignmentDate} label="Dossier pris en charge" done={!!req.assignmentDate} />
                <TimelineItem date={req.evaluationStartDate} label="Début évaluation" done={!!req.evaluationStartDate} />
                <TimelineItem date={req.evaluationEndDate} label="Fin évaluation" done={!!req.evaluationEndDate} />
                <TimelineItem date={req.certificateIssueDate} label="Délivrance certificat" done={!!req.certificateIssueDate} />
                {req.certificateExpirationDate && (
                  <TimelineItem date={req.certificateExpirationDate} label="Expiration certificat" done={false} />
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      {icon && <span className="mt-0.5 text-muted-foreground">{icon}</span>}
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium break-words">{value || "—"}</p>
      </div>
    </div>
  );
}

function TimelineItem({ date, label, done }: { date?: string | null; label: string; done: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-3 h-3 rounded-full shrink-0 ${done ? "bg-green-500" : "bg-gray-300"}`} />
      <div className="flex-1 flex items-center justify-between">
        <span className={`text-sm ${done ? "font-medium" : "text-muted-foreground"}`}>{label}</span>
        <span className="text-xs text-muted-foreground">{date ? formatDate(date) : "—"}</span>
      </div>
    </div>
  );
}

const TYPE_DEMANDE_LABELS: Record<string, string> = {
  initiale: "Accréditation initiale",
  extension: "Extension de portée",
  renouvellement: "Renouvellement",
  transfert: "Transfert",
};

const SITE_TYPE_LABELS: Record<string, string> = {
  monosite: "Mono-site",
  multisite: "Multi-sites",
};

function DescriptionDisplay({ raw }: { raw?: string | null }) {
  if (!raw) return null;

  let parsed: Record<string, any> | null = null;
  try { parsed = JSON.parse(raw); } catch { /* plain text */ }

  if (!parsed || typeof parsed !== "object") {
    return (
      <div>
        <p className="text-xs text-muted-foreground">Description</p>
        <p className="text-sm font-medium whitespace-pre-wrap">{raw}</p>
      </div>
    );
  }

  const activites: string[] = Array.isArray(parsed.activites) ? parsed.activites : [];
  const sites: any[] = Array.isArray(parsed.sites) ? parsed.sites : [];
  const personnelSites: any[] = Array.isArray(parsed.personnelSites) ? parsed.personnelSites : [];

  const rows: { label: string; value: string }[] = [];

  if (parsed.typeDemande) rows.push({ label: "Type de demande", value: TYPE_DEMANDE_LABELS[parsed.typeDemande] || parsed.typeDemande });
  if (activites.length) rows.push({ label: "Activités", value: activites.join(", ") });
  if (parsed.siteType) rows.push({ label: "Type de site", value: SITE_TYPE_LABELS[parsed.siteType] || parsed.siteType });
  if (parsed.nomLegal) rows.push({ label: "Nom légal", value: parsed.nomLegal });
  if (parsed.abreviation) rows.push({ label: "Abréviation", value: parsed.abreviation });
  if (parsed.sigle) rows.push({ label: "Sigle", value: parsed.sigle });
  if (parsed.statutJuridique) rows.push({ label: "Statut juridique", value: parsed.statutJuridique });
  if (parsed.registreCommerce) rows.push({ label: "Registre de commerce", value: parsed.registreCommerce });
  if (parsed.adresseSiege) rows.push({ label: "Adresse du siège", value: parsed.adresseSiege });
  if (parsed.emailOrg) rows.push({ label: "Email organisme", value: parsed.emailOrg });
  if (parsed.siteWeb) rows.push({ label: "Site web", value: parsed.siteWeb });
  if (parsed.contactNom) rows.push({ label: "Contact", value: parsed.contactNom });
  if (parsed.contactFonction) rows.push({ label: "Fonction du contact", value: parsed.contactFonction });
  if (parsed.contactTelephone) rows.push({ label: "Téléphone contact", value: parsed.contactTelephone });
  if (parsed.contactEmail) rows.push({ label: "Email contact", value: parsed.contactEmail });
  if (parsed.dateEvaluation) rows.push({ label: "Date évaluation souhaitée", value: parsed.dateEvaluation });
  if (parsed.motifTransfert) rows.push({ label: "Motif de transfert", value: parsed.motifTransfert });
  if (parsed.responsableQualiteNom) rows.push({ label: "Responsable qualité", value: parsed.responsableQualiteNom });
  if (parsed.demandeurNom) rows.push({ label: "Demandeur", value: parsed.demandeurNom });
  if (parsed.demandeurFonction) rows.push({ label: "Fonction demandeur", value: parsed.demandeurFonction });
  if (parsed.demandeurDate) rows.push({ label: "Date de la demande", value: parsed.demandeurDate });

  if (!rows.length) return null;

  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Détails du formulaire</p>
      <div className="rounded-lg border bg-muted/20 divide-y">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex items-start gap-2 px-3 py-2">
            <span className="text-xs text-muted-foreground w-44 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm font-medium break-words">{value}</span>
          </div>
        ))}
        {sites.length > 0 && sites.some(s => s.localisation || s.adresse) && (
          <div className="px-3 py-2">
            <p className="text-xs text-muted-foreground mb-1">Sites</p>
            {sites.filter(s => s.localisation || s.adresse).map((s, i) => (
              <p key={i} className="text-sm font-medium">{s.localisation || s.adresse}</p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
