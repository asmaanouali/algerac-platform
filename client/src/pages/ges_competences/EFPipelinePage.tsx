import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, RefreshCw, ArrowRight, BookOpen, Eye, ClipboardCheck, Award } from "lucide-react";

interface Q {
  id: number;
  evaluator: { id: number; fullName: string; email: string };
  qualifiedRole: string;
  status: string;
  trainingExamScore?: number;
  observerMissionsCompleted: number;
  supervisedMissionsCompleted: number;
  partialAssessmentCompleted?: boolean;
  trainingCompletedDate?: string;
}

const PHASES = [
  { key: "PENDING_TRAINING", i18nKey: "PENDING_TRAINING", label: "En attente formation", color: "bg-yellow-100 text-yellow-800", icon: BookOpen },
  { key: "TRAINING_IN_PROGRESS", i18nKey: "TRAINING_IN_PROGRESS", label: "Formation en cours", color: "bg-blue-100 text-blue-800", icon: BookOpen },
  { key: "TRAINING_COMPLETED", i18nKey: "TRAINING_COMPLETED", label: "Formation terminée", color: "bg-cyan-100 text-cyan-800", icon: BookOpen },
  { key: "OBSERVER_PHASE", i18nKey: "OBSERVER_PHASE", label: "Phase observation", color: "bg-indigo-100 text-indigo-800", icon: Eye },
  { key: "PRACTICE_PHASE", i18nKey: "PRACTICE_PHASE", label: "Phase pratique", color: "bg-purple-100 text-purple-800", icon: ClipboardCheck },
  { key: "PENDING_COMMISSION", i18nKey: "PENDING_COMMISSION", label: "En attente commission", color: "bg-orange-100 text-orange-800", icon: Award },
];

export default function EFPipelinePage() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [items, setItems] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = t("gesCompetences.efPipeline.pageTitle", { defaultValue: "Pipeline Évaluateurs en Formation | ALGERAC" });
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/qualifications", { credentials: "include" });
    if (res.ok) {
      const all: Q[] = await res.json();
      setItems(all.filter((q) => PHASES.some((p) => p.key === q.status)));
    }
    setLoading(false);
  };

  const advance = async (id: number, action: string) => {
    const url = `/api/qualifications/${id}/${action}`;
    const res = await fetch(url, { method: "POST", credentials: "include" });
    if (res.ok) { toast({ title: t("gesCompetences.efPipeline.stepAdvanced", { defaultValue: "Étape avancée" }) }); fetchAll(); }
    else { const err = await res.json(); toast({ title: t("gesCompetences.efPipeline.error", { defaultValue: "Erreur" }), description: err.error, variant: "destructive" }); }
  };

  const grouped = useMemo(() => {
    const m: Record<string, Q[]> = {};
    PHASES.forEach((p) => (m[p.key] = []));
    items.forEach((q) => { if (m[q.status]) m[q.status].push(q); });
    return m;
  }, [items]);

  const nextActionLabel = (status: string): { label: string; action: string } | null => {
    switch (status) {
      case "TRAINING_COMPLETED": return { label: t("gesCompetences.efPipeline.nextAction.toObserver", { defaultValue: "→ Phase observation" }), action: "advance-observer" };
      case "OBSERVER_PHASE": return { label: t("gesCompetences.efPipeline.nextAction.toPractice", { defaultValue: "→ Phase pratique" }), action: "advance-practice" };
      case "PRACTICE_PHASE": return { label: t("gesCompetences.efPipeline.nextAction.toCommission", { defaultValue: "→ Soumettre commission" }), action: "submit-commission" };
      default: return null;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <GraduationCap className="h-6 w-6 text-indigo-600" /> {t("gesCompetences.efPipeline.title", { defaultValue: "Pipeline Évaluateurs en Formation (EF)" })}
              </h1>
              <p className="text-sm text-slate-500 mt-1">{t("gesCompetences.efPipeline.subtitle", { defaultValue: "PRO 06 §5.3 — parcours formation → observation → pratique → commission" })}</p>
            </div>
            <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" />{t("common.refresh")}</Button>
          </div>

          {loading ? <p>{t("gesCompetences.efPipeline.loading", { defaultValue: "Chargement…" })}</p> : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {PHASES.map((phase) => {
                const Icon = phase.icon;
                const list = grouped[phase.key] || [];
                return (
                  <Card key={phase.key}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{t(`gesCompetences.efPipeline.phases.${phase.i18nKey}`, { defaultValue: phase.label })}</span>
                        <Badge className={phase.color}>{list.length}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {list.length === 0 ? (
                        <p className="text-xs text-slate-400 py-4 text-center">{t("gesCompetences.efPipeline.empty", { defaultValue: "Vide" })}</p>
                      ) : list.map((q) => {
                        const next = nextActionLabel(q.status);
                        return (
                          <div key={q.id} className="border rounded-md p-3 bg-white text-xs space-y-1">
                            <div className="font-medium text-sm">{q.evaluator.fullName}</div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-[10px]">{q.qualifiedRole}</Badge>
                              {q.trainingExamScore != null && <span className="text-slate-500">{t("gesCompetences.efPipeline.exam", { score: q.trainingExamScore, defaultValue: `Examen: ${q.trainingExamScore}%` })}</span>}
                            </div>
                            <div className="text-slate-600">
                              {t("gesCompetences.efPipeline.obsSup", { obs: q.observerMissionsCompleted, sup: q.supervisedMissionsCompleted, defaultValue: `Obs: ${q.observerMissionsCompleted}/1 · Sup: ${q.supervisedMissionsCompleted}/2` })}
                              {q.partialAssessmentCompleted && <span className="text-emerald-600 ml-1">{t("gesCompetences.efPipeline.partialDone", { defaultValue: "· Partielle ✓" })}</span>}
                            </div>
                            {next && (
                              <Button size="sm" variant="outline" className="w-full mt-2 h-7 text-[11px]" onClick={() => advance(q.id, next.action)}>
                                {next.label} <ArrowRight className="h-3 w-3 ml-1" />
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
