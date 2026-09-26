import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute, useLocation } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DatePicker, TimePicker } from "@/components/ui/date-time-picker";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft, Download, CalendarPlus, XCircle, ShieldBan, ShieldCheck,
  RotateCcw, Star, Users, FileText, Loader2,
} from "lucide-react";

interface Candidature {
  id: string;
  registrationId: string;
  fullName: string;
  userType: "EXPERT" | "EVALUATEUR" | "FORMATEUR";
  domaineExpertise: string;
  email: string;
  telephone: string;
  telephoneMobile?: string;
  dateInscription: string;
  status: string;
  photoBase64?: string;
  dateNaissance?: string;
  nationalite?: string;
  adresseDomicile?: string;
  wilaya?: string;
  sousDomaineExpertise?: string;
  rejectionReason?: string;
  documentsJson?: string;
  interviewDate?: string;
  interviewNotes?: string;
  interviewChecklistJson?: string;
  interviewDecision?: string;
  interviewScheduledAt?: string;
  createdAt?: string;
  rejectionType?: string;
  blacklisted?: boolean;
  blacklistReason?: string;
  blacklistedAt?: string;
  starred?: boolean;
  interviewPanelCdId?: number;
  interviewPanelRaId?: number;
}

const STATUS_LABELS_FALLBACK: Record<string, string> = {
  PENDING: "En attente",
  PROFILE_PRESELECTED: "Présélectionné (FOR28)",
  DOCUMENTS_SUBMITTED: "Documents reçus",
  INTERVIEW_SCHEDULED: "Entretien planifié",
  INTERVIEW_CONFIRMED: "Entretien confirmé",
  INTERVIEW_COMPLETED: "Entretien terminé",
  CANDIDATURE_APPROVED: "Acceptée (compte en attente)",
  APPROVED: "Compte actif",
  REJECTED: "Non retenue",
};

const getStatusBadge = (status: string, t: (key: string, opts?: any) => string) => {
  const classMap: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700 border-amber-300",
    PROFILE_PRESELECTED: "bg-orange-50 text-orange-700 border-orange-300",
    DOCUMENTS_SUBMITTED: "bg-indigo-50 text-indigo-700 border-indigo-300",
    INTERVIEW_SCHEDULED: "bg-blue-50 text-blue-700 border-blue-300",
    INTERVIEW_CONFIRMED: "bg-cyan-50 text-cyan-700 border-cyan-300",
    INTERVIEW_COMPLETED: "bg-teal-50 text-teal-700 border-teal-300",
    CANDIDATURE_APPROVED: "bg-emerald-50 text-emerald-700 border-emerald-300",
    APPROVED: "bg-green-50 text-green-700 border-green-300",
    REJECTED: "bg-slate-50 text-slate-600 border-slate-300",
  };
  const label = t(`gesCompetences.candidatures.status.${status}`, { defaultValue: STATUS_LABELS_FALLBACK[status] || status });
  return <Badge variant="outline" className={classMap[status] || ""}>{label}</Badge>;
};

const getTypeBadge = (type: string, t: (key: string, opts?: any) => string) => {
  const colors: Record<string, string> = {
    EXPERT: "bg-blue-100 text-blue-800",
    EVALUATEUR: "bg-purple-100 text-purple-800",
    FORMATEUR: "bg-indigo-100 text-indigo-800",
  };
  const labels: Record<string, string> = {
    EXPERT: t("gesCompetences.common.userType.EXPERT", { defaultValue: "Expert" }),
    EVALUATEUR: t("gesCompetences.common.userType.EVALUATEUR", { defaultValue: "Évaluateur" }),
    FORMATEUR: t("gesCompetences.common.userType.FORMATEUR", { defaultValue: "Formateur" }),
  };
  return <Badge className={colors[type]}>{labels[type] || type}</Badge>;
};

