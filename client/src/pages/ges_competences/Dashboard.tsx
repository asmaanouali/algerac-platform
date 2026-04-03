import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Users, FileCheck, Clock, UserCheck, CalendarDays, 
  ClipboardCheck, TrendingUp, ArrowRight, Eye, Calendar,
  UserPlus, BarChart3, Activity, AlertTriangle
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Navbar } from "@/components/navbar";
import { Link } from "wouter";

interface Candidature {
  id: string;
  registrationId: string;
  fullName: string;
  userType: "EXPERT" | "EVALUATEUR" | "FORMATEUR";
  domaineExpertise: string;
  email: string;
  status: string;
  dateInscription: string;
  interviewDate?: string;
  interviewScheduledAt?: string;
  createdAt?: string;
}

export default function GesCompetencesDashboard() {
  const { user } = useAuth();
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [interviews, setInterviews] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Tableau de Bord - Gestion des Compétences | ALGERAC";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Auto-expire unconfirmed interviews past 7-day deadline
      await fetch("/api/candidatures/experts/expire-unconfirmed", { method: "POST", credentials: "include" }).catch(() => {});
      
      const [candRes, interviewRes] = await Promise.all([
        fetch("/api/candidatures/experts", { credentials: "include" }),
        fetch("/api/candidatures/experts/interviews", { credentials: "include" })
      ]);
      
      if (candRes.ok) {
        const data = await candRes.json();
        setCandidatures(data);
      }
      if (interviewRes.ok) {
        const data = await interviewRes.json();
        setInterviews(data);
      }
    } catch (error) {
      console.error("Erreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = candidatures.filter(c => c.status === "PENDING" || c.status === "PROFILE_PRESELECTED" || c.status === "DOCUMENTS_SUBMITTED").length;
    const interviewScheduled = candidatures.filter(c => c.status === "INTERVIEW_SCHEDULED").length;
    const interviewConfirmed = candidatures.filter(c => c.status === "INTERVIEW_CONFIRMED").length;
    const interviewCompleted = candidatures.filter(c => c.status === "INTERVIEW_COMPLETED").length;
    const approved = candidatures.filter(c => c.status === "CANDIDATURE_APPROVED").length;
    const active = candidatures.filter(c => c.status === "APPROVED").length;
    const rejected = candidatures.filter(c => c.status === "REJECTED").length;
    const total = candidatures.length;
    
    return { pending, interviewScheduled, interviewConfirmed, interviewCompleted, approved, active, rejected, total };
  }, [candidatures]);

  const upcomingInterviews = useMemo(() => {
    const now = new Date();
    return interviews
      .filter(i => i.interviewDate && new Date(i.interviewDate) >= now && i.status === "INTERVIEW_CONFIRMED")
      .sort((a, b) => new Date(a.interviewDate!).getTime() - new Date(b.interviewDate!).getTime())
      .slice(0, 5);
  }, [interviews]);

  const recentCandidatures = useMemo(() => {
    return candidatures
      .filter(c => c.status === "PENDING" || c.status === "PROFILE_PRESELECTED" || c.status === "DOCUMENTS_SUBMITTED")
      .sort((a, b) => new Date(b.createdAt || b.dateInscription || "").getTime() - new Date(a.createdAt || a.dateInscription || "").getTime())
      .slice(0, 5);
  }, [candidatures]);

  const todayInterviews = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return interviews.filter(i => {
      if (!i.interviewDate) return false;
      if (i.status !== "INTERVIEW_CONFIRMED") return false;
      const d = new Date(i.interviewDate);
      return d >= today && d < tomorrow;
    });
  }, [interviews]);

  // Actions requises: pending confirmations + approaching deadline
  const actionsRequises = useMemo(() => {
    const pendingConfirmation = candidatures.filter(c => c.status === "INTERVIEW_SCHEDULED");
    const now = new Date();
    
    const withDeadline = pendingConfirmation.map(c => {
      const scheduledAt = c.interviewScheduledAt ? new Date(c.interviewScheduledAt) : null;
      const daysLeft = scheduledAt 
        ? Math.ceil((scheduledAt.getTime() + 7 * 24 * 60 * 60 * 1000 - now.getTime()) / (24 * 60 * 60 * 1000))
        : null;
      return { ...c, daysLeft };
    }).sort((a, b) => (a.daysLeft ?? 99) - (b.daysLeft ?? 99));
    
    return withDeadline;
  }, [candidatures]);

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      EXPERT: "bg-blue-100 text-blue-800 border-blue-200",
      EVALUATEUR: "bg-purple-100 text-purple-800 border-purple-200",
      FORMATEUR: "bg-indigo-100 text-indigo-800 border-indigo-200",
    };
    const labels: Record<string, string> = {
      EXPERT: "Expert",
      EVALUATEUR: "Évaluateur",
      FORMATEUR: "Formateur",
    };
    return <Badge variant="outline" className={colors[type]}>{labels[type] || type}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      PENDING: { class: "bg-amber-50 text-amber-700 border-amber-300", label: "En attente" },
      INTERVIEW_SCHEDULED: { class: "bg-blue-50 text-blue-700 border-blue-300", label: "Entretien planifié" },
      INTERVIEW_CONFIRMED: { class: "bg-cyan-50 text-cyan-700 border-cyan-300", label: "Entretien confirmé" },
      INTERVIEW_COMPLETED: { class: "bg-teal-50 text-teal-700 border-teal-300", label: "Entretien terminé" },
      CANDIDATURE_APPROVED: { class: "bg-emerald-50 text-emerald-700 border-emerald-300", label: "Acceptée" },
      APPROVED: { class: "bg-green-50 text-green-700 border-green-300", label: "Compte actif" },
      REJECTED: { class: "bg-slate-50 text-slate-600 border-slate-300", label: "Non retenue" },
    };
    const s = map[status] || { class: "", label: status };
    return <Badge variant="outline" className={s.class}>{s.label}</Badge>;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", { 
      day: "numeric", month: "short", year: "numeric" 
    });
  };

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleDateString("fr-FR", { 
      weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" 
    });
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
          
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
              <p className="text-muted-foreground mt-1">
                Bienvenue, {user?.fullName || "Gestionnaire"}. Vue d'ensemble des candidatures et entretiens.
              </p>
            </div>
            <div className="flex gap-2">
              <Link href="/ges-competences/candidatures">
                <Button variant="outline" className="gap-2">
                  <UserPlus className="w-4 h-4" />
                  Candidatures
                </Button>
              </Link>
              <Link href="/ges-competences/entretiens">
                <Button className="gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Planning Entretiens
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-amber-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dossiers en attente</p>
                    <p className="text-3xl font-bold text-amber-600 mt-1">{stats.pending}</p>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-blue-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Entretiens à venir</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{stats.interviewScheduled + stats.interviewConfirmed}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <CalendarDays className="w-6 h-6 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-emerald-500">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Candidats acceptés</p>
                    <p className="text-3xl font-bold text-emerald-600 mt-1">{stats.approved + stats.active}</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <UserCheck className="w-6 h-6 text-emerald-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-l-4 border-l-slate-400">
              <CardContent className="pt-5 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Total candidatures</p>
                    <p className="text-3xl font-bold text-slate-700 mt-1">{stats.total}</p>
                  </div>
                  <div className="p-3 bg-slate-100 rounded-xl">
                    <Users className="w-6 h-6 text-slate-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>


          <div className="grid lg:grid-cols-2 gap-6">
            {/* Actions Requises - Pending Confirmations */}
            {actionsRequises.length > 0 && (
              <Card className="lg:col-span-2 border-amber-200 bg-amber-50/30">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        Actions Requises
                      </CardTitle>
                      <CardDescription>
                        {actionsRequises.length} entretien(s) en attente de confirmation
                      </CardDescription>
                    </div>
                    <Link href="/ges-competences/entretiens">
                      <Button variant="ghost" size="sm" className="gap-1">
                        Gérer <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {actionsRequises.slice(0, 5).map(action => (
                      <div key={action.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            action.daysLeft !== null && action.daysLeft <= 2 
                              ? "bg-red-100" 
                              : action.daysLeft !== null && action.daysLeft <= 4 
                                ? "bg-orange-100" 
                                : "bg-amber-100"
                          }`}>
                            <Clock className={`w-5 h-5 ${
                              action.daysLeft !== null && action.daysLeft <= 2 
                                ? "text-red-600" 
                                : action.daysLeft !== null && action.daysLeft <= 4 
                                  ? "text-orange-600" 
                                  : "text-amber-600"
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{action.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {action.domaineExpertise}
                              {action.interviewDate && ` · Entretien le ${formatDateTime(action.interviewDate)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {action.daysLeft !== null && action.daysLeft <= 0 ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Délai expiré</Badge>
                          ) : action.daysLeft !== null && action.daysLeft <= 2 ? (
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">J-{action.daysLeft}</Badge>
                          ) : action.daysLeft !== null && action.daysLeft <= 4 ? (
                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300">J-{action.daysLeft}</Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300">En attente</Badge>
                          )}
                          {getTypeBadge(action.userType)}
                        </div>
                      </div>
                    ))}
                    {actionsRequises.length > 5 && (
                      <p className="text-xs text-center text-muted-foreground mt-2">
                        +{actionsRequises.length - 5} autre(s) en attente
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Today's Interviews */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <CalendarDays className="w-5 h-5 text-blue-600" />
                      Entretiens du Jour
                    </CardTitle>
                    <CardDescription>
                      {todayInterviews.length === 0 
                        ? "Aucun entretien confirmé aujourd'hui" 
                        : `${todayInterviews.length} entretien(s) confirmé(s)`}
                    </CardDescription>
                  </div>
                  <Link href="/ges-competences/entretiens">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Voir tout <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {todayInterviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarDays className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun entretien confirmé aujourd'hui</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {todayInterviews.map(interview => (
                      <div key={interview.id} className="flex items-center justify-between p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-semibold text-sm">
                              {interview.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{interview.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {interview.interviewDate && new Date(interview.interviewDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              {" · "}
                              {interview.domaineExpertise}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getTypeBadge(interview.userType)}
                          <Link href="/ges-competences/entretiens">
                            <Button variant="outline" size="sm" className="h-8">
                              <Eye className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Interviews */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-cyan-600" />
                      Prochains Entretiens
                    </CardTitle>
                    <CardDescription>Les 5 prochains entretiens confirmés</CardDescription>
                  </div>
                  <Link href="/ges-competences/entretiens">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Planning <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingInterviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun entretien à venir</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {upcomingInterviews.map(interview => (
                      <Link key={interview.id} href="/ges-competences/entretiens">
                        <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center">
                              <span className="text-slate-700 font-semibold text-sm">
                                {interview.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium text-sm">{interview.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {interview.interviewDate && formatDateTime(interview.interviewDate)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {getStatusBadge(interview.status)}
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recent Candidatures */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-amber-600" />
                      Nouvelles Candidatures
                    </CardTitle>
                    <CardDescription>Candidatures en attente d'examen</CardDescription>
                  </div>
                  <Link href="/ges-competences/candidatures">
                    <Button variant="ghost" size="sm" className="gap-1">
                      Toutes les candidatures <ArrowRight className="w-3 h-3" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                {recentCandidatures.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune candidature en attente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentCandidatures.map(cand => (
                      <div key={cand.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-slate-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-amber-50 rounded-full flex items-center justify-center">
                            <span className="text-amber-700 font-semibold text-sm">
                              {cand.fullName?.split(" ").map(n => n[0]).join("").slice(0, 2)}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-sm">{cand.fullName}</p>
                            <p className="text-xs text-muted-foreground">
                              {cand.registrationId} · {cand.domaineExpertise} · {formatDate(cand.createdAt || cand.dateInscription || "")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getTypeBadge(cand.userType)}
                          <Link href="/ges-competences/candidatures">
                            <Button variant="outline" size="sm" className="gap-1 h-8">
                              <Eye className="w-3 h-3" /> Examiner
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-muted-foreground">Experts</span>
                  </div>
                  <p className="text-2xl font-bold">{candidatures.filter(c => c.userType === "EXPERT").length}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium text-muted-foreground">Évaluateurs</span>
                  </div>
                  <p className="text-2xl font-bold">{candidatures.filter(c => c.userType === "EVALUATEUR").length}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <BarChart3 className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-muted-foreground">Formateurs</span>
                  </div>
                  <p className="text-2xl font-bold">{candidatures.filter(c => c.userType === "FORMATEUR").length}</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-muted-foreground">Taux d'acceptation</span>
                  </div>
                  <p className="text-2xl font-bold">
                    {stats.total > 0 
                      ? Math.round(((stats.approved + stats.active) / stats.total) * 100)
                      : 0}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
