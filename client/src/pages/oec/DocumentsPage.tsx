import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { apiRequest } from "@/lib/queryClient";
import { Loader2, FileText, Download, Search } from "lucide-react";

interface Doc {
  key: string;
  name: string;
  base64?: string;
  mimeType?: string;
  requestId: number;
  requestRef: string;
  requestDomain: string;
  requestType: string;
  category: string;
  submittedAt?: string;
}

const guessCategory = (key?: string): string => {
  if (!key) return "Autre";
  if (key.startsWith("admin-")) return "Administratif";
  if (key.startsWith("inspection-")) return "Inspection";
  if (key.startsWith("essais-")) return "Essais";
  if (key.startsWith("etalonnage-")) return "Étalonnage";
  if (key.startsWith("examens_medicaux-")) return "Médical";
  if (key.startsWith("essais_aptitude-")) return "Essais d'aptitude";
  if (key.startsWith("cert_sm-")) return "Certification SM";
  if (key.startsWith("cert_produits-")) return "Certification produits";
  if (key.startsWith("cert_personnes-")) return "Certification personnes";
  if (key.startsWith("transfert-")) return "Transfert";
  return "Technique";
};

export default function OECDocumentsPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<string>("all");
  const [filterReq, setFilterReq] = useState<string>("all");

  useEffect(() => {
    if (user && !authLoading) loadAll();
  }, [user, authLoading]);

  const loadAll = async () => {
    try {
      setLoading(true);
      const res = await apiRequest("GET", "/api/requests/my-requests");
      const requests: any[] = await res.json();

      const all: Doc[] = [];
      (requests || []).forEach((r) => {
        if (!r.description) return;
        try {
          const parsed = JSON.parse(r.description);
          const dlist: any[] = Array.isArray(parsed.documents) ? parsed.documents : [];
          dlist.forEach((d) => {
            all.push({
              key: d.key || d.name,
              name: d.name || d.key || "Document",
              base64: d.base64,
              mimeType: d.mimeType,
              requestId: r.id,
              requestRef: r.referenceNumber || `#${r.id}`,
              requestDomain: r.domain || "",
              requestType: r.type || "",
              category: guessCategory(d.key),
              submittedAt: r.submissionDate,
            });
          });
        } catch { /* ignore parse errors */ }
      });
      setDocs(all);
    } catch (e: any) {
      toast({ variant: "destructive", title: "Erreur", description: e?.message || "Chargement impossible" });
    } finally {
      setLoading(false);
    }
  };

  const requestsById = useMemo(() => {
    const map = new Map<number, string>();
    docs.forEach((d) => map.set(d.requestId, d.requestRef));
    return Array.from(map.entries());
  }, [docs]);

  const categories = useMemo(() => Array.from(new Set(docs.map((d) => d.category))), [docs]);

  const filtered = docs.filter((d) => {
    const q = search.toLowerCase().trim();
    if (filterCat !== "all" && d.category !== filterCat) return false;
    if (filterReq !== "all" && String(d.requestId) !== filterReq) return false;
    if (!q) return true;
    return (
      d.name.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.requestRef.toLowerCase().includes(q) ||
      d.requestDomain.toLowerCase().includes(q)
    );
  });

  const downloadDoc = (d: Doc) => {
    if (!d.base64) {
      toast({ title: "Fichier non disponible", description: "Ce document a été confirmé sans être joint." });
      return;
    }
    const mime = d.mimeType || "application/octet-stream";
    const bc = atob(d.base64);
    const ba = new Uint8Array(bc.length);
    for (let j = 0; j < bc.length; j++) ba[j] = bc.charCodeAt(j);
    const blob = new Blob([ba], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = d.name; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mes Documents</h1>
            <p className="text-muted-foreground mt-1">
              Tous les documents que vous avez soumis dans l'ensemble de vos demandes d'accréditation.
            </p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Documents ({filtered.length})</CardTitle>
                  <CardDescription>Filtrez par catégorie, demande, ou utilisez la recherche</CardDescription>
                </div>
                <div className="flex flex-wrap gap-2">
                  <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Rechercher un document..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={filterCat} onValueChange={setFilterCat}>
                    <SelectTrigger className="w-40"><SelectValue placeholder="Catégorie" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes catégories</SelectItem>
                      {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={filterReq} onValueChange={setFilterReq}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Demande" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les demandes</SelectItem>
                      {requestsById.map(([id, ref]) => <SelectItem key={id} value={String(id)}>{ref}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Aucun document trouvé.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Document</TableHead>
                        <TableHead>Catégorie</TableHead>
                        <TableHead>Demande</TableHead>
                        <TableHead>Date soumission</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((d, i) => (
                        <TableRow key={`${d.requestId}-${d.key}-${i}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-500" />
                              <span className="font-medium text-sm">{d.name}</span>
                            </div>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{d.category}</Badge></TableCell>
                          <TableCell className="text-sm">
                            <p className="font-mono">{d.requestRef}</p>
                            <p className="text-xs text-muted-foreground">{d.requestDomain}</p>
                          </TableCell>
                          <TableCell className="text-sm">{d.submittedAt ? new Date(d.submittedAt).toLocaleDateString("fr-FR") : "—"}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" onClick={() => downloadDoc(d)} disabled={!d.base64}>
                              <Download className="w-4 h-4" />
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
        </main>
      </div>
    </div>
  );
}
