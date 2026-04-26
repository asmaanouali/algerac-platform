import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { FileText, Save, ArrowLeft } from "lucide-react";

interface Plan {
  id: number;
  evaluator: { id: number; fullName: string; email: string };
  qualification?: { id: number; qualifiedRole: string };
  supervisedRole?: string;
  plannedDate?: string;
  requestId?: number;
  status: string;
}

const SCORE_OPTIONS = [1, 2, 3, 4, 5];
const VERDICTS = [
  { v: "QUALIFIED", l: "Qualifié" },
  { v: "QUALIFIED_WITH_CONDITIONS", l: "Qualifié avec conditions" },
  { v: "REQUALIFICATION_NEEDED", l: "Requalification nécessaire" },
  { v: "DISQUALIFIED", l: "Non qualifié" },
];

export default function SupervisionFormPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  useEffect(() => {
    document.title = "Fiche de supervision | ALGERAC";
    fetch(`/api/competency/supervision-plans/${id}`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((p) => { setPlan(p); setLoading(false); });
  }, [id]);

  const isExpert = plan?.supervisedRole === "EXP";

  const submitExpertSheet = async () => {
    setSubmitting(true);
    const payload = {
      expertId: plan?.evaluator.id,
      requestId: plan?.requestId,
      interventionDate: form.interventionDate || plan?.plannedDate,
      score1: Number(form.score1),
      score2: Number(form.score2),
      score3: Number(form.score3),
      score4: Number(form.score4),
      score5: Number(form.score5),
      score6: Number(form.score6),
      score7: Number(form.score7),
      verdict: form.verdict,
      strengths: form.strengths,
      improvements: form.improvements,
      recommendations: form.recommendations,
      comments: form.comments,
    };
    const res = await fetch("/api/competency/expert-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetch(`/api/competency/supervision-plans/${id}/complete`, { method: "POST", credentials: "include" });
      toast({ title: "Fiche FOR 21-3 enregistrée" });
      navigate("/sup/my-plan");
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
    setSubmitting(false);
  };

  const submitMonitoringSheet = async () => {
    setSubmitting(true);
    const payload = {
      evaluatorId: plan?.evaluator.id,
      qualificationId: plan?.qualification?.id,
      isPermanent: form.isPermanent === "true",
      cycleStartDate: form.cycleStartDate,
      cycleEndDate: form.cycleEndDate,
      totalMissionsInCycle: Number(form.totalMissionsInCycle || 0),
      avgObservationScore: form.avgObservationScore ? Number(form.avgObservationScore) : null,
      avgSatisfactionScore: form.avgSatisfactionScore ? Number(form.avgSatisfactionScore) : null,
      proposedDecision: form.proposedDecision,
      strengths: form.strengths,
      areasForImprovement: form.improvements,
      justification: form.justification,
    };
    const res = await fetch("/api/competency/monitoring-sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      await fetch(`/api/competency/supervision-plans/${id}/complete`, { method: "POST", credentials: "include" });
      toast({ title: "Fiche enregistrée" });
      navigate("/sup/my-plan");
    } else {
      toast({ title: "Erreur", variant: "destructive" });
    }
    setSubmitting(false);
  };

  if (loading) return <div className="flex h-screen"><Sidebar /><div className="flex-1"><Navbar /><div className="p-6">Chargement…</div></div></div>;
  if (!plan) return <div className="flex h-screen"><Sidebar /><div className="flex-1"><Navbar /><div className="p-6">Plan introuvable.</div></div></div>;

  const expertCriteria = [
    { k: "score1", l: "1. Maîtrise technique du domaine" },
    { k: "score2", l: "2. Application des référentiels" },
    { k: "score3", l: "3. Qualité des observations" },
    { k: "score4", l: "4. Communication avec l'OEC" },
    { k: "score5", l: "5. Rédaction des constats/non-conformités" },
    { k: "score6", l: "6. Respect des délais et procédures" },
    { k: "score7", l: "7. Comportement et déontologie" },
  ];

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/sup/my-plan")}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Retour
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {isExpert ? "Fiche FOR 21-3 — Supervision Expert" : "Fiche FOR 65-1 / 65-6 — Suivi Évaluateur"}
              </CardTitle>
              <CardDescription>
                Évaluateur supervisé: <strong>{plan.evaluator.fullName}</strong> · Rôle: <Badge variant="outline">{plan.supervisedRole}</Badge>
                {plan.plannedDate && <span className="ml-2">· Date prévue: {plan.plannedDate}</span>}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isExpert ? (
                <div className="space-y-4">
                  <div>
                    <Label>Date d'intervention</Label>
                    <Input type="date" value={form.interventionDate || plan.plannedDate || ""} onChange={(e) => setForm({ ...form, interventionDate: e.target.value })} />
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold">Critères d'évaluation (1-5)</h3>
                    {expertCriteria.map((c) => (
                      <div key={c.k} className="grid grid-cols-3 gap-2 items-center">
                        <Label className="col-span-2 text-sm">{c.l}</Label>
                        <Select value={form[c.k]?.toString() || ""} onValueChange={(v) => setForm({ ...form, [c.k]: Number(v) })}>
                          <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
                          <SelectContent>
                            {SCORE_OPTIONS.map((s) => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                  <div>
                    <Label>Verdict</Label>
                    <Select value={form.verdict || ""} onValueChange={(v) => setForm({ ...form, verdict: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        {VERDICTS.map((v) => <SelectItem key={v.v} value={v.v}>{v.l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Points forts</Label><Textarea value={form.strengths || ""} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
                  <div><Label>Axes d'amélioration</Label><Textarea value={form.improvements || ""} onChange={(e) => setForm({ ...form, improvements: e.target.value })} /></div>
                  <div><Label>Recommandations</Label><Textarea value={form.recommendations || ""} onChange={(e) => setForm({ ...form, recommendations: e.target.value })} /></div>
                  <div><Label>Commentaires libres</Label><Textarea value={form.comments || ""} onChange={(e) => setForm({ ...form, comments: e.target.value })} /></div>
                  <Button onClick={submitExpertSheet} disabled={submitting}>
                    <Save className="h-4 w-4 mr-2" />Enregistrer la fiche
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Type d'évaluateur</Label>
                      <Select value={form.isPermanent || "false"} onValueChange={(v) => setForm({ ...form, isPermanent: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="false">Externe (FOR 65-1, 3 ans)</SelectItem>
                          <SelectItem value="true">Permanent (FOR 65-6, 6 ans)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div><Label>Total missions cycle</Label><Input type="number" value={form.totalMissionsInCycle || ""} onChange={(e) => setForm({ ...form, totalMissionsInCycle: e.target.value })} /></div>
                    <div><Label>Date début cycle</Label><Input type="date" value={form.cycleStartDate || ""} onChange={(e) => setForm({ ...form, cycleStartDate: e.target.value })} /></div>
                    <div><Label>Date fin cycle</Label><Input type="date" value={form.cycleEndDate || ""} onChange={(e) => setForm({ ...form, cycleEndDate: e.target.value })} /></div>
                    <div><Label>Score moyen observation</Label><Input type="number" step="0.1" value={form.avgObservationScore || ""} onChange={(e) => setForm({ ...form, avgObservationScore: e.target.value })} /></div>
                    <div><Label>Score moyen satisfaction</Label><Input type="number" step="0.1" value={form.avgSatisfactionScore || ""} onChange={(e) => setForm({ ...form, avgSatisfactionScore: e.target.value })} /></div>
                  </div>
                  <div>
                    <Label>Décision proposée</Label>
                    <Select value={form.proposedDecision || ""} onValueChange={(v) => setForm({ ...form, proposedDecision: v })}>
                      <SelectTrigger><SelectValue placeholder="Sélectionner" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RENOUVELLEMENT">Renouvellement</SelectItem>
                        <SelectItem value="EXTENSION">Extension</SelectItem>
                        <SelectItem value="REDUCTION">Réduction</SelectItem>
                        <SelectItem value="RADIATION">Radiation</SelectItem>
                        <SelectItem value="FORMATION_COMPLEMENTAIRE">Formation complémentaire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Points forts</Label><Textarea value={form.strengths || ""} onChange={(e) => setForm({ ...form, strengths: e.target.value })} /></div>
                  <div><Label>Axes d'amélioration</Label><Textarea value={form.improvements || ""} onChange={(e) => setForm({ ...form, improvements: e.target.value })} /></div>
                  <div><Label>Justification</Label><Textarea value={form.justification || ""} onChange={(e) => setForm({ ...form, justification: e.target.value })} /></div>
                  <Button onClick={submitMonitoringSheet} disabled={submitting}>
                    <Save className="h-4 w-4 mr-2" />Enregistrer la fiche
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
