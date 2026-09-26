import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  ClipboardCheck, Search, Plus, Eye, Star, RefreshCw,
  CheckCircle2, AlertTriangle, XCircle, BarChart3
} from "lucide-react";

interface ObservationReport {
  id: number;
  evaluator: { id: number; fullName: string; email: string };
  observer: { id: number; fullName: string };
  qualification?: { id: number; qualifiedRole: string };
  observationDate: string;
  observationType: string;
  scoreMaitriseTechnique?: number;
  scoreRigueurExamen?: number;
  scorePertinenceConstats?: number;
  scoreRedactionRapports?: number;
  scoreConnaissanceNormes?: number;
  scoreComportement?: number;
  scoreEcoute?: number;
  scoreImpartialite?: number;
  scoreGestionTemps?: number;
  scoreDiplomatie?: number;
  scoreGlobal?: number;
  verdict?: string;
  pointsForts?: string;
  pointsAmeliorer?: string;
  recommandations?: string;
  commentairesGeneraux?: string;
  conditionsReserve?: string;
  createdAt: string;
}

const VERDICT_LABELS: Record<string, string> = {
  FAVORABLE: "Favorable",
  FAVORABLE_SOUS_RESERVE: "Favorable sous réserve",
  DEFAVORABLE: "Défavorable",
};
const VERDICT_KEYS = ["FAVORABLE", "FAVORABLE_SOUS_RESERVE", "DEFAVORABLE"] as const;

const VERDICT_COLORS: Record<string, string> = {
  FAVORABLE: "bg-green-100 text-green-800",
  FAVORABLE_SOUS_RESERVE: "bg-yellow-100 text-yellow-800",
  DEFAVORABLE: "bg-red-100 text-red-800",
};

const OBS_TYPE_LABELS: Record<string, string> = {
  QUALIFICATION_INITIALE: "Qualification initiale",
  SUPERVISION_PERIODIQUE: "Supervision périodique",
  EXTENSION: "Extension de domaine",
  REQUALIFICATION: "Requalification",
};
const OBS_TYPE_KEYS = ["QUALIFICATION_INITIALE", "SUPERVISION_PERIODIQUE", "EXTENSION", "REQUALIFICATION"] as const;

