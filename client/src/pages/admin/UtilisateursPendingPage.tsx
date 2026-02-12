import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { 
  Search, 
  Eye, 
  UserPlus,
  Building2,
  Mail,
  Phone,
  User,
  Calendar,
  CheckCircle2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PendingOECApplication {
  id: number;
  nomOrganisme: string;
  typeOrganisme: string;
  adresseSiege: string;
  telephone: string;
  email: string;
  nomRepresentant: string;
  fonction: string;
  porteeAccreditation: string;
  status: string;
  createdAt: string;
  reviewedByDtAt?: string;
}

export default function UtilisateursPendingPage() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<PendingOECApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<PendingOECApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Données du compte à créer
  const [accountData, setAccountData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  const fetchPendingApplications = async () => {
    try {
      const response = await fetch("http://localhost:8082/api/oec-applications/approved-for-admin", {
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

  const handleCreateAccount = async () => {
    if (!selectedApplication) return;

    // Validation
    if (!accountData.email || !accountData.password || !accountData.confirmPassword) {
      toast({
        title: "Attention",
        description: "Veuillez remplir tous les champs",
        variant: "destructive"
      });
      return;
    }

    if (accountData.password !== accountData.confirmPassword) {
      toast({
        title: "Attention",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive"
      });
      return;
    }

    if (accountData.password.length < 6) {
      toast({
        title: "Attention",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive"
      });
      return;
    }

    setActionLoading(true);
    try {
      // TODO: Créer l'utilisateur OEC via l'API
      // Pour l'instant, on marque juste la candidature comme traitée
      const response = await fetch(`http://localhost:8082/api/oec-applications/${selectedApplication.id}/mark-account-created`, {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Le compte OEC a été créé avec succès",
        });
        fetchPendingApplications();
        setShowCreateAccountDialog(false);
        setShowDetailsDialog(false);
        setAccountData({ email: "", password: "", confirmPassword: "" });
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
    setAccountData({
      email: app.email,
      password: "",
      confirmPassword: ""
    });
    setShowCreateAccountDialog(true);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.nomOrganisme.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.nomRepresentant?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-64 overflow-y-auto">
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Utilisateurs OEC en Attente</h1>
              <p className="text-muted-foreground">
                Candidatures OEC approuvées par le DT nécessitant la création d'un compte
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
          <CardTitle>Liste des OEC approuvés ({filteredApplications.length})</CardTitle>
          <CardDescription>
            Ces organismes ont été approuvés par le DT et attendent la création de leur compte
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
                          <p className="font-medium">{app.nomOrganisme}</p>
                          <p className="text-sm text-muted-foreground">{app.typeOrganisme}</p>
                        </div>
                      </TableCell>
                      <TableCell>{app.nomRepresentant || "N/A"}</TableCell>
                      <TableCell>{app.email}</TableCell>
                      <TableCell>{app.reviewedByDtAt || app.createdAt}</TableCell>
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
                  <Label className="text-muted-foreground">Approuvé le</Label>
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {selectedApplication.reviewedByDtAt || "N/A"}
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
            <DialogTitle>Créer un compte OEC</DialogTitle>
            <DialogDescription>
              {selectedApplication?.nomOrganisme}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note :</strong> Un email sera envoyé à l'organisme avec ses identifiants de connexion.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email de connexion <span className="text-red-500">*</span></Label>
              <Input 
                type="email"
                placeholder="email@exemple.dz"
                value={accountData.email}
                onChange={(e) => setAccountData({...accountData, email: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Mot de passe <span className="text-red-500">*</span></Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={accountData.password}
                onChange={(e) => setAccountData({...accountData, password: e.target.value})}
              />
              <p className="text-xs text-muted-foreground">Minimum 6 caractères</p>
            </div>

            <div className="space-y-2">
              <Label>Confirmer le mot de passe <span className="text-red-500">*</span></Label>
              <Input 
                type="password"
                placeholder="••••••••"
                value={accountData.confirmPassword}
                onChange={(e) => setAccountData({...accountData, confirmPassword: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowCreateAccountDialog(false);
                setAccountData({ email: "", password: "", confirmPassword: "" });
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
              Créer le compte
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
