import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Eye, Clock, CheckCircle, XCircle, Search, FileCheck, Building2, AlertTriangle, UserPlus,
} from "lucide-react";

interface RequestRow {
  id: number;
  referenceNumber?: string;
  type?: string;
  domain?: string;
  status: string;
  submissionDate?: string;
  createdAt?: string;
  oec?: {
    id?: number;
    organizationName?: string;
    fullName?: string;
    email?: string;
    // Non-null/non-empty => OEC came via /oecregister.
    typeDemande?: string | null;
  };
}

const isNewOec = (r: RequestRow) => !!(r.oec?.typeDemande && r.oec.typeDemande.trim());

async function fetchJson(url: string, timeoutMs = 10000): Promise<any[]> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { credentials: "include", signal: controller.signal });
    if (!res.ok) return [];
    const data = await res.json();
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  } catch {
    return [];
  } finally {
    window.clearTimeout(timer);
  }
}

export default function DTAccreditationRequestsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await fetchJson("/api/requests");
      const cleaned = (data as RequestRow[]).filter((r) => r && r.status && r.status !== "DRAFT");
      cleaned.sort((a, b) => {
        const da = a.submissionDate || a.createdAt || "";
        const db = b.submissionDate || b.createdAt || "";
        return db.localeCompare(da);
      });
      setRequests(cleaned);
    } catch (err: any) {
      setError(true);
      toast({
        variant: "destructive",
        title: "Erreur de chargement",
        description: err?.message || "Impossible de charger les demandes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString("fr-FR") : "—");

  const matches = (r: RequestRow) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      (r.referenceNumber || "").toLowerCase().includes(q) ||
      (r.oec?.organizationName || "").toLowerCase().includes(q) ||
      (r.oec?.fullName || "").toLowerCase().includes(q) ||
      (r.oec?.email || "").toLowerCase().includes(q) ||
      (r.domain || "").toLowerCase().includes(q) ||
      (r.type || "").toLowerCase().includes(q)
    );
  };

  const filtered = requests.filter(matches);
  const pending = filtered.filter((r) => r.status === "PENDING_DT_REVIEW");
  const validated = filtered.filter((r) =>
    ["DT_APPROVED", "PENDING_CD_ASSIGNMENT", "ASSIGNED_TO_RA", "RECEIVABILITY_STUDY", "RECEIVABLE"].includes(r.status)
  );
  const rejected = filtered.filter((r) => r.status === "DT_REJECTED");

  const renderTable = (rows: RequestRow[]) => {
    if (rows.length === 0) {
      return <p className="text-center py-10 text-sm text-muted-foreground">Aucune demande</p>;
    }
    return (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Référence</TableHead>
              <TableHead>Organisme</TableHead>
              <TableHead>Domaine</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type demandeur</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const newOec = isNewOec(r);
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-mono font-medium">{r.referenceNumber || `#${r.id}`}</TableCell>
                  <TableCell>
                    <p className="font-medium">{r.oec?.organizationName || r.oec?.fullName || "—"}</p>
                    {r.oec?.email && <p className="text-xs text-muted-foreground">{r.oec.email}</p>}
                  </TableCell>
                  <TableCell className="text-sm">{r.domain || "—"}</TableCell>
                  <TableCell><Badge variant="outline">{r.type || "—"}</Badge></TableCell>
                  <TableCell className="text-sm">{fmtDate(r.submissionDate || r.createdAt)}</TableCell>
                  <TableCell>
                    {newOec ? (
                      <Badge className="bg-purple-100 text-purple-700 border-purple-200" variant="outline">
                        <UserPlus className="w-3 h-3 mr-1" /> Nouveau OEC
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200" variant="outline">
                        <Building2 className="w-3 h-3 mr-1" /> OEC existant
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="outline" onClick={() => setLocation(`/dt/demande/${r.id}`)}>
                      <Eye className="w-3.5 h-3.5 mr-1" /> Voir
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Demandes d'Accréditation</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Vérifiez les demandes soumises par les OEC avant transmission au Chef de Département.
              </p>
            </div>
            <Button variant="outline" onClick={load} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Actualiser
            </Button>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm text-red-700">
                  Échec du chargement des demandes. Vérifiez que le serveur est accessible puis cliquez sur Actualiser.
                </p>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{requests.length}</div></CardContent>
            </Card>
            <Card className={pending.length > 0 ? "ring-2 ring-amber-300" : ""}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">À vérifier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-amber-600">
                  {requests.filter((r) => r.status === "PENDING_DT_REVIEW").length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Validées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-emerald-600">
                  {requests.filter((r) =>
                    ["DT_APPROVED", "PENDING_CD_ASSIGNMENT", "ASSIGNED_TO_RA", "RECEIVABILITY_STUDY", "RECEIVABLE"].includes(r.status)
                  ).length}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Rejetées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">
                  {requests.filter((r) => r.status === "DT_REJECTED").length}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" /> Demandes ({filtered.length})
                  </CardTitle>
                  <CardDescription>Filtrez et recherchez dans l'ensemble des demandes</CardDescription>
                </div>
                <div className="relative w-full md:w-72">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Rechercher (référence, organisme, email…)"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <Tabs defaultValue="pending" className="space-y-4">
                  <TabsList>
                    <TabsTrigger value="pending">
                      <Clock className="w-4 h-4 mr-1" /> À vérifier ({pending.length})
                    </TabsTrigger>
                    <TabsTrigger value="validated">
                      <CheckCircle className="w-4 h-4 mr-1" /> Validées ({validated.length})
                    </TabsTrigger>
                    <TabsTrigger value="rejected">
                      <XCircle className="w-4 h-4 mr-1" /> Rejetées ({rejected.length})
                    </TabsTrigger>
                    <TabsTrigger value="all">
                      <Building2 className="w-4 h-4 mr-1" /> Toutes ({filtered.length})
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="pending">{renderTable(pending)}</TabsContent>
                  <TabsContent value="validated">{renderTable(validated)}</TabsContent>
                  <TabsContent value="rejected">{renderTable(rejected)}</TabsContent>
                  <TabsContent value="all">{renderTable(filtered)}</TabsContent>
                </Tabs>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
