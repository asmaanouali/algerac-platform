import { useState, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, FileText, Clock, UserCheck, UserX, Users, CalendarDays, ChevronDown, Star } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
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
  "53 - Béni Abbès", "54 - Timimoun", "55 - Touggourt", "56 - Djanet", "57 - In Salah", "58 - In Guezzam",
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
  status: string;
  wilaya?: string;
  rejectionType?: string;
  blacklisted?: boolean;
  starred?: boolean;
  createdAt?: string;
}

export default function GesCompetencesCandidaturesPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterRejectionType, setFilterRejectionType] = useState<string>("all");
  const [filterWilaya, setFilterWilaya] = useState<string>("all");
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Candidatures - Gestion des Compétences | ALGERAC";
    fetchCandidatures();
  }, []);

  const fetchCandidatures = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/candidatures/experts", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setCandidatures(data);
      } else {
        toast({ title: "Erreur", description: "Impossible de charger les candidatures", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erreur", description: "Une erreur est survenue", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const pending = candidatures.filter(c => ["PENDING", "PROFILE_PRESELECTED", "DOCUMENTS_SUBMITTED"].includes(c.status)).length;
    const interviewing = candidatures.filter(c => ["INTERVIEW_SCHEDULED", "INTERVIEW_CONFIRMED", "INTERVIEW_COMPLETED"].includes(c.status)).length;
    const approved = candidatures.filter(c => ["CANDIDATURE_APPROVED", "APPROVED"].includes(c.status)).length;
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
    const matchesRejectionType =
      filterRejectionType === "all" ||
      c.status !== "REJECTED" ||
      (filterRejectionType === "dossier" && c.rejectionType === "dossier") ||
      (filterRejectionType === "interview" && c.rejectionType === "interview") ||
      (filterRejectionType === "blacklisted" && c.blacklisted);
    return matchesSearch && matchesStatus && matchesType && matchesWilaya && matchesRejectionType;
  });

  const handleExport = (format: "csv" | "xlsx") => {
    const headers = ["ID", "Nom Complet", "Type", "Domaine", "Email", "Téléphone", "Date Inscription", "Statut", "Type de rejet", "Blacklisté"];
    const statusLabels: Record<string, string> = {
      PENDING: "En attente", PROFILE_PRESELECTED: "Présélectionné (FOR28)", DOCUMENTS_SUBMITTED: "Documents reçus",
      INTERVIEW_SCHEDULED: "Entretien planifié", INTERVIEW_CONFIRMED: "Entretien confirmé",
      INTERVIEW_COMPLETED: "Entretien terminé", CANDIDATURE_APPROVED: "Acceptée", APPROVED: "Compte actif", REJECTED: "Non retenue",
    };
    const rows = filteredCandidatures.map(c => [
      c.registrationId, c.fullName, c.userType, c.domaineExpertise || "", c.email,
      c.telephoneMobile || c.telephone || "",
      c.createdAt ? new Date(c.createdAt).toLocaleDateString("fr-FR") : c.dateInscription || "",
      statusLabels[c.status] || c.status,
      c.rejectionType || "",
      c.blacklisted ? "Oui" : "Non",
    ]);

    if (format === "xlsx") {
      exportToXlsx(headers, rows, `candidatures_${new Date().toISOString().slice(0, 10)}`);
    } else {
      const csvContent = "\uFEFF" + [headers, ...rows]
        .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";"))
        .join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `candidatures_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
    toast({ title: "Export effectué", description: `${filteredCandidatures.length} candidature(s) exportée(s)` });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <Navbar />

        <main className="flex-1 p-4 md:p-8 overflow-y-auto overflow-x-hidden w-full">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-2xl font-bold">Candidatures</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Gérer les demandes d&apos;inscription des Experts, Évaluateurs et Formateurs
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
                  Exporter en XLS
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
                  <Input
                    placeholder="Rechercher par nom, ID, domaine..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
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
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell>
                    </TableRow>
                  ) : filteredCandidatures.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        Aucune candidature trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCandidatures.map((candidature) => (
                      <TableRow key={candidature.id}>
                        <TableCell className="font-mono text-xs">{candidature.registrationId}</TableCell>
                        <TableCell className="font-medium whitespace-nowrap">{candidature.fullName}</TableCell>
                        <TableCell>{getTypeBadge(candidature.userType)}</TableCell>
                        <TableCell className="max-w-xs truncate">{candidature.domaineExpertise}</TableCell>
                        <TableCell className="whitespace-nowrap">
                          {candidature.createdAt
                            ? new Date(candidature.createdAt).toLocaleDateString("fr-FR")
                            : candidature.dateInscription}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(candidature.status)}
                          {candidature.blacklisted && (
                            <Badge variant="destructive" className="ml-1 text-[10px]">BL</Badge>
                          )}
                          {candidature.starred && (
                            <Star className="inline w-3.5 h-3.5 ml-1 fill-amber-500 text-amber-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setLocation(`/ges-competences/candidatures/${candidature.id}`)}
                          >
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
    </div>
  );
}
