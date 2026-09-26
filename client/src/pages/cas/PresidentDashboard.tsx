import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import {
  Loader2, Gavel, Vote, FileText, CalendarDays, CheckCircle2, Users,
  ShieldCheck, AlertTriangle, ClipboardList, Crown, FileCheck,
  UserCheck, Scale, Clock, Send, Play, StopCircle, Eye, BookOpen,
  Stamp, AlertCircle, ArrowRight, BarChart3, Building2, Star, Ban, RefreshCw
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

/**
 * PRO_07 - Procedure Gestion CAS ALGERAC (Rév. 16)
 * PRO_16 - Procedure Prise de Décision ALGERAC (Rév. 04)
 * FOR 15 - Avis du CAS et Décision d'Accréditation
 *
 * CAS President Dashboard — Full implementation of:
 * - Meeting management: schedule, send summons, send dossiers, manage quorum
 * - FOR 15 decision form with full PRO 16 compliance
 * - Decision types: Grant (full/reduced/with reserves), Refuse, Postpone
 * - Meeting minutes (PV), justifications, appeal rights notification
 * - Vote monitoring, quorum verification, conflict of interest tracking
 * - Decision follow-up and notification management
 */
export default function CASPresidentDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [attendees, setAttendees] = useState<any[]>([]);
  const [voteResults, setVoteResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // FOR 33 & FOR 65-2
  const [for33Data, setFor33Data] = useState<any>(null);
  const [for65List, setFor65List] = useState<any[]>([]);
  const [showFor65Dialog, setShowFor65Dialog] = useState(false);
  const [for65Form, setFor65Form] = useState({
    memberId: "", overallRating: "3", technicalKnowledgeRating: "3",
    impartialityRating: "3", independenceRating: "3", communicationRating: "3",
    strengths: "", areasForImprovement: "", remarks: "", recommendMaintain: true,
    maintenanceJustification: "",
  });

  // Dialogs
  const [showDecisionDialog, setShowDecisionDialog] = useState(false);
  const [showMinutesDialog, setShowMinutesDialog] = useState(false);

  // FOR 15 - Decision form (PRO 16)
  const [decisionForm, setDecisionForm] = useState({
    decision: "ACCORDER",
    presidentNotes: "",
    for15DecisionJustification: "",
    for15Conditions: "",
    for15ScopeDecision: "",
    for15ReservesToLift: "",
    for15ReservesDeadline: "",
    for15AppealRightsNotice: "Conformément à GEN 04 — Procédure d'appel et de réclamation, l'OEC dispose d'un délai de 30 jours pour exercer son droit de recours à compter de la notification de la présente décision.",
    meetingMinutes: "",
  });

  useEffect(() => { loadMeetings(); }, []);

  const loadMeetings = async () => {
    try {
      const res = await fetch("/api/workflow/cas/meetings", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setMeetings(Array.isArray(data) ? data : []);
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectMeeting = async (meeting: any) => {
    setSelectedMeeting(meeting);
    setFor33Data(null);
    setFor65List([]);
    try {
      const [vRes, aRes, vrRes, f33Res, f65Res] = await Promise.all([
        fetch(`/api/workflow/cas/${meeting.id}/votes`, { credentials: "include" }),
        fetch(`/api/workflow/cas/${meeting.id}/attendees`, { credentials: "include" }),
        fetch(`/api/workflow/cas/${meeting.id}/vote-results`, { credentials: "include" }),
        fetch(`/api/cas-committees/meetings/${meeting.id}/for33`, { credentials: "include" }),
        fetch(`/api/cas-committees/meetings/${meeting.id}/for65`, { credentials: "include" }),
      ]);
      if (vRes.ok) { const d = await vRes.json(); setVotes(Array.isArray(d) ? d : []); }
      if (aRes.ok) { const d = await aRes.json(); setAttendees(Array.isArray(d) ? d : []); }
      if (vrRes.ok) setVoteResults(await vrRes.json());
      if (f33Res.ok) setFor33Data(await f33Res.json());
      if (f65Res.ok) { const d = await f65Res.json(); setFor65List(Array.isArray(d) ? d : []); }
    } catch (e) { }
  };

  // PRO 07 - Send formal summons
  const sendSummons = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/send-summons`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Convocations envoyées", description: "PRO 07 — Les membres CAS ont été convoqués" });
        loadMeetings();
        selectMeeting({ ...selectedMeeting, status: "SUMMONS_SENT" });
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  // PRO 07 - Send dossier to members
  const sendDossier = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/send-dossier`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Dossier transmis", description: "PRO 07 §5.3 — Le dossier est disponible pour les membres" });
        loadMeetings();
        selectMeeting({ ...selectedMeeting, status: "DOSSIER_SENT" });
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  // PRO 07 - Start meeting (verify quorum)
  const startMeeting = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/start-meeting`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Réunion démarrée", description: data.message });
        loadMeetings();
        selectMeeting({ ...selectedMeeting, status: "IN_PROGRESS" });
      }
    } catch (e: any) { toast({ title: "Erreur quorum", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  // PRO 07 - Open voting phase
  const openVoting = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/open-vote`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Vote ouvert", description: "Les membres peuvent maintenant soumettre leur FOR 14" });
        loadMeetings();
        selectMeeting({ ...selectedMeeting, status: "VOTING" });
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  // PRO 07 - Close voting phase
  const closeVoting = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/close-voting`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Vote clôturé", description: "Phase de vote terminée — prêt pour la décision" });
        loadMeetings();
        selectMeeting(selectedMeeting);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  // PRO 16 - Submit final decision (FOR 15)
  const submitDecision = async () => {
    if (!selectedMeeting) return;
    if (!decisionForm.for15DecisionJustification.trim()) {
      toast({ title: "Champ obligatoire", description: "La justification est obligatoire (PRO 16 §5.3)", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/decide`, {
        decision: decisionForm.decision,
        presidentNotes: decisionForm.presidentNotes,
        for15DecisionJustification: decisionForm.for15DecisionJustification,
        for15Conditions: decisionForm.for15Conditions,
        for15ScopeDecision: decisionForm.for15ScopeDecision,
        for15ReservesToLift: decisionForm.for15ReservesToLift,
        for15ReservesDeadline: decisionForm.for15ReservesDeadline || null,
        for15AppealRightsNotice: decisionForm.for15AppealRightsNotice,
        meetingMinutes: decisionForm.meetingMinutes,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Décision FOR 15 enregistrée", description: "PRO 16 — Le RA a été notifié pour transmission à l'OEC" });
        setShowDecisionDialog(false);
        setDecisionForm({
          decision: "ACCORDER", presidentNotes: "",
          for15DecisionJustification: "", for15Conditions: "",
          for15ScopeDecision: "", for15ReservesToLift: "",
          for15ReservesDeadline: "",
          for15AppealRightsNotice: "Conformément à GEN 04 — Procédure d'appel et de réclamation, l'OEC dispose d'un délai de 30 jours pour exercer son droit de recours à compter de la notification de la présente décision.",
          meetingMinutes: "",
        });
        loadMeetings();
        selectMeeting(selectedMeeting);
      }
    } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
    setSubmitting(false);
  };

  if (!user) return null;

  const actualVotes = votes.filter((v: any) => v.vote && v.vote !== "PENDING");
  const pendingVotes = votes.filter((v: any) => v.vote === "PENDING");
  const plannedMeetings = meetings.filter(m =>
    ["PLANNED", "SUMMONS_SENT", "ATTENDEES_CONFIRMED", "DOSSIER_SENT", "IN_PROGRESS", "VOTING"].includes(m.status)
  );
  const decidedMeetings = meetings.filter(m => ["DECIDED", "CLOSED"].includes(m.status));

  const voteLabels: Record<string, { label: string; color: string }> = {
    ACCORDER: { label: "Accréditation accordée", color: "bg-green-100 text-green-800" },
    ACCORDER_REDUIT: { label: "Portée réduite", color: "bg-emerald-100 text-emerald-800" },
    ACCORDER_RESERVES: { label: "Avec réserves", color: "bg-teal-100 text-teal-800" },
    REFUSER: { label: "Refuser", color: "bg-red-100 text-red-800" },
    AJOURNER: { label: "Ajourner", color: "bg-amber-100 text-amber-800" },
    ABSTENTION: { label: "Abstention", color: "bg-gray-100 text-gray-800" },
    PENDING: { label: "En attente", color: "bg-blue-100 text-blue-800" },
  };

  const meetingStatusLabels: Record<string, { label: string; color: string; icon: any }> = {
    PLANNED: { label: "Planifiée", color: "bg-blue-100 text-blue-800", icon: CalendarDays },
    SUMMONS_SENT: { label: "Convocations envoyées", color: "bg-indigo-100 text-indigo-800", icon: Send },
    ATTENDEES_CONFIRMED: { label: "Présences confirmées", color: "bg-cyan-100 text-cyan-800", icon: UserCheck },
    DOSSIER_SENT: { label: "Dossiers transmis", color: "bg-violet-100 text-violet-800", icon: FileText },
    IN_PROGRESS: { label: "En cours", color: "bg-orange-100 text-orange-800", icon: Play },
    VOTING: { label: "Vote ouvert", color: "bg-emerald-100 text-emerald-800", icon: Vote },
    DECIDED: { label: "Décidé", color: "bg-green-100 text-green-800", icon: Gavel },
    CLOSED: { label: "Clôturée", color: "bg-gray-100 text-gray-800", icon: CheckCircle2 },
  };

  // Compute vote breakdown
  const voteBreakdown = () => {
    const counts: Record<string, number> = {};
    actualVotes.forEach((v: any) => {
      const key = v.vote?.startsWith("ACCORDER") ? "ACCORDER" : v.vote;
      counts[key] = (counts[key] || 0) + 1;
    });
    return counts;
  };

  // Determine workflow actions based on meeting status
  const getAvailableActions = () => {
    if (!selectedMeeting) return [];
    const actions: { label: string; icon: any; onClick: () => void; variant?: string; disabled?: boolean }[] = [];
    const s = selectedMeeting.status;

    if (s === "PLANNED") {
      actions.push({ label: "Envoyer les convocations", icon: Send, onClick: sendSummons });
    }
    if (["PLANNED", "SUMMONS_SENT"].includes(s)) {
      actions.push({ label: "Transmettre le dossier", icon: FileText, onClick: sendDossier });
    }
    if (["ATTENDEES_CONFIRMED", "DOSSIER_SENT"].includes(s)) {
      actions.push({ label: "Démarrer la réunion", icon: Play, onClick: startMeeting });
    }
    if (s === "IN_PROGRESS") {
      actions.push({ label: "Ouvrir le vote (FOR 14)", icon: Vote, onClick: openVoting });
    }
    if (s === "VOTING") {
      actions.push({ label: "Clôturer le vote", icon: StopCircle, onClick: closeVoting, variant: "outline" });
      actions.push({ label: "Prendre la décision (FOR 15)", icon: Gavel, onClick: () => setShowDecisionDialog(true) });
    }
    return actions;
  };

  // PRO 07 workflow steps
  const workflowSteps = [
    { key: "PLANNED", label: "1. Planification", desc: "Réunion planifiée" },
    { key: "SUMMONS_SENT", label: "2. Convocation", desc: "Convocations envoyées (PRO 07 §4)" },
    { key: "ATTENDEES_CONFIRMED", label: "3. Présences", desc: "Déclarations d'intérêts reçues" },
    { key: "DOSSIER_SENT", label: "4. Dossier", desc: "Dossier transmis aux membres (§5.3)" },
    { key: "IN_PROGRESS", label: "5. Délibération", desc: "Réunion en cours — quorum vérifié" },
    { key: "VOTING", label: "6. Vote FOR 14", desc: "Avis individuels des membres" },
    { key: "DECIDED", label: "7. Décision FOR 15", desc: "Décision prise (PRO 16)" },
  ];

  const statusOrder = ["PLANNED", "SUMMONS_SENT", "ATTENDEES_CONFIRMED", "DOSSIER_SENT", "IN_PROGRESS", "VOTING", "DECIDED", "CLOSED"];
  const currentStepIndex = selectedMeeting ? statusOrder.indexOf(selectedMeeting.status) : -1;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <Crown className="w-7 h-7 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">{t('cas_page.presidentDashboardTitle')}</h1>
                  <p className="text-muted-foreground mt-1">
                    PRO 07 (Gestion CAS) & PRO 16 (Prise de Décision) | {user.fullName}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={loadMeetings} disabled={loading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
                {t("common.refresh")}
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Réunions actives</p><p className="text-2xl font-bold">{plannedMeetings.length}</p></div>
                  <CalendarDays className="w-8 h-8 text-primary/60" />
                </CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">En attente de décision</p><p className="text-2xl font-bold text-amber-600">{meetings.filter(m => m.status === "VOTING").length}</p></div>
                  <Gavel className="w-8 h-8 text-amber-500/60" />
                </CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Décisions rendues</p><p className="text-2xl font-bold text-green-600">{decidedMeetings.length}</p></div>
                  <CheckCircle2 className="w-8 h-8 text-green-500/60" />
                </CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Avis reçus</p><p className="text-2xl font-bold text-blue-600">{actualVotes.length}</p></div>
                  <ClipboardList className="w-8 h-8 text-blue-500/60" />
                </CardContent></Card>
              </div>

              {/* PRO 07/16 Reference */}
              

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Meetings List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" /> Réunions CAS
                    </CardTitle>
                    <CardDescription>Sélectionnez une réunion à gérer</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[65vh] overflow-y-auto">
                    {meetings.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune réunion CAS</p>
                    )}
                    {meetings.map((m) => {
                      const si = meetingStatusLabels[m.status] || { label: m.status, color: "bg-gray-100 text-gray-800", icon: CalendarDays };
                      return (
                        <div key={m.id} onClick={() => selectMeeting(m)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedMeeting?.id === m.id ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-gray-50"
                          }`}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{m.meetingCode || `CAS #${m.id}`}</p>
                            {["VOTING", "IN_PROGRESS"].includes(m.status) && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString("fr-FR", {
                              weekday: "short", day: "numeric", month: "long", year: "numeric"
                            }) : "Date à définir"}
                          </p>
                          <Badge className={`text-xs mt-1 ${si.color}`}>{si.label}</Badge>
                          {m.finalDecision && (
                            <Badge className={`text-xs mt-1 ml-1 ${voteLabels[m.finalDecision]?.color || "bg-gray-100"}`}>
                              {voteLabels[m.finalDecision]?.label || m.finalDecision}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Right Panel - Meeting Management */}
                <Card className="lg:col-span-2">
                  <CardContent className="pt-6">
                    {!selectedMeeting ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Crown className="w-12 h-12 mb-3 opacity-30" />
                        <p>Sélectionnez une réunion CAS à gérer</p>
                      </div>
                    ) : (
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4 flex-wrap h-auto gap-1">
                          <TabsTrigger value="overview"><Eye className="w-4 h-4 mr-1" />Vue d'ensemble</TabsTrigger>
                          <TabsTrigger value="workflow"><ArrowRight className="w-4 h-4 mr-1" />Flux PRO 07</TabsTrigger>
                          <TabsTrigger value="attendees"><Users className="w-4 h-4 mr-1" />Présences</TabsTrigger>
                          <TabsTrigger value="for33"><FileCheck className="w-4 h-4 mr-1" />FOR 33</TabsTrigger>
                          <TabsTrigger value="votes"><ClipboardList className="w-4 h-4 mr-1" />Avis FOR 14</TabsTrigger>
                          <TabsTrigger value="decision"><Gavel className="w-4 h-4 mr-1" />Décision FOR 15</TabsTrigger>
                          <TabsTrigger value="for65"><Star className="w-4 h-4 mr-1" />FOR 65-2</TabsTrigger>
                        </TabsList>

                        {/* OVERVIEW TAB */}
                        <TabsContent value="overview">
                          <div className="space-y-4">
                            {/* Meeting header */}
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold text-lg">{selectedMeeting.meetingCode}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {selectedMeeting.meetingDate
                                    ? new Date(selectedMeeting.meetingDate).toLocaleString("fr-FR", {
                                        weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
                                      })
                                    : "Date à définir"}{" — "}{selectedMeeting.location || "Siège ALGERAC"}
                                </p>
                              </div>
                              <Badge className={meetingStatusLabels[selectedMeeting.status]?.color || ""}>
                                {meetingStatusLabels[selectedMeeting.status]?.label || selectedMeeting.status}
                              </Badge>
                            </div>

                            {/* Key metrics */}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="text-center p-3 bg-blue-50 rounded-lg">
                                <p className="text-2xl font-bold text-blue-700">{attendees.length}</p>
                                <p className="text-xs text-blue-600">Présences confirmées</p>
                              </div>
                              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                                <p className="text-2xl font-bold text-emerald-700">{actualVotes.length}</p>
                                <p className="text-xs text-emerald-600">Avis FOR 14 reçus</p>
                              </div>
                              <div className="text-center p-3 bg-amber-50 rounded-lg">
                                <p className="text-2xl font-bold text-amber-700">{pendingVotes.length}</p>
                                <p className="text-xs text-amber-600">En attente de vote</p>
                              </div>
                            </div>

                            {/* Agenda & Dossier */}
                            {selectedMeeting.agenda && (
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Ordre du jour</p>
                                <p className="text-sm whitespace-pre-wrap">{selectedMeeting.agenda}</p>
                              </div>
                            )}
                            {selectedMeeting.dossierSummary && (
                              <div className="p-3 bg-gray-50 rounded-lg border">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Synthèse du dossier</p>
                                <p className="text-sm whitespace-pre-wrap">{selectedMeeting.dossierSummary}</p>
                              </div>
                            )}

                            {/* Committee info — PRO 07 §5.1 */}
                            {selectedMeeting.committeeName && (
                              <Card className="border-blue-200 bg-blue-50/30">
                                <CardContent className="pt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    <p className="font-medium text-blue-900">Comité CAS assigné (PRO 07 §5.1)</p>
                                  </div>
                                  <p className="text-sm font-semibold">{selectedMeeting.committeeName}</p>
                                  {for33Data && (
                                    <p className="text-xs text-blue-600 mt-1">
                                      {for33Data.totalConvened} membre(s) convoqué(s) — {for33Data.totalAttended} présent(s)
                                    </p>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                            {!selectedMeeting.committeeId && (
                              <div className="p-3 border border-amber-200 bg-amber-50/40 rounded-lg">
                                <p className="text-xs text-amber-700 flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" />
                                  Aucun comité assigné automatiquement. Vérifiez que le domaine de la demande correspond à un comité existant.
                                </p>
                              </div>
                            )}

                            {/* Available actions */}
                            {getAvailableActions().length > 0 && (
                              <div className="space-y-2">
                                <p className="text-sm font-medium text-muted-foreground">Actions disponibles</p>
                                <div className="flex flex-wrap gap-2">
                                  {getAvailableActions().map((action, i) => (
                                    <Button key={i} onClick={action.onClick} disabled={submitting}
                                      variant={action.variant as any || "default"}>
                                      {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <action.icon className="w-4 h-4 mr-2" />}
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Final Decision display */}
                            {selectedMeeting.finalDecision && (
                              <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="pt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Gavel className="w-5 h-5 text-primary" />
                                    <p className="font-semibold text-lg">Décision finale (FOR 15)</p>
                                  </div>
                                  <Badge className={voteLabels[selectedMeeting.finalDecision]?.color || "bg-gray-100"}>
                                    {voteLabels[selectedMeeting.finalDecision]?.label || selectedMeeting.finalDecision}
                                  </Badge>
                                  {selectedMeeting.for15DecisionJustification && (
                                    <div className="mt-3 p-3 bg-white/50 rounded">
                                      <p className="text-xs font-medium text-muted-foreground">Justification (PRO 16)</p>
                                      <p className="text-sm mt-1">{selectedMeeting.for15DecisionJustification}</p>
                                    </div>
                                  )}
                                  {selectedMeeting.for15Conditions && (
                                    <div className="mt-2 p-3 bg-white/50 rounded">
                                      <p className="text-xs font-medium text-muted-foreground">Conditions</p>
                                      <p className="text-sm mt-1">{selectedMeeting.for15Conditions}</p>
                                    </div>
                                  )}
                                  {selectedMeeting.presidentNotes && (
                                    <div className="mt-2 p-3 bg-white/50 rounded">
                                      <p className="text-xs font-medium text-muted-foreground">Notes du Président</p>
                                      <p className="text-sm mt-1">{selectedMeeting.presidentNotes}</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}
                          </div>
                        </TabsContent>

                        {/* WORKFLOW TAB — PRO 07 step visualization */}
                        <TabsContent value="workflow">
                          <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                              <ArrowRight className="w-5 h-5" /> Flux PRO 07 — Déroulement de la réunion CAS
                            </h3>
                            <div className="space-y-0">
                              {workflowSteps.map((step, i) => {
                                const stepIdx = statusOrder.indexOf(step.key);
                                const isCurrent = stepIdx === currentStepIndex;
                                const isCompleted = stepIdx < currentStepIndex;
                                const isFuture = stepIdx > currentStepIndex;
                                return (
                                  <div key={step.key} className="flex gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                                        isCompleted ? "bg-green-500 text-white" :
                                        isCurrent ? "bg-primary text-white ring-2 ring-primary/30 ring-offset-2" :
                                        "bg-gray-200 text-gray-500"
                                      }`}>
                                        {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                                      </div>
                                      {i < workflowSteps.length - 1 && (
                                        <div className={`w-0.5 h-8 ${isCompleted ? "bg-green-300" : "bg-gray-200"}`} />
                                      )}
                                    </div>
                                    <div className={`pb-4 ${isFuture ? "opacity-50" : ""}`}>
                                      <p className={`font-medium text-sm ${isCurrent ? "text-primary" : ""}`}>{step.label}</p>
                                      <p className="text-xs text-muted-foreground">{step.desc}</p>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            {/* Quorum status */}
                            <Card className="border-amber-200 bg-amber-50/30">
                              <CardContent className="pt-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-5 h-5 text-amber-600" />
                                  <p className="font-medium text-amber-900">Quorum (PRO 07 §5.2)</p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <Progress value={attendees.length > 0 ? Math.min(100, (attendees.length / (selectedMeeting.quorumRequired || 3)) * 100) : 0} className="flex-1" />
                                  <span className="text-sm font-medium text-amber-700">
                                    {attendees.length} / {selectedMeeting.quorumRequired || 3}
                                  </span>
                                </div>
                                {selectedMeeting.quorumReached && (
                                  <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
                                    <CheckCircle2 className="w-3 h-3" /> Quorum atteint
                                  </p>
                                )}
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        {/* ATTENDEES TAB — PRO 07 §5.10 */}
                        <TabsContent value="attendees">
                          <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Users className="w-5 h-5" /> Présences & Impartialité (PRO 07 §5.10)
                            </h3>

                            {/* Excluded evaluator alert */}
                            {attendees.some((a: any) => a.isExcludedEvaluator) && (
                              <Card className="border-orange-300 bg-orange-50/40">
                                <CardContent className="pt-4">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Ban className="w-5 h-5 text-orange-600" />
                                    <p className="font-medium text-orange-900">Membres exclus de la délibération (PRO 07 §5.10.a)</p>
                                  </div>
                                  <p className="text-sm text-orange-700">
                                    Ces membres ont participé à l'évaluation du dossier. Ils peuvent assister à la réunion
                                    mais ne participent pas au vote.
                                  </p>
                                </CardContent>
                              </Card>
                            )}

                            {attendees.length > 0 ? (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Membre</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Conflit d'intérêts</TableHead>
                                    <TableHead>Exclu (évaluateur)</TableHead>
                                    <TableHead>A voté</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {attendees.map((a: any, i: number) => (
                                    <TableRow key={i} className={
                                      a.isExcludedEvaluator ? "bg-orange-50/50" :
                                      a.hasConflictOfInterest ? "bg-red-50/50" : ""
                                    }>
                                      <TableCell className="font-medium">{a.voterName || `Membre #${a.voterId}`}</TableCell>
                                      <TableCell>
                                        <Badge className="bg-green-100 text-green-800">
                                          <UserCheck className="w-3 h-3 mr-1" /> Présent
                                        </Badge>
                                      </TableCell>
                                      <TableCell>
                                        {a.hasConflictOfInterest ? (
                                          <div>
                                            <Badge className="bg-red-100 text-red-800">
                                              <AlertTriangle className="w-3 h-3 mr-1" /> Déclaré
                                            </Badge>
                                            {a.conflictDescription && (
                                              <p className="text-xs text-red-600 mt-1 max-w-[180px] truncate">{a.conflictDescription}</p>
                                            )}
                                          </div>
                                        ) : (
                                          <Badge className="bg-green-100 text-green-800">
                                            <ShieldCheck className="w-3 h-3 mr-1" /> Aucun
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {a.isExcludedEvaluator ? (
                                          <Badge className="bg-orange-100 text-orange-800">
                                            <Ban className="w-3 h-3 mr-1" /> Exclu §5.10.a
                                          </Badge>
                                        ) : (
                                          <Badge className="bg-green-100 text-green-800">
                                            <CheckCircle2 className="w-3 h-3 mr-1" /> Éligible
                                          </Badge>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        {a.hasVoted ? (
                                          <Badge className="bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3 mr-1" />Oui</Badge>
                                        ) : (
                                          <Badge className="bg-amber-100 text-amber-800"><Clock className="w-3 h-3 mr-1" />Non</Badge>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Aucune présence confirmée</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* FOR 33 TAB — Liste de présence officielle */}
                        <TabsContent value="for33">
                          <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                              <FileCheck className="w-5 h-5" /> FOR 33 — Liste de présence officielle (PRO 07 §5.10)
                            </h3>
                            {for33Data ? (
                              <>
                                <div className="grid grid-cols-3 gap-3 text-sm">
                                  <div className="p-3 bg-blue-50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Convoqués</p>
                                    <p className="text-xl font-bold text-blue-700">{for33Data.totalConvened}</p>
                                  </div>
                                  <div className="p-3 bg-green-50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Présents</p>
                                    <p className="text-xl font-bold text-green-700">{for33Data.totalAttended}</p>
                                  </div>
                                  <div className="p-3 bg-amber-50 rounded-lg">
                                    <p className="text-xs text-muted-foreground">Quorum</p>
                                    <p className="text-xl font-bold text-amber-700">{for33Data.quorumRequired}</p>
                                  </div>
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Membre</TableHead>
                                      <TableHead>Rôle</TableHead>
                                      <TableHead>Convoqué le</TableHead>
                                      <TableHead>Présent</TableHead>
                                      <TableHead>Conflit / Exclusion</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {(for33Data.attendanceList || []).map((row: any, i: number) => (
                                      <TableRow key={i}>
                                        <TableCell className="font-medium">
                                          {row.memberName}
                                          {row.isPresident && <Badge className="ml-2 bg-purple-100 text-purple-800 text-xs">Président</Badge>}
                                          {row.isVicePresident && <Badge className="ml-2 bg-indigo-100 text-indigo-800 text-xs">Vice-Président</Badge>}
                                        </TableCell>
                                        <TableCell className="text-xs text-gray-500">{row.memberEmail}</TableCell>
                                        <TableCell className="text-xs">
                                          {row.convocationSentAt ? new Date(row.convocationSentAt).toLocaleDateString("fr-FR") : "—"}
                                          {row.convocationAcknowledged && (
                                            <Badge className="ml-1 bg-green-100 text-green-700 text-xs">Accusé de réception</Badge>
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          {row.attended
                                            ? <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Oui</Badge>
                                            : <Badge className="bg-gray-100 text-gray-600">Non</Badge>}
                                        </TableCell>
                                        <TableCell>
                                          {row.isExcludedEvaluator && (
                                            <Badge className="bg-orange-100 text-orange-800">
                                              <Ban className="w-3 h-3 mr-1" />Exclu §5.10.a
                                            </Badge>
                                          )}
                                          {row.hasConflictOfInterest && !row.isExcludedEvaluator && (
                                            <Badge className="bg-red-100 text-red-800">
                                              <AlertTriangle className="w-3 h-3 mr-1" />Conflit déclaré
                                            </Badge>
                                          )}
                                          {!row.isExcludedEvaluator && !row.hasConflictOfInterest && (
                                            <Badge className="bg-green-100 text-green-800">
                                              <ShieldCheck className="w-3 h-3 mr-1" />OK
                                            </Badge>
                                          )}
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <FileCheck className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Envoyez les convocations pour générer FOR 33</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* VOTES TAB — FOR 14 review */}
                        <TabsContent value="votes">
                          <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                              <ClipboardList className="w-5 h-5" /> Avis FOR 14 des Membres CAS
                            </h3>

                            {/* Vote breakdown chart */}
                            {actualVotes.length > 0 && (
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                {Object.entries(voteBreakdown()).map(([key, count]) => {
                                  const info = voteLabels[key] || { label: key, color: "bg-gray-100 text-gray-800" };
                                  return (
                                    <div key={key} className={`text-center p-3 rounded-lg ${info.color}`}>
                                      <p className="text-2xl font-bold">{count}</p>
                                      <p className="text-xs">{info.label}</p>
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* PRO 07 §5.9 — Vote Results & Majority Analysis */}
                            {voteResults && actualVotes.length > 0 && (
                              <Card className={`border-2 ${voteResults.isTie ? "border-amber-400 bg-amber-50/30" : voteResults.majorityResult ? "border-green-400 bg-green-50/30" : "border-gray-200"}`}>
                                <CardContent className="pt-4 space-y-3">
                                  <div className="flex items-center justify-between">
                                    <h4 className="font-semibold flex items-center gap-2">
                                      <BarChart3 className="w-5 h-5" /> Résultat du vote (PRO 07 §5.9)
                                    </h4>
                                    {voteResults.majorityResult && (
                                      <Badge className={voteLabels[voteResults.majorityResult]?.color || "bg-green-100 text-green-800"}>
                                        Majorité : {voteLabels[voteResults.majorityResult]?.label || voteResults.majorityResult}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                    <div className="p-2 bg-white/80 rounded border">
                                      <p className="text-xs text-muted-foreground">Total des votes</p>
                                      <p className="font-bold text-lg">{voteResults.totalVotes}</p>
                                    </div>
                                    <div className="p-2 bg-white/80 rounded border">
                                      <p className="text-xs text-muted-foreground">Votes délibérants</p>
                                      <p className="font-bold text-lg">{voteResults.totalVotesExcludingAbstention}</p>
                                    </div>
                                    <div className="p-2 bg-white/80 rounded border">
                                      <p className="text-xs text-muted-foreground">Seuil majorité</p>
                                      <p className="font-bold text-lg">{voteResults.majorityThreshold}</p>
                                    </div>
                                  </div>
                                  {voteResults.isTie && (
                                    <div className={`p-3 rounded-lg border ${voteResults.presidentDoubleVoteApplied ? "bg-green-50 border-green-300" : "bg-amber-50 border-amber-300"}`}>
                                      <p className="font-medium flex items-center gap-2 text-sm">
                                        <AlertTriangle className="w-4 h-4" />
                                        {voteResults.presidentDoubleVoteApplied
                                          ? "Égalité — Voix prépondérante du Président appliquée (PRO 07 §5.9)"
                                          : "Égalité des voix — La voix du Président est prépondérante (PRO 07 §5.9)"}
                                      </p>
                                    </div>
                                  )}
                                  {!voteResults.majorityResult && !voteResults.isTie && actualVotes.length > 0 && (
                                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                      <p className="text-sm text-blue-800">Pas de majorité simple atteinte — le Président prend la décision finale</p>
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            )}

                            {/* Detailed votes */}
                            {actualVotes.length > 0 ? (
                              <div className="space-y-3">
                                {actualVotes.map((v: any) => (
                                  <Card key={v.id} className="p-4 border">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <UserCheck className="w-4 h-4 text-primary" />
                                        <span className="font-medium">{v.voterName || `Membre #${v.voterId}`}</span>
                                      </div>
                                      <Badge className={voteLabels[v.vote]?.color || "bg-gray-100"}>
                                        {voteLabels[v.vote]?.label || v.vote}
                                      </Badge>
                                    </div>

                                    {v.justification && (
                                      <div className="mb-2">
                                        <p className="text-xs font-medium text-muted-foreground">Justification</p>
                                        <p className="text-sm">{v.justification}</p>
                                      </div>
                                    )}

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                      {v.for14ConformityAssessment && (
                                        <div className="p-2 bg-gray-50 rounded">
                                          <p className="text-xs font-medium text-muted-foreground">Conformité</p>
                                          <p>{v.for14ConformityAssessment}</p>
                                        </div>
                                      )}
                                      {v.for14CompetenceAssessment && (
                                        <div className="p-2 bg-gray-50 rounded">
                                          <p className="text-xs font-medium text-muted-foreground">Compétence</p>
                                          <p>{v.for14CompetenceAssessment}</p>
                                        </div>
                                      )}
                                      {v.for14ImpartialityAssessment && (
                                        <div className="p-2 bg-gray-50 rounded">
                                          <p className="text-xs font-medium text-muted-foreground">Impartialité</p>
                                          <p>{v.for14ImpartialityAssessment}</p>
                                        </div>
                                      )}
                                    </div>

                                    {v.for14TechnicalRemarks && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-muted-foreground">Remarques techniques</p>
                                        <p className="text-sm">{v.for14TechnicalRemarks}</p>
                                      </div>
                                    )}
                                    {v.for14ScopeRemarks && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-muted-foreground">Remarques sur la portée</p>
                                        <p className="text-sm">{v.for14ScopeRemarks}</p>
                                      </div>
                                    )}
                                    {v.for14Recommendation && (
                                      <div className="mt-2">
                                        <p className="text-xs font-medium text-muted-foreground">Recommandation</p>
                                        <p className="text-sm">{v.for14Recommendation}</p>
                                      </div>
                                    )}
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Vote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Aucun avis FOR 14 enregistré</p>
                                {selectedMeeting.status === "VOTING" && (
                                  <p className="text-xs mt-1">Le vote est ouvert — en attente des avis des membres</p>
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* DECISION TAB — FOR 15 / PRO 16 */}
                        <TabsContent value="decision">
                          <div className="space-y-4">
                            <h3 className="font-semibold flex items-center gap-2">
                              <Gavel className="w-5 h-5" /> FOR 15 — Avis du CAS et Décision d'Accréditation (PRO 16)
                            </h3>

                            {selectedMeeting.finalDecision ? (
                              <div className="space-y-4">
                                <Card className="bg-primary/5 border-primary/20">
                                  <CardContent className="pt-4 space-y-4">
                                    <div className="flex items-center gap-3">
                                      <Stamp className="w-6 h-6 text-primary" />
                                      <div>
                                        <p className="font-semibold text-lg">Décision rendue</p>
                                        <Badge className={`text-sm ${voteLabels[selectedMeeting.finalDecision]?.color || "bg-gray-100"}`}>
                                          {voteLabels[selectedMeeting.finalDecision]?.label || selectedMeeting.finalDecision}
                                        </Badge>
                                      </div>
                                    </div>

                                    {selectedMeeting.for15DecisionJustification && (
                                      <div className="p-3 bg-white/50 rounded border">
                                        <p className="text-xs font-medium text-muted-foreground">Justification de la décision (PRO 16 §5.3)</p>
                                        <p className="text-sm mt-1 whitespace-pre-wrap">{selectedMeeting.for15DecisionJustification}</p>
                                      </div>
                                    )}

                                    {selectedMeeting.for15ScopeDecision && (
                                      <div className="p-3 bg-white/50 rounded border">
                                        <p className="text-xs font-medium text-muted-foreground">Portée de l'accréditation</p>
                                        <p className="text-sm mt-1">{selectedMeeting.for15ScopeDecision}</p>
                                      </div>
                                    )}

                                    {selectedMeeting.for15Conditions && (
                                      <div className="p-3 bg-white/50 rounded border">
                                        <p className="text-xs font-medium text-muted-foreground">Conditions</p>
                                        <p className="text-sm mt-1">{selectedMeeting.for15Conditions}</p>
                                      </div>
                                    )}

                                    {selectedMeeting.for15ReservesToLift && (
                                      <div className="p-3 bg-amber-50/50 rounded border border-amber-200">
                                        <p className="text-xs font-medium text-amber-800">Réserves à lever</p>
                                        <p className="text-sm mt-1">{selectedMeeting.for15ReservesToLift}</p>
                                        {selectedMeeting.for15ReservesDeadline && (
                                          <p className="text-xs text-amber-600 mt-1">
                                            Date limite : {new Date(selectedMeeting.for15ReservesDeadline).toLocaleDateString("fr-FR")}
                                          </p>
                                        )}
                                      </div>
                                    )}

                                    {selectedMeeting.for15AppealRightsNotice && (
                                      <div className="p-3 bg-indigo-50/50 rounded border border-indigo-200">
                                        <p className="text-xs font-medium text-indigo-800">Droit de recours (GEN 04)</p>
                                        <p className="text-sm mt-1 text-indigo-700">{selectedMeeting.for15AppealRightsNotice}</p>
                                      </div>
                                    )}

                                    {selectedMeeting.meetingMinutes && (
                                      <div className="p-3 bg-white/50 rounded border">
                                        <p className="text-xs font-medium text-muted-foreground">PV de la réunion</p>
                                        <p className="text-sm mt-1 whitespace-pre-wrap">{selectedMeeting.meetingMinutes}</p>
                                      </div>
                                    )}

                                    {selectedMeeting.presidentNotes && (
                                      <div className="p-3 bg-white/50 rounded border">
                                        <p className="text-xs font-medium text-muted-foreground">Notes du Président</p>
                                        <p className="text-sm mt-1">{selectedMeeting.presidentNotes}</p>
                                      </div>
                                    )}

                                    {selectedMeeting.decidedAt && (
                                      <p className="text-xs text-muted-foreground">
                                        Décision prise le {new Date(selectedMeeting.decidedAt).toLocaleString("fr-FR")}
                                      </p>
                                    )}
                                  </CardContent>
                                </Card>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                {/* Decision prerequisites */}
                                <Card className="border-amber-200 bg-amber-50/30">
                                  <CardContent className="pt-4">
                                    <p className="font-medium text-amber-900 flex items-center gap-2 mb-3">
                                      <AlertCircle className="w-5 h-5" /> Pré-requis pour la décision (PRO 16)
                                    </p>
                                    <div className="space-y-2">
                                      {[
                                        { check: attendees.length >= (selectedMeeting.quorumRequired || 3), label: "Quorum atteint" },
                                        { check: actualVotes.length > 0, label: "Au moins un avis FOR 14 reçu" },
                                        { check: ["VOTING", "IN_PROGRESS"].includes(selectedMeeting.status), label: "Réunion en cours ou vote ouvert" },
                                      ].map((req, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm">
                                          {req.check ? (
                                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                          ) : (
                                            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                                          )}
                                          <span className={req.check ? "text-green-700" : "text-amber-700"}>{req.label}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </CardContent>
                                </Card>

                                {["VOTING", "IN_PROGRESS"].includes(selectedMeeting.status) && (
                                  <Button size="lg" className="w-full" onClick={() => setShowDecisionDialog(true)}>
                                    <Gavel className="w-5 h-5 mr-2" /> Prendre la Décision — FOR 15
                                  </Button>
                                )}

                                {!["VOTING", "IN_PROGRESS", "DECIDED", "CLOSED"].includes(selectedMeeting.status) && (
                                  <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                    <p className="text-sm">La réunion doit être en cours et le vote ouvert pour prendre la décision</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </TabsContent>

                        {/* FOR 65-2 TAB — Suivi des compétences membres CAS */}
                        <TabsContent value="for65">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <h3 className="font-semibold flex items-center gap-2">
                                <Star className="w-5 h-5" /> FOR 65-2 — Suivi des compétences (PRO 07 §5.4)
                              </h3>
                              <Button size="sm" onClick={() => setShowFor65Dialog(true)}>
                                <Star className="w-4 h-4 mr-1" /> Évaluer un membre
                              </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Renseigné par le CD/RA à chaque réunion d'examen. Sert à la décision de maintien/résiliation de la convention (3 ans).
                            </p>

                            {for65List.length > 0 ? (
                              <div className="space-y-3">
                                {for65List.map((r: any) => (
                                  <Card key={r.id} className="p-4">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="font-medium">{r.memberName}</p>
                                      <div className="flex gap-1">
                                        {[1, 2, 3, 4, 5].map(s => (
                                          <Star key={s} className={`w-4 h-4 ${s <= (r.overallRating || 0) ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`} />
                                        ))}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
                                      <div>Technique: {r.technicalKnowledgeRating}/5</div>
                                      <div>Impartialité: {r.impartialityRating}/5</div>
                                      <div>Indépendance: {r.independenceRating}/5</div>
                                      <div>Communication: {r.communicationRating}/5</div>
                                    </div>
                                    {r.remarks && <p className="text-xs mt-2 text-gray-600">{r.remarks}</p>}
                                    <div className="flex items-center gap-2 mt-2">
                                      <Badge className={r.recommendMaintain ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                                        {r.recommendMaintain ? "Recommandation : maintenir" : "Recommandation : résilier"}
                                      </Badge>
                                      <span className="text-xs text-muted-foreground">par {r.evaluatedByName}</span>
                                    </div>
                                  </Card>
                                ))}
                              </div>
                            ) : (
                              <div className="text-center py-8 text-muted-foreground">
                                <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Aucune évaluation FOR 65-2 pour cette réunion</p>
                              </div>
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}

          {/* FOR 65-2 Dialog */}
          <Dialog open={showFor65Dialog} onOpenChange={setShowFor65Dialog}>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500" /> FOR 65-2 — Évaluation de compétence membre CAS
                </DialogTitle>
                <DialogDescription>PRO 07 §5.4 — Renseigné par CD/RA après chaque réunion</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <Label>Membre évalué</Label>
                  <Select value={for65Form.memberId} onValueChange={v => setFor65Form(f => ({ ...f, memberId: v }))}>
                    <SelectTrigger><SelectValue placeholder="Sélectionner un membre" /></SelectTrigger>
                    <SelectContent>
                      {attendees.map((a: any) => (
                        <SelectItem key={a.voterId} value={String(a.voterId)}>{a.voterName || `Membre #${a.voterId}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {(["overallRating", "technicalKnowledgeRating", "impartialityRating", "independenceRating", "communicationRating"] as const).map(field => (
                  <div key={field} className="space-y-1">
                    <Label className="text-sm capitalize">{field.replace(/Rating/, "").replace(/([A-Z])/g, " $1")}</Label>
                    <Select value={(for65Form as any)[field]} onValueChange={v => setFor65Form(f => ({ ...f, [field]: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["1", "2", "3", "4", "5"].map(v => <SelectItem key={v} value={v}>{v} / 5</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
                <div>
                  <Label>Points forts</Label>
                  <Textarea value={for65Form.strengths} onChange={e => setFor65Form(f => ({ ...f, strengths: e.target.value }))} rows={2} />
                </div>
                <div>
                  <Label>Axes d'amélioration</Label>
                  <Textarea value={for65Form.areasForImprovement} onChange={e => setFor65Form(f => ({ ...f, areasForImprovement: e.target.value }))} rows={2} />
                </div>
                <div>
                  <Label>Observations</Label>
                  <Textarea value={for65Form.remarks} onChange={e => setFor65Form(f => ({ ...f, remarks: e.target.value }))} rows={2} />
                </div>
                <div>
                  <Label>Recommandation</Label>
                  <Select value={for65Form.recommendMaintain ? "true" : "false"} onValueChange={v => setFor65Form(f => ({ ...f, recommendMaintain: v === "true" }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Maintenir la convention</SelectItem>
                      <SelectItem value="false">Résilier la convention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowFor65Dialog(false)}>Annuler</Button>
                <Button onClick={async () => {
                  if (!selectedMeeting || !for65Form.memberId) return;
                  try {
                    const res = await fetch(`/api/cas-committees/meetings/${selectedMeeting.id}/for65`, {
                      method: "POST", credentials: "include",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ ...for65Form, recommendMaintain: for65Form.recommendMaintain }),
                    });
                    const data = await res.json();
                    if (res.ok) {
                      toast({ title: "FOR 65-2 enregistré", description: data.message });
                      setShowFor65Dialog(false);
                      selectMeeting(selectedMeeting);
                    } else {
                      toast({ title: "Erreur", description: data.message, variant: "destructive" });
                    }
                  } catch (e: any) { toast({ title: "Erreur", description: e.message, variant: "destructive" }); }
                }}>
                  Enregistrer FOR 65-2
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* FOR 15 Decision Dialog — PRO 16 */}
          <Dialog open={showDecisionDialog} onOpenChange={setShowDecisionDialog}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Stamp className="w-5 h-5 text-primary" /> FOR 15 — Avis du CAS et Décision d'Accréditation
                </DialogTitle>
                <DialogDescription>
                  PRO 16 — Prise de Décision d'Accréditation. Tous les champs (*) sont obligatoires.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* Vote summary */}
                {actualVotes.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm font-medium text-blue-900 mb-2">Synthèse des avis FOR 14 ({actualVotes.length} avis)</p>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(voteBreakdown()).map(([key, count]) => {
                        const info = voteLabels[key] || { label: key, color: "bg-gray-100 text-gray-800" };
                        return (
                          <Badge key={key} className={info.color}>{info.label}: {count}</Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 1. Decision type */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">1. Décision d'accréditation *</h4>
                  <Select value={decisionForm.decision} onValueChange={(v) => setDecisionForm({ ...decisionForm, decision: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCORDER">Accréditation accordée — Portée complète</SelectItem>
                      <SelectItem value="ACCORDER_REDUIT">Accréditation accordée — Portée réduite</SelectItem>
                      <SelectItem value="ACCORDER_RESERVES">Accréditation accordée — Avec réserves à lever</SelectItem>
                      <SelectItem value="REFUSER">Refuser l'accréditation</SelectItem>
                      <SelectItem value="AJOURNER">Ajourner la décision — Compléments requis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Justification */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">2. Justification de la décision *</h4>
                  <Textarea value={decisionForm.for15DecisionJustification}
                    onChange={(e) => setDecisionForm({ ...decisionForm, for15DecisionJustification: e.target.value })}
                    placeholder="Justifiez la décision en vous basant sur les avis FOR 14 des membres, le rapport d'évaluation et les preuves examinées..."
                    rows={5} className={!decisionForm.for15DecisionJustification.trim() ? "border-red-300" : ""} />
                  {!decisionForm.for15DecisionJustification.trim() && <p className="text-xs text-red-500">Obligatoire (PRO 16 §5.3)</p>}
                </div>

                <Separator />

                {/* 3. Scope */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">3. Portée de l'accréditation</h4>
                  <Textarea value={decisionForm.for15ScopeDecision}
                    onChange={(e) => setDecisionForm({ ...decisionForm, for15ScopeDecision: e.target.value })}
                    placeholder="Portée accordée : domaines techniques, méthodes, normes de référence..."
                    rows={3} />
                  {decisionForm.decision === "ACCORDER_REDUIT" && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded text-sm text-amber-700">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Précisez les domaines exclus de la portée et la justification de la réduction.
                    </div>
                  )}
                </div>

                <Separator />

                {/* 4. Conditions */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">4. Conditions de l'accréditation</h4>
                  <Textarea value={decisionForm.for15Conditions}
                    onChange={(e) => setDecisionForm({ ...decisionForm, for15Conditions: e.target.value })}
                    placeholder="Conditions à respecter : programme de surveillance, audits internes annuels, participation aux essais d'aptitude..."
                    rows={3} />
                </div>

                {/* 5. Reserves (if applicable) */}
                {["ACCORDER_RESERVES", "AJOURNER"].includes(decisionForm.decision) && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm border-b pb-1">
                        5. {decisionForm.decision === "ACCORDER_RESERVES" ? "Réserves à lever" : "Compléments requis"}
                      </h4>
                      <Textarea value={decisionForm.for15ReservesToLift}
                        onChange={(e) => setDecisionForm({ ...decisionForm, for15ReservesToLift: e.target.value })}
                        placeholder={decisionForm.decision === "ACCORDER_RESERVES"
                          ? "Réserves à lever : actions correctives requises, preuves à fournir..."
                          : "Compléments d'information requis avant nouvelle présentation..."}
                        rows={3} />
                      <div>
                        <Label className="text-sm">Date limite</Label>
                        <Input type="date" value={decisionForm.for15ReservesDeadline}
                          onChange={(e) => setDecisionForm({ ...decisionForm, for15ReservesDeadline: e.target.value })} />
                      </div>
                    </div>
                  </>
                )}

                {/* 6. Refusal reason */}
                {decisionForm.decision === "REFUSER" && (
                  <>
                    <Separator />
                    <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                      <p className="font-medium text-red-900 flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4" /> Refus d'accréditation
                      </p>
                      <p className="text-sm text-red-700">
                        En cas de refus, l'OEC sera notifié de la décision avec mention expresse du droit
                        de recours conformément à GEN 04. Le refus doit être dûment justifié dans la section 2 ci-dessus.
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                {/* 7. Appeal rights */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">
                    {decisionForm.decision === "ACCORDER" ? "6" : "7"}. Mention du droit de recours (GEN 04) *
                  </h4>
                  <Textarea value={decisionForm.for15AppealRightsNotice}
                    onChange={(e) => setDecisionForm({ ...decisionForm, for15AppealRightsNotice: e.target.value })}
                    rows={2} />
                </div>

                <Separator />

                {/* 8. Meeting minutes */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">
                    {decisionForm.decision === "ACCORDER" ? "7" : "8"}. PV de la réunion
                  </h4>
                  <Textarea value={decisionForm.meetingMinutes}
                    onChange={(e) => setDecisionForm({ ...decisionForm, meetingMinutes: e.target.value })}
                    placeholder="Résumé des délibérations, points discutés, arguments présentés..."
                    rows={4} />
                </div>

                {/* 9. President notes */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">Notes du Président</h4>
                  <Textarea value={decisionForm.presidentNotes}
                    onChange={(e) => setDecisionForm({ ...decisionForm, presidentNotes: e.target.value })}
                    placeholder="Notes personnelles du Président..."
                    rows={2} />
                </div>
              </div>

              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setShowDecisionDialog(false)}>Annuler</Button>
                <Button onClick={submitDecision} disabled={submitting || !decisionForm.for15DecisionJustification.trim()}
                  className={decisionForm.decision === "REFUSER" ? "bg-red-600 hover:bg-red-700" :
                    decisionForm.decision === "AJOURNER" ? "bg-amber-600 hover:bg-amber-700" : ""}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Stamp className="w-4 h-4 mr-2" />}
                  {decisionForm.decision === "REFUSER" ? "Prononcer le refus" :
                   decisionForm.decision === "AJOURNER" ? "Ajourner la décision" :
                   "Valider la décision FOR 15"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
