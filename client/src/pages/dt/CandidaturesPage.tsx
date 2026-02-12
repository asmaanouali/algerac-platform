import { useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, Clock, FileText, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DTNavbar } from "@/components/dt-navbar";

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
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export default function CandidaturesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);

  // Données mockées - à remplacer par un appel API
  const candidatures: Candidature[] = [
    {
      id: "1",
      registrationId: "EXP-0012",
      fullName: "Mohamed Benali",
      userType: "EXPERT",
      domaineExpertise: "ISO 9001 - Système de Management de la Qualité",
      email: "m.benali@email.com",
      telephone: "0555123456",
      dateInscription: "2026-02-08",
      status: "PENDING"
    },
    {
      id: "2",
      registrationId: "EVA-0008",
      fullName: "Sarah Amrani",
      userType: "EVALUATEUR",
      domaineExpertise: "ISO 14001 - Management Environnemental",
      email: "s.amrani@email.com",
      telephone: "0661234567",
      dateInscription: "2026-02-07",
      status: "APPROVED"
    },
    {
      id: "3",
      registrationId: "FOR-0005",
      fullName: "Karim Ziani",
      userType: "FORMATEUR",
      domaineExpertise: "ISO 45001 - Santé et Sécurité au Travail",
      email: "k.ziani@email.com",
      telephone: "0771234567",
      dateInscription: "2026-02-06",
      status: "PENDING"
    },
    {
      id: "4",
      registrationId: "EXP-0013",
      fullName: "Fatima Larbi",
      userType: "EXPERT",
      domaineExpertise: "ISO 27001 - Sécurité de l'Information",
      email: "f.larbi@email.com",
      telephone: "0551234567",
      dateInscription: "2026-02-05",
      status: "REJECTED"
    },
    {
      id: "5",
      registrationId: "EXP-0014",
      fullName: "Ahmed Kaddour",
      userType: "EXPERT",
      domaineExpertise: "ISO 50001 - Management de l'Énergie",
      email: "a.kaddour@email.com",
      telephone: "0661234568",
      dateInscription: "2026-02-04",
      status: "PENDING"
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">En attente</Badge>;
      case "APPROVED":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">Approuvé</Badge>;
      case "REJECTED":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
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

  const handleApprove = (candidature: Candidature) => {
    console.log("Approuver:", candidature);
    // TODO: Appel API pour approuver
  };

  const handleReject = (candidature: Candidature) => {
    console.log("Rejeter:", candidature);
    // TODO: Appel API pour rejeter
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 max-w-full overflow-hidden">
        <DTNavbar />
        
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
                  <div className="grid grid-cols-2 gap-4">
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