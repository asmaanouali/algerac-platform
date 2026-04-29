import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Loader2, FolderOpen, Search, Eye } from "lucide-react";

interface DossierItem {
  id: number;
  referenceNumber: string;
  oecName: string;
  type: string;
  domain: string;
  status: string;
  progress: number;
  createdAt: string;
}

export default function RADossiersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [dossiers, setDossiers] = useState<DossierItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user && !authLoading) {
      loadDossiers();
    }
  }, [user, authLoading]);

  const loadDossiers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/requests/assigned-to-me", { credentials: "include" });
      if (res.ok) {
        const requests = await res.json();
        setDossiers((Array.isArray(requests) ? requests : []).map((r: any) => ({
          id: r.id,
          referenceNumber: r.referenceNumber || `ACC-${r.id}`,
          oecName: r.oec?.organizationName || r.oec?.fullName || "—",
          type: r.type,
          domain: r.domain || "—",
          status: r.status,
          progress: r.progress || 0,
          createdAt: r.createdAt,
        })));
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const filtered = dossiers.filter((d) => {
    const matchSearch =
      d.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      d.oecName?.toLowerCase().includes(search.toLowerCase()) ||
      d.domain?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || d.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; className: string }> = {
      draft: { label: "Brouillon", className: "bg-gray-100 text-gray-800" },
      submitted: { label: "Soumise", className: "bg-blue-100 text-blue-800" },
      receivability_study: { label: "Étude recevabilité", className: "bg-yellow-100 text-yellow-800" },
      evaluation_in_progress: { label: "Évaluation en cours", className: "bg-purple-100 text-purple-800" },
      CERTIFICATE_ISSUED: { label: "Certificat délivré", className: "bg-green-100 text-green-800" },
      ACTIVE: { label: "Active", className: "bg-green-100 text-green-800" },
    };
    const found = map[status];
    if (found) return <Badge className={found.className}>{found.label}</Badge>;
    return <Badge variant="outline">{status.replace(/_/g, " ")}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Dossiers d'Accréditation</h1>
            <p className="text-muted-foreground mt-1">Vue d'ensemble de tous les dossiers en cours et archivés.</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="w-5 h-5 text-primary" />
                    Tous les dossiers ({filtered.length})
                  </CardTitle>
                  <CardDescription>Accédez aux détails de chaque dossier d'accréditation</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="submitted">Soumise</SelectItem>
                      <SelectItem value="receivability_study">Recevabilité</SelectItem>
                      <SelectItem value="evaluation_in_progress">Évaluation</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Aucun dossier trouvé.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>OEC</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Domaine</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Progression</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell className="font-medium">{d.referenceNumber}</TableCell>
                        <TableCell>{d.oecName}</TableCell>
                        <TableCell className="capitalize">{d.type}</TableCell>
                        <TableCell>{d.domain}</TableCell>
                        <TableCell>{statusBadge(d.status)}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-200 rounded-full">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${d.progress}%` }} />
                            </div>
                            <span className="text-xs text-muted-foreground">{d.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{new Date(d.createdAt).toLocaleDateString("fr-FR")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/ra/dossiers/${d.id}`)}>
                            <Eye className="w-4 h-4 mr-1" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
