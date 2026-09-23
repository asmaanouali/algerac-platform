import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Shield, Search, Plus, Loader2, Users, Pencil, Trash2, KeyRound } from "lucide-react";

interface RoleDef {
  id: number;
  name: string;
  code: string;
  description?: string;
  userCount?: number;
  usersCount?: number;
  permissions?: string[];
  active?: boolean;
}

interface PermissionGroup {
  category: string;
  permissions: string[];
}

export default function RolesPermissionsPage() {
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleDef[]>([]);
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDelete, setShowDelete] = useState<RoleDef | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", description: "", permissions: [] as string[] });

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await apiRequest("GET", "/api/admin/roles");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setRoles(Array.isArray(data) ? data : []);
    } catch (err) {
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const res = await apiRequest("GET", "/api/admin/roles/permissions");
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setPermissionCatalog(Array.isArray(data) ? data : []);
    } catch (err) {
      setPermissionCatalog([]);
    }
  };

  const allPermissions = permissionCatalog.flatMap((g) => g.permissions);

  const togglePermission = (perm: string) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(perm)
        ? prev.permissions.filter((p) => p !== perm)
        : [...prev.permissions, perm],
    }));
  };

  const handleCreate = async () => {
    if (!form.name || !form.code) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom et le code sont requis." });
      return;
    }
    setCreating(true);
    try {
      await apiRequest("POST", "/api/admin/roles", form);
      toast({ title: "Rôle créé", description: `Le rôle "${form.name}" a été créé avec succès.` });
      setShowCreate(false);
      setForm({ name: "", code: "", description: "", permissions: [] });
      fetchRoles();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de créer le rôle" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!showDelete) return;
    setDeleting(true);
    try {
      await apiRequest("DELETE", `/api/admin/roles/${showDelete.id}`);
      toast({ title: "Rôle supprimé", description: `Le rôle "${showDelete.name}" a été supprimé.` });
      setShowDelete(null);
      fetchRoles();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de supprimer le rôle" });
    } finally {
      setDeleting(false);
    }
  };

  const filteredRoles = roles.filter(
    (r) =>
      (r.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (r.code || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalUsers = roles.reduce((sum, r) => sum + (r.usersCount ?? r.userCount ?? 0), 0);

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Gestion des Rôles et Permissions
              </h1>
              <p className="text-muted-foreground">Gérez les rôles utilisateurs et leurs permissions d'accès à la plateforme</p>
            </div>
            <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowCreate(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Créer un Rôle
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Rôles définis</p>
                  <p className="text-3xl font-bold">{roles.length}</p>
                </div>
                <Shield className="w-10 h-10 text-primary" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Utilisateurs assignés</p>
                  <p className="text-3xl font-bold">{totalUsers}</p>
                </div>
                <Users className="w-10 h-10 text-blue-500" />
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Permissions disponibles</p>
                  <p className="text-3xl font-bold">{allPermissions.length}</p>
                </div>
                <KeyRound className="w-10 h-10 text-amber-500" />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle>Liste des rôles</CardTitle>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Rechercher un rôle..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredRoles.length === 0 ? (
                <p className="text-center py-12 text-muted-foreground">Aucun rôle trouvé</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rôle</TableHead>
                        <TableHead>Utilisateurs</TableHead>
                        <TableHead>Permissions</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRoles.map((role) => {
                        const usersCount = role.usersCount ?? role.userCount ?? 0;
                        const perms = role.permissions || [];
                        return (
                          <TableRow key={role.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{role.name}</p>
                                <Badge variant="outline" className="font-mono text-[10px] mt-1">{role.code}</Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="w-3.5 h-3.5 text-muted-foreground" /> {usersCount}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-md">
                                {perms.slice(0, 2).map((p) => (
                                  <Badge key={p} className="bg-green-100 text-green-800 text-[10px]">{p}</Badge>
                                ))}
                                {perms.length > 2 && (
                                  <Badge variant="outline" className="text-[10px]">+{perms.length - 2}</Badge>
                                )}
                                {perms.length === 0 && (
                                  <span className="text-xs text-muted-foreground">Aucune</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right space-x-1">
                              <Button variant="ghost" size="sm">
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-destructive hover:text-destructive"
                                onClick={() => setShowDelete(role)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer un nouveau rôle</DialogTitle>
            <DialogDescription>Définissez le nom, le code et les permissions du rôle</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom du rôle</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex: Gestionnaire de contenu" />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="Ex: CONTENT_MANAGER" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description du rôle et de ses responsabilités" />
            </div>
            <div className="space-y-2">
              <Label>Permissions</Label>
              <div className="space-y-3 p-3 border rounded-lg bg-slate-50 max-h-64 overflow-y-auto">
                {permissionCatalog.map((group) => (
                  <div key={group.category}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">{group.category}</p>
                    <div className="grid md:grid-cols-2 gap-2">
                      {group.permissions.map((perm) => (
                        <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.permissions.includes(perm)}
                            onChange={() => togglePermission(perm)}
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          {perm}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Créer le rôle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!showDelete} onOpenChange={(open) => !open && setShowDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le rôle</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer le rôle "{showDelete?.name}" ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDelete(null)} disabled={deleting}>Annuler</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
