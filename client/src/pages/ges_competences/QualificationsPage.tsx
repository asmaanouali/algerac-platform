import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  GraduationCap, Search, Filter, Eye, ChevronRight,
  CheckCircle2, Clock, AlertTriangle, XCircle, Award,
  RefreshCw, UserCheck, BookOpen, Play, ArrowRight, Send
} from "lucide-react";

interface Qualification {
  id: number;
  evaluator: { id: number; fullName: string; email: string; phone?: string };
  qualifiedRole: string;
  qualifiedStandardsJson?: string;
  qualifiedDomainsJson?: string;
  status: string;
  trainingExamScore?: number;
  trainingCompletedDate?: string;
  observerMissionsCompleted: number;
  supervisedMissionsCompleted: number;
  qualificationDate?: string;
  expiryDate?: string;
  lastRenewalDate?: string;
  missionsCompletedCurrentCycle: number;
  lastObservationDate?: string;
  lastRecyclingDate?: string;
  recyclingParticipations: number;
  collaborationContractSigned: boolean;
  suspensionDate?: string;
  suspensionReason?: string;
  withdrawalDate?: string;
  withdrawalReason?: string;
  fromOtherAccreditationBody: boolean;
  lastDecisionType?: string;
  lastDecisionDate?: string;
  createdAt: string;
}

const STATUS_KEYS = [
  "PENDING_TRAINING", "TRAINING_IN_PROGRESS", "TRAINING_COMPLETED", "TRAINING_FAILED",
  "OBSERVER_PHASE", "PRACTICE_PHASE", "PENDING_COMMISSION", "QUALIFIED",
  "RENEWAL_PENDING", "RENEWED", "EXTENSION_PENDING", "SUSPENDED", "WITHDRAWN",
] as const;

const STATUS_LABELS: Record<string, string> = {
  PENDING_TRAINING: "En attente de formation",
  TRAINING_IN_PROGRESS: "Formation en cours",
  TRAINING_COMPLETED: "Formation terminée",
  TRAINING_FAILED: "Formation échouée",
  OBSERVER_PHASE: "Phase d'observation",
  PRACTICE_PHASE: "Phase de pratique",
  PENDING_COMMISSION: "En attente de commission",
  QUALIFIED: "Qualifié",
  RENEWAL_PENDING: "Renouvellement en attente",
  RENEWED: "Renouvelé",
  EXTENSION_PENDING: "Extension en attente",
  SUSPENDED: "Suspendu",
  WITHDRAWN: "Retiré",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING_TRAINING: "bg-yellow-100 text-yellow-800",
  TRAINING_IN_PROGRESS: "bg-blue-100 text-blue-800",
  TRAINING_COMPLETED: "bg-green-100 text-green-800",
  TRAINING_FAILED: "bg-red-100 text-red-800",
  OBSERVER_PHASE: "bg-indigo-100 text-indigo-800",
  PRACTICE_PHASE: "bg-purple-100 text-purple-800",
  PENDING_COMMISSION: "bg-orange-100 text-orange-800",
  QUALIFIED: "bg-emerald-100 text-emerald-800",
  RENEWAL_PENDING: "bg-amber-100 text-amber-800",
  RENEWED: "bg-teal-100 text-teal-800",
  EXTENSION_PENDING: "bg-cyan-100 text-cyan-800",
  SUSPENDED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-800",
};

const ROLE_LABELS: Record<string, string> = {
  ET: "Évaluateur Technique",
  EXP: "Expert Technique",
  EQ: "Évaluateur Qualiticien",
  REE: "Responsable d'Équipe d'Évaluation",
};
const ROLE_KEYS = ["ET", "EXP", "EQ", "REE"] as const;