export default function CandidatureDetailPage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [matched, params] = useRoute("/ges-competences/candidatures/:id");
  const candidatureId = params?.id;

  const [candidature, setCandidature] = useState<Candidature | null>(null);
  const [loading, setLoading] = useState(true);

  // Interview scheduling
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [interviewDateObj, setInterviewDateObj] = useState<Date | undefined>(undefined);
  const [interviewTime, setInterviewTime] = useState("");
  const [availableCDs, setAvailableCDs] = useState<Array<{id: number; fullName: string; email: string; domaineExpertise: string}>>([]);
  const [availableRAs, setAvailableRAs] = useState<Array<{id: number; fullName: string; email: string; domaineExpertise: string}>>([]);
  const [selectedPanelCdId, setSelectedPanelCdId] = useState<string>("");
  const [selectedPanelRaId, setSelectedPanelRaId] = useState<string>("");

  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [starOnReject, setStarOnReject] = useState(false);

  // Blacklist dialog
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");

  // Loading state per action (preselect | schedule | reject | blacklist | unblacklist | restore | star)
  const [submittingAction, setSubmittingAction] = useState<string | null>(null);
  const isBusy = submittingAction !== null;

  useEffect(() => {
    if (candidatureId) {
      fetchCandidature();
      fetchPanelMembers();
    }
  }, [candidatureId]);

  const fetchCandidature = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/candidatures/experts", { credentials: "include" });
      if (response.ok) {
        const data: Candidature[] = await response.json();
        const found = data.find((c) => String(c.id) === String(candidatureId));
        setCandidature(found || null);
      } else {
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorLoad", { defaultValue: "Impossible de charger la candidature" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPanelMembers = async () => {
    try {
      const response = await fetch("/api/candidatures/experts/panel-members", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setAvailableCDs(data.chefsDepartement || []);
        setAvailableRAs(data.responsablesAccreditation || []);
      }
    } catch { /* ignore */ }
  };

  const handleScheduleInterview = async () => {
    if (!candidature || !interviewDateObj || !interviewTime) {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.toasts.errorSelectDateTime", { defaultValue: "Veuillez sélectionner une date et une heure" }), variant: "destructive" });
      return;
    }
    if (!selectedPanelCdId || !selectedPanelRaId) {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.toasts.errorSelectPanel", { defaultValue: "Veuillez sélectionner un Chef de Département et un Responsable d'Accréditation pour le panel" }), variant: "destructive" });
      return;
    }
    const year = interviewDateObj.getFullYear();
    const month = String(interviewDateObj.getMonth() + 1).padStart(2, "0");
    const day = String(interviewDateObj.getDate()).padStart(2, "0");
    const dateTime = `${year}-${month}-${day}T${interviewTime}:00`;
    setSubmittingAction("schedule");
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/schedule-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          interviewDate: dateTime,
          panelCdId: parseInt(selectedPanelCdId),
          panelRaId: parseInt(selectedPanelRaId),
        }),
      });
      if (response.ok) {
        toast({ title: t("gesCompetences.candidatureDetail.toasts.success", { defaultValue: "Succès" }), description: t("gesCompetences.candidatureDetail.toasts.successScheduled", { defaultValue: "Entretien planifié. Tous les membres du panel ont été notifiés." }) });
        setShowScheduleDialog(false);
        setInterviewDateObj(undefined);
        setInterviewTime("");
        setSelectedPanelCdId("");
        setSelectedPanelRaId("");
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: error.message || t("gesCompetences.candidatureDetail.toasts.errorSchedule", { defaultValue: "Impossible de planifier l'entretien" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleRejectDossier = async () => {
    if (!candidature) return;
    setSubmittingAction("reject");
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rejectionReason: rejectionReason || t("gesCompetences.candidatureDetail.defaultRejectionReason", { defaultValue: "Profil non retenu dans le cadre des besoins actuels" }) }),
      });
      if (response.ok) {
        if (starOnReject) {
          await fetch(`/api/candidatures/experts/${candidature.id}/toggle-star`, {
            method: "POST",
            credentials: "include",
          });
        }
        toast({ title: t("gesCompetences.candidatureDetail.toasts.successProcessed", { defaultValue: "Traitement effectué" }), description: t("gesCompetences.candidatureDetail.toasts.successProcessedDesc", { defaultValue: "Le candidat a été notifié par email de manière appropriée." }) });
        setShowRejectDialog(false);
        setRejectionReason("");
        setStarOnReject(false);
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: error.message || t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleDownloadFor20 = async () => {
    if (!candidature) return;
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/for20`, { credentials: "include" });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `FOR20_${candidature.registrationId}_${candidature.fullName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.toasts.errorDownloadFor20", { defaultValue: "Impossible de télécharger le FOR20" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    }
  };

  const handlePreselectProfile = async () => {
    if (!candidature) return;
    setSubmittingAction("preselect");
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/preselect-profile`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        toast({ title: t("gesCompetences.candidatureDetail.toasts.successPreselected", { defaultValue: "Profil présélectionné" }), description: t("gesCompetences.candidatureDetail.toasts.successPreselectedDesc", { defaultValue: "Un email avec le lien FOR28 a été envoyé au candidat." }) });
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: error.message || t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleBlacklist = async () => {
    if (!candidature || !blacklistReason.trim()) {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.toasts.errorRequiredBlacklistReason", { defaultValue: "Le motif de blacklist est obligatoire" }), variant: "destructive" });
      return;
    }
    setSubmittingAction("blacklist");
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: blacklistReason }),
      });
      if (response.ok) {
        toast({ title: t("gesCompetences.candidatureDetail.toasts.success", { defaultValue: "Succès" }), description: t("gesCompetences.candidatureDetail.toasts.successBlacklisted", { defaultValue: "Candidat blacklisté. Il ne pourra plus se réinscrire." }) });
        setShowBlacklistDialog(false);
        setBlacklistReason("");
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: error.message || t("gesCompetences.candidatureDetail.toasts.errorBlacklistFailed", { defaultValue: "Échec du blacklist" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleUnblacklist = async () => {
    if (!candidature) return;
    setSubmittingAction("unblacklist");
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/unblacklist`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        toast({ title: t("gesCompetences.candidatureDetail.toasts.success", { defaultValue: "Succès" }), description: t("gesCompetences.candidatureDetail.toasts.successUnblacklisted", { defaultValue: "Candidat retiré de la blacklist" }) });
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: error.message || t("gesCompetences.candidatureDetail.toasts.errorFailed", { defaultValue: "Échec" }), variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleRestore = async () => {
    if (!candidature) return;
    setSubmittingAction("restore");
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/restore`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        toast({ title: t("gesCompetences.candidatureDetail.toasts.success", { defaultValue: "Succès" }), description: t("gesCompetences.candidatureDetail.toasts.successRestored", { defaultValue: "Candidature restaurée. Le dossier est de nouveau en attente d'examen." }) });
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: error.message || t("gesCompetences.candidatureDetail.toasts.errorFailed", { defaultValue: "Échec" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleToggleStar = async () => {
    if (!candidature) return;
    setSubmittingAction("star");
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/toggle-star`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        toast({
          title: data.starred ? t("gesCompetences.candidatureDetail.toasts.successStarred", { defaultValue: "Profil marqué" }) : t("gesCompetences.candidatureDetail.toasts.successUnstarred", { defaultValue: "Marque retirée" }),
          description: data.starred
            ? t("gesCompetences.candidatureDetail.toasts.starredToastDesc", { defaultValue: "Ce profil sera considéré pour de futures opportunités." })
            : t("gesCompetences.candidatureDetail.toasts.unstarredToastDesc", { defaultValue: "La marque a été retirée." }),
        });
        fetchCandidature();
      } else {
        const error = await response.json();
        toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: error.message || t("gesCompetences.candidatureDetail.toasts.errorFailed", { defaultValue: "Échec" }), variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.candidatureDetail.toasts.error", { defaultValue: "Erreur" }), description: t("gesCompetences.candidatureDetail.errorGeneric", { defaultValue: "Une erreur est survenue" }), variant: "destructive" });
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
          {/* Back button + title */}
          <div className="mb-6 flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => setLocation("/ges-competences/candidatures")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">{t("gesCompetences.candidatureDetail.title", { defaultValue: "Détails de la Candidature" })}</h1>
              {candidature && (
                <p className="text-sm text-muted-foreground">{t("gesCompetences.candidatureDetail.reference", { id: candidature.registrationId, defaultValue: `Référence : ${candidature.registrationId}` })}</p>
              )}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">{t("gesCompetences.candidatureDetail.loading", { defaultValue: "Chargement..." })}</div>
          ) : !candidature ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <p className="text-muted-foreground">{t("gesCompetences.candidatureDetail.notFound", { defaultValue: "Candidature introuvable." })}</p>
              <Button variant="outline" onClick={() => setLocation("/ges-competences/candidatures")}>
                {t("gesCompetences.candidatureDetail.backToList", { defaultValue: "Retour à la liste" })}
              </Button>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Photo */}
              {candidature.photoBase64 && (
                <div className="flex justify-center">
                  <img
                    src={`data:image/jpeg;base64,${candidature.photoBase64}`}
                    alt="Photo"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
              )}

              {/* Identity info */}
              <Card>
                <CardContent className="pt-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.fullName", { defaultValue: "Nom Complet" })}</Label>
                      <p className="font-medium mt-1">{candidature.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.type", { defaultValue: "Type" })}</Label>
                      <div className="mt-1">{getTypeBadge(candidature.userType, t)}</div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.email", { defaultValue: "Email" })}</Label>
                      <p className="font-medium mt-1">{candidature.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.phone", { defaultValue: "Téléphone" })}</Label>
                      <p className="font-medium mt-1">{candidature.telephoneMobile || candidature.telephone || t("gesCompetences.candidatureDetail.fields.notProvided", { defaultValue: "Non renseigné" })}</p>
                    </div>
                    {candidature.dateNaissance && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.birthDate", { defaultValue: "Date de naissance" })}</Label>
                        <p className="font-medium mt-1">{candidature.dateNaissance}</p>
                      </div>
                    )}
                    {candidature.nationalite && (
                      <div>
                        <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.nationality", { defaultValue: "Nationalité" })}</Label>
                        <p className="font-medium mt-1">{candidature.nationalite}</p>
                      </div>
                    )}
                    <div>
                      <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.status", { defaultValue: "Statut" })}</Label>
                      <div className="mt-1">
                        {getStatusBadge(candidature.status, t)}
                        {candidature.blacklisted && (
                          <Badge variant="destructive" className="ml-2 text-[10px]">{t("gesCompetences.candidatureDetail.fields.blacklistedBadge", { defaultValue: "Blacklisté" })}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.domain", { defaultValue: "Domaine d'expertise" })}</Label>
                      <p className="font-medium mt-1">{candidature.domaineExpertise}</p>
                    </div>
                    {candidature.sousDomaineExpertise && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.subDomain", { defaultValue: "Sous-domaine" })}</Label>
                        <p className="font-medium mt-1">{candidature.sousDomaineExpertise}</p>
                      </div>
                    )}
                    {candidature.adresseDomicile && (
                      <div className="md:col-span-2">
                        <Label className="text-xs text-muted-foreground">{t("gesCompetences.candidatureDetail.fields.address", { defaultValue: "Adresse" })}</Label>
                        <p className="font-medium mt-1">{candidature.adresseDomicile}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Interview info */}
              {candidature.interviewDate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-semibold text-blue-700 mb-1 block">{t("gesCompetences.candidatureDetail.interviewScheduledLabel", { defaultValue: "Entretien planifié" })}</Label>
                  <p className="text-sm text-blue-800">
                    {new Date(candidature.interviewDate).toLocaleDateString("fr-FR", {
                      weekday: "long", day: "numeric", month: "long", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              )}

              {/* Rejection info */}
              {candidature.status === "REJECTED" && candidature.rejectionReason && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <Label className="text-sm font-semibold text-slate-700 mb-1 block">
                    {t("gesCompetences.candidatureDetail.rejectionReasonLabel", {
                      suffix: candidature.rejectionType === "interview"
                        ? t("gesCompetences.candidatureDetail.rejectionSuffixInterview", { defaultValue: "(après entretien)" })
                        : t("gesCompetences.candidatureDetail.rejectionSuffixDossier", { defaultValue: "(dossier)" }),
                      defaultValue: `Motif de refus ${candidature.rejectionType === "interview" ? "(après entretien)" : "(dossier)"}`,
                    })}
                  </Label>
                  <p className="text-sm text-slate-600">{candidature.rejectionReason}</p>
                </div>
              )}

              {/* Star indicator */}
              {candidature.starred && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Label className="text-sm font-semibold text-amber-700 mb-1 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {t("gesCompetences.candidatureDetail.starredLabel", { defaultValue: "Profil à considérer" })}
                  </Label>
                  <p className="text-sm text-amber-600">{t("gesCompetences.candidatureDetail.starredDesc", { defaultValue: "Ce profil a été marqué comme intéressant pour de futures opportunités." })}</p>
                </div>
              )}

              {/* Blacklist info */}
              {candidature.blacklisted && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Label className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                    <ShieldBan className="w-4 h-4" /> {t("gesCompetences.candidatureDetail.blacklistedLabel", { defaultValue: "Candidat blacklisté" })}
                  </Label>
                  <p className="text-sm text-red-600">{candidature.blacklistReason}</p>
                  {candidature.blacklistedAt && (
                    <p className="text-xs text-red-400 mt-1">
                      {t("gesCompetences.candidatureDetail.blacklistedSince", { date: new Date(candidature.blacklistedAt).toLocaleDateString("fr-FR"), defaultValue: `Depuis le ${new Date(candidature.blacklistedAt).toLocaleDateString("fr-FR")}` })}
                    </p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-green-700 border-green-300"
                    onClick={handleUnblacklist}
                  >
                    <ShieldCheck className="w-3 h-3 mr-1" /> {t("gesCompetences.candidatureDetail.removeFromBlacklist", { defaultValue: "Retirer de la blacklist" })}
                  </Button>
                </div>
              )}

              {/* Documents */}
              <Card>
                <CardContent className="pt-6">
                  <Label className="text-sm font-semibold mb-3 block">{t("gesCompetences.candidatureDetail.documentsTitle", { defaultValue: "Documents" })}</Label>
                  <Button variant="outline" className="w-full justify-start gap-2" onClick={handleDownloadFor20}>
                    <Download className="w-4 h-4" /> {t("gesCompetences.candidatureDetail.downloadFor20", { defaultValue: "Télécharger le formulaire FOR20" })}
                  </Button>
                  {candidature.documentsJson && (() => {
                    try {
                      const docs: Array<{ name: string; base64?: string; mimeType?: string }> = JSON.parse(candidature.documentsJson);
                      if (!docs || docs.length === 0) return null;
                      return (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-muted-foreground font-medium">{t("gesCompetences.candidatureDetail.attachedFiles", { defaultValue: "Fichiers joints :" })}</p>
                          {docs.map((doc, i) => (
                            <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                              <span className="text-sm truncate flex-1 mr-2">{doc.name}</span>
                              {doc.base64 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="shrink-0 h-7 px-2"
                                  onClick={() => {
                                    const mime = doc.mimeType || "application/octet-stream";
                                    const byteChars = atob(doc.base64!);
                                    const byteArr = new Uint8Array(byteChars.length);
                                    for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
                                    const blob = new Blob([byteArr], { type: mime });
                                    const url = URL.createObjectURL(blob);
                                    const a = document.createElement("a");
                                    a.href = url;
                                    a.download = doc.name;
                                    a.click();
                                    URL.revokeObjectURL(url);
                                  }}
                                >
                                  <Download className="w-3 h-3 mr-1" /> {t("gesCompetences.candidatureDetail.download", { defaultValue: "Télécharger" })}
                                </Button>
                              )}
                            </div>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardContent className="pt-6 space-y-3">
                  {/* PENDING */}
                  {candidature.status === "PENDING" && (
                    <div className="flex gap-3 flex-wrap">
                      <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={handlePreselectProfile} disabled={isBusy}>
                        {submittingAction === "preselect" ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("gesCompetences.candidatureDetail.actions.inProgress", { defaultValue: "Action en cours…" })}</>
                        ) : (
                          <><FileText className="w-4 h-4 mr-2" /> {t("gesCompetences.candidatureDetail.actions.preselect", { defaultValue: "Présélectionner (FOR28)" })}</>
                        )}
                      </Button>
                      <Button variant="outline" className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50" onClick={() => setShowRejectDialog(true)} disabled={isBusy}>
                        <XCircle className="w-4 h-4 mr-2" /> {t("gesCompetences.candidatureDetail.actions.rejectDossier", { defaultValue: "Dossier Non Retenu" })}
                      </Button>
                      {!candidature.blacklisted && (
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowBlacklistDialog(true)} disabled={isBusy}>
                          <ShieldBan className="w-4 h-4 mr-1" /> {t("gesCompetences.candidatureDetail.actions.blacklist", { defaultValue: "Blacklist" })}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* DOCUMENTS_SUBMITTED */}
                  {candidature.status === "DOCUMENTS_SUBMITTED" && (
                    <div className="flex gap-3 flex-wrap">
                      <Button
                        className="flex-1 bg-[#00A63E] hover:bg-[#009235]"
                        onClick={() => setShowScheduleDialog(true)}
                        disabled={isBusy}
                      >
                        <CalendarPlus className="w-4 h-4 mr-2" /> {t("gesCompetences.candidatureDetail.actions.scheduleInterview", { defaultValue: "Planifier un Entretien" })}
                      </Button>
                      <Button variant="outline" className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50" onClick={() => setShowRejectDialog(true)} disabled={isBusy}>
                        <XCircle className="w-4 h-4 mr-2" /> {t("gesCompetences.candidatureDetail.actions.rejectDossier", { defaultValue: "Dossier Non Retenu" })}
                      </Button>
                      {!candidature.blacklisted && (
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowBlacklistDialog(true)} disabled={isBusy}>
                          <ShieldBan className="w-4 h-4 mr-1" /> {t("gesCompetences.candidatureDetail.actions.blacklist", { defaultValue: "Blacklist" })}
                        </Button>
                      )}
                    </div>
                  )}

                  {/* REJECTED */}
                  {candidature.status === "REJECTED" && (
                    <div className="flex gap-3 flex-wrap">
                      <Button variant="outline" className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50" onClick={handleRestore} disabled={isBusy}>
                        {submittingAction === "restore" ? (
                          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("gesCompetences.candidatureDetail.actions.inProgress", { defaultValue: "Action en cours…" })}</>
                        ) : (
                          <><RotateCcw className="w-4 h-4 mr-2" /> {t("gesCompetences.candidatureDetail.actions.reexamine", { defaultValue: "Réexaminer la candidature" })}</>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        className={candidature.starred
                          ? "text-amber-600 border-amber-300 hover:bg-amber-50"
                          : "text-slate-600 border-slate-300 hover:bg-slate-50"}
                        onClick={handleToggleStar}
                        disabled={isBusy}
                      >
                        {submittingAction === "star" ? (
                          <><Loader2 className="w-4 h-4 mr-1 animate-spin" /> {t("gesCompetences.candidatureDetail.actions.inProgress", { defaultValue: "Action en cours…" })}</>
                        ) : (
                          <>
                            <Star className={`w-4 h-4 mr-1 ${candidature.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                            {candidature.starred ? t("gesCompetences.candidatureDetail.actions.unstar", { defaultValue: "Retirer l'étoile" }) : t("gesCompetences.candidatureDetail.actions.star", { defaultValue: "Marquer le profil" })}
                          </>
                        )}
                      </Button>
                    </div>
                  )}

                  {/* Blacklist action for other statuses */}
                  {candidature.status !== "PENDING" &&
                    candidature.status !== "DOCUMENTS_SUBMITTED" &&
                    candidature.status !== "REJECTED" &&
                    !candidature.blacklisted && (
                      <div className="flex gap-3">
                        <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => setShowBlacklistDialog(true)} disabled={isBusy}>
                          <ShieldBan className="w-4 h-4 mr-1" /> {t("gesCompetences.candidatureDetail.actions.blacklistCandidate", { defaultValue: "Blacklister ce candidat" })}
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("gesCompetences.candidatureDetail.scheduleDialog.title", { defaultValue: "Planifier un Entretien" })}</DialogTitle>
            <DialogDescription>
              {candidature && t("gesCompetences.candidatureDetail.scheduleDialog.candidateLabel", { name: candidature.fullName, defaultValue: `Candidat(e) : ${candidature.fullName}` })}
              <br />
              {t("gesCompetences.candidatureDetail.scheduleDialog.notice", { defaultValue: "Un email de convocation sera envoyé au candidat et à tous les membres du panel d'entretien." })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>{t("gesCompetences.candidatureDetail.scheduleDialog.dateLabel", { defaultValue: "Date de l'entretien *" })}</Label>
              <div className="mt-2">
                <DatePicker value={interviewDateObj} onChange={setInterviewDateObj} placeholder={t("gesCompetences.candidatureDetail.scheduleDialog.datePlaceholder", { defaultValue: "Sélectionner une date" })} minDate={new Date()} />
              </div>
            </div>
            <div>
              <Label>{t("gesCompetences.candidatureDetail.scheduleDialog.timeLabel", { defaultValue: "Heure de l'entretien *" })}</Label>
              <div className="mt-2">
                <TimePicker value={interviewTime} onChange={setInterviewTime} placeholder={t("gesCompetences.candidatureDetail.scheduleDialog.timePlaceholder", { defaultValue: "Sélectionner l'heure" })} />
              </div>
            </div>
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-600" />
                <Label className="text-base font-semibold">{t("gesCompetences.candidatureDetail.scheduleDialog.panelTitle", { defaultValue: "Composition du Panel d'Entretien" })}</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                {t("gesCompetences.candidatureDetail.scheduleDialog.panelNotice", { defaultValue: "Le Directeur Technique (DT) et le Responsable Qualité (RQ) sont automatiquement inclus. Veuillez sélectionner le Chef de Département et le Responsable d'Accréditation." })}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">DT</span> — <span className="text-muted-foreground">{t("gesCompetences.candidatureDetail.scheduleDialog.dtLabel", { defaultValue: "Directeur Technique" })}</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">RQ</span> — <span className="text-muted-foreground">{t("gesCompetences.candidatureDetail.scheduleDialog.rqLabel", { defaultValue: "Responsable Qualité" })}</span>
                </div>
                <div>
                  <Label>{t("gesCompetences.candidatureDetail.scheduleDialog.cdLabel", { defaultValue: "Chef de Département (CD) *" })}</Label>
                  <Select value={selectedPanelCdId} onValueChange={(val) => { setSelectedPanelCdId(val); setSelectedPanelRaId(""); }}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("gesCompetences.candidatureDetail.scheduleDialog.cdPlaceholder", { defaultValue: "Sélectionner un Chef de Département" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCDs.map((cd) => (
                        <SelectItem key={cd.id} value={String(cd.id)}>
                          {cd.fullName} ({cd.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>{t("gesCompetences.candidatureDetail.scheduleDialog.raLabel", { defaultValue: "Responsable d'Accréditation (RA) *" })}</Label>
                  <Select value={selectedPanelRaId} onValueChange={setSelectedPanelRaId} disabled={!selectedPanelCdId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={selectedPanelCdId ? t("gesCompetences.candidatureDetail.scheduleDialog.raPlaceholder", { defaultValue: "Sélectionner un Responsable d'Accréditation" }) : t("gesCompetences.candidatureDetail.scheduleDialog.raPlaceholderNoCD", { defaultValue: "Veuillez d'abord sélectionner un CD" })} />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRAs
                        .filter((ra) => {
                          const selectedCD = availableCDs.find((cd) => String(cd.id) === selectedPanelCdId);
                          return selectedCD ? ra.domaineExpertise === selectedCD.domaineExpertise : true;
                        })
                        .map((ra) => (
                          <SelectItem key={ra.id} value={String(ra.id)}>
                            {ra.fullName} ({ra.email})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">GES</span> — <span className="text-muted-foreground">{t("gesCompetences.candidatureDetail.scheduleDialog.gesLabel", { defaultValue: "Gestionnaire de Compétences (vous)" })}</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowScheduleDialog(false); setInterviewDateObj(undefined); setInterviewTime(""); setSelectedPanelCdId(""); setSelectedPanelRaId(""); }}>
              {t("gesCompetences.candidatureDetail.scheduleDialog.cancel", { defaultValue: "Annuler" })}
            </Button>
            <Button
              className="bg-[#00A63E] hover:bg-[#009235]"
              onClick={handleScheduleInterview}
              disabled={!interviewDateObj || !interviewTime || !selectedPanelCdId || !selectedPanelRaId || submittingAction === "schedule"}
            >
              {submittingAction === "schedule" ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("gesCompetences.candidatureDetail.actions.inProgress", { defaultValue: "Action en cours…" })}</>
              ) : (
                <><CalendarPlus className="w-4 h-4 mr-2" /> {t("gesCompetences.candidatureDetail.scheduleDialog.confirm", { defaultValue: "Confirmer & Notifier le Panel" })}</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dossier Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("gesCompetences.candidatureDetail.rejectDialog.title", { defaultValue: "Dossier Non Retenu" })}</DialogTitle>
            <DialogDescription>
              {t("gesCompetences.candidatureDetail.rejectDialog.notice", { defaultValue: "Le candidat recevra un email professionnel indiquant que son profil ne correspond pas aux besoins actuels, tout en gardant son dossier pour de futures opportunités." })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">{t("gesCompetences.candidatureDetail.rejectDialog.reasonLabel", { defaultValue: "Motif de refus (non visible par le candidat)" })}</Label>
              <Textarea
                id="rejectionReason"
                placeholder={t("gesCompetences.candidatureDetail.rejectDialog.reasonPlaceholder", { defaultValue: "Raison interne du refus (pour vos archives uniquement)..." })}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            <div
              className="flex items-center gap-3 p-3 border rounded-lg hover:bg-amber-50/50 cursor-pointer"
              onClick={() => setStarOnReject(!starOnReject)}
            >
              <Checkbox checked={starOnReject} onCheckedChange={(checked) => setStarOnReject(!!checked)} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${starOnReject ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                  <span className="text-sm font-medium">{t("gesCompetences.candidatureDetail.rejectDialog.starCheckboxLabel", { defaultValue: "Bon profil à considérer" })}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">{t("gesCompetences.candidatureDetail.rejectDialog.starCheckboxDesc", { defaultValue: "Marquer ce profil pour une éventuelle reconsidération future." })}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowRejectDialog(false); setRejectionReason(""); setStarOnReject(false); }} disabled={submittingAction === "reject"}>
                {t("gesCompetences.candidatureDetail.rejectDialog.cancel", { defaultValue: "Annuler" })}
              </Button>
              <Button variant="outline" className="flex-1 text-slate-600" onClick={handleRejectDossier} disabled={submittingAction === "reject"}>
                {submittingAction === "reject" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("gesCompetences.candidatureDetail.actions.inProgress", { defaultValue: "Action en cours…" })}</>
                ) : (
                  t("gesCompetences.candidatureDetail.rejectDialog.confirm", { defaultValue: "Confirmer" })
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <ShieldBan className="w-5 h-5" /> {t("gesCompetences.candidatureDetail.blacklistDialog.title", { defaultValue: "Blacklister un candidat" })}
            </DialogTitle>
            <DialogDescription>
              {candidature && t("gesCompetences.candidatureDetail.blacklistDialog.candidateLabel", { name: candidature.fullName, defaultValue: `Candidat(e) : ${candidature.fullName}` })}
              <br />
              {t("gesCompetences.candidatureDetail.blacklistDialog.notice", { defaultValue: "Un candidat blacklisté ne pourra plus se réinscrire avec la même adresse email." })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="blacklistReason">{t("gesCompetences.candidatureDetail.blacklistDialog.reasonLabel", { defaultValue: "Motif du blacklist *" })}</Label>
              <Textarea
                id="blacklistReason"
                placeholder={t("gesCompetences.candidatureDetail.blacklistDialog.reasonPlaceholder", { defaultValue: "Raison du blacklist (spam, abus, fausse identité...)" })}
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                rows={3}
                className="mt-2"
              />
            </div>
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">
                <strong>{t("gesCompetences.candidatureDetail.blacklistDialog.warningTitle", { defaultValue: "Attention :" })}</strong> {t("gesCompetences.candidatureDetail.blacklistDialog.warningText", { defaultValue: "Cette action empêchera ce candidat de se réinscrire. Elle peut être annulée ultérieurement." })}
              </p>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowBlacklistDialog(false); setBlacklistReason(""); }} disabled={submittingAction === "blacklist"}>
                {t("gesCompetences.candidatureDetail.blacklistDialog.cancel", { defaultValue: "Annuler" })}
              </Button>
              <Button variant="destructive" onClick={handleBlacklist} disabled={!blacklistReason.trim() || submittingAction === "blacklist"}>
                {submittingAction === "blacklist" ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> {t("gesCompetences.candidatureDetail.actions.inProgress", { defaultValue: "Action en cours…" })}</>
                ) : (
                  <><ShieldBan className="w-4 h-4 mr-2" /> {t("gesCompetences.candidatureDetail.blacklistDialog.confirm", { defaultValue: "Confirmer le blacklist" })}</>
                )}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
