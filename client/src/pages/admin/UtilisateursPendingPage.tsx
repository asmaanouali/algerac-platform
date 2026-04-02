import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { 
  Search, 
  Eye, 
  UserPlus,
  Building2,
  Mail,
  Phone,
  User,
  Calendar,
  CheckCircle2,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface PendingOECApplication {
  id: number;
  // OEC fields
  organizationName?: string;
  typeOrganisme?: string;
  adresseSiege?: string;
  nomRepresentant?: string;
  fonction?: string;
  porteeAccreditation?: string;
  // Expert/Évaluateur/Formateur fields
  fullName?: string;
  userType?: string;
  domaineExpertise?: string;
  telephone?: string;
  // Common
  email: string;
  phone?: string;
  status: string;
  createdAt: string;
  dateApprobation?: string;
}

const getDisplayName = (app: PendingOECApplication) => app.organizationName || app.fullName || app.email;
const getAppType = (app: PendingOECApplication) => app.userType || "OEC";

export default function UtilisateursPendingPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [applications, setApplications] = useState<PendingOECApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<PendingOECApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchPendingApplications();
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

  const fetchPendingApplications = async () => {
    try {
      const [oecRes, expertRes] = await Promise.all([
        fetch("/api/candidatures/oec/approved", { credentials: "include" }),
        fetch("/api/candidatures/experts/approved", { credentials: "include" })
      ]);
      const oecData = oecRes.ok ? await oecRes.json() : [];
      const expertData = expertRes.ok ? await expertRes.json() : [];
      setApplications([...oecData, ...expertData]);
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

  const handleCreateAccount = async () => {
    if (!selectedApplication) return;
    const isExpert = !!selectedApplication.userType;
    const endpoint = isExpert
      ? `/api/candidatures/experts/${selectedApplication.id}/create-account`
      : `/api/candidatures/oec/${selectedApplication.id}/create-account`;

    setActionLoading(true);
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "include" });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Succès",
          description: `Le compte ${getAppType(selectedApplication)} a été créé avec succès. Les identifiants ont été envoyés par email.`,
        });
        if (result.generatedPassword) {
          console.log("Mot de passe généré :", result.generatedPassword);
        }
        fetchPendingApplications();
        setShowCreateAccountDialog(false);
        setShowDetailsDialog(false);
      } else {
        const error = await response.json();
        toast({
          title: "Erreur",
          description: error.message || "Impossible de créer le compte",
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

  const openCreateAccountDialog = (app: PendingOECApplication) => {
    setSelectedApplication(app);
    setShowCreateAccountDialog(true);
  };

  const filteredApplications = applications.filter(app => {
    const name = getDisplayName(app);
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (app.nomRepresentant?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    return matchesSearch;
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
              <h1 className="text-2xl font-bold">Candidatures Approuvées</h1>
              <p className="text-muted-foreground">
                Candidatures (OEC, Experts, Évaluateurs, Formateurs) approuvées nécessitant la création d'un compte
              </p>
            </div>
          </div>

      {/* Filtre  de recherche */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input 
              placeholder="Nom d'organisme, email, représentant..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Statistique */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">En attente de création de compte</p>
              <p className="text-4xl font-bold">{applications.length}</p>
            </div>
            <UserPlus className="w-12 h-12 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      {/* Tableau des candidatures */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des candidats approuvés ({filteredApplications.length})</CardTitle>
          <CardDescription>
            Ces candidats (OEC, Experts, Évaluateurs, Formateurs) ont été approuvés et attendent la création de leur compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">Chargement...</p>
          ) : filteredApplications.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
              <div>
                <p className="text-lg font-medium">Aucune candidature en attente</p>
                <p className="text-muted-foreground">Toutes les candidatures approuvées ont été traitées</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Organisme</TableHead>
                    <TableHead>Représentant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Approuvé le</TableHead>
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
                      <TableCell>{app.dateApprobation || app.createdAt}</TableCell>
                      <TableCell className="text-right space-x-2">
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
                        <Button 
                          variant="default" 
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                          onClick={() => openCreateAccountDialog(app)}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Créer compte
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

      {/* Dialog de détails */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la candidature #{selectedApplication?.id}</DialogTitle>
            <DialogDescription>
              {selectedApplication && getDisplayName(selectedApplication)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Type</Label>
                  <Badge className={selectedApplication.userType ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                    {getAppType(selectedApplication)}
                  </Badge>
                </div>
                {selectedApplication.organizationName && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Organisme</Label>
                    <p className="font-medium">{selectedApplication.organizationName}</p>
                  </div>
                )}
                {selectedApplication.fullName && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Nom Complet</Label>
                    <p className="font-medium">{selectedApplication.fullName}</p>
                  </div>
                )}
                {selectedApplication.typeOrganisme && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Type d&apos;organisme</Label>
                    <p>{selectedApplication.typeOrganisme}</p>
                  </div>
                )}
                {selectedApplication.domaineExpertise && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Domaine d&apos;expertise</Label>
                    <p>{selectedApplication.domaineExpertise}</p>
                  </div>
                )}
                {selectedApplication.adresseSiege && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Adresse</Label>
                    <p>{selectedApplication.adresseSiege}</p>
                  </div>
                )}
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
                    {selectedApplication.phone || selectedApplication.telephone || "Non renseigné"}
                  </p>
                </div>
                {selectedApplication.nomRepresentant && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Représentant</Label>
                    <p className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {selectedApplication.nomRepresentant}
                    </p>
                  </div>
                )}
                {selectedApplication.fonction && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Fonction</Label>
                    <p>{selectedApplication.fonction}</p>
                  </div>
                )}
                {selectedApplication.porteeAccreditation && (
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-muted-foreground">Portée d&apos;accréditation</Label>
                    <p>{selectedApplication.porteeAccreditation}</p>
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Date de candidature</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedApplication.createdAt}
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Approuvé le</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedApplication.dateApprobation || "N/A"}
                  </p>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    openCreateAccountDialog(selectedApplication);
                  }}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Créer le compte utilisateur
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog de création de compte */}
      <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un compte</DialogTitle>
            <DialogDescription>
              {selectedApplication && getDisplayName(selectedApplication)}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Confirmation :</strong> Un mot de passe sera généré automatiquement et envoyé par email au candidat avec ses identifiants de connexion.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email du candidat</Label>
              <Input 
                type="email"
                disabled
                value={selectedApplication?.email || ""}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateAccountDialog(false);
              }}
              disabled={actionLoading}
            >
              Annuler
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700"
              onClick={handleCreateAccount}
              disabled={actionLoading}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {actionLoading ? "Création en cours..." : "Créer le compte"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
}