export default function ObservationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [observations, setObservations] = useState<ObservationReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [verdictFilter, setVerdictFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedObs, setSelectedObs] = useState<ObservationReport | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const tVerdict = (v: string) => t(`gesCompetences.observations.verdict.${v}`, { defaultValue: VERDICT_LABELS[v] || v });
  const tObsType = (v: string) => t(`gesCompetences.observations.obsType.${v}`, { defaultValue: OBS_TYPE_LABELS[v] || v });

  // Create form state
  const [form, setForm] = useState({
    evaluatorId: "",
    observerId: "",
    qualificationId: "",
    observationDate: new Date().toISOString().split("T")[0],
    observationType: "SUPERVISION_PERIODIQUE",
    scoreMaitriseTechnique: "",
    scoreRigueurExamen: "",
    scorePertinenceConstats: "",
    scoreRedactionRapports: "",
    scoreConnaissanceNormes: "",
    scoreComportement: "",
    scoreEcoute: "",
    scoreImpartialite: "",
    scoreGestionTemps: "",
    scoreDiplomatie: "",
    verdict: "",
    pointsForts: "",
    pointsAmeliorer: "",
    recommandations: "",
    commentairesGeneraux: "",
    conditionsReserve: "",
  });

  useEffect(() => {
    document.title = t("gesCompetences.observations.pageTitle", { defaultValue: "Observations (FOR 71) - ALGERAC" });
    fetchObservations();
  }, []);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/qualifications/observations", { credentials: "include" });
      if (res.ok) setObservations(await res.json());
    } catch (err) {
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return observations.filter(o => {
      const matchSearch = !searchTerm ||
        o.evaluator.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.observer.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchVerdict = verdictFilter === "all" || o.verdict === verdictFilter;
      return matchSearch && matchVerdict;
    });
  }, [observations, searchTerm, verdictFilter]);

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleCreate = async () => {
    if (!form.evaluatorId || !form.observerId) {
      toast({ title: t("gesCompetences.observations.error", { defaultValue: "Erreur" }), description: t("gesCompetences.observations.errorRequired", { defaultValue: "Évaluateur et observateur sont requis" }), variant: "destructive" });
      return;
    }
    setActionLoading(true);
    try {
      const body: any = { ...form };
      // Convert numeric fields
      ["scoreMaitriseTechnique", "scoreRigueurExamen", "scorePertinenceConstats",
        "scoreRedactionRapports", "scoreConnaissanceNormes", "scoreComportement",
        "scoreEcoute", "scoreImpartialite", "scoreGestionTemps", "scoreDiplomatie"
      ].forEach(key => {
        if (body[key]) body[key] = parseInt(body[key]);
        else delete body[key];
      });
      if (!body.qualificationId) delete body.qualificationId;

      const res = await fetch("/api/qualifications/observations", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast({ title: t("gesCompetences.observations.success", { defaultValue: "Succès" }), description: t("gesCompetences.observations.successCreated", { defaultValue: "Fiche d'observation FOR 71 créée" }) });
        setCreateOpen(false);
        fetchObservations();
      } else {
        const err = await res.json();
        toast({ title: t("gesCompetences.observations.error", { defaultValue: "Erreur" }), description: err.error, variant: "destructive" });
      }
    } catch {
      toast({ title: t("gesCompetences.observations.error", { defaultValue: "Erreur" }), description: t("gesCompetences.observations.errorConnection", { defaultValue: "Erreur de connexion" }), variant: "destructive" });
    } finally {
      setActionLoading(false);
    }
  };

  const ScoreDisplay = ({ label, score }: { label: string; score?: number }) => (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-600">{label}</span>
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(i => (
          <Star key={i} className={`h-4 w-4 ${score && i <= score ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
        ))}
        <span className="text-sm font-medium ml-2">{score ?? "-"}/5</span>
      </div>
    </div>
  );

  const ScoreInput = ({ label, field }: { label: string; field: string }) => (
    <div>
      <Label className="text-xs">{label}</Label>
      <Select value={(form as any)[field]} onValueChange={v => updateForm(field, v)}>
        <SelectTrigger className="h-8">
          <SelectValue placeholder={t("gesCompetences.observations.scorePlaceholder", { defaultValue: "Score" })} />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map(i => (
            <SelectItem key={i} value={String(i)}>{i}/5</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t("gesCompetences.observations.title", { defaultValue: "Fiches d'Observation (FOR 71)" })}</h1>
              <p className="text-gray-500 mt-1">{t("gesCompetences.observations.subtitle", { defaultValue: "Observation et évaluation des aptitudes des évaluateurs" })}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchObservations}>
                <RefreshCw className="h-4 w-4 mr-2" /> {t("common.refresh")}
              </Button>
              <Button size="sm" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> {t("gesCompetences.observations.newObservation", { defaultValue: "Nouvelle observation" })}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold">{observations.length}</div><div className="text-xs text-gray-500">{t("gesCompetences.observations.statTotal", { defaultValue: "Total" })}</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">{observations.filter(o => o.verdict === "FAVORABLE").length}</div><div className="text-xs text-gray-500">{t("gesCompetences.observations.statFavorable", { defaultValue: "Favorables" })}</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{observations.filter(o => o.verdict === "FAVORABLE_SOUS_RESERVE").length}</div><div className="text-xs text-gray-500">{t("gesCompetences.observations.statFavorableReserve", { defaultValue: "Sous réserve" })}</div></CardContent></Card>
            <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{observations.filter(o => o.verdict === "DEFAVORABLE").length}</div><div className="text-xs text-gray-500">{t("gesCompetences.observations.statUnfavorable", { defaultValue: "Défavorables" })}</div></CardContent></Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder={t("gesCompetences.observations.searchPlaceholder", { defaultValue: "Rechercher..." })} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
                </div>
                <Select value={verdictFilter} onValueChange={setVerdictFilter}>
                  <SelectTrigger className="w-[200px]"><SelectValue placeholder={t("gesCompetences.observations.filterVerdictPlaceholder", { defaultValue: "Verdict" })} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("gesCompetences.observations.filterAllVerdicts", { defaultValue: "Tous les verdicts" })}</SelectItem>
                    {VERDICT_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>{tVerdict(k)}</SelectItem>
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
                    <TableHead>{t("gesCompetences.observations.table.evaluator", { defaultValue: "Évaluateur" })}</TableHead>
                    <TableHead>{t("gesCompetences.observations.table.observer", { defaultValue: "Observateur" })}</TableHead>
                    <TableHead>{t("gesCompetences.observations.table.date", { defaultValue: "Date" })}</TableHead>
                    <TableHead>{t("gesCompetences.observations.table.type", { defaultValue: "Type" })}</TableHead>
                    <TableHead>{t("gesCompetences.observations.table.score", { defaultValue: "Score" })}</TableHead>
                    <TableHead>{t("gesCompetences.observations.table.verdict", { defaultValue: "Verdict" })}</TableHead>
                    <TableHead className="text-right">{t("gesCompetences.observations.table.actions", { defaultValue: "Actions" })}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">{t("gesCompetences.observations.table.loading", { defaultValue: "Chargement..." })}</TableCell></TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-500">{t("gesCompetences.observations.table.empty", { defaultValue: "Aucune observation" })}</TableCell></TableRow>
                  ) : filtered.map(o => (
                    <TableRow key={o.id} className="cursor-pointer hover:bg-gray-50"
                      onClick={() => { setSelectedObs(o); setDetailOpen(true); }}>
                      <TableCell>
                        <div className="font-medium">{o.evaluator.fullName}</div>
                      </TableCell>
                      <TableCell>{o.observer.fullName}</TableCell>
                      <TableCell>{new Date(o.observationDate).toLocaleDateString("fr-FR")}</TableCell>
                      <TableCell className="text-sm">{tObsType(o.observationType)}</TableCell>
                      <TableCell>
                        <span className="font-semibold">{o.scoreGlobal?.toFixed(1) ?? "-"}</span>
                        <span className="text-xs text-gray-400">/5</span>
                      </TableCell>
                      <TableCell>
                        {o.verdict && (
                          <Badge className={VERDICT_COLORS[o.verdict]}>{tVerdict(o.verdict)}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
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
          {selectedObs && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  {t("gesCompetences.observations.detail.title", { defaultValue: "Fiche d'Observation FOR 71" })}
                </DialogTitle>
                <DialogDescription>
                  {selectedObs.evaluator.fullName} — {new Date(selectedObs.observationDate).toLocaleDateString("fr-FR")}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-500">{t("gesCompetences.observations.detail.observer", { defaultValue: "Observateur" })}</Label>
                    <p className="font-medium">{selectedObs.observer.fullName}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-500">{t("gesCompetences.observations.detail.type", { defaultValue: "Type" })}</Label>
                    <p className="font-medium">{tObsType(selectedObs.observationType)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{t("gesCompetences.observations.detail.knowHowTitle", { defaultValue: "Savoir-faire" })}</h4>
                  <div className="space-y-1 bg-gray-50 p-3 rounded-lg">
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.technicalMastery", { defaultValue: "Maîtrise technique" })} score={selectedObs.scoreMaitriseTechnique} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.examRigor", { defaultValue: "Rigueur d'examen" })} score={selectedObs.scoreRigueurExamen} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.findingsRelevance", { defaultValue: "Pertinence des constats" })} score={selectedObs.scorePertinenceConstats} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.reportWriting", { defaultValue: "Rédaction des rapports" })} score={selectedObs.scoreRedactionRapports} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.standardsKnowledge", { defaultValue: "Connaissance des normes" })} score={selectedObs.scoreConnaissanceNormes} />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">{t("gesCompetences.observations.detail.softSkillsTitle", { defaultValue: "Savoir-être" })}</h4>
                  <div className="space-y-1 bg-gray-50 p-3 rounded-lg">
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.behavior", { defaultValue: "Comportement" })} score={selectedObs.scoreComportement} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.listening", { defaultValue: "Écoute" })} score={selectedObs.scoreEcoute} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.impartiality", { defaultValue: "Impartialité" })} score={selectedObs.scoreImpartialite} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.timeManagement", { defaultValue: "Gestion du temps" })} score={selectedObs.scoreGestionTemps} />
                    <ScoreDisplay label={t("gesCompetences.observations.detail.criteria.diplomacy", { defaultValue: "Diplomatie" })} score={selectedObs.scoreDiplomatie} />
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-100 rounded-lg">
                  <div>
                    <span className="text-sm text-gray-500">{t("gesCompetences.observations.detail.globalScore", { defaultValue: "Score global" })}</span>
                    <p className="text-3xl font-bold">{selectedObs.scoreGlobal?.toFixed(2) ?? "-"}<span className="text-lg text-gray-400">/5</span></p>
                  </div>
                  {selectedObs.verdict && (
                    <Badge className={`text-lg px-4 py-2 ${VERDICT_COLORS[selectedObs.verdict]}`}>
                      {tVerdict(selectedObs.verdict)}
                    </Badge>
                  )}
                </div>

                {selectedObs.pointsForts && (
                  <div>
                    <Label className="text-xs text-gray-500">{t("gesCompetences.observations.detail.strengths", { defaultValue: "Points forts" })}</Label>
                    <p className="text-sm bg-green-50 p-3 rounded-lg">{selectedObs.pointsForts}</p>
                  </div>
                )}
                {selectedObs.pointsAmeliorer && (
                  <div>
                    <Label className="text-xs text-gray-500">{t("gesCompetences.observations.detail.improvements", { defaultValue: "Points à améliorer" })}</Label>
                    <p className="text-sm bg-yellow-50 p-3 rounded-lg">{selectedObs.pointsAmeliorer}</p>
                  </div>
                )}
                {selectedObs.recommandations && (
                  <div>
                    <Label className="text-xs text-gray-500">{t("gesCompetences.observations.detail.recommendations", { defaultValue: "Recommandations" })}</Label>
                    <p className="text-sm bg-blue-50 p-3 rounded-lg">{selectedObs.recommandations}</p>
                  </div>
                )}
                {selectedObs.conditionsReserve && (
                  <div>
                    <Label className="text-xs text-gray-500">{t("gesCompetences.observations.detail.reserveConditions", { defaultValue: "Conditions de la réserve" })}</Label>
                    <p className="text-sm bg-orange-50 p-3 rounded-lg">{selectedObs.conditionsReserve}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("gesCompetences.observations.createDialog.title", { defaultValue: "Nouvelle Fiche d'Observation (FOR 71)" })}</DialogTitle>
            <DialogDescription>{t("gesCompetences.observations.createDialog.subtitle", { defaultValue: "Remplir la fiche d'observation des aptitudes" })}</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t("gesCompetences.observations.createDialog.evaluatorId", { defaultValue: "ID Évaluateur *" })}</Label>
                <Input value={form.evaluatorId} onChange={e => updateForm("evaluatorId", e.target.value)} placeholder={t("gesCompetences.observations.createDialog.idPlaceholder", { defaultValue: "ID" })} />
              </div>
              <div>
                <Label>{t("gesCompetences.observations.createDialog.observerId", { defaultValue: "ID Observateur *" })}</Label>
                <Input value={form.observerId} onChange={e => updateForm("observerId", e.target.value)} placeholder={t("gesCompetences.observations.createDialog.idPlaceholder", { defaultValue: "ID" })} />
              </div>
              <div>
                <Label>{t("gesCompetences.observations.createDialog.qualificationId", { defaultValue: "ID Qualification" })}</Label>
                <Input value={form.qualificationId} onChange={e => updateForm("qualificationId", e.target.value)} placeholder={t("gesCompetences.observations.createDialog.qualificationIdOptional", { defaultValue: "Optionnel" })} />
              </div>
              <div>
                <Label>{t("gesCompetences.observations.createDialog.observationDate", { defaultValue: "Date d'observation" })}</Label>
                <Input type="date" value={form.observationDate} onChange={e => updateForm("observationDate", e.target.value)} />
              </div>
            </div>

            <div>
              <Label>{t("gesCompetences.observations.createDialog.observationType", { defaultValue: "Type d'observation" })}</Label>
              <Select value={form.observationType} onValueChange={v => updateForm("observationType", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {OBS_TYPE_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{tObsType(k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h4 className="font-semibold mb-3">{t("gesCompetences.observations.createDialog.knowHowTitle", { defaultValue: "Savoir-faire (1-5)" })}</h4>
              <div className="grid grid-cols-2 gap-3">
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.technicalMastery", { defaultValue: "Maîtrise technique" })} field="scoreMaitriseTechnique" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.examRigor", { defaultValue: "Rigueur d'examen" })} field="scoreRigueurExamen" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.findingsRelevance", { defaultValue: "Pertinence des constats" })} field="scorePertinenceConstats" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.reportWriting", { defaultValue: "Rédaction des rapports" })} field="scoreRedactionRapports" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.standardsKnowledge", { defaultValue: "Connaissance des normes" })} field="scoreConnaissanceNormes" />
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-3">{t("gesCompetences.observations.createDialog.softSkillsTitle", { defaultValue: "Savoir-être (1-5)" })}</h4>
              <div className="grid grid-cols-2 gap-3">
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.behavior", { defaultValue: "Comportement" })} field="scoreComportement" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.listening", { defaultValue: "Écoute" })} field="scoreEcoute" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.impartiality", { defaultValue: "Impartialité" })} field="scoreImpartialite" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.timeManagement", { defaultValue: "Gestion du temps" })} field="scoreGestionTemps" />
                <ScoreInput label={t("gesCompetences.observations.detail.criteria.diplomacy", { defaultValue: "Diplomatie" })} field="scoreDiplomatie" />
              </div>
            </div>

            <div>
              <Label>{t("gesCompetences.observations.createDialog.verdictLabel", { defaultValue: "Verdict" })}</Label>
              <Select value={form.verdict} onValueChange={v => updateForm("verdict", v)}>
                <SelectTrigger><SelectValue placeholder={t("gesCompetences.observations.createDialog.selectPlaceholder", { defaultValue: "Sélectionner..." })} /></SelectTrigger>
                <SelectContent>
                  {VERDICT_KEYS.map((k) => (
                    <SelectItem key={k} value={k}>{tVerdict(k)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label>{t("gesCompetences.observations.createDialog.strengths", { defaultValue: "Points forts" })}</Label>
                <Textarea value={form.pointsForts} onChange={e => updateForm("pointsForts", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>{t("gesCompetences.observations.createDialog.improvements", { defaultValue: "Points à améliorer" })}</Label>
                <Textarea value={form.pointsAmeliorer} onChange={e => updateForm("pointsAmeliorer", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>{t("gesCompetences.observations.createDialog.recommendations", { defaultValue: "Recommandations" })}</Label>
                <Textarea value={form.recommandations} onChange={e => updateForm("recommandations", e.target.value)} rows={2} />
              </div>
              <div>
                <Label>{t("gesCompetences.observations.createDialog.generalComments", { defaultValue: "Commentaires généraux" })}</Label>
                <Textarea value={form.commentairesGeneraux} onChange={e => updateForm("commentairesGeneraux", e.target.value)} rows={2} />
              </div>
              {form.verdict === "FAVORABLE_SOUS_RESERVE" && (
                <div>
                  <Label>{t("gesCompetences.observations.createDialog.reserveConditions", { defaultValue: "Conditions de la réserve" })}</Label>
                  <Textarea value={form.conditionsReserve} onChange={e => updateForm("conditionsReserve", e.target.value)} rows={2} />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{t("gesCompetences.observations.createDialog.cancel", { defaultValue: "Annuler" })}</Button>
            <Button onClick={handleCreate} disabled={actionLoading}>{t("gesCompetences.observations.createDialog.save", { defaultValue: "Enregistrer" })}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
