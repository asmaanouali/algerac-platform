import { useState, useEffect, useMemo } from "react";
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

export default function QualificationsPage() {
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

  useEffect(() => {
    document.title = "Qualifications - Gestion des Compétences | ALGERAC";
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
      console.error("Erreur:", err);
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
        toast({ title: "Succès", description: "Action effectuée avec succès" });
        fetchQualifications();
        setDetailOpen(false);
      } else {
        const err = await res.json();
        toast({ title: "Erreur", description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Erreur de connexion", variant: "destructive" });
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
              <h1 className="text-2xl font-bold text-gray-900">Gestion des Qualifications</h1>
              <p className="text-gray-500 mt-1">Suivi du processus de qualification des évaluateurs et experts</p>
            </div>
            <Button onClick={fetchQualifications} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" /> Actualiser
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <div className="text-xs text-gray-500 mt-1">Total</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-emerald-600">{stats.qualified}</div>
                <div className="text-xs text-gray-500 mt-1">Qualifiés</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <div className="text-xs text-gray-500 mt-1">En cours</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.pendingCommission}</div>
                <div className="text-xs text-gray-500 mt-1">Commission</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
                <div className="text-xs text-gray-500 mt-1">Suspendus</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-amber-600">{stats.expiringSoon}</div>
                <div className="text-xs text-gray-500 mt-1">Expirent bientôt</div>
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
                    placeholder="Rechercher par nom ou email..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Rôle" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rôles</SelectItem>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
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
                    <TableHead>Évaluateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Qualification</TableHead>
                    <TableHead>Expiration</TableHead>
                    <TableHead>Missions</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Aucune qualification trouvée
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
                        <Badge variant="outline">{ROLE_LABELS[q.qualifiedRole] || q.qualifiedRole}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={STATUS_COLORS[q.status] || "bg-gray-100"}>
                          {STATUS_LABELS[q.status] || q.status}
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
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
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
                  {ROLE_LABELS[selectedQual.qualifiedRole] || selectedQual.qualifiedRole} — 
                  {STATUS_LABELS[selectedQual.status] || selectedQual.status}
                </DialogDescription>
              </DialogHeader>

              <Tabs defaultValue="info" className="mt-4">
                <TabsList className="grid grid-cols-3">
                  <TabsTrigger value="info">Informations</TabsTrigger>
                  <TabsTrigger value="progress">Progression</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="info" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Email</Label>
                      <p className="font-medium">{selectedQual.evaluator.email}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Téléphone</Label>
                      <p className="font-medium">{selectedQual.evaluator.phone || "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Date de qualification</Label>
                      <p className="font-medium">{selectedQual.qualificationDate ? new Date(selectedQual.qualificationDate).toLocaleDateString("fr-FR") : "Non qualifié"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Date d'expiration</Label>
                      <p className="font-medium">{selectedQual.expiryDate ? new Date(selectedQual.expiryDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Contrat FOR 18 bis</Label>
                      <p className="font-medium">{selectedQual.collaborationContractSigned ? "✅ Signé" : "❌ Non signé"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Cas spécial</Label>
                      <p className="font-medium">{selectedQual.fromOtherAccreditationBody ? "Autre organisme" : "Parcours standard"}</p>
                    </div>
                  </div>
                  {selectedQual.suspensionReason && (
                    <div className="p-3 bg-red-50 rounded-lg">
                      <Label className="text-xs text-red-600">Motif de suspension</Label>
                      <p className="text-red-800">{selectedQual.suspensionReason}</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="progress" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs text-gray-500">Score examen formation</Label>
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
                      <Label className="text-xs text-gray-500">Formation terminée</Label>
                      <p className="font-medium">{selectedQual.trainingCompletedDate ? new Date(selectedQual.trainingCompletedDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Missions observateur</Label>
                      <p className="font-medium text-lg">{selectedQual.observerMissionsCompleted} / 1 min</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Missions supervisées</Label>
                      <p className="font-medium text-lg">{selectedQual.supervisedMissionsCompleted} / 2 min</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Missions cycle en cours</Label>
                      <p className="font-medium">{selectedQual.missionsCompletedCurrentCycle}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Participations recyclage</Label>
                      <p className="font-medium">{selectedQual.recyclingParticipations}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Dernière observation</Label>
                      <p className="font-medium">{selectedQual.lastObservationDate ? new Date(selectedQual.lastObservationDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Dernier recyclage</Label>
                      <p className="font-medium">{selectedQual.lastRecyclingDate ? new Date(selectedQual.lastRecyclingDate).toLocaleDateString("fr-FR") : "-"}</p>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="actions" className="space-y-3 mt-4">
                  {selectedQual.status === "PENDING_TRAINING" && (
                    <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "status", "PUT", { status: "TRAINING_IN_PROGRESS" })}>
                      <BookOpen className="h-4 w-4 mr-2" /> Démarrer la formation
                    </Button>
                  )}
                  {selectedQual.status === "TRAINING_IN_PROGRESS" && (
                    <Button className="w-full justify-start" onClick={() => { setTrainingDialogOpen(true); }}>
                      <CheckCircle2 className="h-4 w-4 mr-2" /> Enregistrer résultat d'examen
                    </Button>
                  )}
                  {selectedQual.status === "TRAINING_COMPLETED" && (
                    <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "advance-observer")}>
                      <Eye className="h-4 w-4 mr-2" /> Passer en phase d'observation
                    </Button>
                  )}
                  {selectedQual.status === "OBSERVER_PHASE" && (
                    <>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "increment-observer")}>
                        <ArrowRight className="h-4 w-4 mr-2" /> +1 Mission observateur
                      </Button>
                      <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "advance-practice")}>
                        <Play className="h-4 w-4 mr-2" /> Passer en phase de pratique
                      </Button>
                    </>
                  )}
                  {selectedQual.status === "PRACTICE_PHASE" && (
                    <>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "increment-supervised")}>
                        <ArrowRight className="h-4 w-4 mr-2" /> +1 Mission supervisée
                      </Button>
                      <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "submit-commission")}>
                        <Send className="h-4 w-4 mr-2" /> Soumettre à la Commission
                      </Button>
                    </>
                  )}
                  {selectedQual.status === "PENDING_COMMISSION" && (
                    <Button className="w-full justify-start" onClick={() => setCommissionDialogOpen(true)}>
                      <Award className="h-4 w-4 mr-2" /> Appliquer décision de commission
                    </Button>
                  )}
                  {(selectedQual.status === "QUALIFIED" || selectedQual.status === "RENEWED") && (
                    <>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "record-mission")}>
                        <ArrowRight className="h-4 w-4 mr-2" /> Enregistrer mission complétée
                      </Button>
                      <Button className="w-full justify-start" variant="outline" onClick={() => performAction(selectedQual.id, "record-recycling")}>
                        <RefreshCw className="h-4 w-4 mr-2" /> Enregistrer participation recyclage
                      </Button>
                      {!selectedQual.collaborationContractSigned && (
                        <Button className="w-full justify-start" onClick={() => performAction(selectedQual.id, "sign-contract")}>
                          <CheckCircle2 className="h-4 w-4 mr-2" /> Signer contrat FOR 18 bis
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
            <DialogTitle>Résultat d'examen de formation</DialogTitle>
            <DialogDescription>Seuil de réussite : 70%</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Score obtenu (%)</Label>
              <Input type="number" min="0" max="100" value={examScore} onChange={e => setExamScore(e.target.value)} placeholder="Ex: 85" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTrainingDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleTrainingResult} disabled={actionLoading || !examScore}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commission Decision Dialog */}
      <Dialog open={commissionDialogOpen} onOpenChange={setCommissionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Décision de la Commission de Qualification</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Type de décision</Label>
              <Select value={decisionType} onValueChange={setDecisionType}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="QUALIFICATION_INITIALE">Qualification initiale</SelectItem>
                  <SelectItem value="RENOUVELLEMENT">Renouvellement</SelectItem>
                  <SelectItem value="EXTENSION">Extension</SelectItem>
                  <SelectItem value="AVERTISSEMENT">Avertissement</SelectItem>
                  <SelectItem value="SUSPENSION_TEMPORAIRE">Suspension temporaire</SelectItem>
                  <SelectItem value="RETRAIT_DEFINITIF">Retrait définitif</SelectItem>
                  <SelectItem value="MISE_A_NIVEAU">Mise à niveau</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes / Motif</Label>
              <Textarea value={decisionNotes} onChange={e => setDecisionNotes(e.target.value)}
                placeholder="Notes de la commission..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionDialogOpen(false)}>Annuler</Button>
            <Button onClick={handleCommissionDecision} disabled={actionLoading || !decisionType}>Appliquer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
