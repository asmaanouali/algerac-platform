import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCheck, Search, Mail, Briefcase } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface RAWorkload {
  id: number;
  fullName: string;
  email: string;
  specialite: string;
  domaineExpertise: string;
  sousDomaineExpertise: string;
  assignedDossiers: number;
  activeDossiers: number;
}

export default function CDRAWorkloadPage() {
  const { toast } = useToast();
  const [ras, setRas] = useState<RAWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/workflow/ra-workload");
      const data = await res.json();
      setRas(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err?.message || "Impossible de charger la liste des RA" });
    } finally { setLoading(false); }
  };

  const filtered = ras.filter((r) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      r.fullName?.toLowerCase().includes(q) ||
      r.email?.toLowerCase().includes(q) ||
      r.domaineExpertise?.toLowerCase().includes(q) ||
      r.specialite?.toLowerCase().includes(q)
    );
  });

  const totalActive = ras.reduce((s, r) => s + (r.activeDossiers || 0), 0);
  const totalAssigned = ras.reduce((s, r) => s + (r.assignedDossiers || 0), 0);
  const overloaded = ras.filter((r) => (r.activeDossiers || 0) > 5).length;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Responsables d'Accréditation</h1>
            <p className="text-muted-foreground mt-2">Vue d'ensemble des RA du département, leurs compétences et leur charge de travail</p>
          </div>

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total RA</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{ras.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Dossiers actifs</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold text-blue-600">{totalActive}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total assignés</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold">{totalAssigned}</div></CardContent>
            </Card>
            <Card className={overloaded > 0 ? "ring-2 ring-amber-300" : ""}>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">RA surchargés (&gt;5)</CardTitle></CardHeader>
              <CardContent><div className={`text-2xl font-bold ${overloaded > 0 ? "text-amber-600" : ""}`}>{overloaded}</div></CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2"><UserCheck className="h-5 w-5" /> Liste des RA ({filtered.length})</CardTitle>
                  <CardDescription>Compétences, domaines et charge de travail</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Rechercher nom, email, domaine..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Aucun RA trouvé</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>RA</TableHead>
                        <TableHead>Domaine d'expertise</TableHead>
                        <TableHead>Sous-domaine</TableHead>
                        <TableHead>Spécialité</TableHead>
                        <TableHead className="text-center">Actifs</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead>Charge</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((ra) => {
                        const pct = Math.min(((ra.activeDossiers || 0) / 6) * 100, 100);
                        return (
                          <TableRow key={ra.id}>
                            <TableCell>
                              <div className="min-w-[180px]">
                                <p className="font-medium">{ra.fullName}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{ra.email}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">{ra.domaineExpertise || "—"}</TableCell>
                            <TableCell className="text-sm">{ra.sousDomaineExpertise || "—"}</TableCell>
                            <TableCell className="text-sm flex items-center gap-1"><Briefcase className="w-3 h-3 text-muted-foreground" />{ra.specialite || "—"}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant={(ra.activeDossiers || 0) > 5 ? "destructive" : "outline"}>{ra.activeDossiers || 0}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm">{ra.assignedDossiers || 0}</TableCell>
                            <TableCell>
                              <div className="w-32">
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${pct > 83 ? "bg-red-500" : pct > 50 ? "bg-amber-500" : "bg-primary"}`} style={{ width: `${pct}%` }} />
                                </div>
                              </div>
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
    </div>
  );
}
