import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, CalendarDays, Clock, MapPin, User } from "lucide-react";

interface PlanningEvent {
  id: number;
  requestId: number;
  referenceNumber: string;
  oecName: string;
  type: string;
  status: string;
  scheduledDate?: string;
  evaluationPeriodStart?: string;
  evaluationPeriodEnd?: string;
  assignedExperts?: string[];
}

export default function RAPlanningPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<PlanningEvent[]>([]);

  useEffect(() => {
    if (user && !authLoading) {
      loadPlanning();
    }
  }, [user, authLoading]);

  const loadPlanning = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accreditation-requests", { credentials: "include" });
      if (res.ok) {
        const requests = await res.json();
        // Filter requests that are in evaluation or have scheduled dates
        const planned = requests
          .filter((r: any) =>
            r.evaluationStartDate || r.evaluationEndDate || r.scheduledDate ||
            [
              // Constitution équipe
              "team_designation", "team_sent_to_cd", "team_cd_approved", "team_sent_to_oec",
              "team_date_refused", "team_member_recused", "team_recused", "team_recusation_invalid", "team_validated",
              // Revue documentaire
              "doc_review_in_progress", "doc_review_results_submitted", "doc_review_results_sent_to_cd",
              "doc_review_results_sent_to_oec", "awaiting_oec_doc_response", "doc_review_cd_decision", "documentary_review_completed",
              // Préparation évaluation
              "mandates_preparation", "mandates_pending_cd", "mandates_cd_modification", "mandates_sent_to_team",
              "mission_orders_pending", "mission_orders_pending_dt", "mission_orders_pending_dg", "mission_orders_sent",
              "evaluation_plan_preparation", "evaluation_plan_pending_ra", "evaluation_plan_ra_approved",
              "evaluation_plan_pending_cd", "evaluation_plan_validation", "evaluation_planned",
              // Évaluation
              "evaluation_in_progress", "evaluation_opening_meeting", "evaluation_ongoing",
              "evaluation_consensus", "evaluation_closing_meeting", "evaluation_gaps_sent_to_oec",
              "evaluation_oec_review", "evaluation_oec_all_accepted", "evaluation_docs_transmitted", "evaluation_completed",
            ].includes(r.status)
          )
          .map((r: any) => ({
            id: r.id,
            requestId: r.id,
            referenceNumber: r.referenceNumber || `ACC-${r.id}`,
            oecName: r.oec?.nomOrganisme || r.oec?.fullName || "—",
            type: r.type,
            status: r.status,
            scheduledDate: r.scheduledDate,
            evaluationPeriodStart: r.evaluationStartDate,
            evaluationPeriodEnd: r.evaluationEndDate,
          }));
        setEvents(planned);
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      // Constitution équipe
      team_designation: { label: "Désignation équipe", className: "bg-blue-100 text-blue-800" },
      team_sent_to_cd: { label: "Équipe → CD", className: "bg-blue-100 text-blue-800" },
      team_cd_approved: { label: "Équipe validée CD", className: "bg-green-100 text-green-800" },
      team_sent_to_oec: { label: "Équipe → OEC", className: "bg-teal-100 text-teal-800" },
      team_validated: { label: "Équipe validée", className: "bg-green-100 text-green-800" },
      team_date_refused: { label: "Date refusée", className: "bg-red-100 text-red-800" },
      team_member_recused: { label: "Récusation", className: "bg-amber-100 text-amber-800" },
      // Revue documentaire
      doc_review_in_progress: { label: "Revue documentaire", className: "bg-yellow-100 text-yellow-800" },
      doc_review_results_submitted: { label: "Résultats soumis", className: "bg-yellow-100 text-yellow-800" },
      doc_review_results_sent_to_cd: { label: "Résultats → CD", className: "bg-yellow-100 text-yellow-800" },
      doc_review_results_sent_to_oec: { label: "Résultats → OEC", className: "bg-yellow-100 text-yellow-800" },
      awaiting_oec_doc_response: { label: "En attente OEC", className: "bg-amber-100 text-amber-800" },
      documentary_review_completed: { label: "Revue terminée", className: "bg-green-100 text-green-800" },
      // Préparation évaluation
      mandates_preparation: { label: "Mandatements", className: "bg-indigo-100 text-indigo-800" },
      mandates_pending_cd: { label: "Mandatements → CD", className: "bg-indigo-100 text-indigo-800" },
      mandates_sent_to_team: { label: "Mandatements envoyés", className: "bg-indigo-100 text-indigo-800" },
      mission_orders_pending: { label: "Ordres mission", className: "bg-violet-100 text-violet-800" },
      mission_orders_pending_dg: { label: "Ordres → DG", className: "bg-violet-100 text-violet-800" },
      mission_orders_sent: { label: "Ordres signés", className: "bg-violet-100 text-violet-800" },
      evaluation_plan_preparation: { label: "Plan FOR 32", className: "bg-cyan-100 text-cyan-800" },
      evaluation_plan_pending_cd: { label: "Plan → CD", className: "bg-cyan-100 text-cyan-800" },
      evaluation_plan_validation: { label: "Plan validé", className: "bg-cyan-100 text-cyan-800" },
      evaluation_planned: { label: "Évaluation planifiée", className: "bg-emerald-100 text-emerald-800" },
      // Évaluation
      evaluation_in_progress: { label: "Évaluation en cours", className: "bg-purple-100 text-purple-800" },
      evaluation_opening_meeting: { label: "Réunion ouverture", className: "bg-purple-100 text-purple-800" },
      evaluation_ongoing: { label: "Évaluation sur site", className: "bg-orange-100 text-orange-800" },
      evaluation_consensus: { label: "Consensus", className: "bg-purple-100 text-purple-800" },
      evaluation_closing_meeting: { label: "Réunion clôture", className: "bg-purple-100 text-purple-800" },
      evaluation_gaps_sent_to_oec: { label: "Écarts → OEC", className: "bg-amber-100 text-amber-800" },
      evaluation_completed: { label: "Évaluation terminée", className: "bg-green-100 text-green-800" },
    };
    const found = map[status];
    if (found) return <Badge className={found.className}>{found.label}</Badge>;
    return <Badge variant="outline">{status.replace(/_/g, " ")}</Badge>;
  };

  const formatDate = (d?: string) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Planning des Évaluations</h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble des évaluations planifiées et en cours.</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : events.length === 0 ? (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-muted-foreground">
                  <CalendarDays className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Aucune évaluation planifiée pour le moment.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {events.map((event) => (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="font-semibold text-lg">{event.referenceNumber}</h3>
                          {statusBadge(event.status)}
                        </div>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {event.oecName}
                          </span>
                          <span className="capitalize">{event.type}</span>
                        </div>
                      </div>
                      <div className="text-right text-sm space-y-1">
                        {event.evaluationPeriodStart && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            <span>
                              {formatDate(event.evaluationPeriodStart)}
                              {event.evaluationPeriodEnd && ` — ${formatDate(event.evaluationPeriodEnd)}`}
                            </span>
                          </div>
                        )}
                        {event.scheduledDate && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <CalendarDays className="w-4 h-4" />
                            <span>{formatDate(event.scheduledDate)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
