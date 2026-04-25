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
  Calendar,
  CreditCard,
  ShieldCheck
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/queryClient";

interface OECAccountApplication {
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
  depositFeeAmount?: number;
  paymentVerifiedAt?: string;
}

interface NewOECPending {
  id: number;
  nomOrganisme: string;
  typeOrganisme: string;
  adresseSiege: string;
  email: string;
  telephone: string;
  nomRepresentant: string;
  fonction: string;
  porteeAccreditation: string;
  typeDemande: string;
  createdAt: string;
}

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
  // Common
  email: string;
  phone?: string;
  telephone?: string;
  status: string;
  createdAt: string;
  dateApprobation?: string;
}

const getApplicationDisplayName = (app: PendingApplication): string =>
  app.organizationName || app.fullName || app.email;

const getApplicationType = (app: PendingApplication): string => {
  if (app.userType) return app.userType;
  return "OEC";
};

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

  // OEC Accounts State (payment verified, awaiting account creation)
  const [oecAccountApps, setOecAccountApps] = useState<OECAccountApplication[]>([]);
  const [oecAccountsLoading, setOecAccountsLoading] = useState(true);
  const [oecAccountsSearch, setOecAccountsSearch] = useState("");
  const [oecCreating, setOecCreating] = useState(false);
  const [oecConfirmApp, setOecConfirmApp] = useState<OECAccountApplication | null>(null);
  const [showOecConfirmDialog, setShowOecConfirmDialog] = useState(false);

  // New OEC pending account creation (DT-approved, no account yet)
  const [newOecPending, setNewOecPending] = useState<NewOECPending[]>([]);
  const [newOecLoading, setNewOecLoading] = useState(true);
  const [newOecActivating, setNewOecActivating] = useState<number | null>(null);
  const [newOecConfirm, setNewOecConfirm] = useState<NewOECPending | null>(null);
  const [showNewOecConfirmDialog, setShowNewOecConfirmDialog] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchActiveUsers();
      fetchPendingApplications();
      fetchOecAccountApps();
      fetchNewOecPending();
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
      const response = await fetch("/api/users", {
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
      const [oecRes, expertRes] = await Promise.all([
        fetch("/api/candidatures/oec/approved", { credentials: "include" }),
        fetch("/api/candidatures/experts/approved", { credentials: "include" })
      ]);
      const oecData = oecRes.ok ? await oecRes.json() : [];
      const expertData = expertRes.ok ? await expertRes.json() : [];
      setPendingApplications([...oecData, ...expertData]);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setPendingLoading(false);
    }
  };

  // OEC Account Applications Functions
  const fetchOecAccountApps = async () => {
    try {
      setOecAccountsLoading(true);
      const res = await apiRequest("GET", "/api/oec-applications/approved-for-admin");
      const data = await res.json();
      setOecAccountApps(data);
    } catch (err) {
      setOecAccountApps([]);
    } finally { setOecAccountsLoading(false); }
  };

  const handleCreateOecAccount = async () => {
    if (!oecConfirmApp) return;
    try {
      setOecCreating(true);
      await apiRequest("POST", `/api/oec-applications/${oecConfirmApp.id}/mark-account-created`);
      toast({
        title: "Succès",
        description: `Le compte OEC pour ${oecConfirmApp.nomOrganisme} a été créé.`,
      });
      setShowOecConfirmDialog(false);
      fetchOecAccountApps();
      fetchActiveUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de créer le compte" });
    } finally { setOecCreating(false); }
  };

  // New OEC (from /oecregister, no account) — fetch + activate
  const fetchNewOecPending = async () => {
    try {
      setNewOecLoading(true);
      const res = await fetch("/api/users/pending-new-oec", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setNewOecPending(Array.isArray(data) ? data : []);
      } else {
        setNewOecPending([]);
      }
    } catch {
      setNewOecPending([]);
    } finally {
      setNewOecLoading(false);
    }
  };

  const handleActivateNewOec = async () => {
    if (!newOecConfirm) return;
    try {
      setNewOecActivating(newOecConfirm.id);
      const res = await apiRequest("POST", `/api/users/${newOecConfirm.id}/activate-oec`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur lors de la création du compte");
      toast({
        title: "Compte créé",
        description: `Le compte OEC pour ${newOecConfirm.nomOrganisme} a été activé et les identifiants ont été envoyés par email.`,
      });
      setShowNewOecConfirmDialog(false);
      fetchNewOecPending();
      fetchActiveUsers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible d'activer le compte" });
    } finally {
      setNewOecActivating(null);
    }
  };

  const filteredOecAccountApps = oecAccountApps.filter(a =>
    (a.nomOrganisme || "").toLowerCase().includes(oecAccountsSearch.toLowerCase()) ||
    (a.email || "").toLowerCase().includes(oecAccountsSearch.toLowerCase()) ||
    (a.nomRepresentant || "").toLowerCase().includes(oecAccountsSearch.toLowerCase())
  );

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    try { return new Date(dateStr).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" }); }
    catch { return dateStr; }
  };

  const handleCreateAccount = async () => {
    if (!selectedApplication) return;
    const isExpert = !!selectedApplication.userType;
    const typeName = isExpert ? selectedApplication.userType : "OEC";
    const endpoint = isExpert
      ? `/api/candidatures/experts/${selectedApplication.id}/create-account`
      : `/api/candidatures/oec/${selectedApplication.id}/create-account`;

    setActionLoading(true);
    try {
      const response = await fetch(endpoint, { method: "POST", credentials: "include" });

      if (response.ok) {
        toast({
          title: "Succès",
          description: `Le compte ${typeName} a été créé avec succès. Les identifiants ont été envoyés par email.`,
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
      case "CANDIDATURE_APPROVED":
        return <Badge className="bg-blue-100 text-blue-800">Approuvé (compte en attente)</Badge>;
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
    const name = getApplicationDisplayName(app);
    const matchesSearch = 
      name.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      app.email.toLowerCase().includes(pendingSearch.toLowerCase()) ||
      (app.nomRepresentant?.toLowerCase().includes(pendingSearch.toLowerCase()) ?? false);
    
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
              <TabsList className="grid w-full md:w-auto grid-cols-3">
                <TabsTrigger value="active" className="gap-2">
                  <Users className="w-4 h-4" />
                  Utilisateurs ({activeUsers.length})
                </TabsTrigger>
                <TabsTrigger value="pending" className="gap-2">
                  <Clock className="w-4 h-4" />
                  Candidatures ({pendingApplications.length})
                </TabsTrigger>
                <TabsTrigger value="oec-accounts" className="gap-2">
                  <CreditCard className="w-4 h-4" />
                  Comptes OEC ({oecAccountApps.length + newOecPending.length})
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
                      Candidatures (OEC, Experts, Évaluateurs, Formateurs) approuvées en attente de création de compte
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
                              <TableHead>Type</TableHead>
                              <TableHead>Nom / Organisme</TableHead>
                              <TableHead>Contact</TableHead>
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
                                  <Badge className={app.userType ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                                    {getApplicationType(app)}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div>
                                    <p className="font-medium">{getApplicationDisplayName(app)}</p>
                                    <p className="text-sm text-muted-foreground">{app.typeOrganisme || app.domaineExpertise || ""}</p>
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

              {/* OEC Accounts Tab */}
              <TabsContent value="oec-accounts" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Rechercher</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        placeholder="Nom d'organisme, email, représentant..."
                        value={oecAccountsSearch}
                        onChange={(e) => setOecAccountsSearch(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* New OECs from /oecregister whose DT approved the request */}
                <Card className={newOecPending.length > 0 ? "ring-2 ring-amber-300" : ""}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-600" />
                      Nouveaux OEC — validés par DT ({newOecPending.length})
                    </CardTitle>
                    <CardDescription>
                      OEC inscrits via le formulaire public dont le dossier a été approuvé par la Direction Technique. Créez leur compte pour qu'ils puissent se connecter.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {newOecLoading ? (
                      <p className="text-center py-6 text-muted-foreground">Chargement...</p>
                    ) : newOecPending.length === 0 ? (
                      <div className="text-center py-8 space-y-2">
                        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
                        <p className="text-sm text-muted-foreground">Aucun nouveau OEC en attente de compte</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Organisme</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Représentant</TableHead>
                              <TableHead>Portée</TableHead>
                              <TableHead>Soumis le</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {newOecPending
                              .filter(o =>
                                (o.nomOrganisme || "").toLowerCase().includes(oecAccountsSearch.toLowerCase()) ||
                                (o.email || "").toLowerCase().includes(oecAccountsSearch.toLowerCase()) ||
                                (o.nomRepresentant || "").toLowerCase().includes(oecAccountsSearch.toLowerCase())
                              )
                              .map((oec) => (
                                <TableRow key={oec.id}>
                                  <TableCell className="font-medium">{oec.nomOrganisme}</TableCell>
                                  <TableCell>
                                    <Badge className="bg-orange-100 text-orange-700 border-orange-200" variant="outline">
                                      {oec.typeOrganisme || "OEC"}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{oec.email}</TableCell>
                                  <TableCell>{oec.nomRepresentant || "—"}</TableCell>
                                  <TableCell className="max-w-[180px] truncate text-xs text-muted-foreground">{oec.porteeAccreditation || "—"}</TableCell>
                                  <TableCell>{formatDate(oec.createdAt)}</TableCell>
                                  <TableCell className="text-right">
                                    <Button
                                      size="sm"
                                      className="bg-amber-600 hover:bg-amber-700"
                                      disabled={newOecActivating === oec.id}
                                      onClick={() => {
                                        setNewOecConfirm(oec);
                                        setShowNewOecConfirmDialog(true);
                                      }}
                                    >
                                      {newOecActivating === oec.id
                                        ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                                        : <UserPlus className="w-3.5 h-3.5 mr-1" />
                                      }
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

                {/* Original DAG-verified OEC applications */}
                <Card>
                  <CardHeader>
                    <CardTitle>Candidatures OEC vérifiées ({filteredOecAccountApps.length})</CardTitle>
                    <CardDescription>
                      Candidatures OEC dont le paiement a été vérifié par la DAG — en attente de création de compte
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {oecAccountsLoading ? (
                      <p className="text-center py-8 text-muted-foreground">Chargement...</p>
                    ) : filteredOecAccountApps.length === 0 ? (
                      <div className="text-center py-12 space-y-4">
                        <CheckCircle2 className="w-16 h-16 mx-auto text-green-500" />
                        <div>
                          <p className="text-lg font-medium">Aucune candidature OEC en attente</p>
                          <p className="text-muted-foreground">Toutes les candidatures OEC vérifiées ont été traitées</p>
                        </div>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Organisme</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Représentant</TableHead>
                              <TableHead>Montant payé</TableHead>
                              <TableHead>Paiement vérifié le</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredOecAccountApps.map((app) => (
                              <TableRow key={app.id}>
                                <TableCell className="font-medium">{app.nomOrganisme}</TableCell>
                                <TableCell>
                                  <Badge className="bg-purple-100 text-purple-800">{app.typeOrganisme}</Badge>
                                </TableCell>
                                <TableCell>{app.email}</TableCell>
                                <TableCell>{app.nomRepresentant}</TableCell>
                                <TableCell>{app.depositFeeAmount ? `${app.depositFeeAmount} DA` : "—"}</TableCell>
                                <TableCell>{app.paymentVerifiedAt ? formatDate(app.paymentVerifiedAt) : "—"}</TableCell>
                                <TableCell className="text-right">
                                  <Button
                                    variant="default"
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => {
                                      setOecConfirmApp(app);
                                      setShowOecConfirmDialog(true);
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

      {/* OEC Account Confirm Dialog (DAG flow) */}
      <Dialog open={showOecConfirmDialog} onOpenChange={setShowOecConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la création du compte OEC</DialogTitle>
            <DialogDescription>
              Vous êtes sur le point de créer un compte pour cet organisme OEC.
            </DialogDescription>
          </DialogHeader>
          {oecConfirmApp && (
            <div className="space-y-2 text-sm">
              <p><strong>Organisme :</strong> {oecConfirmApp.nomOrganisme}</p>
              <p><strong>Type :</strong> {oecConfirmApp.typeOrganisme}</p>
              <p><strong>Email :</strong> {oecConfirmApp.email}</p>
              <p><strong>Représentant :</strong> {oecConfirmApp.nomRepresentant}</p>
              <p><strong>Montant :</strong> {oecConfirmApp.depositFeeAmount ? `${oecConfirmApp.depositFeeAmount} DA` : "—"}</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOecConfirmDialog(false)}>Annuler</Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              disabled={oecCreating}
              onClick={handleCreateOecAccount}
            >
              {oecCreating ? "Création..." : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <AddUserDialog 
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSuccess={() => {
          fetchActiveUsers();
          setShowAddUserDialog(false);
        }}
      />

      {/* New OEC Activation Confirm Dialog */}
      <Dialog open={showNewOecConfirmDialog} onOpenChange={setShowNewOecConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer le compte OEC</DialogTitle>
            <DialogDescription>
              Un mot de passe temporaire sera généré et envoyé par email à l'organisme.
            </DialogDescription>
          </DialogHeader>
          {newOecConfirm && (
            <div className="space-y-2 text-sm">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-1">
                <p><strong>Organisme :</strong> {newOecConfirm.nomOrganisme}</p>
                <p><strong>Type :</strong> {newOecConfirm.typeOrganisme}</p>
                <p><strong>Email :</strong> {newOecConfirm.email}</p>
                <p><strong>Représentant :</strong> {newOecConfirm.nomRepresentant || "—"}</p>
                <p><strong>Portée :</strong> {newOecConfirm.porteeAccreditation || "—"}</p>
                <p><strong>Type de demande :</strong> {newOecConfirm.typeDemande || "initiale"}</p>
              </div>
              <p className="text-xs text-muted-foreground">
                L'OEC recevra un email contenant ses identifiants de connexion et un message confirmant que son dossier a été accepté.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewOecConfirmDialog(false)} disabled={!!newOecActivating}>
              Annuler
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-700"
              disabled={!!newOecActivating}
              onClick={handleActivateNewOec}
            >
              {newOecActivating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
              Confirmer et envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails de la candidature #{selectedApplication?.id}</DialogTitle>
            <DialogDescription>{selectedApplication && getApplicationDisplayName(selectedApplication)}</DialogDescription>
          </DialogHeader>
          
          {selectedApplication && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Type</Label>
                  <Badge className={selectedApplication.userType ? "bg-purple-100 text-purple-800" : "bg-blue-100 text-blue-800"}>
                    {getApplicationType(selectedApplication)}
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
            <DialogTitle>Créer un compte</DialogTitle>
            <DialogDescription>{selectedApplication && getApplicationDisplayName(selectedApplication)}</DialogDescription>
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
