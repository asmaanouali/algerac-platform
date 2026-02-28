import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  Mail,
  Phone,
  User,
  Calendar,
  AlertCircle,
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";

interface OECApplication {
  id: number;
  organizationName: string;
  typeOrganisme: string;
  adresseSiege: string;
  phone: string;
  email: string;
  nomRepresentant: string;
  fonction: string;
  porteeAccreditation: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejectionReason?: string;
  createdAt: string;
  dateApprobation?: string;
  documentsJson?: string;
}

export default function CandidaturesOECPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<OECApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedApplication, setSelectedApplication] = useState<OECApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchApplications();
    }
  }, [user, authLoading]);

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const fetchApplications = async () => {
    try {
      const response = await fetch("http://localhost:8082/api/candidatures/oec/all", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les candidatures",
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
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir approuver cette candidature ? Le dossier sera transmis au DAG pour fixation des frais de dépôt.")) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/${id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "La candidature a été approuvée. Le DAG a été notifié pour fixer les frais de dépôt.",
        });
        fetchApplications();
        setShowDetailsDialog(false);
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
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      toast({
        title: "Attention",
        description: "Veuillez indiquer un motif de refus",
        variant: "destructive"
      });
      return;
    }
    
    if (!selectedApplication) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/${selectedApplication.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ rejectionReason })
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "La candidature a été rejetée. Le candidat a été notifié.",
        });
        fetchApplications();
        setShowRejectDialog(false);
        setShowDetailsDialog(false);
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
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "APPROVED":
        return <Badge className="bg-green-500">Approuvé</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-500">Rejeté</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
  const matchesSearch = 
    app.organizationName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    app.nomRepresentant?.toLowerCase().includes(searchTerm.toLowerCase());
  
  const matchesStatus = filterStatus === "all" || app.status === filterStatus;
  
  return matchesSearch && matchesStatus;
});

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Candidatures OEC</h1>
              <p className="text-muted-foreground">Gestion des demandes d'accréditation des organismes</p>
            </div>
          </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input 
                  placeholder="Nom, email, représentant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Statut</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="PENDING">En attente</SelectItem>
                  <SelectItem value="APPROVED">Approuvé</SelectItem>
                  <SelectItem value="REJECTED">Rejeté</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques rapides */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{applications.length}</p>
              </div>
              <Building2 className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold">
                  {applications.filter(a => a.status === "PENDING").length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvés</p>
                <p className="text-2xl font-bold">
                  {applications.filter(a => a.status === "APPROVED").length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Rejetés</p>
                <p className="text-2xl font-bold">
                  {applications.filter(a => a.status === "REJECTED").length}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des candidatures */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des candidatures ({filteredApplications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : filteredApplications.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">Aucune candidature trouvée</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Organisme</TableHead>
                    <TableHead>Représentant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((app) => (
                    <TableRow key={app.id}>
                      <TableCell className="font-medium">#{app.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{app.organizationName}</p>
                          <p className="text-sm text-muted-foreground">{app.typeOrganisme}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.nomRepresentant || "N/A"}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.createdAt}</TableCell>
                      <TableCell>{getStatusBadge(app.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowDetailsDialog(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      </div>

      {/* Dialog de détails et actions */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la candidature #{selectedApplication?.id}</DialogTitle>
            <DialogDescription>
              {selectedApplication?.organizationName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Organisme</Label>
                  <p className="font-medium">{selectedApplication.organizationName}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Type</Label>
                  <p>{selectedApplication.typeOrganisme}</p>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-muted-foreground">Adresse</Label>
                  <p>{selectedApplication.adresseSiege}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    {selectedApplication.email}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Téléphone</Label>
                  <p className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {selectedApplication.phone || "Non renseigné"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Représentant</Label>
                  <p className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {selectedApplication.nomRepresentant || "Non renseigné"}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Fonction</Label>
                  <p>{selectedApplication.fonction || "Non renseigné"}</p>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-muted-foreground">Portée d'accréditation</Label>
                  <p>{selectedApplication.porteeAccreditation || "Non renseigné"}</p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date de candidature</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedApplication.createdAt}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Statut</Label>
                  <div>{getStatusBadge(selectedApplication.status)}</div>
                </div>
                
                {selectedApplication.rejectionReason && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Motif de refus</Label>
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-800">{selectedApplication.rejectionReason}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Formulaire DOC1 */}
              <div className="border-t pt-4">
                <Label className="text-sm font-semibold mb-3 block">Formulaire DOC1</Label>
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                  <span className="text-sm font-medium text-blue-800">DOC1 - Formulaire de demande d'accréditation</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0 h-7 px-2 border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={async () => {
                      try {
                        const response = await fetch(`http://localhost:8082/api/candidatures/oec/${selectedApplication.id}/doc1`, {
                          credentials: "include"
                        });
                        if (!response.ok) throw new Error("Erreur lors du téléchargement");
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = `DOC1_${selectedApplication.organizationName.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
                        a.click();
                        URL.revokeObjectURL(url);
                      } catch (err) {
                        toast({ title: "Erreur", description: "Impossible de télécharger le DOC1", variant: "destructive" });
                      }
                    }}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Télécharger
                  </Button>
                </div>
              </div>

              {/* Documents joints */}
              {selectedApplication.documentsJson && (() => {
                try {
                  const docs: Array<{key?: string, name: string, base64?: string, mimeType?: string}> = JSON.parse(selectedApplication.documentsJson);
                  if (!docs || docs.length === 0) return null;
                  return (
                    <div className="border-t pt-4">
                      <Label className="text-sm font-semibold mb-3 block">Documents joints</Label>
                      <div className="space-y-2">
                        {docs.map((doc, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 rounded border">
                            <span className="text-sm truncate flex-1 mr-2">{doc.name}</span>
                            {doc.base64 ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="shrink-0 h-7 px-2"
                                onClick={() => {
                                  const mime = doc.mimeType || "application/octet-stream";
                                  const byteChars = atob(doc.base64!);
                                  const byteArr = new Uint8Array(byteChars.length);
                                  for (let j = 0; j < byteChars.length; j++) byteArr[j] = byteChars.charCodeAt(j);
                                  const blob = new Blob([byteArr], { type: mime });
                                  const url = URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = doc.name;
                                  a.click();
                                  URL.revokeObjectURL(url);
                                }}
                              >
                                <Download className="w-3 h-3 mr-1" />
                                Télécharger
                              </Button>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Confirmé (sans fichier)</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                } catch { return null; }
              })()}
              
              {selectedApplication.status === "PENDING" && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button 
                    variant="default" 
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleApprove(selectedApplication.id)}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approuver
                  </Button>
                  
                  <Button 
                    variant="destructive" 
                    className="flex-1"
                    onClick={() => setShowRejectDialog(true)}
                    disabled={actionLoading}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Refuser
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de refus */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refuser la candidature</DialogTitle>
            <DialogDescription>
              Veuillez indiquer le motif de refus. Le candidat sera notifié par email.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Motif de refus <span className="text-red-500">*</span></Label>
              <Textarea 
                placeholder="Indiquez les raisons du refus..."
                rows={5}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowRejectDialog(false);
                setRejectionReason("");
              }}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleReject}
              disabled={actionLoading || !rejectionReason.trim()}
            >
              Confirmer le refus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
