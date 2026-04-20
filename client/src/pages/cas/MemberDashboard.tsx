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
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Loader2, Gavel, Vote, FileText, CalendarDays, CheckCircle2, Users,
  ShieldCheck, AlertTriangle, ClipboardList, Eye, FileCheck,
  UserCheck, Scale, Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

/**
 * PRO_07 - Procedure Gestion CAS ALGERAC (Rév. 16)
 * FOR 14 - Avis des membres CAS
 *
 * CAS Member Dashboard — Full implementation of:
 * - Attendance confirmation with conflict of interest declaration
 * - Dossier examination and document checklist
 * - FOR 14 individual opinion form with detailed assessments
 * - Vote submission with mandatory justification
 * - Quorum tracking and impartiality controls
 * - Decision results viewing
 */
export default function CASMemberDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [selectedMeeting, setSelectedMeeting] = useState<any>(null);
  const [votes, setVotes] = useState<any[]>([]);
  const [myVotes, setMyVotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVoteForm, setShowVoteForm] = useState(false);
  const [showConfirmAttendance, setShowConfirmAttendance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("dossier");

  // FOR 14 - Avis des membres CAS form
  const [voteForm, setVoteForm] = useState({
    vote: "ACCORDER",
    justification: "",
    notes: "",
    for14Opinion: "",
    for14TechnicalRemarks: "",
    for14ScopeRemarks: "",
    for14Recommendation: "",
    for14ConformityAssessment: "",
    for14CompetenceAssessment: "",
    for14ImpartialityAssessment: "",
  });

  // Conflict of interest declaration (PRO 07 §4.2)
  const [conflictForm, setConflictForm] = useState({
    hasConflict: false,
    conflictDescription: "",
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
    try {
      const vRes = await fetch(`/api/workflow/cas/${meeting.id}/votes`, { credentials: "include" });
      if (vRes.ok) {
        const allVotes = await vRes.json();
        const votesList = Array.isArray(allVotes) ? allVotes : [];
        setVotes(votesList);
        setMyVotes(votesList.filter((v: any) => v.voterId === user?.id));
      }
    } catch (e) { }
  };

  const confirmAttendance = async () => {
    if (!selectedMeeting) return;
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/confirm-attendance`, {
        userId: user?.id,
        hasConflictOfInterest: conflictForm.hasConflict,
        conflictDescription: conflictForm.conflictDescription,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Présence confirmée", description: "Votre déclaration d'intérêts a été enregistrée (PRO 07)" });
        setShowConfirmAttendance(false);
        setConflictForm({ hasConflict: false, conflictDescription: "" });
        selectMeeting(selectedMeeting);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitFOR14Vote = async () => {
    if (!selectedMeeting) return;
    if (!voteForm.justification.trim()) {
      toast({ title: "Champ obligatoire", description: "La justification est obligatoire (PRO 16 §5.3)", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/cas/${selectedMeeting.id}/vote`, {
        voterId: user?.id,
        vote: voteForm.vote,
        justification: voteForm.justification,
        notes: voteForm.notes,
        for14Opinion: voteForm.for14Opinion,
        for14TechnicalRemarks: voteForm.for14TechnicalRemarks,
        for14ScopeRemarks: voteForm.for14ScopeRemarks,
        for14Recommendation: voteForm.for14Recommendation,
        for14ConformityAssessment: voteForm.for14ConformityAssessment,
        for14CompetenceAssessment: voteForm.for14CompetenceAssessment,
        for14ImpartialityAssessment: voteForm.for14ImpartialityAssessment,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Avis FOR 14 enregistré", description: "Votre avis a été transmis conformément à PRO 07" });
        setShowVoteForm(false);
        setVoteForm({
          vote: "ACCORDER", justification: "", notes: "",
          for14Opinion: "", for14TechnicalRemarks: "", for14ScopeRemarks: "",
          for14Recommendation: "", for14ConformityAssessment: "",
          for14CompetenceAssessment: "", for14ImpartialityAssessment: "",
        });
        selectMeeting(selectedMeeting);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (!user) return null;

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
  };

  const meetingStatusLabels: Record<string, { label: string; color: string }> = {
    PLANNED: { label: "Planifiée", color: "bg-blue-100 text-blue-800" },
    SUMMONS_SENT: { label: "Convocations envoyées", color: "bg-indigo-100 text-indigo-800" },
    ATTENDEES_CONFIRMED: { label: "Présences confirmées", color: "bg-cyan-100 text-cyan-800" },
    DOSSIER_SENT: { label: "Dossiers transmis", color: "bg-violet-100 text-violet-800" },
    IN_PROGRESS: { label: "En cours", color: "bg-orange-100 text-orange-800" },
    VOTING: { label: "Vote ouvert", color: "bg-emerald-100 text-emerald-800" },
    DECIDED: { label: "Décidé", color: "bg-green-100 text-green-800" },
    CLOSED: { label: "Clôturée", color: "bg-gray-100 text-gray-800" },
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <Scale className="w-7 h-7 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">{t('cas_page.dashboardTitle')}</h1>
                <p className="text-muted-foreground mt-1">
                  Membre CAS — {user.fullName} | PRO 07 & PRO 16
                </p>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Réunions planifiées</p><p className="text-2xl font-bold">{plannedMeetings.length}</p></div>
                  <CalendarDays className="w-8 h-8 text-primary/60" />
                </CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">En attente de vote</p><p className="text-2xl font-bold text-amber-600">{meetings.filter(m => m.status === "VOTING").length}</p></div>
                  <Vote className="w-8 h-8 text-amber-500/60" />
                </CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Mes avis donnés</p><p className="text-2xl font-bold text-blue-600">{myVotes.length}</p></div>
                  <FileCheck className="w-8 h-8 text-blue-500/60" />
                </CardContent></Card>
                <Card><CardContent className="pt-6 flex items-center justify-between">
                  <div><p className="text-sm text-muted-foreground">Décisions prises</p><p className="text-2xl font-bold text-green-600">{decidedMeetings.length}</p></div>
                  <Gavel className="w-8 h-8 text-green-500/60" />
                </CardContent></Card>
              </div>

              {/* PRO 07 Reference */}
              <Card className="mb-6 border-blue-200 bg-blue-50/30">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <FileText className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900">PRO 07 — Procédure de Gestion des CAS (Rév. 16)</p>
                      <p className="text-blue-700 mt-1">
                        Étapes : (1) Confirmer votre présence et déclarer tout conflit d'intérêts,
                        (2) Examiner les dossiers transmis, (3) Remplir le FOR 14 (Avis individuel),
                        (4) Participer aux délibérations et voter en toute impartialité.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel - Meetings List */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="w-5 h-5" /> Réunions CAS
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 max-h-[65vh] overflow-y-auto">
                    {meetings.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Aucune réunion CAS</p>
                    )}
                    {meetings.map((m) => {
                      const si = meetingStatusLabels[m.status] || { label: m.status, color: "bg-gray-100 text-gray-800" };
                      return (
                        <div key={m.id} onClick={() => selectMeeting(m)}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedMeeting?.id === m.id ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-gray-50"
                          }`}>
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm">{m.meetingCode || `CAS #${m.id}`}</p>
                            {m.status === "VOTING" && <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString("fr-FR", {
                              weekday: "short", day: "numeric", month: "long", year: "numeric"
                            }) : "Date à définir"}
                          </p>
                          <Badge className={`text-xs mt-1 ${si.color}`}>{si.label}</Badge>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Right Panel - Meeting Details */}
                <Card className="lg:col-span-2">
                  <CardContent className="pt-6">
                    {!selectedMeeting ? (
                      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <Gavel className="w-12 h-12 mb-3 opacity-30" />
                        <p>Sélectionnez une réunion CAS</p>
                      </div>
                    ) : (
                      <Tabs value={activeTab} onValueChange={setActiveTab}>
                        <TabsList className="mb-4">
                          <TabsTrigger value="dossier"><FileText className="w-4 h-4 mr-1" />Dossier</TabsTrigger>
                          <TabsTrigger value="impartiality"><ShieldCheck className="w-4 h-4 mr-1" />Impartialité</TabsTrigger>
                          <TabsTrigger value="for14"><ClipboardList className="w-4 h-4 mr-1" />FOR 14</TabsTrigger>
                          <TabsTrigger value="results"><Gavel className="w-4 h-4 mr-1" />Résultats</TabsTrigger>
                        </TabsList>

                        {/* DOSSIER TAB */}
                        <TabsContent value="dossier">
                          <div className="space-y-4">
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

                            {/* Documents checklist - PRO 07 §5.3 */}
                            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                              <p className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                                <FileText className="w-4 h-4" /> Documents du dossier (PRO 07 §5.3)
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {[
                                  "Rapport d'évaluation validé (FOR 23)",
                                  "Fiches d'écart (FOR 02) avec preuves",
                                  "Plans d'action et statut de résolution",
                                  "Synthèse de la revue documentaire",
                                  "Recommandation du Chef de Département",
                                  "Historique des cycles précédents",
                                  "Résultats des essais d'aptitude",
                                  "Formulaire d'auto-évaluation OEC",
                                ].map((item, i) => (
                                  <div key={i} className="flex items-center gap-2 p-2 bg-white/50 rounded text-sm">
                                    <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                    <span className="text-blue-800">{item}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Quorum */}
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                              <div className="flex items-center gap-2 text-sm">
                                <Users className="w-4 h-4 text-amber-600" />
                                <span className="font-medium text-amber-900">
                                  Quorum : {votes.length > 0 ? `${votes.length} avis enregistrés` : "En attente de confirmations"}
                                </span>
                              </div>
                              <p className="text-xs text-amber-700 mt-1">
                                PRO 07 §5.2 : Le quorum doit être atteint pour que les délibérations soient valides.
                              </p>
                            </div>

                            {["PLANNED", "SUMMONS_SENT"].includes(selectedMeeting.status) && (
                              <Button onClick={() => setShowConfirmAttendance(true)} className="w-full">
                                <UserCheck className="w-4 h-4 mr-2" /> Confirmer ma présence & Déclarer mes intérêts
                              </Button>
                            )}
                          </div>
                        </TabsContent>

                        {/* IMPARTIALITY TAB - PRO 07 §4.2 */}
                        <TabsContent value="impartiality">
                          <div className="space-y-4">
                            <div className="p-4 bg-indigo-50/50 rounded-lg border border-indigo-200">
                              <h3 className="font-semibold text-indigo-900 flex items-center gap-2 mb-3">
                                <ShieldCheck className="w-5 h-5" /> Déclaration d'impartialité (PRO 07 §4.2)
                              </h3>
                              <div className="space-y-2 text-sm text-indigo-800">
                                <p>En tant que membre du CAS, je m'engage à :</p>
                                <ul className="list-disc list-inside space-y-1 ml-2">
                                  <li>Respecter la confidentialité des informations</li>
                                  <li>Déclarer tout conflit d'intérêts réel ou potentiel</li>
                                  <li>Prendre mes décisions en toute impartialité</li>
                                  <li>Fonder mon avis uniquement sur les preuves fournies</li>
                                  <li>Ne pas participer aux délibérations en cas de conflit avéré</li>
                                </ul>
                              </div>
                            </div>

                            <Card className="border-amber-200">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-base">Déclaration de conflit d'intérêts</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="space-y-3">
                                  <div className="flex items-center gap-3">
                                    <Checkbox checked={conflictForm.hasConflict}
                                      onCheckedChange={(checked) => setConflictForm({ ...conflictForm, hasConflict: checked === true })} />
                                    <Label className="text-sm">Je déclare avoir un conflit d'intérêts avec le dossier examiné</Label>
                                  </div>
                                  {conflictForm.hasConflict && (
                                    <>
                                      <Textarea value={conflictForm.conflictDescription}
                                        onChange={(e) => setConflictForm({ ...conflictForm, conflictDescription: e.target.value })}
                                        placeholder="Décrivez la nature du conflit d'intérêts..." rows={3} />
                                      <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
                                        <AlertTriangle className="w-4 h-4 inline mr-1" />
                                        En cas de conflit avéré, vous serez exclu des délibérations (PRO 07 §4.2).
                                      </div>
                                    </>
                                  )}
                                  <Button onClick={() => setShowConfirmAttendance(true)}
                                    disabled={conflictForm.hasConflict && !conflictForm.conflictDescription}>
                                    <ShieldCheck className="w-4 h-4 mr-2" />
                                    {conflictForm.hasConflict ? "Soumettre déclaration de conflit" : "Confirmer absence de conflit"}
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        {/* FOR 14 TAB */}
                        <TabsContent value="for14">
                          <div className="space-y-4">
                            {myVotes.filter((v: any) => v.vote && v.vote !== "PENDING").length > 0 ? (
                              <div className="p-4 border rounded-lg bg-green-50/30 border-green-200">
                                <div className="flex items-center gap-2 mb-3">
                                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                                  <p className="font-medium">Avis FOR 14 enregistré</p>
                                </div>
                                {myVotes.filter((v: any) => v.vote && v.vote !== "PENDING").map((v: any) => (
                                  <div key={v.id} className="space-y-2">
                                    <Badge className={voteLabels[v.vote]?.color || "bg-gray-100 text-gray-800"}>
                                      {voteLabels[v.vote]?.label || v.vote}
                                    </Badge>
                                    {v.justification && <div><p className="text-xs font-medium text-muted-foreground">Justification</p><p className="text-sm">{v.justification}</p></div>}
                                    {v.for14TechnicalRemarks && <div><p className="text-xs font-medium text-muted-foreground">Remarques techniques</p><p className="text-sm">{v.for14TechnicalRemarks}</p></div>}
                                    {v.for14ScopeRemarks && <div><p className="text-xs font-medium text-muted-foreground">Remarques sur la portée</p><p className="text-sm">{v.for14ScopeRemarks}</p></div>}
                                    {v.for14Recommendation && <div><p className="text-xs font-medium text-muted-foreground">Recommandation</p><p className="text-sm">{v.for14Recommendation}</p></div>}
                                    {v.notes && <div><p className="text-xs font-medium text-muted-foreground">Notes</p><p className="text-sm">{v.notes}</p></div>}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <>
                                <div className="p-4 bg-violet-50 rounded-lg border border-violet-200">
                                  <h3 className="font-semibold text-violet-900 flex items-center gap-2 mb-2">
                                    <ClipboardList className="w-5 h-5" /> FOR 14 — Avis des Membres du CAS
                                  </h3>
                                  <p className="text-sm text-violet-700">
                                    Conformément à PRO 07 et PRO 16, chaque membre doit fournir son avis individuel
                                    motivé avant la délibération collective.
                                  </p>
                                </div>
                                {!["VOTING", "IN_PROGRESS"].includes(selectedMeeting.status) ? (
                                  <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-4 rounded-lg border border-amber-200">
                                    <Clock className="w-5 h-5 shrink-0" />
                                    <div>
                                      <p className="font-medium">En attente d'ouverture des délibérations</p>
                                      <p className="text-xs mt-1">Le Président du CAS ouvrira le vote après vérification du quorum.</p>
                                    </div>
                                  </div>
                                ) : (
                                  <Button onClick={() => setShowVoteForm(true)} size="lg" className="w-full">
                                    <ClipboardList className="w-5 h-5 mr-2" /> Remplir le FOR 14 — Donner mon Avis
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </TabsContent>

                        {/* RESULTS TAB */}
                        <TabsContent value="results">
                          <div className="space-y-4">
                            {votes.filter((v: any) => v.vote && v.vote !== "PENDING").length > 0 && (
                              <>
                                <h3 className="font-medium flex items-center gap-2">
                                  <Vote className="w-5 h-5" /> Synthèse des votes ({votes.filter((v: any) => v.vote && v.vote !== "PENDING").length} avis)
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {["ACCORDER", "REFUSER", "AJOURNER", "ABSTENTION"].map(key => {
                                    const count = votes.filter((v: any) => v.vote && v.vote !== "PENDING" && (v.vote === key || v.vote?.startsWith(key))).length;
                                    const info = voteLabels[key];
                                    return (
                                      <div key={key} className={`text-center p-3 rounded-lg ${info?.color || "bg-gray-50"}`}>
                                        <p className="text-xl font-bold">{count}</p>
                                        <p className="text-xs">{info?.label || key}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Membre</TableHead>
                                      <TableHead>Avis</TableHead>
                                      <TableHead>Justification</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {votes.filter((v: any) => v.vote && v.vote !== "PENDING").map((v: any) => (
                                      <TableRow key={v.id}>
                                        <TableCell className="font-medium">{v.voterName || `Membre #${v.voterId}`}</TableCell>
                                        <TableCell><Badge className={voteLabels[v.vote]?.color || "bg-gray-100"}>{voteLabels[v.vote]?.label || v.vote}</Badge></TableCell>
                                        <TableCell className="text-sm max-w-[250px] truncate">{v.justification || "—"}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </>
                            )}
                            {votes.filter((v: any) => v.vote && v.vote !== "PENDING").length === 0 && (
                              <div className="text-center py-8 text-muted-foreground">
                                <Vote className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-sm">Aucun avis enregistré</p>
                              </div>
                            )}

                            {/* Final Decision */}
                            {selectedMeeting.finalDecision && (
                              <Card className="bg-primary/5 border-primary/20">
                                <CardContent className="pt-4">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Gavel className="w-5 h-5 text-primary" />
                                    <p className="font-semibold text-lg">Décision finale du CAS (FOR 15)</p>
                                  </div>
                                  <Badge className={
                                    selectedMeeting.finalDecision.startsWith("ACCORDER") ? "bg-green-100 text-green-800" :
                                    selectedMeeting.finalDecision === "REFUSER" ? "bg-red-100 text-red-800" :
                                    "bg-amber-100 text-amber-800"
                                  }>
                                    {voteLabels[selectedMeeting.finalDecision]?.label || selectedMeeting.finalDecision}
                                  </Badge>
                                  {selectedMeeting.presidentNotes && (
                                    <div className="mt-3 p-3 bg-white/50 rounded">
                                      <p className="text-xs font-medium text-muted-foreground">Notes du Président</p>
                                      <p className="text-sm mt-1">{selectedMeeting.presidentNotes}</p>
                                    </div>
                                  )}
                                  <p className="text-xs text-muted-foreground mt-3">
                                    PRO 16 : La décision est communiquée à l'OEC avec mention du droit de recours (GEN 04).
                                  </p>
                                </CardContent>
                              </Card>
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

          {/* FOR 14 Vote Dialog */}
          <Dialog open={showVoteForm} onOpenChange={setShowVoteForm}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-primary" /> FOR 14 — Avis du Membre CAS
                </DialogTitle>
                <DialogDescription>
                  PRO 07 & PRO 16 — Avis individuel motivé. Les champs (*) sont obligatoires.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-2">
                {/* 1. Decision */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">1. Avis sur la décision d'accréditation *</h4>
                  <Select value={voteForm.vote} onValueChange={(v) => setVoteForm({ ...voteForm, vote: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ACCORDER">Accréditation accordée — Portée complète</SelectItem>
                      <SelectItem value="ACCORDER_REDUIT">Accréditation accordée — Portée réduite</SelectItem>
                      <SelectItem value="ACCORDER_RESERVES">Accréditation accordée — Avec réserves à lever</SelectItem>
                      <SelectItem value="REFUSER">Refuser l'accréditation</SelectItem>
                      <SelectItem value="AJOURNER">Ajourner la décision — Compléments requis</SelectItem>
                      <SelectItem value="ABSTENTION">Abstention</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* 2. Justification */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">2. Justification *</h4>
                  <Textarea value={voteForm.justification}
                    onChange={(e) => setVoteForm({ ...voteForm, justification: e.target.value })}
                    placeholder="Motivez votre avis en vous basant sur le rapport d'évaluation, les écarts et les preuves..."
                    rows={4} className={!voteForm.justification.trim() ? "border-red-300" : ""} />
                  {!voteForm.justification.trim() && <p className="text-xs text-red-500">Obligatoire (PRO 16 §5.3)</p>}
                </div>

                <Separator />

                {/* 3. Technical Assessment */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">3. Évaluation technique</h4>
                  <div>
                    <Label className="text-sm">Conformité aux exigences normatives</Label>
                    <Select value={voteForm.for14ConformityAssessment}
                      onValueChange={(v) => setVoteForm({ ...voteForm, for14ConformityAssessment: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CONFORME">Conforme aux exigences</SelectItem>
                        <SelectItem value="CONFORME_RESERVATIONS">Conforme avec réservations mineures</SelectItem>
                        <SelectItem value="NON_CONFORME_MAJEUR">Non-conformités majeures identifiées</SelectItem>
                        <SelectItem value="INSUFFISANT">Preuves insuffisantes</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Compétence de l'OEC</Label>
                    <Select value={voteForm.for14CompetenceAssessment}
                      onValueChange={(v) => setVoteForm({ ...voteForm, for14CompetenceAssessment: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ADEQUATE">Compétence adéquate démontrée</SelectItem>
                        <SelectItem value="PARTIELLE">Compétence partiellement démontrée</SelectItem>
                        <SelectItem value="INSUFFISANTE">Compétence insuffisante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Impartialité de l'OEC</Label>
                    <Select value={voteForm.for14ImpartialityAssessment}
                      onValueChange={(v) => setVoteForm({ ...voteForm, for14ImpartialityAssessment: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SATISFAISANTE">Impartialité satisfaisante</SelectItem>
                        <SelectItem value="RISQUES_IDENTIFIES">Risques gérés</SelectItem>
                        <SelectItem value="NON_SATISFAISANTE">Non satisfaisante</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm">Remarques techniques</Label>
                    <Textarea value={voteForm.for14TechnicalRemarks}
                      onChange={(e) => setVoteForm({ ...voteForm, for14TechnicalRemarks: e.target.value })}
                      placeholder="Observations techniques : méthodes, équipements, personnel..." rows={3} />
                  </div>
                </div>

                <Separator />

                {/* 4. Scope */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">4. Avis sur la portée</h4>
                  <Textarea value={voteForm.for14ScopeRemarks}
                    onChange={(e) => setVoteForm({ ...voteForm, for14ScopeRemarks: e.target.value })}
                    placeholder="Adéquation de la portée, exclusions suggérées, restrictions..." rows={3} />
                </div>

                <Separator />

                {/* 5. Recommendation */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm border-b pb-1">5. Recommandation</h4>
                  <Textarea value={voteForm.for14Recommendation}
                    onChange={(e) => setVoteForm({ ...voteForm, for14Recommendation: e.target.value })}
                    placeholder="Recommandations au Président du CAS, conditions à imposer..." rows={3} />
                  <div>
                    <Label className="text-sm">Notes complémentaires</Label>
                    <Textarea value={voteForm.notes}
                      onChange={(e) => setVoteForm({ ...voteForm, notes: e.target.value })}
                      placeholder="Autres observations..." rows={2} />
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowVoteForm(false)}>Annuler</Button>
                <Button onClick={submitFOR14Vote} disabled={submitting || !voteForm.justification.trim()}>
                  {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Vote className="w-4 h-4 mr-2" />}
                  Soumettre mon Avis FOR 14
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Confirm Attendance Dialog */}
          <Dialog open={showConfirmAttendance} onOpenChange={setShowConfirmAttendance}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserCheck className="w-5 h-5" /> Confirmation de présence — PRO 07
                </DialogTitle>
                <DialogDescription>
                  Confirmez votre présence et déclarez tout conflit d'intérêts.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                  <p className="font-medium mb-1">Engagement du membre CAS :</p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs">
                    <li>Je respecterai la confidentialité des informations</li>
                    <li>Je m'engage à l'impartialité dans mes délibérations</li>
                    <li>J'ai pris connaissance du dossier</li>
                  </ul>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox checked={conflictForm.hasConflict}
                    onCheckedChange={(checked) => setConflictForm({ ...conflictForm, hasConflict: checked === true })} />
                  <Label className="text-sm">Je déclare un conflit d'intérêts</Label>
                </div>
                {conflictForm.hasConflict && (
                  <Textarea value={conflictForm.conflictDescription}
                    onChange={(e) => setConflictForm({ ...conflictForm, conflictDescription: e.target.value })}
                    placeholder="Nature du conflit d'intérêts..." rows={3} />
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowConfirmAttendance(false)}>Annuler</Button>
                <Button onClick={confirmAttendance} disabled={submitting || (conflictForm.hasConflict && !conflictForm.conflictDescription)}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <UserCheck className="w-4 h-4 mr-2" /> Confirmer
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
