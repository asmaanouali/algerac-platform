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
import { Loader2, FileCheck, Send, AlertCircle, CheckCircle, Clock, RefreshCw } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { Alert, AlertDescription } from "@/components/ui/alert";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  DRAFT:                { label: "Brouillon",              color: "bg-gray-100 text-gray-700",    icon: FileCheck },
  SUBMITTED_TO_RA:      { label: "Soumis au RA",           color: "bg-blue-100 text-blue-700",    icon: Clock },
  RA_ADJUSTMENTS_NEEDED:{ label: "Ajustements RA demandés",color: "bg-amber-100 text-amber-700",  icon: AlertCircle },
  RA_APPROVED:          { label: "Approuvé par le RA",     color: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
  PENDING_CD:           { label: "En attente validation CD",color: "bg-indigo-100 text-indigo-700", icon: Clock },
  CD_VALIDATED:         { label: "Validé par le CD",       color: "bg-green-100 text-green-700",  icon: CheckCircle },
  SENT_TO_OEC:          { label: "Envoyé à l'OEC",         color: "bg-primary/10 text-primary",   icon: Send },
  // Legacy statuses
  SUBMITTED_TO_CD:      { label: "En attente du RA",       color: "bg-blue-100 text-blue-700",    icon: Clock },
  ADJUSTMENTS_NEEDED:   { label: "Ajustements demandés",   color: "bg-amber-100 text-amber-700",  icon: AlertCircle },
  VALIDATED:            { label: "Validé",                 color: "bg-green-100 text-green-700",  icon: CheckCircle },
  ACTIVE:               { label: "Actif",                  color: "bg-green-100 text-green-700",  icon: CheckCircle },
};

const emptyForm = { dailyProgram: "", activityDistribution: "", schedules: "", documentsToExamine: "" };

