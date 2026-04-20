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
            ["team_proposed", "team_approved", "evaluation_in_progress", "mandate_meetings", "site_evaluation", "documentary_review_in_progress"].includes(r.status)
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
      team_proposed: { label: "Équipe proposée", className: "bg-blue-100 text-blue-800" },
      team_approved: { label: "Équipe validée", className: "bg-green-100 text-green-800" },
      evaluation_in_progress: { label: "Évaluation en cours", className: "bg-purple-100 text-purple-800" },
      mandate_meetings: { label: "Mandatements", className: "bg-indigo-100 text-indigo-800" },
      site_evaluation: { label: "Évaluation sur site", className: "bg-orange-100 text-orange-800" },
      documentary_review_in_progress: { label: "Revue documentaire", className: "bg-yellow-100 text-yellow-800" },
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
            <h1 className="text-2xl font-bold text-slate-900">Planning des Évaluations</h1>
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
