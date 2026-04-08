import { useState, useEffect, useMemo } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, FileText, Download, Clock, UserCheck, UserX, Users, CalendarDays, CalendarPlus, XCircle, ShieldBan, ShieldCheck, ChevronDown, RotateCcw, Star } from "lucide-react";
import { DatePicker, TimePicker } from "@/components/ui/date-time-picker";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { exportToXlsx } from "@/lib/export-utils";

const WILAYAS = [
  "01 - Adrar", "02 - Chlef", "03 - Laghouat", "04 - Oum El Bouaghi", "05 - Batna",
  "06 - Béjaïa", "07 - Biskra", "08 - Béchar", "09 - Blida", "10 - Bouira",
  "11 - Tamanrasset", "12 - Tébessa", "13 - Tlemcen", "14 - Tiaret", "15 - Tizi Ouzou",
  "16 - Alger", "17 - Djelfa", "18 - Jijel", "19 - Sétif", "20 - Saïda",
  "21 - Skikda", "22 - Sidi Bel Abbès", "23 - Annaba", "24 - Guelma", "25 - Constantine",
  "26 - Médéa", "27 - Mostaganem", "28 - M'Sila", "29 - Mascara", "30 - Ouargla",
  "31 - Oran", "32 - El Bayadh", "33 - Illizi", "34 - Bordj Bou Arréridj", "35 - Boumerdès",
  "36 - El Tarf", "37 - Tindouf", "38 - Tissemsilt", "39 - El Oued", "40 - Khenchela",
  "41 - Souk Ahras", "42 - Tipaza", "43 - Mila", "44 - Aïn Defla", "45 - Naâma",
  "46 - Aïn Témouchent", "47 - Ghardaïa", "48 - Relizane",
  "49 - El M'Ghair", "50 - El Meniaa", "51 - Ouled Djellal", "52 - Bordj Badji Mokhtar",
  "53 - Béni Abbès", "54 - Timimoun", "55 - Touggourt", "56 - Djanet", "57 - In Salah", "58 - In Guezzam"
];

interface Candidature {
  id: string;
  registrationId: string;
  fullName: string;
  userType: "EXPERT" | "EVALUATEUR" | "FORMATEUR";
  domaineExpertise: string;
  email: string;
  telephone: string;
  telephoneMobile?: string;
  dateInscription: string;
  status: "PENDING" | "PROFILE_PRESELECTED" | "DOCUMENTS_SUBMITTED" | "INTERVIEW_SCHEDULED" | "INTERVIEW_CONFIRMED" | "INTERVIEW_COMPLETED" | "CANDIDATURE_APPROVED" | "APPROVED" | "REJECTED";
  photoBase64?: string;
  dateNaissance?: string;
  nationalite?: string;
  adresseDomicile?: string;
  wilaya?: string;
  sousDomaineExpertise?: string;
  rejectionReason?: string;
  documentsJson?: string;
  interviewDate?: string;
  interviewNotes?: string;
  interviewChecklistJson?: string;
  interviewDecision?: string;
  interviewScheduledAt?: string;
  createdAt?: string;
  rejectionType?: string;
  blacklisted?: boolean;
  blacklistReason?: string;
  blacklistedAt?: string;
  starred?: boolean;
  interviewPanelCdId?: number;
  interviewPanelRaId?: number;
}

export default function GesCompetencesCandidaturesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interview scheduling dialog
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [interviewDateObj, setInterviewDateObj] = useState<Date | undefined>(undefined);
  const [interviewTime, setInterviewTime] = useState("");
  const [schedulingCandidature, setSchedulingCandidature] = useState<Candidature | null>(null);
  
  // Panel member selection for interview
  const [availableCDs, setAvailableCDs] = useState<Array<{id: number; fullName: string; email: string}>>([]);
  const [availableRAs, setAvailableRAs] = useState<Array<{id: number; fullName: string; email: string}>>([]);
  const [selectedPanelCdId, setSelectedPanelCdId] = useState<string>("");
  const [selectedPanelRaId, setSelectedPanelRaId] = useState<string>("");
  
  // Reject dialog
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [starOnReject, setStarOnReject] = useState(false);
  
  // Blacklist dialog
  const [showBlacklistDialog, setShowBlacklistDialog] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [blacklistingCandidature, setBlacklistingCandidature] = useState<Candidature | null>(null);
  
  // Rejection type filter
  const [filterRejectionType, setFilterRejectionType] = useState<string>("all");
  const [filterWilaya, setFilterWilaya] = useState<string>("all");

  useEffect(() => {
    document.title = "Candidatures - Gestion des Compétences | ALGERAC";
    fetchCandidatures();
    fetchPanelMembers();
  }, []);

  const fetchCandidatures = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/candidatures/experts", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setCandidatures(data);
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les candidatures", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPanelMembers = async () => {
    try {
      const response = await fetch("/api/candidatures/experts/panel-members", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setAvailableCDs(data.chefsDepartement || []);
        setAvailableRAs(data.responsablesAccreditation || []);
      }
    } catch (error) {
      console.error("Erreur chargement panel:", error);
    }
  };

  const stats = useMemo(() => {
    const pending = candidatures.filter(c => c.status === "PENDING" || c.status === "PROFILE_PRESELECTED" || c.status === "DOCUMENTS_SUBMITTED").length;
    const interviewing = candidatures.filter(c => ["INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED", "INTERVIEW_COMPLETED"].includes(c.status)).length;
    const approved = candidatures.filter(c => c.status === "CANDIDATURE_APPROVED" || c.status === "APPROVED").length;
    const rejected = candidatures.filter(c => c.status === "REJECTED").length;
    return { pending, interviewing, approved, rejected, total: candidatures.length };
  }, [candidatures]);

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      PENDING: { class: "bg-amber-50 text-amber-700 border-amber-300", label: "En attente" },
      PROFILE_PRESELECTED: { class: "bg-orange-50 text-orange-700 border-orange-300", label: "Présélectionné (FOR28)" },
      DOCUMENTS_SUBMITTED: { class: "bg-indigo-50 text-indigo-700 border-indigo-300", label: "Documents reçus" },
      INTERVIEW_SCHEDULED: { class: "bg-blue-50 text-blue-700 border-blue-300", label: "Entretien planifié" },
      INTERVIEW_CONFIRMED: { class: "bg-cyan-50 text-cyan-700 border-cyan-300", label: "Entretien confirmé" },
      INTERVIEW_COMPLETED: { class: "bg-teal-50 text-teal-700 border-teal-300", label: "Entretien terminé" },
      CANDIDATURE_APPROVED: { class: "bg-emerald-50 text-emerald-700 border-emerald-300", label: "Acceptée (compte en attente)" },
      APPROVED: { class: "bg-green-50 text-green-700 border-green-300", label: "Compte actif" },
      REJECTED: { class: "bg-slate-50 text-slate-600 border-slate-300", label: "Non retenue" },
    };
    const s = map[status] || { class: "", label: status };
    return <Badge variant="outline" className={s.class}>{s.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      EXPERT: "bg-blue-100 text-blue-800",
      EVALUATEUR: "bg-purple-100 text-purple-800",
      FORMATEUR: "bg-indigo-100 text-indigo-800",
    };
    const labels: Record<string, string> = { EXPERT: "Expert", EVALUATEUR: "Évaluateur", FORMATEUR: "Formateur" };
    return <Badge className={colors[type]}>{labels[type] || type}</Badge>;
  };

  const filteredCandidatures = candidatures.filter(c => {
    const matchesSearch = 
      c.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.domaineExpertise?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesType = filterType === "all" || c.userType === filterType;
    const matchesWilaya = filterWilaya === "all" || c.wilaya === filterWilaya;
    
    // Rejection type filter (only applies when viewing REJECTED status)
    const matchesRejectionType = filterRejectionType === "all" || 
      c.status !== "REJECTED" || 
      (filterRejectionType === "dossier" && c.rejectionType === "dossier") ||
      (filterRejectionType === "interview" && c.rejectionType === "interview") ||
      (filterRejectionType === "blacklisted" && c.blacklisted);
    
    return matchesSearch && matchesStatus && matchesType && matchesWilaya && matchesRejectionType;
  });

  // Schedule interview
  const handleScheduleInterview = async () => {
    if (!schedulingCandidature || !interviewDateObj || !interviewTime) {
      toast({ title: "Erreur", description: "Veuillez sélectionner une date et une heure", variant: "destructive" });
      return;
    }
    if (!selectedPanelCdId || !selectedPanelRaId) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un Chef de Département et un Responsable d'Accréditation pour le panel", variant: "destructive" });
      return;
    }

    const year = interviewDateObj.getFullYear();
    const month = String(interviewDateObj.getMonth() + 1).padStart(2, '0');
    const day = String(interviewDateObj.getDate()).padStart(2, '0');
    const dateTime = `${year}-${month}-${day}T${interviewTime}:00`;

    try {
      const response = await fetch(`/api/candidatures/experts/${schedulingCandidature.id}/schedule-interview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ 
          interviewDate: dateTime,
          panelCdId: parseInt(selectedPanelCdId),
          panelRaId: parseInt(selectedPanelRaId)
        })
      });
      
      if (response.ok) {
        toast({ title: "Succès", description: "Entretien planifié. Tous les membres du panel (DT, RQ, CD, RA) ont été notifiés." });
        fetchCandidatures();
        setShowScheduleDialog(false);
        setSelectedCandidature(null);
        setInterviewDateObj(undefined);
        setInterviewTime("");
        setSchedulingCandidature(null);
        setSelectedPanelCdId("");
        setSelectedPanelRaId("");
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Impossible de planifier l'entretien", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Reject dossier (implicit rejection)
  const handleRejectDossier = async (candidature: Candidature) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rejectionReason: rejectionReason || "Profil non retenu dans le cadre des besoins actuels" })
      });
      
      if (response.ok) {
        // If starOnReject is checked, also star the profile
        if (starOnReject) {
          await fetch(`/api/candidatures/experts/${candidature.id}/toggle-star`, {
            method: "POST",
            credentials: "include"
          });
        }
        toast({ title: "Traitement effectué", description: "Le candidat a été notifié par email de manière appropriée." });
        fetchCandidatures();
        setSelectedCandidature(null);
        setShowRejectDialog(false);
        setRejectionReason("");
        setStarOnReject(false);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Une erreur est survenue", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  const handleDownloadFor20 = async (candidature: Candidature) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/for20`, {
        credentials: "include"
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `FOR20_${candidature.registrationId}_${candidature.fullName}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast({ title: "Erreur", description: "Impossible de télécharger le FOR20", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Preselect profile (send FOR28 link)
  const handlePreselectProfile = async (candidatureId: string) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidatureId}/preselect-profile`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast({ title: "Profil présélectionné", description: "Un email avec le lien FOR28 a été envoyé au candidat." });
        fetchCandidatures();
        setSelectedCandidature(null);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Une erreur est survenue", variant: "destructive" });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Export candidatures to CSV or XLSX
  const handleExport = (format: "csv" | "xlsx" = "csv") => {
    const headers = ["ID", "Nom Complet", "Type", "Domaine", "Email", "Téléphone", "Date Inscription", "Statut", "Type de rejet", "Blacklisté"];
    const statusLabels: Record<string, string> = {
      PENDING: "En attente", PROFILE_PRESELECTED: "Présélectionné (FOR28)", DOCUMENTS_SUBMITTED: "Documents reçus",
      INTERVIEW_SCHEDULED: "Entretien planifié", INTERVIEW_CONFIRMED: "Entretien confirmé",
      INTERVIEW_COMPLETED: "Entretien terminé", CANDIDATURE_APPROVED: "Acceptée", APPROVED: "Compte actif", REJECTED: "Non retenue"
    };
    const rows = filteredCandidatures.map(c => [
      c.registrationId, c.fullName, c.userType, c.domaineExpertise || "", c.email, c.telephoneMobile || c.telephone || "",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : c.dateInscription || "",
      statusLabels[c.status] || c.status,
      c.rejectionType || "",
      c.blacklisted ? "Oui" : "Non"
    ]);
    
    if (format === "xlsx") {
      exportToXlsx(headers, rows, `candidatures_${new Date().toISOString().slice(0,10)}`);
    } else {
      const csvContent = "\uFEFF" + [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `candidatures_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    }
    toast({ title: "Export effectué", description: `${filteredCandidatures.length} candidature(s) exportée(s) en ${format.toUpperCase()}` });
  };

  // Blacklist a candidate
  const handleBlacklist = async () => {
    if (!blacklistingCandidature || !blacklistReason.trim()) {
      toast({ title: "Erreur", description: "Le motif de blacklist est obligatoire", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch(`/api/candidatures/experts/${blacklistingCandidature.id}/blacklist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: blacklistReason })
      });
      if (response.ok) {
        toast({ title: "Succès", description: "Candidat blacklisté. Il ne pourra plus se réinscrire." });
        fetchCandidatures();
        setShowBlacklistDialog(false);
        setBlacklistReason("");
        setBlacklistingCandidature(null);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Échec du blacklist", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Unblacklist a candidate
  const handleUnblacklist = async (candidature: Candidature) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/unblacklist`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        toast({ title: "Succès", description: "Candidat retiré de la blacklist" });
        fetchCandidatures();
        setSelectedCandidature(null);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Échec", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Restore a rejected candidature back to PENDING
  const handleRestore = async (candidature: Candidature) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/restore`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        toast({ title: "Succès", description: "Candidature restaurée. Le dossier est de nouveau en attente d'examen." });
        fetchCandidatures();
        setSelectedCandidature(null);
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Échec", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  // Toggle star/favorite for a candidature
  const handleToggleStar = async (candidature: Candidature) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/toggle-star`, {
        method: "POST",
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        toast({ title: data.starred ? "Profil marqué" : "Marque retirée", description: data.starred ? "Ce profil sera considéré pour de futures opportunités." : "La marque a été retirée." });
        fetchCandidatures();
        if (selectedCandidature && String(selectedCandidature.id) === String(candidature.id)) {
          setSelectedCandidature({ ...selectedCandidature, starred: data.starred });
        }
      } else {
        const error = await response.json();
        toast({ title: "Erreur", description: error.message || "Échec", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />
        
        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl md:text-2xl font-bold text-slate-900">Candidatures</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Gérer les demandes d'inscription des Experts, Évaluateurs et Formateurs
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="shrink-0">
                  <FileText className="w-4 h-4 mr-2" />
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
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("PENDING")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">En attente</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
                  </div>
                  <Clock className="w-8 h-8 text-amber-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("INTERVIEW_SCHEDULED")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Entretiens</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.interviewing}</p>
                  </div>
                  <CalendarDays className="w-8 h-8 text-blue-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("CANDIDATURE_APPROVED")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Acceptées</p>
                    <p className="text-2xl font-bold text-emerald-600">{stats.approved}</p>
                  </div>
                  <UserCheck className="w-8 h-8 text-emerald-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("REJECTED")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Non retenues</p>
                    <p className="text-2xl font-bold text-slate-500">{stats.rejected}</p>
                  </div>
                  <UserX className="w-8 h-8 text-slate-400 opacity-60" />
                </div>
              </CardContent>
            </Card>
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFilterStatus("all")}>
              <CardContent className="pt-4 pb-4 px-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
                  </div>
                  <Users className="w-8 h-8 text-slate-500 opacity-60" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6 w-full">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder="Rechercher par nom, ID, domaine..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger><SelectValue placeholder="Statut" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="PROFILE_PRESELECTED">Présélectionné (FOR28)</SelectItem>
                    <SelectItem value="DOCUMENTS_SUBMITTED">Documents reçus</SelectItem>
                    <SelectItem value="INTERVIEW_SCHEDULED">Entretien planifié</SelectItem>
                    <SelectItem value="INTERVIEW_CONFIRMED">Entretien confirmé</SelectItem>
                    <SelectItem value="INTERVIEW_COMPLETED">Entretien terminé</SelectItem>
                    <SelectItem value="CANDIDATURE_APPROVED">Acceptées</SelectItem>
                    <SelectItem value="APPROVED">Compte actif</SelectItem>
                    <SelectItem value="REJECTED">Non retenues</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                    <SelectItem value="EVALUATEUR">Évaluateur</SelectItem>
                    <SelectItem value="FORMATEUR">Formateur</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterWilaya} onValueChange={setFilterWilaya}>
                  <SelectTrigger><SelectValue placeholder="Wilaya" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les wilayas</SelectItem>
                    {WILAYAS.map((w) => (
                      <SelectItem key={w} value={w}>{w}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterRejectionType} onValueChange={setFilterRejectionType}>
                  <SelectTrigger><SelectValue placeholder="Type de rejet" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les rejets</SelectItem>
                    <SelectItem value="dossier">Rejet dossier</SelectItem>
                    <SelectItem value="interview">Rejet après entretien</SelectItem>
                    <SelectItem value="blacklisted">Blacklistés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card className="w-full overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="whitespace-nowrap">ID</TableHead>
                    <TableHead className="whitespace-nowrap">Nom Complet</TableHead>
                    <TableHead className="whitespace-nowrap">Type</TableHead>
                    <TableHead className="whitespace-nowrap">Domaine</TableHead>
                    <TableHead className="whitespace-nowrap">Date</TableHead>
                    <TableHead className="whitespace-nowrap">Statut</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell></TableRow>
                  ) : filteredCandidatures.length === 0 ? (
                    <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune candidature trouvée</TableCell></TableRow>
                  ) : (
                    filteredCandidatures.map((candidature) => (
                      <TableRow key={candidature.id}>
                        <TableCell className="font-mono text-xs">{candidature.registrationId}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{candidature.fullName}</TableCell>
                        <TableCell>{getTypeBadge(candidature.userType)}</TableCell>
                        <TableCell className="max-w-xs truncate">{candidature.domaineExpertise}</TableCell>
                        <TableCell className="whitespace-nowrap">{candidature.createdAt ? new Date(candidature.createdAt).toLocaleDateString("fr-FR") : candidature.dateInscription}</TableCell>
                        <TableCell>{getStatusBadge(candidature.status)}{candidature.blacklisted && <Badge variant="destructive" className="ml-1 text-[10px]">BL</Badge>}{candidature.starred && <Star className="inline w-3.5 h-3.5 ml-1 fill-amber-500 text-amber-500" />}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedCandidature(candidature)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedCandidature} onOpenChange={() => setSelectedCandidature(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Candidature</DialogTitle>
            <DialogDescription>{selectedCandidature && `Référence : ${selectedCandidature.registrationId}`}</DialogDescription>
          </DialogHeader>

          {selectedCandidature && (
            <div className="space-y-6">
              {selectedCandidature.photoBase64 && (
                <div className="flex justify-center">
                  <img src={`data:image/jpeg;base64,${selectedCandidature.photoBase64}`} alt="Photo" className="w-32 h-32 rounded-full object-cover border-4 border-gray-200" />
                </div>
              )}

              <div className="grid md:grid-cols-2 gap-4">
                <div><Label className="text-xs text-muted-foreground">Nom Complet</Label><p className="font-medium">{selectedCandidature.fullName}</p></div>
                <div><Label className="text-xs text-muted-foreground">Type</Label><div className="mt-1">{getTypeBadge(selectedCandidature.userType)}</div></div>
                <div><Label className="text-xs text-muted-foreground">Email</Label><p className="font-medium">{selectedCandidature.email}</p></div>
                <div><Label className="text-xs text-muted-foreground">Téléphone</Label><p className="font-medium">{selectedCandidature.telephoneMobile || selectedCandidature.telephone || "Non renseigné"}</p></div>
                {selectedCandidature.dateNaissance && (<div><Label className="text-xs text-muted-foreground">Date de naissance</Label><p className="font-medium">{selectedCandidature.dateNaissance}</p></div>)}
                {selectedCandidature.nationalite && (<div><Label className="text-xs text-muted-foreground">Nationalité</Label><p className="font-medium">{selectedCandidature.nationalite}</p></div>)}
                <div><Label className="text-xs text-muted-foreground">Statut</Label><div className="mt-1">{getStatusBadge(selectedCandidature.status)}</div></div>
                <div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Domaine d&apos;expertise</Label><p className="font-medium">{selectedCandidature.domaineExpertise}</p></div>
                {selectedCandidature.sousDomaineExpertise && (<div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Sous-domaine</Label><p className="font-medium">{selectedCandidature.sousDomaineExpertise}</p></div>)}
                {selectedCandidature.adresseDomicile && (<div className="md:col-span-2"><Label className="text-xs text-muted-foreground">Adresse</Label><p className="font-medium">{selectedCandidature.adresseDomicile}</p></div>)}
              </div>

              {/* Interview info if scheduled */}
              {selectedCandidature.interviewDate && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <Label className="text-sm font-semibold text-blue-700 mb-1 block">Entretien planifié</Label>
                  <p className="text-sm text-blue-800">
                    {new Date(selectedCandidature.interviewDate).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}

              {/* Rejection info */}
              {selectedCandidature.status === "REJECTED" && selectedCandidature.rejectionReason && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <Label className="text-sm font-semibold text-slate-700 mb-1 block">
                    Motif de refus {selectedCandidature.rejectionType === "interview" ? "(après entretien)" : "(dossier)"}
                  </Label>
                  <p className="text-sm text-slate-600">{selectedCandidature.rejectionReason}</p>
                </div>
              )}

              {/* Star indicator */}
              {selectedCandidature.starred && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <Label className="text-sm font-semibold text-amber-700 mb-1 flex items-center gap-2">
                    <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> Profil à considérer
                  </Label>
                  <p className="text-sm text-amber-600">Ce profil a été marqué comme intéressant pour de futures opportunités.</p>
                </div>
              )}

              {/* Restore rejected candidature + star toggle */}
              {selectedCandidature.status === "REJECTED" && (
                <div className="flex gap-3 pt-4 border-t flex-wrap">
                  <Button variant="outline" className="flex-1 text-blue-600 border-blue-300 hover:bg-blue-50" onClick={() => handleRestore(selectedCandidature)}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Réexaminer la candidature
                  </Button>
                  <Button
                    variant="outline"
                    className={selectedCandidature.starred 
                      ? "text-amber-600 border-amber-300 hover:bg-amber-50" 
                      : "text-slate-600 border-slate-300 hover:bg-slate-50"}
                    onClick={() => handleToggleStar(selectedCandidature)}
                  >
                    <Star className={`w-4 h-4 mr-1 ${selectedCandidature.starred ? "fill-amber-500 text-amber-500" : ""}`} />
                    {selectedCandidature.starred ? "Retirer l'étoile" : "Marquer le profil"}
                  </Button>
                </div>
              )}

              {/* Blacklist info */}
              {selectedCandidature.blacklisted && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <Label className="text-sm font-semibold text-red-700 mb-1 flex items-center gap-2">
                    <ShieldBan className="w-4 h-4" /> Candidat blacklisté
                  </Label>
                  <p className="text-sm text-red-600">{selectedCandidature.blacklistReason}</p>
                  {selectedCandidature.blacklistedAt && (
                    <p className="text-xs text-red-400 mt-1">Depuis le {new Date(selectedCandidature.blacklistedAt).toLocaleDateString("fr-FR")}</p>
                  )}
                  <Button variant="outline" size="sm" className="mt-2 text-green-700 border-green-300" onClick={() => handleUnblacklist(selectedCandidature)}>
                    <ShieldCheck className="w-3 h-3 mr-1" /> Retirer de la blacklist
                  </Button>
                </div>
              )}

              {/* Documents */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">Documents</Label>
                <Button variant="outline" className="w-full justify-start gap-2" onClick={() => handleDownloadFor20(selectedCandidature)}>
                  <Download className="w-4 h-4" /> Télécharger le formulaire FOR20
                </Button>
                {selectedCandidature.documentsJson && (() => {
                  try {
                    const docs: Array<{name: string, base64?: string, mimeType?: string}> = JSON.parse(selectedCandidature.documentsJson);
                    if (!docs || docs.length === 0) return null;
                    return (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-muted-foreground font-medium">Fichiers joints :</p>
                        {docs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                            <span className="text-sm truncate flex-1 mr-2">{doc.name}</span>
                            {doc.base64 && (
                              <Button variant="ghost" size="sm" className="shrink-0 h-7 px-2" onClick={() => {
                                const mime = doc.mimeType || "application/octet-stream";
                                const byteChars = atob(doc.base64!);
                                const byteArr = new Uint8Array(byteChars.length);
                                for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
                                const blob = new Blob([byteArr], { type: mime });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement("a");
                                a.href = url; a.download = doc.name; a.click();
                                URL.revokeObjectURL(url);
                              }}>
                                <Download className="w-3 h-3 mr-1" /> Télécharger
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  } catch { return null; }
                })()}
              </div>

              {/* Actions for PENDING candidatures */}
              {selectedCandidature.status === "PENDING" && (
                <div className="flex gap-3 pt-4 border-t flex-wrap">
                  <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={() => handlePreselectProfile(selectedCandidature.id)}>
                    <FileText className="w-4 h-4 mr-2" />
                    Présélectionner (FOR28)
                  </Button>
                  <Button variant="outline" className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50" onClick={() => setShowRejectDialog(true)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Dossier Non Retenu
                  </Button>
                  {!selectedCandidature.blacklisted && (
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => {
                      setBlacklistingCandidature(selectedCandidature);
                      setShowBlacklistDialog(true);
                    }}>
                      <ShieldBan className="w-4 h-4 mr-1" />
                      Blacklist
                    </Button>
                  )}
                </div>
              )}

              {/* Actions for DOCUMENTS_SUBMITTED candidatures */}
              {selectedCandidature.status === "DOCUMENTS_SUBMITTED" && (
                <div className="flex gap-3 pt-4 border-t flex-wrap">
                  <Button className="flex-1 bg-[#00A63E] hover:bg-[#009235]" onClick={() => {
                    setSchedulingCandidature(selectedCandidature);
                    setShowScheduleDialog(true);
                  }}>
                    <CalendarPlus className="w-4 h-4 mr-2" />
                    Planifier un Entretien
                  </Button>
                  <Button variant="outline" className="flex-1 text-slate-600 border-slate-300 hover:bg-slate-50" onClick={() => setShowRejectDialog(true)}>
                    <XCircle className="w-4 h-4 mr-2" />
                    Dossier Non Retenu
                  </Button>
                  {!selectedCandidature.blacklisted && (
                    <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => {
                      setBlacklistingCandidature(selectedCandidature);
                      setShowBlacklistDialog(true);
                    }}>
                      <ShieldBan className="w-4 h-4 mr-1" />
                      Blacklist
                    </Button>
                  )}
                </div>
              )}

              {/* Blacklist action for other statuses */}
              {selectedCandidature.status !== "PENDING" && !selectedCandidature.blacklisted && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={() => {
                    setBlacklistingCandidature(selectedCandidature);
                    setShowBlacklistDialog(true);
                  }}>
                    <ShieldBan className="w-4 h-4 mr-1" />
                    Blacklister ce candidat
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Planifier un Entretien</DialogTitle>
            <DialogDescription>
              {schedulingCandidature && `Candidat(e) : ${schedulingCandidature.fullName}`}
              <br />
              Un email de convocation sera envoyé au candidat et à tous les membres du panel d'entretien.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Date de l'entretien *</Label>
              <div className="mt-2">
                <DatePicker
                  value={interviewDateObj}
                  onChange={setInterviewDateObj}
                  placeholder="Sélectionner une date"
                  minDate={new Date()}
                />
              </div>
            </div>
            <div>
              <Label>Heure de l'entretien *</Label>
              <div className="mt-2">
                <TimePicker
                  value={interviewTime}
                  onChange={setInterviewTime}
                  placeholder="Sélectionner l'heure"
                />
              </div>
            </div>
            
            {/* Panel Members Selection */}
            <div className="border-t pt-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="w-4 h-4 text-slate-600" />
                <Label className="text-base font-semibold">Composition du Panel d'Entretien</Label>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Le Directeur Technique (DT) et le Responsable Qualité (RQ) sont automatiquement inclus. 
                Veuillez sélectionner le Chef de Département et le Responsable d'Accréditation.
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">DT</span> — <span className="text-muted-foreground">Directeur Technique (automatique)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">RQ</span> — <span className="text-muted-foreground">Responsable Qualité (automatique)</span>
                </div>
                
                <div>
                  <Label>Chef de Département (CD) *</Label>
                  <Select value={selectedPanelCdId} onValueChange={setSelectedPanelCdId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un Chef de Département" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCDs.map(cd => (
                        <SelectItem key={cd.id} value={String(cd.id)}>
                          {cd.fullName} ({cd.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Responsable d'Accréditation (RA) *</Label>
                  <Select value={selectedPanelRaId} onValueChange={setSelectedPanelRaId}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Sélectionner un Responsable d'Accréditation" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableRAs.map(ra => (
                        <SelectItem key={ra.id} value={String(ra.id)}>
                          {ra.fullName} ({ra.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <span className="font-medium">GES</span> — <span className="text-muted-foreground">Gestionnaire de Compétences (vous)</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => { setShowScheduleDialog(false); setInterviewDateObj(undefined); setInterviewTime(""); setSelectedPanelCdId(""); setSelectedPanelRaId(""); }}>
              Annuler
            </Button>
            <Button className="bg-[#00A63E] hover:bg-[#009235]" onClick={handleScheduleInterview} disabled={!interviewDateObj || !interviewTime || !selectedPanelCdId || !selectedPanelRaId}>
              <CalendarPlus className="w-4 h-4 mr-2" />
              Confirmer & Notifier le Panel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dossier Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dossier Non Retenu</DialogTitle>
            <DialogDescription>
              Le candidat recevra un email professionnel indiquant que son profil ne correspond pas aux besoins actuels, 
              tout en gardant son dossier pour de futures opportunités.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motif de refus (non visible par le candidat)</Label>
              <Textarea id="rejectionReason" placeholder="Raison interne du refus (pour vos archives uniquement)..." value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows={3} className="mt-2" />
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs text-amber-700">
                <strong>Note :</strong> Le candidat recevra un email mentionnant que son dossier sera conservé dans le vivier de compétences pour de futures opportunités. Aucune mention directe de refus.
              </p>
            </div>

            <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-amber-50/50 cursor-pointer" onClick={() => setStarOnReject(!starOnReject)}>
              <Checkbox checked={starOnReject} onCheckedChange={(checked) => setStarOnReject(!!checked)} />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <Star className={`w-4 h-4 ${starOnReject ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
                  <span className="text-sm font-medium">Bon profil à considérer</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Marquer ce profil pour une éventuelle reconsidération future.</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => { setShowRejectDialog(false); setRejectionReason(""); setStarOnReject(false); }}>
                Annuler
              </Button>
              <Button variant="outline" className="flex-1 text-slate-600" onClick={() => selectedCandidature && handleRejectDossier(selectedCandidature)}>
                Confirmer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Blacklist Dialog */}
      <Dialog open={showBlacklistDialog} onOpenChange={setShowBlacklistDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <ShieldBan className="w-5 h-5" /> Blacklister un candidat
            </DialogTitle>
            <DialogDescription>
              {blacklistingCandidature && `Candidat(e) : ${blacklistingCandidature.fullName}`}
              <br />
              Un candidat blacklisté ne pourra plus se réinscrire avec la même adresse email.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="blacklistReason">Motif du blacklist *</Label>
              <Textarea id="blacklistReason" placeholder="Raison du blacklist (spam, abus, fausse identité...)" value={blacklistReason} onChange={(e) => setBlacklistReason(e.target.value)} rows={3} className="mt-2" />
            </div>

            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700">
                <strong>Attention :</strong> Cette action empêchera ce candidat de se réinscrire. Elle peut être annulée ultérieurement.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => { setShowBlacklistDialog(false); setBlacklistReason(""); setBlacklistingCandidature(null); }}>
                Annuler
              </Button>
              <Button variant="destructive" onClick={handleBlacklist} disabled={!blacklistReason.trim()}>
                <ShieldBan className="w-4 h-4 mr-2" />
                Confirmer le blacklist
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
