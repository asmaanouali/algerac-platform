import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle, RotateCcw, RefreshCw } from "lucide-react";

interface Q {
  id: number;
  evaluator: { id: number; fullName: string; email: string };
  qualifiedRole: string;
  status: string;
  lastActivityDate?: string;
  inactivityNoticeDate?: string;
  qualificationDate?: string;
  expiryDate?: string;
}

export default function RequalificationPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Q[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Requalification des évaluateurs | ALGERAC";
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/competency/inactive-qualifications", { credentials: "include" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const detect = async () => {
    const res = await fetch("/api/competency/detect-inactivity", { method: "POST", credentials: "include" });
    if (res.ok) {
      toast({ title: "Détection lancée" });
      fetchAll();
    }
  };

  const trigger = async (id: number) => {
    const res = await fetch(`/api/competency/qualifications/${id}/trigger-requalification`, {
      method: "POST", credentials: "include",
    });
    if (res.ok) {
      toast({ title: "Requalification déclenchée" });
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
                <RotateCcw className="h-6 w-6 text-amber-600" /> Requalification après inactivité
              </h1>
              <p className="text-sm text-slate-500 mt-1">PRO 06 §5.5 — inactivité ≥ 1 an : évaluation complète sous supervision requise</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={detect}><AlertTriangle className="h-4 w-4 mr-2" />Lancer détection</Button>
              <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Qualifications en requalification ({items.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? <p>Chargement…</p> : items.length === 0 ? (
                <p className="text-center py-8 text-emerald-600">Aucun évaluateur en requalification.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Évaluateur</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Dernière activité</TableHead>
                      <TableHead>Notification le</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((q) => (
                      <TableRow key={q.id}>
                        <TableCell className="font-medium">{q.evaluator.fullName}<br /><span className="text-xs text-slate-500">{q.evaluator.email}</span></TableCell>
                        <TableCell><Badge>{q.qualifiedRole}</Badge></TableCell>
                        <TableCell>{q.lastActivityDate || q.qualificationDate || "—"}</TableCell>
                        <TableCell>{q.inactivityNoticeDate || "—"}</TableCell>
                        <TableCell><Badge className="bg-amber-100 text-amber-800">{q.status}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => trigger(q.id)}>
                            Renforcer décision
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
    </div>
  );
}
