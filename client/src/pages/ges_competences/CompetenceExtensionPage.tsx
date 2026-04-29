import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { TrendingUp, RefreshCw, Eye } from "lucide-react";

interface Ext {
  id: number;
  evaluator: { id: number; fullName: string; email: string };
  currentRole?: string;
  extensionType: string;
  requestedDomainsJson?: string;
  requestedStandardsJson?: string;
  justification?: string;
  status: string;
  reviewNotes?: string;
  createdAt?: string;
}

const STATUS: Record<string, string> = {
  REQUESTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-amber-100 text-amber-800",
  TRAINING_REQUIRED: "bg-orange-100 text-orange-800",
  APPROVED: "bg-emerald-100 text-emerald-800",
  REJECTED: "bg-red-100 text-red-800",
};

export default function CompetenceExtensionPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Ext[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState<Ext | null>(null);
  const [newStatus, setNewStatus] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    document.title = "Extension de compétences | ALGERAC";
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/competency/extensions", { credentials: "include" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const review = async () => {
    if (!reviewing) return;
    const res = await fetch(`/api/competency/extensions/${reviewing.id}/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ status: newStatus, reviewNotes: notes }),
    });
    if (res.ok) {
      toast({ title: "Décision enregistrée" });
      setReviewing(null);
      setNewStatus("");
      setNotes("");
      fetchAll();
    }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <TrendingUp className="h-6 w-6 text-purple-600" /> Extensions de compétences
              </h1>
              <p className="text-sm text-slate-500 mt-1">PRO 06 §5.6 — extension domaine (EXP/ET) ou référentiel (REE/EQ)</p>
            </div>
            <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Demandes ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Chargement…</p> : items.length === 0 ? (
                <p className="text-center py-8 text-slate-500">Aucune demande</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Évaluateur</TableHead>
                      <TableHead>Rôle actuel</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Domaines/Normes</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="font-medium">{e.evaluator.fullName}</TableCell>
                        <TableCell><Badge variant="outline">{e.currentRole || "—"}</Badge></TableCell>
                        <TableCell>{e.extensionType}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-xs">
                          {e.requestedDomainsJson || e.requestedStandardsJson || "—"}
                        </TableCell>
                        <TableCell><Badge className={STATUS[e.status]}>{e.status}</Badge></TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline" onClick={() => { setReviewing(e); setNewStatus(e.status); setNotes(e.reviewNotes || ""); }}>
                            <Eye className="h-3 w-3 mr-1" />Examiner
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!reviewing} onOpenChange={(o) => !o && setReviewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Examen de la demande d'extension</DialogTitle>
          </DialogHeader>
          {reviewing && (
            <div className="space-y-3">
              <div><Label>Évaluateur</Label><p className="text-sm">{reviewing.evaluator.fullName}</p></div>
              <div><Label>Type</Label><p className="text-sm">{reviewing.extensionType}</p></div>
              <div><Label>Domaines demandés</Label><p className="text-sm">{reviewing.requestedDomainsJson || "—"}</p></div>
              <div><Label>Normes demandées</Label><p className="text-sm">{reviewing.requestedStandardsJson || "—"}</p></div>
              <div><Label>Justification</Label><p className="text-sm whitespace-pre-line">{reviewing.justification || "—"}</p></div>
              <div>
                <Label>Statut</Label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="UNDER_REVIEW">Sous examen</SelectItem>
                    <SelectItem value="TRAINING_REQUIRED">Formation requise</SelectItem>
                    <SelectItem value="APPROVED">Approuvée</SelectItem>
                    <SelectItem value="REJECTED">Rejetée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Notes de décision</Label>
                <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setReviewing(null)}>Annuler</Button>
            <Button onClick={review}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
