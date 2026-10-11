import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, ArrowRight } from "lucide-react";

interface PanelInterview {
  id: number;
  fullName: string;
  registrationId: string;
  userType: string;
  domaineExpertise?: string;
  status: string;
  interviewDate: string;
}

const TYPE_LABELS: Record<string, string> = {
  EXPERT: "Expert",
  EVALUATEUR: "Évaluateur",
  FORMATEUR: "Formateur",
};

const MAX_ITEMS = 5;

/**
 * Entretiens de candidats planifiés où l'utilisateur connecté est membre du panel.
 */
export function UpcomingInterviewsCard({ href }: { href: string }) {
  const [interviews, setInterviews] = useState<PanelInterview[]>([]);

  useEffect(() => {
    fetch("/api/candidatures/experts/my-interviews", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : []))
      .then((data: PanelInterview[]) => {
        const now = Date.now();
        setInterviews(
          data
            .filter(
              (i) =>
                ["INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED"].includes(i.status) &&
                i.interviewDate &&
                new Date(i.interviewDate).getTime() >= now
            )
            .sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime())
        );
      })
      .catch(() => setInterviews([]));
  }, []);

  if (interviews.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <CalendarClock className="w-5 h-5 text-blue-600" />
          Entretiens à venir ({interviews.length})
        </CardTitle>
        <Link href={href} className="text-sm text-primary flex items-center gap-1 hover:underline">
          Voir tout <ArrowRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2">
        {interviews.slice(0, MAX_ITEMS).map((i) => (
          <Link key={i.id} href={href}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 rounded-md border p-3 cursor-pointer hover:bg-slate-50">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium">{i.fullName}</span>
                  <Badge variant="outline">{TYPE_LABELS[i.userType] || i.userType}</Badge>
                  <Badge
                    variant="outline"
                    className={
                      i.status === "INTERVIEW_CONFIRMED"
                        ? "bg-cyan-50 text-cyan-700 border-cyan-300"
                        : "bg-blue-50 text-blue-700 border-blue-300"
                    }
                  >
                    {i.status === "INTERVIEW_CONFIRMED" ? "Confirmé" : "Planifié"}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {i.registrationId}
                  {i.domaineExpertise ? ` · ${i.domaineExpertise}` : ""}
                </p>
              </div>
              <p className="text-sm font-medium text-blue-700">
                {new Date(i.interviewDate).toLocaleDateString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
