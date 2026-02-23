import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Eye, CheckCircle, XCircle, FileText, Download } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
  photoBase64?: string;
  dateNaissance?: string;
  nationalite?: string;
  adresseDomicile?: string;
  sousDomaineExpertise?: string;
}

export default function GesCompetencesCandidaturesPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [selectedCandidature, setSelectedCandidature] = useState<Candidature | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  useEffect(() => {
    fetchCandidatures();
  }, []);

  const fetchCandidatures = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8082/api/candidatures/experts", {
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
      const response = await fetch(`http://localhost:8082/api/candidatures/experts/${candidature.id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Candidature approuvée. L'administrateur a été notifié pour créer le compte."
        });
        fetchCandidatures();
        setSelectedCandidature(null);
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible d'approuver la candidature",
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
    if (!rejectionReason.trim()) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un motif de rejet",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/experts/${candidature.id}/reject`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({ rejectionReason })
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "Candidature rejetée. Un email a été envoyé au candidat."
        });
        fetchCandidatures();
        setSelectedCandidature(null);
        setShowRejectDialog(false);
        setRejectionReason("");
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible de rejeter la candidature",
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

  const handleDownloadFor20 = async (candidature: Candidature) => {
    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/experts/${candidature.id}/for20`, {
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
        toast({
          title: "Erreur",
          description: "Impossible de télécharger le FOR20",
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
              <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Candidatures d&apos;Inscription</h1>
              <p className="text-muted-foreground mt-1 text-sm md:text-base">
                Gérer les demandes d'inscription des Experts, Évaluateurs et Formateurs
              </p>
            </div>
            <Button className="shrink-0">
              <FileText className="w-4 h-4 mr-2" />
              Exporter
            </Button>
          </div>

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
                      <TableCell colSpan={7} className="text-center py-8">
                        Chargement...
                      </TableCell>
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
                        <TableCell className="whitespace-nowrap">{candidature.dateInscription}</TableCell>
                        <TableCell>{getStatusBadge(candidature.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setSelectedCandidature(candidature)}
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

      {/* Dialog de détails */}
      <Dialog open={!!selectedCandidature} onOpenChange={() => setSelectedCandidature(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la Candidature</DialogTitle>
            <DialogDescription>
              {selectedCandidature && `ID: ${selectedCandidature.registrationId}`}
            </DialogDescription>
          </DialogHeader>

          {selectedCandidature && (
            <div className="space-y-6">
              {/* Photo */}
              {selectedCandidature.photoBase64 && (
                <div className="flex justify-center">
                  <img 
                    src={`data:image/jpeg;base64,${selectedCandidature.photoBase64}`}
                    alt="Photo du candidat"
                    className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
                  />
                </div>
              )}

              {/* Informations personnelles */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Nom Complet</Label>
                  <p className="font-medium">{selectedCandidature.fullName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <div className="mt-1">{getTypeBadge(selectedCandidature.userType)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  <p className="font-medium">{selectedCandidature.email}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Téléphone</Label>
                  <p className="font-medium">{selectedCandidature.telephone}</p>
                </div>
                {selectedCandidature.dateNaissance && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Date de naissance</Label>
                    <p className="font-medium">{selectedCandidature.dateNaissance}</p>
                  </div>
                )}
                {selectedCandidature.nationalite && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Nationalité</Label>
                    <p className="font-medium">{selectedCandidature.nationalite}</p>
                  </div>
                )}
                <div className="md:col-span-2">
                  <Label className="text-xs text-muted-foreground">Domaine d&apos;expertise</Label>
                  <p className="font-medium">{selectedCandidature.domaineExpertise}</p>
                </div>
                {selectedCandidature.sousDomaineExpertise && (
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Sous-domaine</Label>
                    <p className="font-medium">{selectedCandidature.sousDomaineExpertise}</p>
                  </div>
                )}
                {selectedCandidature.adresseDomicile && (
                  <div className="md:col-span-2">
                    <Label className="text-xs text-muted-foreground">Adresse</Label>
                    <p className="font-medium">{selectedCandidature.adresseDomicile}</p>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-2 block">Documents</Label>
                <Button 
                  variant="outline" 
                  className="w-full justify-start gap-2"
                  onClick={() => handleDownloadFor20(selectedCandidature)}
                >
                  <Download className="w-4 h-4" />
                  Télécharger le formulaire FOR20
                </Button>
              </div>

              {/* Actions */}
              {selectedCandidature.status === "PENDING" && (
                <div className="flex gap-3 pt-4 border-t">
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
                    onClick={() => setShowRejectDialog(true)}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de rejet avec motif */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la candidature</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif de rejet. Un email sera envoyé au candidat.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="rejectionReason">Motif de rejet *</Label>
              <Textarea
                id="rejectionReason"
                placeholder="Expliquez la raison du rejet..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-2"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowRejectDialog(false);
                  setRejectionReason("");
                }}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => selectedCandidature && handleReject(selectedCandidature)}
              >
                Confirmer le rejet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