export default function QualificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [qualifications, setQualifications] = useState<Qualification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedQual, setSelectedQual] = useState<Qualification | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Training result dialog
  const [trainingDialogOpen, setTrainingDialogOpen] = useState(false);
  const [examScore, setExamScore] = useState("");

  // Commission decision dialog
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [decisionType, setDecisionType] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");

  const tStatus = (status: string) => t(`gesCompetences.qualifications.status.${status}`, { defaultValue: STATUS_LABELS[status] || status });
  const tRole = (role: string) => t(`gesCompetences.qualifications.roleLabels.${role}`, { defaultValue: ROLE_LABELS[role] || role });

  useEffect(() => {
    document.title = t("gesCompetences.qualifications.pageTitle", { defaultValue: "Qualifications - Gestion des Compétences | ALGERAC" });
    fetchQualifications();
  }, []);

  const fetchQualifications = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/qualifications", { credentials: "include" });
      if (res.ok) {
        setQualifications(await res.json());
      }
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return qualifications.filter(q => {
      const matchSearch = !searchTerm ||
        q.evaluator.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.evaluator.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "all" || q.status === statusFilter;
      const matchRole = roleFilter === "all" || q.qualifiedRole === roleFilter;
      return matchSearch && matchStatus && matchRole;
    });
  }, [qualifications, searchTerm, statusFilter, roleFilter]);

  const stats = useMemo(() => ({
    total: qualifications.length,
    qualified: qualifications.filter(q => q.status === "QUALIFIED" || q.status === "RENEWED").length,
    inProgress: qualifications.filter(q => ["PENDING_TRAINING", "TRAINING_IN_PROGRESS", "TRAINING_COMPLETED", "OBSERVER_PHASE", "PRACTICE_PHASE"].includes(q.status)).length,
    pendingCommission: qualifications.filter(q => q.status === "PENDING_COMMISSION").length,
    suspended: qualifications.filter(q => q.status === "SUSPENDED").length,
    expiringSoon: qualifications.filter(q => {
      if (!q.expiryDate) return false;
      const diff = new Date(q.expiryDate).getTime() - Date.now();
      return diff > 0 && diff < 90 * 24 * 60 * 60 * 1000;
    }).length,
  }), [qualifications]);

  const performAction = async (qualId: number, endpoint: string, method = "POST", body?: any) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/qualifications/${qualId}/${endpoint}`, {
        method,
        credentials: "include",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.ok) {
        toast({ title: t("gesCompetences.qualifications.actionSuccess", { defaultValue: "Succès" }), description: t("gesCompetences.qualifications.actionSuccessDesc", { defaultValue: "Action effectuée avec succès" }) });
        fetchQualifications();
        setDetailOpen(false);
      } else {
        const err = await res.json();
        toast({ title: t("gesCompetences.qualifications.error", { defaultValue: "Erreur" }), description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.qualifications.error", { defaultValue: "Erreur" }), description: t("gesCompetences.qualifications.errorConnection", { defaultValue: "Erreur de connexion" }), variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const handleTrainingResult = async () => {
    if (!selectedQual || !examScore) return;
    await performAction(selectedQual.id, "training-result", "POST", { examScore: parseFloat(examScore) });
    setTrainingDialogOpen(false);
    setExamScore("");
  };

  const handleCommissionDecision = async () => {
    if (!selectedQual || !decisionType) return;
    await performAction(selectedQual.id, "commission-decision", "POST", {
      decision: decisionType,
      notes: decisionNotes,
    });
    setCommissionDialogOpen(false);
    setDecisionType("");
    setDecisionNotes("");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("gesCompetences.qualifications.title", { defaultValue: "Gestion des Qualifications" })}</h1>
              <p className="text-gray-500 mt-1">{t("gesCompetences.qualifications.subtitle", { defaultValue: "Suivi du processus de qualification des évaluateurs et experts" })}</p>
            </div>
            <Button onClick={fetchQualifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> {t("common.refresh")}
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500 mt-1">{t("gesCompetences.qualifications.statTotal", { defaultValue: "Total" })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.qualified}</div>
                <div className="text-xs text-gray-500 mt-1">{t("gesCompetences.qualifications.statQualified", { defaultValue: "Qualifiés" })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs text-gray-500 mt-1">{t("gesCompetences.qualifications.statInProgress", { defaultValue: "En cours" })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingCommission}</div>
                <div className="text-xs text-gray-500 mt-1">{t("gesCompetences.qualifications.statCommission", { defaultValue: "Commission" })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
                <div className="text-xs text-gray-500 mt-1">{t("gesCompetences.qualifications.statSuspended", { defaultValue: "Suspendus" })}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
                <div className="text-xs text-gray-500 mt-1">{t("gesCompetences.qualifications.statExpiringSoon", { defaultValue: "Expirent bientôt" })}</div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder={t("gesCompetences.qualifications.searchPlaceholder", { defaultValue: "Rechercher par nom ou email..." })}
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={t("gesCompetences.qualifications.filterStatusPlaceholder", { defaultValue: "Statut" })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("gesCompetences.qualifications.filterAllStatuses", { defaultValue: "Tous les statuts" })}</SelectItem>
                    {STATUS_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{tStatus(k)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder={t("gesCompetences.qualifications.filterRolePlaceholder", { defaultValue: "Rôle" })} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("gesCompetences.qualifications.filterAllRoles", { defaultValue: "Tous les rôles" })}</SelectItem>
                    {ROLE_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{tRole(k)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("gesCompetences.qualifications.table.evaluator", { defaultValue: "Évaluateur" })}</TableHead>
                    <TableHead>{t("gesCompetences.qualifications.table.role", { defaultValue: "Rôle" })}</TableHead>
                    <TableHead>{t("gesCompetences.qualifications.table.status", { defaultValue: "Statut" })}</TableHead>
                    <TableHead>{t("gesCompetences.qualifications.table.qualification", { defaultValue: "Qualification" })}</TableHead>
                    <TableHead>{t("gesCompetences.qualifications.table.expiry", { defaultValue: "Expiration" })}</TableHead>
                    <TableHead>{t("gesCompetences.qualifications.table.missions", { defaultValue: "Missions" })}</TableHead>
                    <TableHead className="text-right">{t("gesCompetences.qualifications.table.actions", { defaultValue: "Actions" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {t("gesCompetences.qualifications.table.loading", { defaultValue: "Chargement..." })}
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        {t("gesCompetences.qualifications.table.empty", { defaultValue: "Aucune qualification trouvée" })}
                      </TableCell>
                    </TableRow>
                  ) : filtered.map(q => (
                    <TableRow key={q.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { setSelectedQual(q); setDetailOpen(true); }}>
                      <TableCell>
                        <div className="font-medium">{q.evaluator.fullName}</div>
                        <div className="text-xs text-gray-500">{q.evaluator.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{tRole(q.qualifiedRole)}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[q.status] || "bg-gray-100"}>
                          {tStatus(q.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {q.qualificationDate ? new Date(q.qualificationDate).toLocaleDateString("fr-FR") : "-"}
                      </TableCell>
                      <TableCell>
                        {q.expiryDate ? (
                          <span className={new Date(q.expiryDate) < new Date() ? "text-red-600 font-semibold" : ""}>
                            {new Date(q.expiryDate).toLocaleDateString("fr-FR")}
                          </span>
                        ) : "-"}
                      </TableCell>
                      <TableCell>{q.missionsCompletedCurrentCycle}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {q.status === "PENDING_COMMISSION" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => { e.stopPropagation(); setSelectedQual(q); setCommissionDialogOpen(true); }}
                            >
                              <Award className="h-4 w-4 mr-1" /> {t("gesCompetences.qualifications.quickApplyDecision", { defaultValue: "Appliquer décision" })}
                            </Button>
                          )}
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selectedQual && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  {selectedQual.evaluator.fullName}
                </DialogTitle>
                <DialogDescription>
                  {tRole(selectedQual.qualifiedRole)} — 
                  {tStatus(selectedQual.status)}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="info">{t("gesCompetences.qualifications.detail.tabInfo", { defaultValue: "Informations" })}</TabsTrigger>
                  <TabsTrigger value="progress">{t("gesCompetences.qualifications.detail.tabProgress", { defaultValue: "Progression" })}</TabsTrigger>
                  <TabsTrigger value="actions">{t("gesCompetences.qualifications.detail.tabActions", { defaultValue: "Actions" })}</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.email", { defaultValue: "Email" })}</Label>
                      <p className="font-medium">{selectedQual.evaluator.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.phone", { defaultValue: "Téléphone" })}</Label>
                      <p className="font-medium">{selectedQual.evaluator.phone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.qualificationDate", { defaultValue: "Date de qualification" })}</Label>
                      <p className="font-medium">{selectedQual.qualificationDate ? new Date(selectedQual.qualificationDate).toLocaleDateString("fr-FR") : t("gesCompetences.qualifications.notQualified", { defaultValue: "Non qualifié" })}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.expiryDate", { defaultValue: "Date d'expiration" })}</Label>
                      <p className="font-medium">{selectedQual.expiryDate ? new Date(selectedQual.expiryDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.contractLabel", { defaultValue: "Contrat FOR 18 bis" })}</Label>
                      <p className="font-medium">{selectedQual.collaborationContractSigned ? t("gesCompetences.qualifications.detail.signed", { defaultValue: "✅ Signé" }) : t("gesCompetences.qualifications.detail.notSigned", { defaultValue: "❌ Non signé" })}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.specialCase", { defaultValue: "Cas spécial" })}</Label>
                      <p className="font-medium">{selectedQual.fromOtherAccreditationBody ? t("gesCompetences.qualifications.detail.otherBody", { defaultValue: "Autre organisme" }) : t("gesCompetences.qualifications.detail.standardPath", { defaultValue: "Parcours standard" })}</p>
                    </div>
                  </div>
                  {selectedQual.suspensionReason && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <Label className="text-xs text-red-600">{t("gesCompetences.qualifications.detail.suspensionReason", { defaultValue: "Motif de suspension" })}</Label>
                      <p className="text-red-800">{selectedQual.suspensionReason}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="progress" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.examScore", { defaultValue: "Score examen formation" })}</Label>
                      <p className="font-medium text-lg">
                        {selectedQual.trainingExamScore != null ? `${selectedQual.trainingExamScore}%` : "-"}
                        {selectedQual.trainingExamScore != null && (
                          selectedQual.trainingExamScore >= 70
                            ? <CheckCircle2 className="inline ml-2 h-4 w-4 text-green-600" />
                            : <XCircle className="inline ml-2 h-4 w-4 text-red-600" />
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.trainingCompletedLabel", { defaultValue: "Formation terminée" })}</Label>
                      <p className="font-medium">{selectedQual.trainingCompletedDate ? new Date(selectedQual.trainingCompletedDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.observerMissions", { defaultValue: "Missions observateur" })}</Label>
                      <p className="font-medium text-lg">{selectedQual.observerMissionsCompleted} / 1 min</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.supervisedMissions", { defaultValue: "Missions supervisées" })}</Label>
                      <p className="font-medium text-lg">{selectedQual.supervisedMissionsCompleted} / 2 min</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.currentCycleMissions", { defaultValue: "Missions cycle en cours" })}</Label>
                      <p className="font-medium">{selectedQual.missionsCompletedCurrentCycle}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.recyclingParticipations", { defaultValue: "Participations recyclage" })}</Label>
                      <p className="font-medium">{selectedQual.recyclingParticipations}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.lastObservation", { defaultValue: "Dernière observation" })}</Label>
                      <p className="font-medium">{selectedQual.lastObservationDate ? new Date(selectedQual.lastObservationDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">{t("gesCompetences.qualifications.detail.lastRecycling", { defaultValue: "Dernier recyclage" })}</Label>
                      <p className="font-medium">{selectedQual.lastRecyclingDate ? new Date(selectedQual.lastRecyclingDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-3 mt-4">
                  {selectedQual.status === "PENDING_TRAINING" && (
                    <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "status", "PUT", { status: "TRAINING_IN_PROGRESS" })}>
                      <BookOpen className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.startTraining", { defaultValue: "Démarrer la formation" })}
                    </Button>
                  )}
                  {selectedQual.status === "TRAINING_IN_PROGRESS" && (
                    <Button className="w-full justify-start" onClick={() => { setTrainingDialogOpen(true); }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.recordExamResult", { defaultValue: "Enregistrer résultat d'examen" })}
                    </Button>
                  )}
                  {selectedQual.status === "TRAINING_COMPLETED" && (
                    <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "advance-observer")}>
                      <Eye className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.advanceObserver", { defaultValue: "Passer en phase d'observation" })}
                    </Button>
                  )}
                  {selectedQual.status === "OBSERVER_PHASE" && (
                    <>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "increment-observer")}>
                        <ArrowRight className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.incObserver", { defaultValue: "+1 Mission observateur" })}
                      </Button>
                      <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "advance-practice")}>
                        <Play className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.advancePractice", { defaultValue: "Passer en phase de pratique" })}
                      </Button>
                    </>
                  )}
                  {selectedQual.status === "PRACTICE_PHASE" && (
                    <>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "increment-supervised")}>
                        <ArrowRight className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.incSupervised", { defaultValue: "+1 Mission supervisée" })}
                      </Button>
                      <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "submit-commission")}>
                        <Send className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.submitCommission", { defaultValue: "Soumettre à la Commission" })}
                      </Button>
                    </>
                  )}
                  {selectedQual.status === "PENDING_COMMISSION" && (
                    <Button className="w-full justify-start" onClick={() => setCommissionDialogOpen(true)}>
                      <Award className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.applyCommissionDecision", { defaultValue: "Appliquer décision de commission" })}
                    </Button>
                  )}
                  {(selectedQual.status === "QUALIFIED" || selectedQual.status === "RENEWED") && (
                    <>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "record-mission")}>
                        <ArrowRight className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.recordMission", { defaultValue: "Enregistrer mission complétée" })}
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "record-recycling")}>
                        <RefreshCw className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.recordRecycling", { defaultValue: "Enregistrer participation recyclage" })}
                      </Button>
                      {!selectedQual.collaborationContractSigned && (
                        <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "sign-contract")}>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> {t("gesCompetences.qualifications.detail.actions.signContract", { defaultValue: "Signer contrat FOR 18 bis" })}
                        </Button>
                      )}
                    </>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Training Exam Dialog */}
      <Dialog open={trainingDialogOpen} onOpenChange={setTrainingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("gesCompetences.qualifications.trainingDialog.title", { defaultValue: "Résultat d'examen de formation" })}</DialogTitle>
            <DialogDescription>{t("gesCompetences.qualifications.trainingDialog.subtitle", { defaultValue: "Seuil de réussite : 70%" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("gesCompetences.qualifications.trainingDialog.scoreLabel", { defaultValue: "Score obtenu (%)" })}</Label>
              <Input type="number" min="0" max="100" value={examScore} onChange={e => setExamScore(e.target.value)} placeholder={t("gesCompetences.qualifications.trainingDialog.scorePlaceholder", { defaultValue: "Ex: 85" })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrainingDialogOpen(false)}>{t("gesCompetences.qualifications.trainingDialog.cancel", { defaultValue: "Annuler" })}</Button>
            <Button onClick={handleTrainingResult} disabled={actionLoading || !examScore}>{t("gesCompetences.qualifications.trainingDialog.save", { defaultValue: "Enregistrer" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Decision Dialog */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("gesCompetences.qualifications.commissionDialog.title", { defaultValue: "Décision de la Commission de Qualification" })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>{t("gesCompetences.qualifications.commissionDialog.decisionTypeLabel", { defaultValue: "Type de décision" })}</Label>
              <Select value={decisionType} onValueChange={setDecisionType}>
                <SelectTrigger><SelectValue placeholder={t("gesCompetences.qualifications.commissionDialog.selectPlaceholder", { defaultValue: "Sélectionner..." })} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUALIFICATION_INITIALE">{t("gesCompetences.qualifications.commissionDialog.decisions.QUALIFICATION_INITIALE", { defaultValue: "Qualification initiale" })}</SelectItem>
                  <SelectItem value="RENOUVELLEMENT">{t("gesCompetences.qualifications.commissionDialog.decisions.RENOUVELLEMENT", { defaultValue: "Renouvellement" })}</SelectItem>
                  <SelectItem value="EXTENSION">{t("gesCompetences.qualifications.commissionDialog.decisions.EXTENSION", { defaultValue: "Extension" })}</SelectItem>
                  <SelectItem value="AVERTISSEMENT">{t("gesCompetences.qualifications.commissionDialog.decisions.AVERTISSEMENT", { defaultValue: "Avertissement" })}</SelectItem>
                  <SelectItem value="SUSPENSION_TEMPORAIRE">{t("gesCompetences.qualifications.commissionDialog.decisions.SUSPENSION_TEMPORAIRE", { defaultValue: "Suspension temporaire" })}</SelectItem>
                  <SelectItem value="RETRAIT_DEFINITIF">{t("gesCompetences.qualifications.commissionDialog.decisions.RETRAIT_DEFINITIF", { defaultValue: "Retrait définitif" })}</SelectItem>
                  <SelectItem value="MISE_A_NIVEAU">{t("gesCompetences.qualifications.commissionDialog.decisions.MISE_A_NIVEAU", { defaultValue: "Mise à niveau" })}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("gesCompetences.qualifications.commissionDialog.notesLabel", { defaultValue: "Notes / Motif" })}</Label>
              <Textarea value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)}
                placeholder={t("gesCompetences.qualifications.commissionDialog.notesPlaceholder", { defaultValue: "Notes de la commission..." })} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>{t("gesCompetences.qualifications.commissionDialog.cancel", { defaultValue: "Annuler" })}</Button>
            <Button onClick={handleCommissionDecision} disabled={actionLoading || !decisionType}>{t("gesCompetences.qualifications.commissionDialog.apply", { defaultValue: "Appliquer" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
