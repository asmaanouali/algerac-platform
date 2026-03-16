import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, Plus, CheckCircle, Building, Network } from "lucide-react";

interface MultiSiteConfig {
  id: number; configCode: string; mainSiteName: string; mainSiteAddress: string;
  centralizedManagementSystem: boolean; totalSatelliteSites: number;
  sitesToEvaluateInitial: number; sitesToEvaluateAnnual: number;
  status: string; createdAt: string;
}

export default function MultiSitePage() {
  const { toast } = useToast();
  const [configs, setConfigs] = useState<MultiSiteConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({
    requestId: "", mainSiteName: "", mainSiteAddress: "",
    mainSiteContact: "", mainSiteEmail: "", centralizedSystem: true,
    managementSystemDesc: "", totalSatellites: "", satelliteSites: "",
    selectionCriteria: ""
  });

  useEffect(() => { loadConfigs(); }, []);

  const loadConfigs = async () => {
    try {
      const res = await fetch("/api/multi-site", { credentials: "include" });
      const data = await res.json();
      setConfigs(data.data || []);
    } catch { setConfigs([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/multi-site", {
        ...form, totalSatellites: form.totalSatellites ? parseInt(form.totalSatellites) : 0,
        requestId: parseInt(form.requestId)
      });
      toast({ title: "Configuration multi-site créée" });
      setShowCreate(false); loadConfigs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleSubmit = async (id: number) => {
    try { await apiRequest("PUT", `/api/multi-site/${id}/submit`, {}); toast({ title: "Soumis pour validation" }); loadConfigs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleValidate = async (id: number, approved: boolean) => {
    try { await apiRequest("PUT", `/api/multi-site/${id}/validate`, { approved, comments: "" }); toast({ title: approved ? "Validé" : "Rejeté" }); loadConfigs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleActivate = async (id: number) => {
    try { await apiRequest("PUT", `/api/multi-site/${id}/activate`, {}); toast({ title: "Configuration activée" }); loadConfigs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", label: "Brouillon" },
      SUBMITTED: { color: "bg-blue-100 text-blue-800", label: "Soumis" },
      VALIDATED: { color: "bg-green-100 text-green-800", label: "Validé" },
      CHANGES_REQUESTED: { color: "bg-yellow-100 text-yellow-800", label: "Modifications" },
      ACTIVE: { color: "bg-emerald-100 text-emerald-800", label: "Actif" },
    };
    const s = map[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar /><div className="md:ml-64"><Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div><h1 className="text-2xl font-bold flex items-center gap-2"><Network className="w-6 h-6 text-primary" />Multi-sites — PRO 26</h1>
              <p className="text-muted-foreground">Gestion de l'accréditation multi-sites (√n sampling)</p></div>
            <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Nouvelle configuration</Button>
          </div>

          <Card>
            <CardHeader><CardTitle>Configurations multi-sites</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : (
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Code</TableHead><TableHead>Site principal</TableHead>
                    <TableHead>Satellites</TableHead><TableHead>Évaluation initiale</TableHead>
                    <TableHead>Évaluation annuelle</TableHead><TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {configs.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-mono text-sm">{c.configCode}</TableCell>
                        <TableCell className="font-medium"><div><p>{c.mainSiteName}</p><p className="text-xs text-muted-foreground">{c.mainSiteAddress}</p></div></TableCell>
                        <TableCell>{c.totalSatelliteSites}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{c.sitesToEvaluateInitial} sites</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{c.sitesToEvaluateAnnual} sites/an</Badge>
                        </TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end">
                            {c.status === "DRAFT" && <Button size="sm" variant="outline" onClick={() => handleSubmit(c.id)}>Soumettre</Button>}
                            {c.status === "SUBMITTED" && <>
                              <Button size="sm" onClick={() => handleValidate(c.id, true)}><CheckCircle className="w-3 h-3 mr-1" />Valider</Button>
                              <Button size="sm" variant="outline" onClick={() => handleValidate(c.id, false)}>Rejeter</Button>
                            </>}
                            {c.status === "VALIDATED" && <Button size="sm" onClick={() => handleActivate(c.id)}>Activer</Button>}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouvelle configuration multi-site</DialogTitle>
                <DialogDescription>Le calcul du nombre de sites suit la formule √n (PRO 26)</DialogDescription></DialogHeader>
              <div className="space-y-4">
                <div><Label>ID de la demande</Label><Input type="number" value={form.requestId} onChange={(e) => setForm({...form, requestId: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nom du site principal</Label><Input value={form.mainSiteName} onChange={(e) => setForm({...form, mainSiteName: e.target.value})} /></div>
                  <div><Label>Adresse</Label><Input value={form.mainSiteAddress} onChange={(e) => setForm({...form, mainSiteAddress: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Contact</Label><Input value={form.mainSiteContact} onChange={(e) => setForm({...form, mainSiteContact: e.target.value})} /></div>
                  <div><Label>Email</Label><Input type="email" value={form.mainSiteEmail} onChange={(e) => setForm({...form, mainSiteEmail: e.target.value})} /></div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox checked={form.centralizedSystem} onCheckedChange={(c) => setForm({...form, centralizedSystem: !!c})} />
                  <Label>Système de management centralisé</Label>
                </div>
                <div><Label>Nombre de sites satellites</Label><Input type="number" value={form.totalSatellites} onChange={(e) => setForm({...form, totalSatellites: e.target.value})} />
                  {form.totalSatellites && parseInt(form.totalSatellites) > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Échantillon initial: 1 + ⌈√{form.totalSatellites}⌉ = {1 + Math.ceil(Math.sqrt(parseInt(form.totalSatellites)))} sites |
                      Annuel: ⌈{form.totalSatellites}/4⌉ = {Math.ceil(parseInt(form.totalSatellites) / 4)} sites
                    </p>
                  )}
                </div>
                <div><Label>Description du système de management</Label><Textarea value={form.managementSystemDesc} onChange={(e) => setForm({...form, managementSystemDesc: e.target.value})} /></div>
                <div><Label>Critères de sélection des sites</Label><Textarea value={form.selectionCriteria} onChange={(e) => setForm({...form, selectionCriteria: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
