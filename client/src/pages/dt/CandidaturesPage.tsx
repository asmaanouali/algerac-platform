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
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Candidatures Experts</h1>
          <p className="text-muted-foreground mt-1">Gérer les demandes d'inscription</p>
        </div>
        <Button>
          <FileText className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Filtres */}
      <Card>
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
      <div className="grid gap-4 md:grid-cols-4">
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
      <Card>
        <CardHeader>
          <CardTitle>Liste des Candidatures ({filteredCandidatures.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Candidat</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Domaine d'Expertise</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCandidatures.map((candidature) => (
                <TableRow key={candidature.id}>
                  <TableCell className="font-mono text-sm">{candidature.registrationId}</TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{candidature.fullName}</p>
                      <p className="text-xs text-muted-foreground">{candidature.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{getTypeBadge(candidature.userType)}</TableCell>
                  <TableCell className="max-w-xs truncate">{candidature.domaineExpertise}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(candidature.dateInscription).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{getStatusBadge(candidature.status)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
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
  );
}
