import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { GraduationCap, BookOpen, Eye, ClipboardCheck, Award, CheckCircle2, Circle } from "lucide-react";

interface Q {
  id: number;
  qualifiedRole: string;
  status: string;
  trainingExamScore?: number;
  trainingCompletedDate?: string;
  observerMissionsCompleted: number;
  supervisedMissionsCompleted: number;
  partialAssessmentCompleted?: boolean;
  qualificationDate?: string;
  expiryDate?: string;
  qualifiedStandardsJson?: string;
  qualifiedDomainsJson?: string;
}

interface Sheet {
  id: number;
  observationDate: string;
  scoreGlobal?: number;
  verdict?: string;
  observer: { fullName: string };
}

const STAGES = [
  { key: "TRAINING", label: "Formation théorique", icon: BookOpen, statuses: ["PENDING_TRAINING", "TRAINING_IN_PROGRESS", "TRAINING_COMPLETED", "TRAINING_FAILED"] },
  { key: "OBSERVATION", label: "Phase observation", icon: Eye, statuses: ["OBSERVER_PHASE"] },
  { key: "PRACTICE", label: "Phase pratique", icon: ClipboardCheck, statuses: ["PRACTICE_PHASE"] },
  { key: "COMMISSION", label: "Commission", icon: Award, statuses: ["PENDING_COMMISSION"] },
  { key: "QUALIFIED", label: "Qualifié", icon: CheckCircle2, statuses: ["QUALIFIED", "RENEWED"] },
];

export default function MyQualificationJourneyPage() {
  const { user } = useAuth();
  const [qualifications, setQualifications] = useState<Q[]>([]);
  const [observations, setObservations] = useState<Sheet[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Mon parcours de qualification | ALGERAC";
    if (user?.id) fetchAll();
  }, [user?.id]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [qRes, oRes] = await Promise.all([
        fetch(`/api/qualifications/evaluator/${user?.id}`, { credentials: "include" }),
        fetch(`/api/qualifications/observations/by-evaluator/${user?.id}`, { credentials: "include" }).catch(() => null),
      ]);
      if (qRes.ok) setQualifications(await qRes.json());
      if (oRes && oRes.ok) setObservations(await oRes.json());
    } finally {
      setLoading(false);
    }
  };

  const getCurrentStageIndex = (status: string): number =>
    STAGES.findIndex((s) => s.statuses.includes(status));

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-indigo-600" /> Mon parcours de qualification
            </h1>
            <p className="text-sm text-slate-500 mt-1">PRO 06 §5.3 — formation, observation, pratique, commission</p>
          </div>

          {loading ? <p>Chargement…</p> : qualifications.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-slate-500">Aucune qualification active. Contactez la Gestion des Compétences.</CardContent></Card>
          ) : qualifications.map((q) => {
            const currentIdx = getCurrentStageIndex(q.status);
            return (
              <Card key={q.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Qualification {q.qualifiedRole}</CardTitle>
                      <CardDescription>
                        Statut: <Badge variant="outline" className="ml-1">{q.status}</Badge>
                        {q.qualificationDate && <span className="ml-3">Qualifié le {q.qualificationDate}</span>}
                        {q.expiryDate && <span className="ml-3">Expire le {q.expiryDate}</span>}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Timeline */}
                  <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
                    {STAGES.map((stage, idx) => {
                      const Icon = stage.icon;
                      const done = idx < currentIdx;
                      const active = idx === currentIdx;
                      return (
                        <div key={stage.key} className="flex items-center flex-shrink-0">
                          <div className={`flex flex-col items-center gap-1 min-w-[100px] ${done ? "text-emerald-600" : active ? "text-blue-600" : "text-slate-400"}`}>
                            <div className={`rounded-full p-2 border-2 ${done ? "bg-emerald-50 border-emerald-500" : active ? "bg-blue-50 border-blue-500" : "border-slate-300"}`}>
                              {done ? <CheckCircle2 className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                            </div>
                            <span className="text-[10px] font-medium text-center">{stage.label}</span>
                          </div>
                          {idx < STAGES.length - 1 && (
                            <div className={`w-8 h-0.5 ${done ? "bg-emerald-500" : "bg-slate-200"}`} />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-sm">
                      <div className="text-slate-500">Examen module 1+2</div>
                      <div className="font-bold text-lg">
                        {q.trainingExamScore != null ? `${q.trainingExamScore}%` : "—"}
                      </div>
                      {q.trainingExamScore != null && (
                        <Badge className={q.trainingExamScore >= 70 ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                          {q.trainingExamScore >= 70 ? "Réussi" : "Échoué"}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm">
                      <div className="text-slate-500">Missions observateur</div>
                      <div className="font-bold text-lg">{q.observerMissionsCompleted}/1</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-slate-500">Missions sous supervision</div>
                      <div className="font-bold text-lg">{q.supervisedMissionsCompleted}/2</div>
                    </div>
                    <div className="text-sm">
                      <div className="text-slate-500">Évaluation partielle</div>
                      <div className="flex items-center gap-1 mt-1">
                        {q.partialAssessmentCompleted ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Circle className="h-5 w-5 text-slate-400" />}
                        <span className="text-sm">{q.partialAssessmentCompleted ? "Validée" : "À réaliser"}</span>
                      </div>
                    </div>
                  </div>

                  {observations.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-2">Fiches d'observation reçues</h3>
                      <div className="space-y-1">
                        {observations.map((o) => (
                          <div key={o.id} className="text-xs p-2 bg-slate-100 rounded flex items-center justify-between">
                            <span>{o.observationDate} · Observateur: {o.observer.fullName}</span>
                            <div className="flex items-center gap-2">
                              {o.scoreGlobal && <Badge>{o.scoreGlobal.toFixed(1)}/5</Badge>}
                              {o.verdict && <Badge variant="outline">{o.verdict}</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
