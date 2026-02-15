import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Download, UserPlus, Eye, MoreHorizontal, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { AddUserDialog } from "@/components/AddUserDialog";


interface User {
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

export default function UsersPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("APPROVED"); // Par défaut, afficher seulement les utilisateurs actifs
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [showAddUserDialog, setShowAddUserDialog] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      fetchUsers();
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

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8082/api/users", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
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
      setLoading(false);
    }
  };

  const getInitials = (prenom?: string, nom?: string) => {
    const p = prenom || "";
    const n = nom || "";
    return `${p.charAt(0)}${n.charAt(0)}`.toUpperCase() || "??";
  };

  const getAvatarColor = (index: number) => {
    const colors = [
      "bg-[#7C3AED]", // violet
      "bg-[#059669]", // green
      "bg-[#F59E42]", // orange
      "bg-[#2563EB]", // blue
      "bg-[#E11D48]", // pink
      "bg-[#F43F5E]", // red
      "bg-[#FACC15]", // yellow
      "bg-[#10B981]", // emerald
    ];
    return colors[index % colors.length];
  };

  const getRoleBadge = (role: string) => {
    const roleMap: { [key: string]: { label: string; color: string } } = {
      "ADMIN": { label: "Admin Système", color: "bg-green-100 text-green-700 border-green-300" },
      "DT": { label: "Direction Générale (DG)", color: "bg-blue-100 text-blue-700 border-blue-300" },
      "RA": { label: "Responsable Qualité (RQ)", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
      "ET": { label: "Évaluateur Technique (ET)", color: "bg-cyan-100 text-cyan-700 border-cyan-300" },
      "CD": { label: "Chef de Département (CD)", color: "bg-purple-100 text-purple-700 border-purple-300" },
      "SYS": { label: "Admin Système", color: "bg-green-100 text-green-700 border-green-300" },
      "EXP": { label: "Expert (EXP)", color: "bg-orange-100 text-orange-700 border-orange-300" },
      "OBS": { label: "Observateur (OBS)", color: "bg-gray-100 text-gray-700 border-gray-300" },
    };
    const key = (role || "").toUpperCase();
    const info = roleMap[key] || { label: role, color: "bg-gray-100 text-gray-700 border-gray-300" };
    return <span className={`px-2 py-1 rounded font-semibold text-xs border ${info.color}`}>{info.label}</span>;
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string, color: string, icon: JSX.Element } } = {
      "APPROVED": { label: "Actif", color: "bg-green-50 text-green-700 border-green-300", icon: <span className="mr-1">✓</span> },
      "ACTIVE": { label: "Actif", color: "bg-green-50 text-green-700 border-green-300", icon: <span className="mr-1">✓</span> },
      "PENDING": { label: "En attente", color: "bg-orange-50 text-orange-700 border-orange-300", icon: <span className="mr-1">⚠️</span> },
      "REJECTED": { label: "Inactif", color: "bg-red-50 text-red-700 border-red-300", icon: <span className="mr-1">⛔</span> },
      "INACTIF": { label: "Inactif", color: "bg-red-50 text-red-700 border-red-300", icon: <span className="mr-1">⛔</span> },
      "EN ATTENTE": { label: "En attente", color: "bg-orange-50 text-orange-700 border-orange-300", icon: <span className="mr-1">⚠️</span> },
    };
    const key = (status || "").toUpperCase();
    const info = statusMap[key] || { label: status || "Inconnu", color: "bg-gray-100 text-gray-700 border-gray-300", icon: null };
    return <span className={`inline-flex items-center px-2 py-1 rounded font-semibold text-xs border ${info.color}`}>{info.icon}{info.label}</span>;
  };

  const getDepartment = (userType?: string, fonction?: string) => {
    const deptMap: { [key: string]: string } = {
      "ADMIN": "Administration",
      "DT": "Technique",
      "RA": "Accréditation",
      "OEC": "Organisme",
      "EXPERT": "Expertise"
    };
    return fonction || deptMap[userType?.toUpperCase() || ""] || "Non défini";
  };

  const getLastConnection = (dateInscription?: string) => {
    if (!dateInscription) return "Jamais";
    
    const date = new Date(dateInscription);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return "Aujourd'hui";
    if (days === 1) return "Hier";
    if (days < 7) return `Il y a ${days} jours`;
    if (days < 30) return `Il y a ${Math.floor(days / 7)} semaine${Math.floor(days / 7) > 1 ? 's' : ''}`;
    return `Il y a ${Math.floor(days / 30)} mois`;
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      `${user.prenom} ${user.nom}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === "all" || user.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const toggleUserSelection = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Gestion des Utilisateurs</h1>
              <p className="text-slate-500 mt-1 text-base">Gérez les comptes, rôles et permissions des utilisateurs du système.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                size="default" 
                className="border-slate-200 shadow-sm"
                onClick={() => {
                  // Export logic - à implémenter
                  const csv = [
                    ['Nom', 'Prénom', 'Email', 'Rôle', 'Statut', 'Téléphone'].join(','),
                    ...filteredUsers.map(u => [
                      u.nom, u.prenom, u.email, u.role || u.userType, u.status, u.telephone || ''
                    ].join(','))
                  ].join('\\n');
                  const blob = new Blob([csv], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
                  a.click();
                  toast({ title: "Export réussi", description: "Le fichier a été téléchargé" });
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button 
                size="default" 
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-sm"
                onClick={() => setShowAddUserDialog(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Nouvel Utilisateur
              </Button>
            </div>
          </div>

          {/* Filtres */}
          <div className="bg-white rounded-xl shadow p-4 flex flex-wrap items-center gap-4 mb-6">
            <div className="relative flex-1 min-w-[220px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 rounded-lg border-slate-200"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] rounded-lg border-slate-200">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="APPROVED">Actif</SelectItem>
                <SelectItem value="PENDING">En attente</SelectItem>
                <SelectItem value="REJECTED">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <Card className="rounded-xl shadow border-slate-200">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader className="sticky top-0 z-10 bg-white border-b border-slate-200">
                    <TableRow>
                      <TableHead className="w-[50px] text-center">
                        <Checkbox 
                          checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                          onCheckedChange={toggleAllUsers}
                        />
                      </TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-xs">Utilisateur</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-xs">Rôle</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-xs">Statut</TableHead>
                      <TableHead className="font-bold text-slate-500 uppercase text-xs">Dernière Connexion</TableHead>
                      <TableHead className="text-right font-bold text-slate-500 uppercase text-xs">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                          Chargement des utilisateurs...
                        </TableCell>
                      </TableRow>
                    ) : filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-slate-400">
                          Aucun utilisateur trouvé
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((user, index) => (
                        <TableRow key={user.id} className="hover:bg-slate-50">
                          <TableCell className="text-center">
                            <Checkbox 
                              checked={selectedUsers.includes(user.id)}
                              onCheckedChange={() => toggleUserSelection(user.id)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full border-2 border-white shadow-sm ${getAvatarColor(index)} flex items-center justify-center text-white font-bold text-base`}>
                                {getInitials(user.prenom, user.nom)}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-900">
                                  {user.prenom} {user.nom}
                                </p>
                                <p className="text-sm text-slate-500">{user.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            {getRoleBadge(user.role || user.userType)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.status)}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {getLastConnection(user.dateInscription)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      <AddUserDialog
        open={showAddUserDialog}
        onOpenChange={setShowAddUserDialog}
        onSuccess={fetchUsers}
      />
    </div>
  );
}
