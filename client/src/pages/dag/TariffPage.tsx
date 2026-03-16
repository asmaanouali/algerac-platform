import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Plus, CheckCircle, Calculator, Globe2, Building } from "lucide-react";

interface TariffGrid {
  id: number;
  tariffCode: string;
  name: string;
  category: string;
  forNationalOEC: boolean;
  forForeignOEC: boolean;
  registrationFee: number;
  evaluationFeePerDay: number;
  surveillanceFee: number;
  status: string;
  createdAt: string;
}

export default function TariffPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tariffs, setTariffs] = useState<TariffGrid[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showCalc, setShowCalc] = useState(false);
  const [calcResult, setCalcResult] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: "", category: "INITIAL_ACCREDITATION", forNational: true, forForeign: false,
    domain: "", oecType: "", registrationFee: "", evalFeePerDay: "", docReviewFee: "",
    surveillanceFee: "", renewalFee: "", extensionFee: "", travelSupplement: "",
    adminFee: "", minDays: "", maxDays: "", notes: ""
  });
  const [calcForm, setCalcForm] = useState({ domain: "", oecType: "", category: "INITIAL_ACCREDITATION", days: "3", type: "national" });

  useEffect(() => { loadTariffs(); }, []);

  const loadTariffs = async () => {
    try {
      const res = await fetch("/api/tariffs", { credentials: "include" });
      const data = await res.json();
      setTariffs(data.data || []);
    } catch { setTariffs([]); }
    setLoading(false);
  };

  const handleCreate = async () => {
    try {
      await apiRequest("POST", "/api/tariffs", form);
      toast({ title: "Grille tarifaire créée" });
      setShowCreate(false);
      loadTariffs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleActivate = async (id: number) => {
    try {
      await apiRequest("PUT", `/api/tariffs/${id}/activate`, {});
      toast({ title: "Tarif activé" });
      loadTariffs();
    } catch (err: any) { toast({ title: "Erreur", description: err.message, variant: "destructive" }); }
  };

  const handleCalculate = async () => {
    try {
      const endpoint = calcForm.type === "national" ? "/api/tariffs/calculate/national" : "/api/tariffs/calculate/foreign";
      const params = new URLSearchParams({ domain: calcForm.domain, oecType: calcForm.oecType, category: calcForm.category, days: calcForm.days });
      const res = await fetch(`${endpoint}?${params}`, { credentials: "include" });
      const data = await res.json();
      setCalcResult(data.data?.total || null);
    } catch (err: any) { toast({ title: "Erreur de calcul", description: err.message, variant: "destructive" }); }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { color: string; label: string }> = {
      DRAFT: { color: "bg-gray-100 text-gray-800", label: "Brouillon" },
      ACTIVE: { color: "bg-green-100 text-green-800", label: "Actif" },
      EXPIRED: { color: "bg-red-100 text-red-800", label: "Expiré" },
    };
    const s = map[status] || { color: "bg-gray-100 text-gray-800", label: status };
    return <Badge className={s.color}>{s.label}</Badge>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-6 md:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2"><DollarSign className="w-6 h-6 text-primary" />Tarifs — PRO 18</h1>
              <p className="text-muted-foreground">Grilles tarifaires et frais d'accréditation</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowCalc(true)}><Calculator className="w-4 h-4 mr-2" />Calculer devis</Button>
              <Button onClick={() => setShowCreate(true)}><Plus className="w-4 h-4 mr-2" />Nouveau tarif</Button>
            </div>
          </div>

          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">Tous</TabsTrigger>
              <TabsTrigger value="national"><Building className="w-4 h-4 mr-1" />National</TabsTrigger>
              <TabsTrigger value="foreign"><Globe2 className="w-4 h-4 mr-1" />Étranger</TabsTrigger>
            </TabsList>
            {["all", "national", "foreign"].map(tab => (
              <TabsContent key={tab} value={tab}>
                <Card>
                  <CardHeader><CardTitle>Grilles tarifaires</CardTitle></CardHeader>
                  <CardContent>
                    {loading ? <p className="text-center py-8 text-muted-foreground">Chargement...</p> : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Code</TableHead>
                            <TableHead>Nom</TableHead>
                            <TableHead>Catégorie</TableHead>
                            <TableHead>Frais inscription</TableHead>
                            <TableHead>Frais éval/jour</TableHead>
                            <TableHead>Statut</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {tariffs
                            .filter(t => tab === "all" || (tab === "national" ? t.forNationalOEC : t.forForeignOEC))
                            .map(t => (
                            <TableRow key={t.id}>
                              <TableCell className="font-mono text-sm">{t.tariffCode}</TableCell>
                              <TableCell className="font-medium">{t.name}</TableCell>
                              <TableCell>{t.category?.replace(/_/g, " ")}</TableCell>
                              <TableCell>{t.registrationFee?.toLocaleString("fr-DZ")} DA</TableCell>
                              <TableCell>{t.evaluationFeePerDay?.toLocaleString("fr-DZ")} DA</TableCell>
                              <TableCell>{getStatusBadge(t.status)}</TableCell>
                              <TableCell className="text-right">
                                {t.status === "DRAFT" && <Button size="sm" onClick={() => handleActivate(t.id)}><CheckCircle className="w-3 h-3 mr-1" />Activer</Button>}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>

          {/* Create */}
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Nouvelle grille tarifaire</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Nom</Label><Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} /></div>
                  <div><Label>Catégorie</Label>
                    <Select value={form.category} onValueChange={(v) => setForm({...form, category: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INITIAL_ACCREDITATION">Accréditation initiale</SelectItem>
                        <SelectItem value="SURVEILLANCE">Surveillance</SelectItem>
                        <SelectItem value="RENEWAL">Renouvellement</SelectItem>
                        <SelectItem value="EXTENSION">Extension</SelectItem>
                      </SelectContent></Select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Domaine</Label><Input value={form.domain} onChange={(e) => setForm({...form, domain: e.target.value})} /></div>
                  <div><Label>Type OEC</Label><Input value={form.oecType} onChange={(e) => setForm({...form, oecType: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div><Label>Frais inscription (DA)</Label><Input type="number" value={form.registrationFee} onChange={(e) => setForm({...form, registrationFee: e.target.value})} /></div>
                  <div><Label>Frais éval/jour (DA)</Label><Input type="number" value={form.evalFeePerDay} onChange={(e) => setForm({...form, evalFeePerDay: e.target.value})} /></div>
                  <div><Label>Frais surveillance (DA)</Label><Input type="number" value={form.surveillanceFee} onChange={(e) => setForm({...form, surveillanceFee: e.target.value})} /></div>
                </div>
                <div><Label>Notes</Label><Textarea value={form.notes} onChange={(e) => setForm({...form, notes: e.target.value})} /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Annuler</Button>
                <Button onClick={handleCreate}>Créer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Calculator */}
          <Dialog open={showCalc} onOpenChange={setShowCalc}>
            <DialogContent>
              <DialogHeader><DialogTitle>Calculateur de devis</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Domaine</Label><Input value={calcForm.domain} onChange={(e) => setCalcForm({...calcForm, domain: e.target.value})} /></div>
                  <div><Label>Type OEC</Label><Input value={calcForm.oecType} onChange={(e) => setCalcForm({...calcForm, oecType: e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><Label>Type</Label>
                    <Select value={calcForm.type} onValueChange={(v) => setCalcForm({...calcForm, type: v})}><SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="national">National</SelectItem><SelectItem value="foreign">Étranger</SelectItem></SelectContent></Select></div>
                  <div><Label>Jours d'évaluation</Label><Input type="number" value={calcForm.days} onChange={(e) => setCalcForm({...calcForm, days: e.target.value})} /></div>
                </div>
                {calcResult !== null && (
                  <Card className="bg-green-50 border-green-200"><CardContent className="pt-4">
                    <p className="text-center"><span className="text-sm text-muted-foreground">Montant total estimé</span><br />
                    <span className="text-3xl font-bold text-green-700">{calcResult.toLocaleString("fr-DZ")} DA</span></p>
                  </CardContent></Card>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCalc(false)}>Fermer</Button>
                <Button onClick={handleCalculate}><Calculator className="w-4 h-4 mr-2" />Calculer</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
