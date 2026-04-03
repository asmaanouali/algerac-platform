import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";

// Type pour les candidatures
interface Candidature {
  id: string;
  registrationId: string;
  fullName: string;
  userType: "EXPERT" | "EVALUATEUR" | "FORMATEUR";
  domaineExpertise: string;
  email: string;
  telephone: string;
  dateInscription: string;
  status: "PENDING" | "PROFILE_PRESELECTED" | "DOCUMENTS_SUBMITTED" | "INTERVIEW_SCHEDULED" | "INTERVIEW_CONFIRMED" | "INTERVIEW_COMPLETED" | "CANDIDATURE_APPROVED" | "APPROVED" | "REJECTED";
}

export default function CandidaturesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCandidatures();
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
        toast({
          title: "Erreur",
          description: "Impossible de charger les candidatures",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur lors du chargement des candidatures:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { class: string; label: string }> = {
      PENDING: { class: "bg-yellow-50 text-yellow-700 border-yellow-300", label: "En attente" },
      PROFILE_PRESELECTED: { class: "bg-orange-50 text-orange-700 border-orange-300", label: "Présélectionné (FOR28)" },
      DOCUMENTS_SUBMITTED: { class: "bg-indigo-50 text-indigo-700 border-indigo-300", label: "Documents reçus" },
      INTERVIEW_SCHEDULED: { class: "bg-blue-50 text-blue-700 border-blue-300", label: "Entretien planifié" },
      INTERVIEW_CONFIRMED: { class: "bg-cyan-50 text-cyan-700 border-cyan-300", label: "Entretien confirmé" },
      INTERVIEW_COMPLETED: { class: "bg-teal-50 text-teal-700 border-teal-300", label: "Entretien terminé" },
      CANDIDATURE_APPROVED: { class: "bg-emerald-50 text-emerald-700 border-emerald-300", label: "Acceptée" },
      APPROVED: { class: "bg-green-50 text-green-700 border-green-300", label: "Approuvé" },
      REJECTED: { class: "bg-red-50 text-red-700 border-red-300", label: "Rejeté" },
    };
    const s = map[status] || { class: "", label: status };
    return <Badge variant="outline" className={s.class}>{s.label}</Badge>;
  };

  const getTypeBadge = (type: string) => {
    const colors = {
      EXPERT: "bg-blue-100 text-blue-800",
      EVALUATEUR: "bg-purple-100 text-purple-800",
      FORMATEUR: "bg-indigo-100 text-indigo-800",
    };
    return <Badge className={colors[type as keyof typeof colors]}>{type}</Badge>;
  };

  // Filtrage des candidatures
  const filteredCandidatures = candidatures.filter(c => {
    const matchesSearch = 
      c.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.registrationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.domaineExpertise.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || c.status === filterStatus;
    const matchesType = filterType === "all" || c.userType === filterType;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleApprove = async (candidature: Candidature) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Candidature approuvée avec succès"
        });
        fetchCandidatures();
        setSelectedCandidature(null);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible d'approuver la candidature",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (candidature: Candidature) => {
    try {
      const response = await fetch(`/api/candidatures/experts/${candidature.id}/reject`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Candidature rejetée"
        });
        fetchCandidatures();
        setSelectedCandidature(null);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de rejeter la candidature",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Candidatures Experts</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">Gérer les demandes d'inscription</p>
            </div>
            <Button className="shrink-0">
              <FileText className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>

          {/* Filtres */}
          <Card className="mb-6 w-full">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
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
                    <SelectItem value="PENDING">En attente</SelectItem>
                    <SelectItem value="APPROVED">Approuvé</SelectItem>
                    <SelectItem value="REJECTED">Rejeté</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="EXPERT">Expert</SelectItem>
                    <SelectItem value="EVALUATEUR">Évaluateur</SelectItem>
                    <SelectItem value="FORMATEUR">Formateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques rapides */}
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{candidatures.filter(c => c.status === "PENDING").length}</p>
                  <p className="text-sm text-muted-foreground">En attente</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{candidatures.filter(c => c.status === "APPROVED").length}</p>
                  <p className="text-sm text-muted-foreground">Approuvés</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{candidatures.filter(c => c.status === "REJECTED").length}</p>
                  <p className="text-sm text-muted-foreground">Rejetés</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{candidatures.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Table des candidatures */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Liste des Candidatures ({filteredCandidatures.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Chargement...</p>
                </div>
              ) : filteredCandidatures.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <p className="text-muted-foreground">Aucune candidature trouvée</p>
                </div>
              ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[90px] sm:w-[100px]">ID</TableHead>
                    <TableHead className="min-w-[160px] sm:min-w-[200px]">Candidat</TableHead>
                    <TableHead className="w-[100px] sm:w-[120px]">Type</TableHead>
                    <TableHead className="min-w-[200px] sm:min-w-[250px] max-w-[300px] sm:max-w-[350px]">Domaine</TableHead>
                    <TableHead className="w-[90px] sm:w-[100px]">Date</TableHead>
                    <TableHead className="w-[90px] sm:w-[100px]">Statut</TableHead>
                    <TableHead className="w-[120px] sm:w-[140px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCandidatures.map((candidature) => (
                    <TableRow key={candidature.id}>
                      <TableCell className="font-mono text-sm whitespace-nowrap">{candidature.registrationId}</TableCell>
                      <TableCell>
                        <div className="min-w-[180px]">
                          <p className="font-medium whitespace-nowrap">{candidature.fullName}</p>
                          <p className="text-xs text-muted-foreground truncate">{candidature.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{getTypeBadge(candidature.userType)}</TableCell>
                      <TableCell>
                        <div className="max-w-[350px] truncate" title={candidature.domaineExpertise}>
                          {candidature.domaineExpertise}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(candidature.dateInscription).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>{getStatusBadge(candidature.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedCandidature(candidature)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {candidature.status === "PENDING" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleApprove(candidature)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleReject(candidature)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
              )}
            </CardContent>
          </Card>

          {/* Dialog de détails */}
          <Dialog open={!!selectedCandidature} onOpenChange={() => setSelectedCandidature(null)}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Détails de la Candidature</DialogTitle>
                <DialogDescription>
                  {selectedCandidature?.registrationId} - {selectedCandidature?.fullName}
                </DialogDescription>
              </DialogHeader>
              {selectedCandidature && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Nom complet</label>
                      <p className="text-sm font-semibold">{selectedCandidature.fullName}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Type</label>
                      <p className="text-sm">{getTypeBadge(selectedCandidature.userType)}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <p className="text-sm">{selectedCandidature.email}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Téléphone</label>
                      <p className="text-sm">{selectedCandidature.telephone}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="text-sm font-medium text-muted-foreground">Domaine d'expertise</label>
                      <p className="text-sm">{selectedCandidature.domaineExpertise}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Date d'inscription</label>
                      <p className="text-sm">{new Date(selectedCandidature.dateInscription).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Statut</label>
                      <p className="text-sm">{getStatusBadge(selectedCandidature.status)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 pt-4 border-t">
                    <Button variant="outline" className="flex-1">
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le CV
                    </Button>
                    {selectedCandidature.status === "PENDING" && (
                      <>
                        <Button 
                          className="flex-1 bg-green-600 hover:bg-green-700"
                          onClick={() => handleApprove(selectedCandidature)}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Approuver
                        </Button>
                        <Button 
                          variant="destructive" 
                          className="flex-1"
                          onClick={() => handleReject(selectedCandidature)}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Rejeter
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}