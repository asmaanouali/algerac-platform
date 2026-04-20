import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { StringDatePicker } from "@/components/ui/date-time-picker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Users, UserPlus, Send, CheckCircle, Shield, AlertTriangle, Trash2, Calendar, Search, Filter, CalendarDays, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Expert {
  id: number;
  fullName: string;
  email: string;
  role: string;
  specialite: string;
  experience: string;
  activeDossiers: number;
  unavailableDates: string[];
}

interface TeamMember {
  id: number;
  expert: { id: number; fullName: string; email: string; role?: string };
  role: string;
  specialization: string;
  confidentialityAgreementSigned: boolean;
  impartialityAgreementSigned: boolean;
  conflictOfInterestDeclared: boolean;
  available: boolean;
  recusedByOEC: boolean;
}

const roleLabels: Record<string, string> = {
  REE: "Responsable Equipe Evaluation",
  ET: "Evaluateur Technique",
  EQ: "Evaluateur Qualite",
  EXP: "Expert",
  SUP: "Superviseur",
  OBS: "Observateur",
  EF: "Evaluateur en Formation",
};

const platformRoleToTeamRole: Record<string, string> = {
  REE: "REE",
  ET: "ET",
  EQ: "EQ",
  EXPERT: "EXP",
  EVALUATEUR: "ET",
  FORMATEUR: "EF",
};

