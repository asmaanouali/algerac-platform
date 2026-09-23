import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { List, Search, Plus, Loader2, Upload, Download, Building2, UserCheck, Gavel, Pencil, Trash2 } from "lucide-react";

interface RefItem {
  id: number;
  name: string;
  code?: string;
  category: string;
  type?: string;
  accreditationDate?: string;
  status: string;
  createdAt?: string;
}

const CATEGORIES = [
  { key: "OEC", label: "OEC", icon: Building2 },
  { key: "EVALUATEUR", label: "Évaluateurs", icon: UserCheck },
  { key: "CAS", label: "CAS", icon: Gavel },
];

const STATUS_BADGE: Record<string, string> = {
  ACTIF: "bg-green-100 text-green-800",
  SUSPENDU: "bg-orange-100 text-orange-800",
};

export default function ReferentielsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("OEC");
  const [items, setItems] = useState<Record<string, RefItem[]>>({ OEC: [], EVALUATEUR: [], CAS: [] });
  const [loading, setLoading] = useState<Record<string, boolean>>({ OEC: true, EVALUATEUR: true, CAS: true });
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", type: "", accreditationDate: "", status: "ACTIF" });

  useEffect(() => {
    CATEGORIES.forEach((c) => fetchCategory(c.key));
  }, []);

  const fetchCategory = async (category: string) => {
    setLoading((prev) => ({ ...prev, [category]: true }));
    try {
      const res = await apiRequest("GET", `/api/admin/referentiels?category=${category}`);
      const json = await res.json();
      const data = json?.data !== undefined ? json.data : json;
      setItems((prev) => ({ ...prev, [category]: Array.isArray(data) ? data : [] }));
    } catch (err) {
      setItems((prev) => ({ ...prev, [category]: [] }));
    } finally {
      setLoading((prev) => ({ ...prev, [category]: false }));
    }
  };

  const handleCreate = async () => {
    if (!form.name) {
      toast({ variant: "destructive", title: "Erreur", description: "Le nom est requis." });
      return;
    }
    setCreating(true);
    try {
      await apiRequest("POST", "/api/admin/referentiels", { ...form, category: activeTab });
      toast({ title: "Élément ajouté", description: `"${form.name}" a été ajouté au référentiel.` });
      setShowCreate(false);
      setForm({ name: "", code: "", type: "", accreditationDate: "", status: "ACTIF" });
      fetchCategory(activeTab);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible d'ajouter l'élément" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (item: RefItem) => {
    try {
      await apiRequest("DELETE", `/api/admin/referentiels/${item.id}`);
      toast({ title: "Élément supprimé", description: `"${item.name}" a été supprimé.` });
      fetchCategory(activeTab);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erreur", description: err.message || "Impossible de supprimer l'élément" });
    }
  };

  const handleExport = (category: string) => {
    const rows = items[category] || [];
    const csv = ["Nom,Code,Type,Statut", ...rows.map((r) => `${r.name},${r.code || ""},${r.type || ""},${r.status}`)].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `referentiel-${category.toLowerCase()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentItems = (items[activeTab] || []).filter(
    (i) => i.name.toLowerCase().includes(search.toLowerCase()) || (i.code || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <List className="w-6 h-6 text-primary" />
                Gestion des Référentiels
              </h1>
              <p className="text-muted-foreground">Gérez les référentiels des organismes (OEC), évaluateurs et membres du comité CAS</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
              <Button variant="outline" onClick={() => handleExport(activeTab)}>
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => setShowCreate(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter
              </Button>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full md:w-auto grid-cols-3">
              {CATEGORIES.map((c) => (
                <TabsTrigger key={c.key} value={c.key} className="gap-2">
                  <c.icon className="w-4 h-4" />
                  {c.label} ({items[c.key]?.length || 0})
                </TabsTrigger>
              ))}
            </TabsList>

            {CATEGORIES.map((c) => (
              <TabsContent key={c.key} value={c.key} className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between flex-wrap gap-3">
                      <CardTitle>{c.label}</CardTitle>
                      <div className="relative w-full md:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loading[c.key] ? (
                      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                    ) : currentItems.length === 0 ? (
                      <p className="text-center py-12 text-muted-foreground">Aucun élément dans ce référentiel</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code {c.key === "OEC" ? "OEC" : ""}</TableHead>
                              <TableHead>Nom</TableHead>
                              <TableHead>Type</TableHead>
                              <TableHead>Date Accréditation</TableHead>
                              <TableHead>Statut</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {currentItems.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell><Badge variant="outline" className="font-mono">{item.code || "—"}</Badge></TableCell>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell className="text-sm text-muted-foreground">{item.type || "—"}</TableCell>
                                <TableCell className="text-sm">
                                  {item.accreditationDate ? new Date(item.accreditationDate).toLocaleDateString("fr-FR") : "—"}
                                </TableCell>
                                <TableCell>
                                  <Badge className={STATUS_BADGE[item.status] || "bg-gray-100 text-gray-800"}>
                                    {item.status === "ACTIF" ? "Actif" : item.status === "SUSPENDU" ? "Suspendu" : item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right space-x-1">
                                  <Button variant="ghost" size="sm"><Pencil className="w-4 h-4" /></Button>
                                  <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDelete(item)}>
                                    <Trash2 className="w-4 h-4" />
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
              </TabsContent>
            ))}
          </Tabs>
        </main>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un élément — {CATEGORIES.find((c) => c.key === activeTab)?.label}</DialogTitle>
            <DialogDescription>Ajoutez un nouvel élément à ce référentiel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="Ex: Laboratoire d'essais" />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Date d'accréditation</Label>
                <Input type="date" value={form.accreditationDate} onChange={(e) => setForm({ ...form, accreditationDate: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACTIF">Actif</SelectItem>
                    <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>Annuler</Button>
            <Button className="bg-primary hover:bg-primary/90" onClick={handleCreate} disabled={creating}>
              {creating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
