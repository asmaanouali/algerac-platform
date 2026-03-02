import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Mail, Calendar, FileText, CheckCircle, Clock, MapPin, Users, ClipboardList } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const MANDATE_STATUS: Record<string, { label: string; color: string }> = {
  DRAFT: { label: "Brouillon", color: "bg-gray-100 text-gray-700" },
  SENT_TO_CD: { label: "En attente CD", color: "bg-blue-100 text-blue-700" },
  CD_APPROVED: { label: "Approuvé par le CD", color: "bg-green-100 text-green-700" },
  CD_MODIFICATION_REQUESTED: { label: "Modifications demandées", color: "bg-amber-100 text-amber-700" },
  SENT_TO_MEMBERS: { label: "Reçu", color: "bg-emerald-100 text-emerald-700" },
};

const MEETING_STATUS: Record<string, { label: string; color: string }> = {
  PLANNED: { label: "Planifiée", color: "bg-blue-100 text-blue-700" },
  INVITATIONS_SENT: { label: "Invitation reçue", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Terminée", color: "bg-gray-100 text-gray-700" },
};

export default function MandateMeetingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [mandates, setMandates] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [mandatesRes, teamsRes] = await Promise.all([
        fetch("/api/workflow/mandates/my-mandates", { credentials: "include" }),
        fetch("/api/workflow/teams/my-teams", { credentials: "include" }),
      ]);
      if (mandatesRes.ok) setMandates(await mandatesRes.json());
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
        // Load meetings for each team's request
        const allMeetings: any[] = [];
        for (const t of teamsData) {
          const reqId = t.requestId ?? t.request?.id;
          if (reqId) {
            try {
              const mRes = await fetch(`/api/workflow/preparation-meeting/by-request/${reqId}`, { credentials: "include" });
              if (mRes.ok) {
                const data = await mRes.json();
                allMeetings.push(...data);
              }
            } catch (e) { /* ignore */ }
          }
        }
        setMeetings(allMeetings);
      }
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  if (!user) return null;

  const receivedMandates = mandates.filter((m: any) => m.status === "SENT_TO_MEMBERS");
  const upcomingMeetings = meetings.filter((m: any) => m.status !== "COMPLETED");
  const pastMeetings = meetings.filter((m: any) => m.status === "COMPLETED");

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Mandatements & Réunions</h1>
            <p className="text-muted-foreground mt-1">Vos mandatements reçus et les réunions de préparation planifiées (Étape 6)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : mandates.length === 0 && meetings.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground py-12">
                <Mail className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>Aucun mandatement ou réunion de préparation pour le moment.</p>
                <p className="text-xs mt-1">Vous serez notifié lorsque le RA vous enverra vos mandatements.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Received Mandates */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-primary" />
                    Mes Mandatements
                    {receivedMandates.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{receivedMandates.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Tâches, missions et objectifs qui vous ont été assignés pour l'évaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  {mandates.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Aucun mandatement reçu.</p>
                  ) : (
                    <div className="space-y-4">
                      {mandates.map((m: any) => {
                        const st = MANDATE_STATUS[m.status] ?? { label: m.status, color: "bg-gray-100 text-gray-700" };
                        return (
                          <div key={m.id} className="border rounded-lg p-4 space-y-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="font-medium text-sm">
                                  Dossier: {m.requestReference || `#${m.requestId}`}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  Rôle: {m.memberRole}
                                </p>
                              </div>
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                                {st.label}
                              </span>
                            </div>

                            {m.status === "SENT_TO_MEMBERS" && (
                              <>
                                {m.tasks && (
                                  <div className="bg-slate-50 rounded-md p-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Tâches assignées</p>
                                    <p className="text-sm whitespace-pre-wrap">{m.tasks}</p>
                                  </div>
                                )}
                                {m.missions && (
                                  <div className="bg-slate-50 rounded-md p-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Missions</p>
                                    <p className="text-sm whitespace-pre-wrap">{m.missions}</p>
                                  </div>
                                )}
                                {m.objectives && (
                                  <div className="bg-slate-50 rounded-md p-3">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Objectifs</p>
                                    <p className="text-sm whitespace-pre-wrap">{m.objectives}</p>
                                  </div>
                                )}
                              </>
                            )}

                            {m.status !== "SENT_TO_MEMBERS" && (
                              <p className="text-xs text-muted-foreground italic">
                                Ce mandatement est en cours de validation. Le contenu sera visible une fois envoyé.
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Upcoming Meetings */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Réunions de Préparation
                    {upcomingMeetings.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{upcomingMeetings.length}</Badge>
                    )}
                  </CardTitle>
                  <CardDescription>Réunions FOR 47 — organisées par le CD pour préparer l'évaluation</CardDescription>
                </CardHeader>
                <CardContent>
                  {meetings.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-6">Aucune réunion de préparation planifiée.</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Upcoming first */}
                      {upcomingMeetings.map((m: any) => {
                        const st = MEETING_STATUS[m.status] ?? { label: m.status, color: "bg-gray-100 text-gray-700" };
                        return (
                          <div key={m.id} className="border rounded-lg p-4 border-primary/30 bg-primary/5">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${st.color}`}>
                                {st.label}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Dossier: {m.requestReferenceNumber || `#${m.requestId}`}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="flex items-center gap-2 text-sm">
                                <Calendar className="w-4 h-4 text-muted-foreground" />
                                <span>{m.meetingDate ? new Date(m.meetingDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : "Non définie"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <Clock className="w-4 h-4 text-muted-foreground" />
                                <span>{m.meetingTime || "Heure non définie"}</span>
                              </div>
                              <div className="flex items-center gap-2 text-sm">
                                <MapPin className="w-4 h-4 text-muted-foreground" />
                                <span>{m.location || "Lieu non défini"}</span>
                              </div>
                            </div>
                            {m.description && (
                              <div className="mt-3 text-sm text-muted-foreground">
                                <p className="text-xs font-semibold uppercase tracking-wide mb-1">Description</p>
                                <p>{m.description}</p>
                              </div>
                            )}
                            {m.agenda && (
                              <div className="mt-2 text-sm text-muted-foreground">
                                <p className="text-xs font-semibold uppercase tracking-wide mb-1">Ordre du jour</p>
                                <p className="whitespace-pre-wrap">{m.agenda}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Past meetings */}
                      {pastMeetings.length > 0 && (
                        <>
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide pt-2">Réunions passées</p>
                          {pastMeetings.map((m: any) => (
                            <div key={m.id} className="border rounded-lg p-4 opacity-60">
                              <div className="flex items-center justify-between mb-2">
                                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">Terminée</span>
                                <span className="text-xs text-muted-foreground">
                                  {m.meetingDate ? new Date(m.meetingDate).toLocaleDateString("fr-FR") : ""} — {m.location || ""}
                                </span>
                              </div>
                              {m.description && <p className="text-sm">{m.description}</p>}
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Dossier Documentation Access hint */}
              <Alert className="border-blue-200 bg-blue-50">
                <FileText className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Vous avez accès à la documentation du dossier à tout moment via le tableau de bord de vos missions.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