export default function TeamCompositionPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState<any[]>([]);
  const [experts, setExperts] = useState<Expert[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddMember, setShowAddMember] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<string>("");
  const [specialization, setSpecialization] = useState("");

  // Filters
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterSpecialite, setFilterSpecialite] = useState("");
  const [filterName, setFilterName] = useState("");
  const [filterAvailability, setFilterAvailability] = useState<string>("all");

  // Calendar popup
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarExpert, setCalendarExpert] = useState<Expert | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Evaluation date
  const [evaluationDate, setEvaluationDate] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [reqRes, expRes] = await Promise.all([
        fetch("/api/requests/assigned-to-me", { credentials: "include" }),
        fetch("/api/workflow/available-experts", { credentials: "include" }),
      ]);
      if (reqRes.ok) {
        const allReqs = await reqRes.json();
        setRequests(allReqs.filter((r: any) =>
          ["QUOTATION_VALIDATED", "QUOTATION_APPROVED_BY_DAG", "QUOTATION_SENT_TO_OEC",
           "TEAM_DESIGNATION", "TEAM_SENT_TO_CD", "TEAM_CD_APPROVED", "TEAM_CD_CHANGES_REQUESTED",
           "TEAM_SENT_TO_OEC", "TEAM_DATE_REFUSED", "TEAM_MEMBER_RECUSED", "TEAM_RECUSED",
           "TEAM_RECUSATION_INVALID",
           "FEASIBILITY_APPROVED", "RECEIVABLE"].includes(r.status)
        ));
      }
      if (expRes.ok) setExperts(await expRes.json());
    } catch (e) { }
    setLoading(false);
  };

  const selectRequest = async (req: any) => {
    setSelectedRequest(req);
    try {
      const res = await fetch(`/api/workflow/teams/by-request/${req.id}`, { credentials: "include" });
      if (res.ok) {
        const teams = await res.json();
        if (teams.length > 0) {
          setTeam(teams[0]);
          const memRes = await fetch(`/api/workflow/teams/${teams[0].id}/members`, { credentials: "include" });
          if (memRes.ok) setMembers(await memRes.json());
        } else {
          setTeam(null);
          setMembers([]);
        }
      }
    } catch (e) { }
  };

  const createTeam = async () => {
    try {
      const res = await apiRequest("POST", "/api/workflow/teams/create", { requestId: selectedRequest.id });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Equipe d'evaluation creee" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const addMember = async () => {
    if (!selectedExpert) return;
    const expert = experts.find(e => e.id === parseInt(selectedExpert));
    if (!expert) return;
    const teamRole = platformRoleToTeamRole[expert.role] || "ET";
    try {
      const res = await apiRequest("POST", `/api/workflow/teams/${team.id}/add-member`, {
        expertId: parseInt(selectedExpert),
        role: teamRole,
        specialization,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: `${expert.fullName} ajoute en tant que ${roleLabels[teamRole] || teamRole}` });
        setShowAddMember(false);
        setSelectedExpert("");
        setSpecialization("");
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const hasMinimumTeam = useMemo(() => {
    const hasREE = members.some(m => m.role === "REE");
    const hasET = members.some(m => m.role === "ET");
    return hasREE && hasET;
  }, [members]);

  const sendToCD = async () => {
    if (!hasMinimumTeam) {
      toast({ title: "Erreur", description: "Equipe doit comprendre min 1 REE et 1 Evaluateur Technique", variant: "destructive" });
      return;
    }
    if (!evaluationDate) {
      toast({ title: "Erreur", description: "Veuillez selectionner une date d'evaluation", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest("POST", `/api/workflow/teams/${team.id}/send-to-cd`, {
        compositionSheet: "Fiche composition equipe FOR 26",
        evaluationDate: evaluationDate,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Fiche de composition et date d'evaluation envoyees au CD pour validation" });
        loadData();
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const changeDate = async () => {
    if (!evaluationDate) {
      toast({ title: "Erreur", description: "Veuillez selectionner une nouvelle date d'evaluation", variant: "destructive" });
      return;
    }
    try {
      const res = await apiRequest("POST", `/api/workflow/teams/${team.id}/change-date`, {
        evaluationDate: evaluationDate,
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Nouvelle date proposee, envoyee au CD pour validation" });
        loadData();
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const removeMember = async (memberId: number) => {
    if (!confirm("Voulez-vous vraiment retirer ce membre ?")) return;
    try {
      const res = await apiRequest("DELETE", `/api/workflow/teams/members/${memberId}`);
      const data = await res.json();
      if (data.success) {
        toast({ title: "Succes", description: "Membre retire de l'equipe" });
        selectRequest(selectedRequest);
      }
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    }
  };

  const filteredExperts = useMemo(() => {
    return experts.filter(exp => {
      if (filterRole !== "all" && exp.role !== filterRole) return false;
      if (filterSpecialite && !exp.specialite?.toLowerCase().includes(filterSpecialite.toLowerCase())) return false;
      if (filterName && !exp.fullName?.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterAvailability === "available" && exp.unavailableDates?.length > 0) return false;
      if (filterAvailability === "unavailable" && (!exp.unavailableDates || exp.unavailableDates.length === 0)) return false;
      return true;
    });
  }, [experts, filterRole, filterSpecialite, filterName, filterAvailability]);

  const uniqueRoles = useMemo(() => Array.from(new Set(experts.map(e => e.role).filter(Boolean))), [experts]);

  const openCalendar = (expert: Expert) => {
    setCalendarExpert(expert);
    setCalendarMonth(new Date());
    setShowCalendar(true);
  };

  const getDaysInMonth = (date: Date) => {
    const y = date.getFullYear();
    const m = date.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    return { firstDay: firstDay === 0 ? 6 : firstDay - 1, daysInMonth };
  };

  const isUnavailable = (date: string) => {
    return calendarExpert?.unavailableDates?.includes(date);
  };

  const renderCalendar = () => {
    const { firstDay, daysInMonth } = getDaysInMonth(calendarMonth);
    const days = [];
    const today = new Date().toISOString().split("T")[0];
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="h-8" />);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const unavail = isUnavailable(dateStr);
      const isToday = dateStr === today;
      days.push(
        <div key={d} className={`h-8 w-8 flex items-center justify-center rounded text-xs font-medium cursor-default ${unavail ? "bg-red-100 text-red-700 border border-red-300" : "bg-green-50 text-green-700"} ${isToday ? "ring-2 ring-primary" : ""}`} title={unavail ? "Indisponible" : "Disponible"}>
          {d}
        </div>
      );
    }
    return days;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-800">Constitution de l'Equipe d'Evaluation</h1>
            <p className="text-muted-foreground mt-1">Designez les membres de l'equipe d'evaluation (Etape 4)</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Dossiers eligibles */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg">Dossiers en attente</CardTitle>
                  <CardDescription>Selectionnez un dossier pour constituer l'equipe</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {requests.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun dossier en attente de constitution d'equipe</p>
                  ) : (
                    requests.map((r) => (
                      <div key={r.id} onClick={() => selectRequest(r)} className={`p-3 rounded-lg border border-gray-200 cursor-pointer transition-all hover:shadow-sm ${selectedRequest?.id === r.id ? "border-primary bg-primary/5 shadow-sm" : "hover:bg-gray-50 hover:border-primary/30"}`}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm">{r.referenceNumber || `Demande #${r.id}`}</p>
                            <p className="text-xs text-muted-foreground">{r.domain}</p>
                            <p className="text-xs text-muted-foreground">{r.oec?.organizationName || r.oec?.fullName}</p>
                          </div>
                          <Badge variant={["TEAM_RECUSED","TEAM_MEMBER_RECUSED","TEAM_DATE_REFUSED","TEAM_CD_CHANGES_REQUESTED"].includes(r.status) ? "destructive" : "secondary"} className="text-xs">
                            {r.status === "TEAM_RECUSED" || r.status === "TEAM_MEMBER_RECUSED" ? "Recusee" 
                             : r.status === "TEAM_DATE_REFUSED" ? "Date refusee"
                             : r.status === "TEAM_CD_CHANGES_REQUESTED" ? "Modif. demandees"
                             : r.status === "TEAM_SENT_TO_CD" ? "En attente CD"
                             : r.status === "TEAM_SENT_TO_OEC" ? "En attente OEC"
                             : r.status === "TEAM_DESIGNATION" ? "En cours" : "A traiter"}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* Composition de l'equipe */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-lg">Composition de l'Equipe</CardTitle>
                      <CardDescription>
                        {selectedRequest ? `Dossier: ${selectedRequest.referenceNumber || selectedRequest.id}` : "Selectionnez un dossier"}
                      </CardDescription>
                    </div>
                    {selectedRequest && !team && (
                      <Button onClick={createTeam}><Users className="w-4 h-4 mr-2" />Creer l'Equipe</Button>
                    )}
                    {team && team.status === "DRAFT" && (
                      <Button variant="outline" onClick={() => setShowAddMember(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />Ajouter
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!selectedRequest ? (
                    <p className="text-center text-muted-foreground py-8">Selectionnez un dossier dans la liste a gauche</p>
                  ) : !team ? (
                    <p className="text-center text-muted-foreground py-8">Creez une equipe d'evaluation pour ce dossier</p>
                  ) : members.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Aucun membre. Ajoutez des evaluateurs.</p>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Membre</TableHead>
                            <TableHead>Role equipe</TableHead>
                            <TableHead>Engagements</TableHead>
                            <TableHead>Statut</TableHead>
                            {team.status === "DRAFT" && <TableHead>Actions</TableHead>}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {members.map((m) => (
                            <TableRow key={m.id}>
                              <TableCell>
                                <div>
                                  <p className="font-medium">{m.expert?.fullName}</p>
                                  <p className="text-xs text-muted-foreground">{m.expert?.email}</p>
                                </div>
                              </TableCell>
                              <TableCell><Badge variant="outline">{roleLabels[m.role] || m.role}</Badge></TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {m.confidentialityAgreementSigned ? <CheckCircle className="w-4 h-4 text-green-500" aria-label="Confidentialite signe" /> : <Shield className="w-4 h-4 text-gray-300" aria-label="Confidentialite non signe" />}
                                  {m.impartialityAgreementSigned ? <CheckCircle className="w-4 h-4 text-green-500" aria-label="Impartialite signe" /> : <Shield className="w-4 h-4 text-gray-300" aria-label="Impartialite non signe" />}
                                  {m.conflictOfInterestDeclared && <AlertTriangle className="w-4 h-4 text-amber-500" aria-label="Conflit d'interet" />}
                                </div>
                              </TableCell>
                              <TableCell>
                                {m.recusedByOEC ? <Badge variant="destructive">Recuse</Badge> : m.confidentialityAgreementSigned && m.impartialityAgreementSigned ? <Badge className="bg-green-100 text-green-800">Confirme</Badge> : <Badge variant="secondary">En attente signature</Badge>}
                              </TableCell>
                              {team.status === "DRAFT" && (
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => removeMember(m.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Validation checks */}
                      <div className="mt-4 space-y-2">
                        <div className={`p-3 rounded-lg flex items-center gap-2 ${hasMinimumTeam ? "bg-green-50 border border-green-200" : "bg-red-50 border border-red-200"}`}>
                          {hasMinimumTeam ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />}
                          <p className={`text-sm font-medium ${hasMinimumTeam ? "text-green-800" : "text-red-800"}`}>
                            {hasMinimumTeam ? "L'equipe comprend min 1 REE et 1 ET" : `Il manque : ${!members.some(m => m.role === "REE") ? "1 REE" : ""}${!members.some(m => m.role === "REE") && !members.some(m => m.role === "ET") ? " et " : ""}${!members.some(m => m.role === "ET") ? "1 ET" : ""}`}
                          </p>
                        </div>
                        {members.some(m => !m.confidentialityAgreementSigned || !m.impartialityAgreementSigned) && (
                          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                            <p className="text-sm font-medium text-amber-800">Tous les membres doivent signer leurs engagements avant envoi a l'OEC.</p>
                          </div>
                        )}
                      </div>

                      {/* Evaluation date + Send to CD */}
                      {team.status === "DRAFT" && hasMinimumTeam && (
                        <div className="mt-6 space-y-4">
                          <div className="space-y-2">
                            <Label className="font-medium">Date d'evaluation proposee *</Label>
                            <StringDatePicker value={evaluationDate} onChange={(v) => setEvaluationDate(v)} min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} />
                            <p className="text-xs text-muted-foreground">Le CD validera puis enverra a l'OEC</p>
                          </div>
                          <Button className="w-full" size="lg" onClick={sendToCD} disabled={!members.every(m => m.confidentialityAgreementSigned && m.impartialityAgreementSigned) || !evaluationDate}>
                            <Send className="w-4 h-4 mr-2" />Envoyer la composition et la date au CD pour validation
                          </Button>
                        </div>
                      )}

                      {/* Status messages */}
                      {team.status === "SENT_TO_CD" && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm font-medium text-blue-800">En attente de validation par le CD. Le CD approuvera la composition et l'enverra a l'OEC.</p>
                        </div>
                      )}

                      {team.status === "CD_CHANGES_REQUESTED" && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm font-medium text-amber-800">Le CD a demande des modifications. Veuillez corriger et renvoyer.</p>
                          {team.recusationDecisionReason && <p className="text-sm text-amber-700 mt-1">Commentaires : {team.recusationDecisionReason}</p>}
                        </div>
                      )}

                      {/* Date refused by OEC - RA must propose new date */}
                      {(team.status === "DATE_REFUSED" || selectedRequest?.status === "TEAM_DATE_REFUSED") && (
                        <div className="mt-6 space-y-4">
                          <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                            <p className="text-sm font-medium text-red-800">L'OEC a refuse la date d'evaluation proposee.</p>
                            {team.dateRefusalReason && <p className="text-sm text-red-700 mt-1">Motif : {team.dateRefusalReason}</p>}
                            {team.oecProposedDate && <p className="text-sm text-red-700 mt-1">Date suggeree par l'OEC : {new Date(team.oecProposedDate).toLocaleDateString("fr-FR")}</p>}
                          </div>
                          <div className="space-y-2">
                            <Label className="font-medium">Nouvelle date d'evaluation proposee *</Label>
                            <StringDatePicker value={evaluationDate} onChange={(v) => setEvaluationDate(v)} min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]} />
                          </div>
                          <Button className="w-full" size="lg" onClick={changeDate} disabled={!evaluationDate}>
                            <Send className="w-4 h-4 mr-2" />Proposer la nouvelle date (envoi au CD pour validation)
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Liste evaluateurs avec filtres */}
              <Card className="lg:col-span-3">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2"><Users className="w-5 h-5" />Evaluateurs Disponibles</CardTitle>
                      <CardDescription>Filtrez et consultez les disponibilites des evaluateurs</CardDescription>
                    </div>
                    <Badge variant="outline">{filteredExperts.length} / {experts.length} evaluateurs</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="mb-4 p-4 bg-muted/50 rounded-lg border space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                      <Filter className="w-4 h-4" /> Filtres
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Recherche par nom</Label>
                        <div className="relative">
                          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input placeholder="Nom..." value={filterName} onChange={(e) => setFilterName(e.target.value)} className="pl-8 h-9" />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Role</Label>
                        <Select value={filterRole} onValueChange={setFilterRole}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous les roles</SelectItem>
                            {uniqueRoles.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Specialite</Label>
                        <Input placeholder="ISO, metrologie..." value={filterSpecialite} onChange={(e) => setFilterSpecialite(e.target.value)} className="h-9" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Disponibilite</Label>
                        <Select value={filterAvailability} onValueChange={setFilterAvailability}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Tous</SelectItem>
                            <SelectItem value="available">Disponibles uniquement</SelectItem>
                            <SelectItem value="unavailable">Avec indisponibilites</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    {(filterName || filterRole !== "all" || filterSpecialite || filterAvailability !== "all") && (
                      <Button variant="ghost" size="sm" onClick={() => { setFilterName(""); setFilterRole("all"); setFilterSpecialite(""); setFilterAvailability("all"); }}>
                        <X className="w-3 h-3 mr-1" /> Reinitialiser les filtres
                      </Button>
                    )}
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Evaluateur</TableHead>
                        <TableHead>Role</TableHead>
                        <TableHead>Specialite</TableHead>
                        <TableHead>Experience</TableHead>
                        <TableHead>Dossiers actifs</TableHead>
                        <TableHead>Disponibilites</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredExperts.length === 0 ? (
                        <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun evaluateur ne correspond aux filtres</TableCell></TableRow>
                      ) : (
                        filteredExperts.map((exp) => (
                          <TableRow key={exp.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{exp.fullName}</p>
                                <p className="text-xs text-muted-foreground">{exp.email}</p>
                              </div>
                            </TableCell>
                            <TableCell><Badge variant="outline" className="text-xs">{exp.role || "---"}</Badge></TableCell>
                            <TableCell className="text-sm">{exp.specialite || "---"}</TableCell>
                            <TableCell className="text-sm">{exp.experience || "---"}</TableCell>
                            <TableCell>
                              <Badge variant={exp.activeDossiers > 3 ? "destructive" : "secondary"}>{exp.activeDossiers} dossier(s)</Badge>
                            </TableCell>
                            <TableCell>
                              <Button variant="outline" size="sm" onClick={() => openCalendar(exp)}>
                                <CalendarDays className="w-3 h-3 mr-1" />Planning
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Dialog Ajouter Membre */}
          <Dialog open={showAddMember} onOpenChange={setShowAddMember}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Ajouter un Membre a l'Equipe</DialogTitle>
                <DialogDescription>Le role dans l'equipe est determine par le role dans la plateforme</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Evaluateur</Label>
                  <Select value={selectedExpert} onValueChange={setSelectedExpert}>
                    <SelectTrigger><SelectValue placeholder="Choisir un evaluateur" /></SelectTrigger>
                    <SelectContent>
                      {experts.map((exp) => (
                        <SelectItem key={exp.id} value={String(exp.id)}>
                          {exp.fullName} [{exp.role}] --- {exp.specialite || "Generaliste"} ({exp.activeDossiers} dossiers)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {selectedExpert && (() => {
                  const exp = experts.find(e => e.id === parseInt(selectedExpert));
                  if (!exp) return null;
                  const assignedRole = platformRoleToTeamRole[exp.role] || "ET";
                  return (
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm"><strong>{exp.fullName}</strong> sera ajoute en tant que <Badge variant="outline" className="ml-1">{roleLabels[assignedRole] || assignedRole}</Badge></p>
                      <p className="text-xs text-muted-foreground mt-1">Role determine par son role plateforme : {exp.role}</p>
                      {exp.unavailableDates?.length > 0 && (
                        <p className="text-xs text-amber-700 mt-1">{exp.unavailableDates.length} jour(s) d'indisponibilite</p>
                      )}
                    </div>
                  );
                })()}
                <div>
                  <Label>Specialisation (optionnel)</Label>
                  <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} placeholder="Ex: ISO 17025, Metrologie..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddMember(false)}>Annuler</Button>
                <Button onClick={addMember} disabled={!selectedExpert}>Ajouter</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Calendar popup disponibilites */}
          <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
            <DialogContent className="sm:max-w-[480px]">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" /> Disponibilites de {calendarExpert?.fullName}
                </DialogTitle>
                <DialogDescription>{calendarExpert?.role} --- {calendarExpert?.specialite || "Generaliste"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>Prev</Button>
                  <p className="font-medium">{calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</p>
                  <Button variant="outline" size="sm" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>Suiv</Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map(d => (
                    <div key={d} className="text-xs font-medium text-muted-foreground h-6 flex items-center justify-center">{d}</div>
                  ))}
                  {renderCalendar()}
                </div>
                <div className="flex items-center gap-4 text-xs pt-2 border-t">
                  <div className="flex items-center gap-1"><div className="w-4 h-4 bg-green-50 border border-green-300 rounded" /><span>Disponible</span></div>
                  <div className="flex items-center gap-1"><div className="w-4 h-4 bg-red-100 border border-red-300 rounded" /><span>Indisponible</span></div>
                </div>
                {calendarExpert?.unavailableDates && calendarExpert.unavailableDates.length > 0 && (
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 mb-1">Dates d'indisponibilite :</p>
                    <div className="flex flex-wrap gap-1">
                      {calendarExpert.unavailableDates.slice(0, 20).map(d => (
                        <Badge key={d} variant="outline" className="text-xs bg-red-50 text-red-700 border-red-200">
                          {new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}
                        </Badge>
                      ))}
                      {calendarExpert.unavailableDates.length > 20 && (
                        <Badge variant="outline" className="text-xs">+{calendarExpert.unavailableDates.length - 20} autres</Badge>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
