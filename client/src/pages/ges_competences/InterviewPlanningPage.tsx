import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { DatePicker, TimePicker } from "@/components/ui/date-time-picker";
import {
  CalendarDays,
  Clock,
  ChevronLeft,
  ChevronRight,
  Search,
  Eye,
  CalendarCheck,
  CalendarClock,
  CheckCircle,
  Edit3,
  User,
  MapPin,
  FileText,
  ChevronDown,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { exportToCsv, exportToXlsx } from "@/lib/export-utils";

interface Interview {
  id: string;
  registrationId: string;
  fullName: string;
  userType: "EXPERT" | "EVALUATEUR" | "FORMATEUR";
  domaineExpertise: string;
  email: string;
  telephone: string;
  status: string;
  interviewDate: string;
  interviewScheduledAt?: string;
  photoBase64?: string;
}

export default function InterviewPlanningPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [allCandidatures, setAllCandidatures] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"calendar" | "list">("list");

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Reschedule dialog
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [rescheduleInterview, setRescheduleInterview] = useState<Interview | null>(null);
  const [newDateObj, setNewDateObj] = useState<Date | undefined>(undefined);
  const [newTime, setNewTime] = useState("");

  // Day detail dialog (calendar day click)
  const [selectedDayInterviews, setSelectedDayInterviews] = useState<Interview[]>([]);
  const [selectedDayLabel, setSelectedDayLabel] = useState("");
  const [showDayDialog, setShowDayDialog] = useState(false);

  useEffect(() => {
    document.title = "Planning Entretiens - Gestion des Compétences | ALGERAC";
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Auto-expire unconfirmed interviews past 7-day deadline
      await fetch("/api/candidatures/experts/expire-unconfirmed", { method: "POST", credentials: "include" }).catch(() => {});
      
      const [interviewsRes, candidaturesRes] = await Promise.all([
        fetch("/api/candidatures/experts/interviews", { credentials: "include" }),
        fetch("/api/candidatures/experts", { credentials: "include" }),
      ]);

      if (interviewsRes.ok) {
        const data = await interviewsRes.json();
        setInterviews(data);
      }
      if (candidaturesRes.ok) {
        const data = await candidaturesRes.json();
        // Keep ALL candidatures that have/had an interview (interviewDate is set), regardless of current status
        setAllCandidatures(
          data.filter((c: Interview) =>
            ["INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED", "INTERVIEW_COMPLETED"].includes(c.status) ||
            (c.interviewDate && ["CANDIDATURE_APPROVED", "APPROVED", "REJECTED"].includes(c.status))
          )
        );
      }
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible de charger les entretiens", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Merge interviews and candidatures with interview status for a unified list
  const mergedInterviews = useMemo(() => {
    const map = new Map<string, Interview>();
    interviews.forEach((i) => map.set(i.id, i));
    allCandidatures.forEach((c) => {
      if (!map.has(c.id) && c.interviewDate) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [interviews, allCandidatures]);

  const stats = useMemo(() => {
    const scheduled = mergedInterviews.filter((i) => i.status === "INTERVIEW_SCHEDULED").length;
    const confirmed = mergedInterviews.filter((i) => i.status === "INTERVIEW_CONFIRMED").length;
    const completed = mergedInterviews.filter((i) => 
      i.status === "INTERVIEW_COMPLETED" || i.status === "CANDIDATURE_APPROVED" || i.status === "APPROVED" || i.status === "REJECTED"
    ).length;
    const today = mergedInterviews.filter((i) => {
      if (!i.interviewDate) return false;
      const d = new Date(i.interviewDate);
      const now = new Date();
      return d.toDateString() === now.toDateString();
    }).length;
    return { scheduled, confirmed, completed, today, total: mergedInterviews.length };
  }, [mergedInterviews]);

  const filteredInterviews = mergedInterviews
    .filter((i) => {
      const matchesSearch =
        i.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.registrationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.domaineExpertise?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === "all" || 
        i.status === filterStatus ||
        (filterStatus === "INTERVIEW_COMPLETED" && ["INTERVIEW_COMPLETED", "CANDIDATURE_APPROVED", "APPROVED", "REJECTED"].includes(i.status));
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (!a.interviewDate) return 1;
      if (!b.interviewDate) return -1;
      return new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime();
    });

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string; icon: React.ReactNode }> = {
      INTERVIEW_SCHEDULED: {
        class: "bg-blue-50 text-blue-700 border-blue-300",
        label: "Planifié",
        icon: <CalendarClock className="w-3 h-3 mr-1" />,
      },
      INTERVIEW_CONFIRMED: {
        class: "bg-cyan-50 text-cyan-700 border-cyan-300",
        label: "Confirmé",
        icon: <CalendarCheck className="w-3 h-3 mr-1" />,
      },
      INTERVIEW_COMPLETED: {
        class: "bg-teal-50 text-teal-700 border-teal-300",
        label: "Terminé",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      CANDIDATURE_APPROVED: {
        class: "bg-emerald-50 text-emerald-700 border-emerald-300",
        label: "Accepté",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      APPROVED: {
        class: "bg-green-50 text-green-700 border-green-300",
        label: "Compte actif",
        icon: <CheckCircle className="w-3 h-3 mr-1" />,
      },
      REJECTED: {
        class: "bg-slate-50 text-slate-600 border-slate-300",
        label: "Non retenu",
        icon: null,
      },
    };
    const s = map[status] || { class: "", label: status, icon: null };
    return (
      <Badge variant="outline" className={`${s.class} flex items-center w-fit`}>
        {s.icon}
        {s.label}
      </Badge>
    );
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { EXPERT: "Expert", EVALUATEUR: "Évaluateur", FORMATEUR: "Formateur" };
    return labels[type] || type;
  };

  const handleConfirmInterview = async (interview: Interview) => {
    try {
      const response = await fetch(
        `/api/candidatures/experts/${interview.id}/confirm-interview`,
        { method: "POST", credentials: "include" }
      );
      if (response.ok) {
        toast({ title: "Succès", description: "Entretien confirmé" });
        fetchData();
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Erreur", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleInterview || !newDateObj || !newTime) {
      toast({ title: "Erreur", description: "Veuillez renseigner une date et une heure", variant: "destructive" });
      return;
    }
    try {
      const year = newDateObj.getFullYear();
      const month = String(newDateObj.getMonth() + 1).padStart(2, '0');
      const day = String(newDateObj.getDate()).padStart(2, '0');
      const dateTime = `${year}-${month}-${day}T${newTime}:00`;
      const response = await fetch(
        `/api/candidatures/experts/${rescheduleInterview.id}/update-interview-date`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ newDate: dateTime }),
        }
      );
      if (response.ok) {
        toast({ title: "Succès", description: "Date de l'entretien mise à jour" });
        fetchData();
        setShowRescheduleDialog(false);
        setRescheduleInterview(null);
        setNewDateObj(undefined);
        setNewTime("");
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Erreur", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date: Date) => {
    const d = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    return d === 0 ? 6 : d - 1; // Monday-first
  };

  const calendarInterviewsByDate = useMemo(() => {
    const map: Record<string, Interview[]> = {};
    // Only show confirmed+ interviews in the calendar view
    mergedInterviews
      .filter(i => i.status !== "INTERVIEW_SCHEDULED")
      .forEach((i) => {
        if (!i.interviewDate) return;
        const key = new Date(i.interviewDate).toDateString();
        if (!map[key]) map[key] = [];
        map[key].push(i);
      });
    return map;
  }, [mergedInterviews]);

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isToday = (date: Date) => date.toDateString() === new Date().toDateString();

  // Export interviews
  const handleExport = (format: "csv" | "xlsx") => {
    const headers = ["ID", "Nom Complet", "Type", "Domaine", "Email", "Téléphone", "Date Entretien", "Statut"];
    const statusLabels: Record<string, string> = {
      INTERVIEW_SCHEDULED: "Planifié",
      INTERVIEW_CONFIRMED: "Confirmé",
      INTERVIEW_COMPLETED: "Terminé",
    };
    const rows = filteredInterviews.map(i => [
      i.registrationId || "",
      i.fullName || "",
      getTypeLabel(i.userType),
      i.domaineExpertise || "",
      i.email || "",
      i.telephone || "",
      i.interviewDate ? new Date(i.interviewDate).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
      statusLabels[i.status] || i.status,
    ]);
    
    const filename = `entretiens_${new Date().toISOString().slice(0, 10)}`;
    if (format === "xlsx") {
      exportToXlsx(headers, rows, filename);
    } else {
      exportToCsv(headers, rows, filename);
    }
    toast({ title: "Export effectué", description: `${filteredInterviews.length} entretien(s) exporté(s) en ${format.toUpperCase()}` });
  };
  const isPast = (dateStr: string) => new Date(dateStr) < new Date();

  // 7-day deadline helper: returns days remaining for INTERVIEW_SCHEDULED candidates
  const getDeadlineDaysRemaining = (interview: Interview): number | null => {
    if (interview.status !== "INTERVIEW_SCHEDULED") return null;
    const scheduledAt = interview.interviewScheduledAt;
    if (!scheduledAt) return null;
    const deadlineDate = new Date(new Date(scheduledAt).getTime() + 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const msRemaining = deadlineDate.getTime() - now.getTime();
    return Math.ceil(msRemaining / (24 * 60 * 60 * 1000));
  };

  const getDeadlineBadge = (interview: Interview) => {
    const daysLeft = getDeadlineDaysRemaining(interview);
    if (daysLeft === null) return null;
    if (daysLeft <= 0) {
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-xs">Délai expiré</Badge>;
    }
    if (daysLeft <= 2) {
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs">J-{daysLeft}</Badge>;
    }
    if (daysLeft <= 4) {
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-xs">J-{daysLeft}</Badge>;
    }
    return null;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
          {/* Header */}
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-2xl font-bold">Planning des Entretiens</h1>
              <p className="text-muted-foreground mt-1">Vue d'ensemble et gestion des entretiens planifiés</p>
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <FileText className="w-4 h-4 mr-1" />
                    Exporter
                    <ChevronDown className="w-4 h-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleExport("csv")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Exporter en CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                    <FileText className="w-4 h-4 mr-2" />
                    Exporter en XLSX
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                Liste
              </Button>
              <Button
                variant={viewMode === "calendar" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("calendar")}
              >
                <CalendarDays className="w-4 h-4 mr-1" /> Calendrier
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-sm text-muted-foreground">Aujourd'hui</p>
                <p className="text-2xl font-bold text-orange-600">{stats.today}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-sm text-muted-foreground">Planifiés</p>
                <p className="text-2xl font-bold text-blue-600">{stats.scheduled}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-sm text-muted-foreground">Confirmés</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.confirmed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-sm text-muted-foreground">Terminés</p>
                <p className="text-2xl font-bold text-teal-600">{stats.completed}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4 px-4">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher par nom, ID, domaine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="INTERVIEW_SCHEDULED">Planifiés</SelectItem>
                    <SelectItem value="INTERVIEW_CONFIRMED">Confirmés</SelectItem>
                    <SelectItem value="INTERVIEW_COMPLETED">Terminés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Calendar View */}
          {viewMode === "calendar" && (
            <Card className="mb-6">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={prevMonth}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <CardTitle className="text-lg">
                    {currentMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                  </CardTitle>
                  <Button variant="ghost" size="sm" onClick={nextMonth}>
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-7 gap-px bg-slate-200 rounded-lg overflow-hidden">
                  {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((day) => (
                    <div key={day} className="bg-slate-50 p-2 text-center text-xs font-semibold text-slate-500">
                      {day}
                    </div>
                  ))}
                  {Array.from({ length: getFirstDayOfMonth(currentMonth) }).map((_, i) => (
                    <div key={`empty-${i}`} className="bg-white p-2 min-h-[80px]" />
                  ))}
                  {Array.from({ length: getDaysInMonth(currentMonth) }).map((_, i) => {
                    const day = i + 1;
                    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
                    const dateKey = date.toDateString();
                    const dayInterviews = calendarInterviewsByDate[dateKey] || [];
                    const today = isToday(date);

                    return (
                      <div
                        key={day}
                        className={`bg-white p-2 min-h-[80px] border-t cursor-pointer hover:bg-slate-50 transition-colors ${today ? "ring-2 ring-blue-500 ring-inset" : ""}`}
                        onClick={() => {
                          if (dayInterviews.length > 0) {
                            setSelectedDayInterviews(dayInterviews);
                            setSelectedDayLabel(date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }));
                            setShowDayDialog(true);
                          }
                        }}
                      >
                        <span
                          className={`text-sm font-medium ${today ? "text-blue-600 font-bold" : "text-slate-700"}`}
                        >
                          {day}
                        </span>
                        {dayInterviews.length > 0 && (
                          <div className="mt-1 space-y-1">
                            {dayInterviews.slice(0, 3).map((interview) => (
                              <div
                                key={interview.id}
                                className={`text-xs p-1 rounded cursor-pointer truncate ${
                                  interview.status === "INTERVIEW_CONFIRMED"
                                    ? "bg-cyan-100 text-cyan-800 hover:bg-cyan-200"
                                    : interview.status === "INTERVIEW_COMPLETED"
                                      ? "bg-teal-100 text-teal-800 hover:bg-teal-200"
                                      : "bg-blue-100 text-blue-800 hover:bg-blue-200"
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setLocation(`/ges-competences/entretien/${interview.id}`);
                                }}
                              >
                                {new Date(interview.interviewDate).toLocaleTimeString("fr-FR", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}{" "}
                                {interview.fullName?.split(" ")[0]}
                              </div>
                            ))}
                            {dayInterviews.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{dayInterviews.length - 3} autres
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <div className="space-y-3">
              {loading ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">Chargement...</CardContent>
                </Card>
              ) : filteredInterviews.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-muted-foreground">
                    Aucun entretien trouvé
                  </CardContent>
                </Card>
              ) : (
                filteredInterviews.map((interview) => {
                  const past = interview.interviewDate && isPast(interview.interviewDate) && interview.status === "INTERVIEW_SCHEDULED";
                  return (
                    <Card
                      key={interview.id}
                      className={`hover:shadow-md transition-shadow ${past ? "border-l-4 border-l-amber-400" : ""}`}
                    >
                      <CardContent className="py-4 px-5">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                          {/* Avatar / initials */}
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {interview.photoBase64 ? (
                              <img
                                src={`data:image/jpeg;base64,${interview.photoBase64}`}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover border-2 border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                                <User className="w-6 h-6 text-slate-500" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold text-slate-900">{interview.fullName}</h3>
                                <Badge variant="outline" className="text-xs">
                                  {getTypeLabel(interview.userType)}
                                </Badge>
                                {getStatusBadge(interview.status)}
                                {getDeadlineBadge(interview)}
                              </div>
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {interview.domaineExpertise}
                              </p>
                              <div className="flex items-center gap-1 text-sm text-slate-600 mt-1">
                                <Clock className="w-3.5 h-3.5" />
                                <span className={past ? "text-amber-600 font-medium" : ""}>
                                  {formatDate(interview.interviewDate)}
                                </span>
                                {past && <span className="text-xs text-amber-500 ml-1">(passé)</span>}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 shrink-0">
                            {interview.status === "INTERVIEW_SCHEDULED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-cyan-700 border-cyan-300 hover:bg-cyan-50"
                                onClick={() => handleConfirmInterview(interview)}
                              >
                                <CalendarCheck className="w-4 h-4 mr-1" />
                                Confirmer
                              </Button>
                            )}
                            {interview.status !== "INTERVIEW_COMPLETED" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setRescheduleInterview(interview);
                                  setShowRescheduleDialog(true);
                                }}
                              >
                                <Edit3 className="w-4 h-4 mr-1" />
                                Modifier
                              </Button>
                            )}
                            <Button
                              size="sm"
                              onClick={() => setLocation(`/ges-competences/entretien/${interview.id}`)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              {interview.status === "INTERVIEW_COMPLETED" ? "Évaluer" : "Voir détails"}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}
        </main>
      </div>

      {/* Reschedule Dialog */}
      <Dialog open={showRescheduleDialog} onOpenChange={setShowRescheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier la date d'entretien</DialogTitle>
            <DialogDescription>
              {rescheduleInterview && `Candidat(e) : ${rescheduleInterview.fullName}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nouvelle date *</Label>
              <div className="mt-2">
                <DatePicker
                  value={newDateObj}
                  onChange={setNewDateObj}
                  placeholder="Sélectionner une date"
                  minDate={new Date()}
                />
              </div>
            </div>
            <div>
              <Label>Nouvelle heure *</Label>
              <div className="mt-2">
                <TimePicker
                  value={newTime}
                  onChange={setNewTime}
                  placeholder="Sélectionner l'heure"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowRescheduleDialog(false);
                setNewDateObj(undefined);
                setNewTime("");
              }}
            >
              Annuler
            </Button>
            <Button onClick={handleReschedule} disabled={!newDateObj || !newTime}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Day Detail Dialog (calendar day click) */}
      <Dialog open={showDayDialog} onOpenChange={setShowDayDialog}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5" />
              Entretiens du {selectedDayLabel}
            </DialogTitle>
            <DialogDescription>
              {selectedDayInterviews.length} entretien(s) planifié(s) pour cette journée
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {selectedDayInterviews
              .sort((a, b) => new Date(a.interviewDate).getTime() - new Date(b.interviewDate).getTime())
              .map((interview) => (
              <div
                key={interview.id}
                className="p-3 border rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                onClick={() => {
                  setShowDayDialog(false);
                  setLocation(`/ges-competences/entretien/${interview.id}`);
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {interview.photoBase64 ? (
                      <img
                        src={`data:image/jpeg;base64,${interview.photoBase64}`}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{interview.fullName}</p>
                      <p className="text-xs text-muted-foreground">{getTypeLabel(interview.userType)} - {interview.domaineExpertise}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-700">
                      {new Date(interview.interviewDate).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    {getStatusBadge(interview.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
