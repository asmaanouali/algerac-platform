import { useState, useEffect } from "react";
import { useLocation } from "wouter";
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
import { Loader2, CreditCard, FileText, Search, Eye } from "lucide-react";

interface QuotationItem {
  id: number;
  requestId: number;
  referenceNumber: string;
  oecName: string;
  type: string;
  amount?: number;
  status: string;
  sentToOecDate?: string;
  oecResponseDate?: string;
  conventionSigned?: boolean;
}

export default function RAQuotesPage() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<QuotationItem[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    if (user && !authLoading) {
      loadQuotations();
    }
  }, [user, authLoading]);

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/quotations", { credentials: "include" });
      if (res.ok) {
        setQuotations(await res.json());
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  };

  const filtered = quotations.filter((q) => {
    const matchSearch =
      q.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      q.oecName?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || q.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "DRAFT": return <Badge variant="secondary">Brouillon</Badge>;
      case "SENT_TO_OEC": return <Badge className="bg-blue-100 text-blue-800">Envoyé</Badge>;
      case "ACCEPTED": return <Badge className="bg-green-100 text-green-800">Accepté</Badge>;
      case "REJECTED": return <Badge className="bg-red-100 text-red-800">Refusé</Badge>;
      case "EXPIRED": return <Badge className="bg-gray-100 text-gray-800">Expiré</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900">Conventions & Devis</h1>
            <p className="text-muted-foreground mt-1">Gestion des devis et conventions d'évaluation.</p>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-primary" />
                    Devis & Conventions ({filtered.length})
                  </CardTitle>
                  <CardDescription>Liste de tous les devis émis pour les demandes d'accréditation</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      <SelectItem value="DRAFT">Brouillon</SelectItem>
                      <SelectItem value="SENT_TO_OEC">Envoyé</SelectItem>
                      <SelectItem value="ACCEPTED">Accepté</SelectItem>
                      <SelectItem value="REJECTED">Refusé</SelectItem>
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
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-40" />
                  <p>Aucun devis trouvé.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>OEC</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Convention signée</TableHead>
                      <TableHead>Date envoi</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.referenceNumber}</TableCell>
                        <TableCell>{q.oecName}</TableCell>
                        <TableCell className="capitalize">{q.type}</TableCell>
                        <TableCell>{q.amount ? `${q.amount.toLocaleString("fr-FR")} DA` : "—"}</TableCell>
                        <TableCell>{statusBadge(q.status)}</TableCell>
                        <TableCell>
                          {q.conventionSigned ? (
                            <Badge className="bg-green-100 text-green-800">Oui</Badge>
                          ) : (
                            <Badge variant="outline">Non</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {q.sentToOecDate ? new Date(q.sentToOecDate).toLocaleDateString("fr-FR") : "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => setLocation(`/ra/demandes/${q.requestId}/devis`)}>
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
