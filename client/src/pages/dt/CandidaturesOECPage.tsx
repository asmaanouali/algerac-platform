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
  AlertCircle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface OECApplication {
  id: number;
  nomOrganisme: string;
  typeOrganisme: string;
  adresseSiege: string;
  telephone: string;
  email: string;
  nomRepresentant: string;
  fonction: string;
  porteeAccreditation: string;
  status: "PENDING_DT" | "APPROVED_BY_DT" | "REJECTED_BY_DT" | "ACCOUNT_CREATED";
  rejectionReason?: string;
  createdAt: string;
  reviewedByDtAt?: string;
}

export default function CandidaturesOECPage() {
  const { toast } = useToast();
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
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const response = await fetch("http://localhost:8082/api/oec-applications/all", {
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
    if (!confirm("Êtes-vous sûr de vouloir approuver cette candidature ?")) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/oec-applications/${id}/approve`, {
        method: "POST",
        credentials: "include"
      });
      
      if (response.ok) {
        toast({
          title: "Succès",
          description: "La candidature a été approuvée. L'administrateur a été notifié.",
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
      const response = await fetch(`http://localhost:8082/api/oec-applications/${selectedApplication.id}/reject`, {
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
      case "PENDING_DT":
        return <Badge className="bg-yellow-500">En attente</Badge>;
      case "APPROVED_BY_DT":
        return <Badge className="bg-green-500">Approuvé</Badge>;
      case "REJECTED_BY_DT":
        return <Badge className="bg-red-500">Rejeté</Badge>;
      case "ACCOUNT_CREATED":
        return <Badge className="bg-blue-500">Compte créé</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.nomOrganisme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.nomRepresentant?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Candidatures OEC</h1>
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
                  <SelectItem value="PENDING_DT">En attente</SelectItem>
                  <SelectItem value="APPROVED_BY_DT">Approuvé</SelectItem>
                  <SelectItem value="REJECTED_BY_DT">Rejeté</SelectItem>
                  <SelectItem value="ACCOUNT_CREATED">Compte créé</SelectItem>
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
                  {applications.filter(a => a.status === "PENDING_DT").length}
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
                  {applications.filter(a => a.status === "APPROVED_BY_DT").length}
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
                  {applications.filter(a => a.status === "REJECTED_BY_DT").length}
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
                          <p className="font-medium">{app.nomOrganisme}</p>
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
              {selectedApplication?.nomOrganisme}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Organisme</Label>
                  <p className="font-medium">{selectedApplication.nomOrganisme}</p>
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
                    {selectedApplication.telephone || "Non renseigné"}
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
              
              {selectedApplication.status === "PENDING_DT" && (
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
  );
}
