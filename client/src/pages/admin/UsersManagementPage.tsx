import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { AddUserDialog } from "@/components/AddUserDialog";
import { 
  Search, 
  UserPlus, 
  Eye, 
  MoreHorizontal, 
  Download,
  Loader2,
  Users,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  Phone,
  User,
  Calendar
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

interface ActiveUser {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: string;
  userType: string;
  status: string;
  telephone?: string;
  dateInscription?: string;
  fonction?: string;
}

interface PendingApplication {
  id: number;
  organizationName: string;
  typeOrganisme: string;
  adresseSiege: string;
  phone: string;
  email: string;
  nomRepresentant: string;
  fonction: string;
  porteeAccreditation: string;
  status: string;
  createdAt: string;
  dateApprobation?: string;
}

export default function UsersManagementPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  
  // Active Users State
  const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([]);
  const [activeUsersLoading, setActiveUsersLoading] = useState(true);
  const [activeUsersSearch, setActiveUsersSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("APPROVED");
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);
  
  // Pending Applications State
  const [pendingApplications, setPendingApplications] = useState<PendingApplication[]>([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [pendingSearch, setPendingSearch] = useState("");
  const [selectedApplication, setSelectedApplication] = useState<PendingApplication | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showCreateAccountDialog, setShowCreateAccountDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchActiveUsers();
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

  // Active Users Functions
  const fetchActiveUsers = async () => {
    try {
      setActiveUsersLoading(true);
      const response = await fetch("http://localhost:8082/api/users", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setActiveUsers(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les utilisateurs",
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
      setActiveUsersLoading(false);
    }
  };

  // Pending Applications Functions
  const fetchPendingApplications = async () => {
    try {
      setPendingLoading(true);
      const response = await fetch("http://localhost:8082/api/candidatures/oec/approved", {
        credentials: "include"
      });
      if (response.ok) {
        const data = await response.json();
        setPendingApplications(data);
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
      setPendingLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    if (!selectedApplication) return;

    if (!confirm("Confirmer la création du compte pour cet OEC ? Un email avec les identifiants sera envoyé.")) {
      return;
    }

    setActionLoading(true);
    try {
      const response = await fetch(`http://localhost:8082/api/candidatures/oec/${selectedApplication.id}/create-account`, {
        method: "POST",
        credentials: "include"
      });

      if (response.ok) {
        toast({
          title: "Succès",
          description: "Le compte OEC a été créé avec succès. Les identifiants ont été envoyés par email.",
        });
        
        fetchPendingApplications();
        fetchActiveUsers();
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

  const getInitials = (prenom?: string, nom?: string) => {
    const p = prenom || "";
    const n = nom || "";
    return `${p.charAt(0)}${n.charAt(0)}`.toUpperCase() || "??";
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-[#7C3AED]", "bg-[#059669]", "bg-[#F59E42]", 
      "bg-[#3B82F6]", "bg-[#EF4444]", "bg-[#8B5CF6]"
    ];
    return colors[index % colors.length];
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN": return "bg-purple-100 text-purple-800";
      case "OEC": return "bg-blue-100 text-blue-800";
      case "DT": return "bg-green-100 text-green-800";
      case "RA": return "bg-orange-100 text-orange-800";
      case "EXPERT": return "bg-pink-100 text-pink-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-green-100 text-green-800">Actif</Badge>;
      case "PENDING":
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case "REJECTED":
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredActiveUsers = activeUsers.filter(u => {
    const matchesSearch = 
      u.nom?.toLowerCase().includes(activeUsersSearch.toLowerCase()) ||
      u.prenom?.toLowerCase().includes(activeUsersSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(activeUsersSearch.toLowerCase()) ||
      u.role?.toLowerCase().includes(activeUsersSearch.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || u.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const filteredPendingApplications = pendingApplications.filter(app => {
    const matchesSearch = 
      app.organizationName.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      app.nomRepresentant?.toLowerCase().includes(pendingSearch.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold">Gestion des Utilisateurs</h1>
                <p className="text-muted-foreground">
                  Gérer les utilisateurs actifs et les candidatures en attente
                </p>
              </div>
              <Button onClick={() => setShowAddUserDialog(true)}>
                <UserPlus className="w-4 h-4 mr-2" />
                Ajouter un utilisateur
              </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Utilisateurs Actifs</p>
                      <p className="text-3xl font-bold">{activeUsers.filter(u => u.status === "APPROVED").length}</p>
                    </div>
                    <Users className="w-10 h-10 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">En attente de compte</p>
                      <p className="text-3xl font-bold">{pendingApplications.length}</p>
                    </div>
                    <Clock className="w-10 h-10 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Utilisateurs</p>
                      <p className="text-3xl font-bold">{activeUsers.length}</p>
                    </div>
                    <Building2 className="w-10 h-10 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs for Active Users and Pending Applications */}
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full md:w-auto grid-cols-2">
                <TabsTrigger value="active" className="gap-2">
                  <Users className="w-4 h-4" />
                  Utilisateurs Actifs ({activeUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Candidatures Approuvées ({pendingApplications.length})
                </TabsTrigger>
              </TabsList>

              {/* Active Users Tab */}
              <TabsContent value="active" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rechercher et Filtrer</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input 
                          placeholder="Nom, prénom, email, rôle..."
                          value={activeUsersSearch}
                          onChange={(e) => setActiveUsersSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="APPROVED">Actifs</SelectItem>
                          <SelectItem value="PENDING">En attente</SelectItem>
                          <SelectItem value="REJECTED">Rejetés</SelectItem>
                          <SelectItem value="all">Tous</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Liste des utilisateurs ({filteredActiveUsers.length})</CardTitle>
                      <Button variant="outline" size="sm">
                        <Download className="w-4 h-4 mr-2" />
                        Exporter
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {activeUsersLoading ? (
                      <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                    ) : filteredActiveUsers.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground">Aucun utilisateur trouvé</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Utilisateur</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Rôle</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead>Inscription</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredActiveUsers.map((u, index) => (
                              <TableRow key={u.id}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className={cn(
                                      "w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold",
                                      getAvatarColor(index)
                                    )}>
                                      {getInitials(u.prenom, u.nom)}
                                    </div>
                                    <div>
                                      <p className="font-medium">{u.prenom} {u.nom}</p>
                                      {u.telephone && <p className="text-xs text-muted-foreground">{u.telephone}</p>}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>{u.email}</TableCell>
                                <TableCell>
                                  <Badge className={getRoleBadgeColor(u.role)}>
                                    {u.role}
                                  </Badge>
                                </TableCell>
                                <TableCell>{u.userType || "N/A"}</TableCell>
                                <TableCell>{getStatusBadge(u.status)}</TableCell>
                                <TableCell>{u.dateInscription || "N/A"}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="sm">
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
              </TabsContent>

              {/* Pending Applications Tab */}
              <TabsContent value="pending" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rechercher</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input 
                        placeholder="Nom d'organisme, email, représentant..."
                        value={pendingSearch}
                        onChange={(e) => setPendingSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Candidatures approuvées ({filteredPendingApplications.length})</CardTitle>
                    <CardDescription>
                      Ces organismes ont été approuvés par le DT et attendent la création de leur compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {pendingLoading ? (
                      <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                    ) : filteredPendingApplications.length === 0 ? (
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
                            {filteredPendingApplications.map((app) => (
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
                                    onClick={() => {
                                      setSelectedApplication(app);
                                      setShowCreateAccountDialog(true);
                                    }}
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
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Add User Dialog */}
      <AddUserDialog 
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSuccess={() => {
          fetchActiveUsers();
          setShowAddUserDialog(false);
        }}
      />

      {/* Application Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la candidature #{selectedApplication?.id}</DialogTitle>
            <DialogDescription>{selectedApplication?.organizationName}</DialogDescription>
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
              </div>
              
              <div className="pt-4 border-t">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    setShowDetailsDialog(false);
                    setShowCreateAccountDialog(true);
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

      {/* Create Account Dialog */}
      <Dialog open={showCreateAccountDialog} onOpenChange={setShowCreateAccountDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un compte OEC</DialogTitle>
            <DialogDescription>{selectedApplication?.organizationName}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Confirmation :</strong> Un mot de passe sera généré automatiquement et envoyé par email à l'organisme avec ses identifiants de connexion.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Email de l'organisme</Label>
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
              onClick={() => setShowCreateAccountDialog(false)}
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
  );
}