export default function EvaluationPlanPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any>(null);
  const [plan, setPlan] = useState<any>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");

  useEffect(() => { loadTeams(); }, []);

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/workflow/teams/my-teams", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setTeams(data);
        if (data.length === 1) selectTeam(data[0]);
      }
    } catch (e) { }
    setLoading(false);
  };

  const selectTeam = async (team: any) => {
    setSelectedTeam(team);
    setPlan(null);
    setMode("view");
    const requestId = team.requestId ?? team.request?.id;
    if (!requestId) return;
    try {
      const res = await fetch(`/api/workflow/evaluation-plan/by-request/${requestId}`, { credentials: "include" });
      if (res.ok) {
        const plans = await res.json();
        if (plans.length > 0) {
          const p = plans[0];
          setPlan(p);
          setForm({
            dailyProgram: p.dailyProgram || "",
            activityDistribution: p.activityDistribution || "",
            schedules: p.schedules || "",
            documentsToExamine: p.documentsToExamine || "",
          });
        } else {
          setForm(emptyForm);
          setMode("edit");
        }
      }
    } catch (e) { }
  };

  const savePlan = async () => {
    if (!form.dailyProgram.trim()) {
      toast({ title: "Erreur", description: "Le programme journalier est obligatoire.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const requestId = selectedTeam.requestId ?? selectedTeam.request?.id;
      if (plan) {
        // Update existing plan via create endpoint (re-save)
        const res = await apiRequest("POST", "/api/workflow/evaluation-plan/create", {
          requestId,
          ...form,
        });
        const data = await res.json();
        if (data.success || data.data) {
          toast({ title: "Succès", description: "Plan sauvegardé" });
          await selectTeam(selectedTeam);
          setMode("view");
        }
      } else {
        const res = await apiRequest("POST", "/api/workflow/evaluation-plan/create", {
          requestId,
          ...form,
        });
        const data = await res.json();
        if (data.success || data.data) {
          toast({ title: "Succès", description: "Plan FOR 32 créé" });
          await selectTeam(selectedTeam);
          setMode("view");
        }
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const submitToRA = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${plan.id}/submit-to-ra`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Plan soumis au RA pour validation" });
        await selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const sendToOEC = async () => {
    if (!plan) return;
    setSaving(true);
    try {
      const res = await apiRequest("POST", `/api/workflow/evaluation-plan/${plan.id}/send-to-oec`, {});
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succès", description: "Plan FOR 32 envoyé à l'OEC (min. 5 jours avant évaluation)" });
        await selectTeam(selectedTeam);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  if (!user) return null;

  const canEdit = !plan || plan.status === "DRAFT" || plan.status === "ADJUSTMENTS_NEEDED" || plan.status === "RA_ADJUSTMENTS_NEEDED";
  const canSubmitToRA = plan && (plan.status === "DRAFT" || plan.status === "ADJUSTMENTS_NEEDED" || plan.status === "RA_ADJUSTMENTS_NEEDED");
  const canSendToOEC = plan && (plan.status === "VALIDATED" || plan.status === "CD_VALIDATED");
  const statusCfg = plan ? (STATUS_CONFIG[plan.status] ?? { label: plan.status, color: "bg-gray-100 text-gray-700", icon: FileCheck }) : null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl font-bold">Plan d'Évaluation — FOR 32</h1>
              <p className="text-muted-foreground mt-1">Élaborez et soumettez le plan d'évaluation au RA (Étape 6.4)</p>
            </div>
            <Button variant="outline" onClick={loadTeams} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              {t("common.refresh")}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : teams.length === 0 ? (
            <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">
              Vous n'êtes affecté à aucune mission en cours de préparation.
            </CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Dossier list */}
              <Card className="lg:col-span-1">
                <CardHeader><CardTitle className="text-base">Mes missions</CardTitle></CardHeader>
                <CardContent className="space-y-2 p-3">
                  {teams.map((t: any) => (
                    <div key={t.id} onClick={() => selectTeam(t)} className={`p-3 rounded-lg border cursor-pointer transition-colors text-sm ${selectedTeam?.id === t.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}>
                      <p className="font-medium">{t.requestReferenceNumber || `Dossier #${t.requestId ?? t.request?.id}`}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t.request?.domain || ""}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Plan form / view */}
              <div className="lg:col-span-3 space-y-4">
                {!selectedTeam ? (
                  <Card><CardContent className="pt-6 text-center text-muted-foreground py-12">Sélectionnez une mission</CardContent></Card>
                ) : (
                  <>
                    {/* Status banner */}
                    {plan && statusCfg && (
                      <Card>
                        <CardContent className="pt-4 pb-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusCfg.color}`}>
                                {statusCfg.label}
                              </span>
                              <span className="text-sm text-muted-foreground">Plan {plan.planCode}</span>
                            </div>
                            <div className="flex gap-2">
                              {canEdit && <Button size="sm" variant="outline" onClick={() => setMode(mode === "edit" ? "view" : "edit")}>
                                <RefreshCw className="w-3 h-3 mr-1" />{mode === "edit" ? "Annuler" : "Modifier"}
                              </Button>}
                              {canSubmitToRA && mode === "view" && (
                                <Button size="sm" onClick={submitToRA} disabled={saving}>
                                  {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                                  Soumettre au RA
                                </Button>
                              )}
                              {canSendToOEC && (
                                <Button size="sm" onClick={sendToOEC} disabled={saving}>
                                  {saving ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <Send className="w-3 h-3 mr-1" />}
                                  Envoyer à l'OEC
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Adjustment feedback from RA */}
                    {(plan?.status === "ADJUSTMENTS_NEEDED" || plan?.status === "RA_ADJUSTMENTS_NEEDED") && (plan.cdAdjustmentRequests || plan.raAdjustmentNotes) && (
                      <Alert variant="destructive" className="border-amber-300 bg-amber-50 text-amber-800">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          <p className="font-semibold mb-1">Ajustements demandés par le RA :</p>
                          <p>{plan.raAdjustmentNotes || plan.cdAdjustmentRequests}</p>
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Plan form */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <FileCheck className="w-5 h-5 text-primary" />
                          Formulaire FOR 32 — Plan d'Évaluation
                        </CardTitle>
                        <CardDescription>
                          {mode === "edit" ? "Renseignez tous les champs du plan d'évaluation." : "Contenu du plan d'évaluation soumis."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {mode === "edit" ? (
                          <>
                            <div className="space-y-1.5">
                              <Label>Programme journalier <span className="text-red-500">*</span></Label>
                              <Textarea
                                value={form.dailyProgram}
                                onChange={e => setForm(f => ({ ...f, dailyProgram: e.target.value }))}
                                placeholder="Décrivez le programme jour par jour (horaires, séquences d'activités...)"
                                rows={5}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Répartition des activités entre les membres</Label>
                              <Textarea
                                value={form.activityDistribution}
                                onChange={e => setForm(f => ({ ...f, activityDistribution: e.target.value }))}
                                placeholder="Qui fait quoi ? REE, ET, EXP, EQ..."
                                rows={4}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Horaires et plannings</Label>
                              <Textarea
                                value={form.schedules}
                                onChange={e => setForm(f => ({ ...f, schedules: e.target.value }))}
                                placeholder="Créneaux horaires, pauses, synthèses..."
                                rows={3}
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Documents à examiner</Label>
                              <Textarea
                                value={form.documentsToExamine}
                                onChange={e => setForm(f => ({ ...f, documentsToExamine: e.target.value }))}
                                placeholder="Liste des documents, procédures, enregistrements à vérifier..."
                                rows={4}
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <Button onClick={savePlan} disabled={saving}>
                                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <FileCheck className="w-4 h-4 mr-2" />}
                                {plan ? "Sauvegarder" : "Créer le plan FOR 32"}
                              </Button>
                              {!plan && (
                                <p className="text-xs text-muted-foreground self-center">
                                  Après sauvegarde, vous pourrez le soumettre au RA.
                                </p>
                              )}
                            </div>
                          </>
                        ) : (
                          /* Read-only view */
                          <div className="space-y-4">
                            {[
                              { label: "Programme journalier", value: form.dailyProgram },
                              { label: "Répartition des activités", value: form.activityDistribution },
                              { label: "Horaires et plannings", value: form.schedules },
                              { label: "Documents à examiner", value: form.documentsToExamine },
                            ].map(({ label, value }) => value ? (
                              <div key={label} className="border rounded-lg p-4">
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{label}</p>
                                <p className="text-sm whitespace-pre-wrap">{value}</p>
                              </div>
                            ) : null)}
                            {!plan && (
                              <p className="text-center text-muted-foreground py-8">
                                Aucun plan créé. Cliquez sur "Modifier" pour commencer.
                              </p>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Workflow hints */}
                    {(plan?.status === "SUBMITTED_TO_CD" || plan?.status === "SUBMITTED_TO_RA") && (
                      <Alert className="border-blue-200 bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-700">
                          Plan soumis au RA. En attente de vérification de conformité aux normes d'accréditation.
                        </AlertDescription>
                      </Alert>
                    )}
                    {(plan?.status === "RA_APPROVED" || plan?.status === "PENDING_CD") && (
                      <Alert className="border-indigo-200 bg-indigo-50">
                        <Clock className="h-4 w-4 text-indigo-600" />
                        <AlertDescription className="text-indigo-700">
                          Plan approuvé par le RA, transmis au CD pour validation finale.
                        </AlertDescription>
                      </Alert>
                    )}
                    {plan?.status === "CD_VALIDATED" && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Plan validé par le CD. Vous pouvez maintenant l'envoyer à l'OEC (au moins 5 jours avant l'évaluation sur site).
                        </AlertDescription>
                      </Alert>
                    )}
                    {plan?.status === "SENT_TO_OEC" && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription className="text-green-700">
                          Plan envoyé à l'OEC. L'étape 6 est terminée — l'évaluation peut commencer à la date prévue.
                        </AlertDescription>
                      </Alert>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
