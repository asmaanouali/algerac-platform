import { useState, useEffect } from "react";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Plus, Send, RefreshCw, CheckCircle2 } from "lucide-react";

interface Bulletin {
  id: number;
  title: string;
  type: string;
  content?: string;
  publishedDate?: string;
  forumDate?: string;
  audience?: string;
  externalLink?: string;
  emailDispatched?: boolean;
  emailDispatchedAt?: string;
}

const TYPES = [
  { v: "FORUM_HARMONISATION", l: "Forum d'harmonisation" },
  { v: "NEW_REQUIREMENT", l: "Nouvelle exigence" },
  { v: "NORM_UPDATE", l: "Mise à jour norme" },
  { v: "OTHER", l: "Autre" },
];
const TYPE_COLORS: Record<string, string> = {
  FORUM_HARMONISATION: "bg-purple-100 text-purple-800",
  NEW_REQUIREMENT: "bg-blue-100 text-blue-800",
  NORM_UPDATE: "bg-amber-100 text-amber-800",
  OTHER: "bg-slate-100 text-slate-800",
};

export default function RegularInfoPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({ type: "OTHER", audience: "ALL" });

  useEffect(() => {
    document.title = "Informations régulières | ALGERAC";
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const res = await fetch("/api/competency/bulletins", { credentials: "include" });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };

  const create = async () => {
    const res = await fetch("/api/competency/bulletins", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast({ title: "Bulletin créé" });
      setCreateOpen(false);
      setForm({ type: "OTHER", audience: "ALL" });
      fetchAll();
    }
  };

  const dispatch = async (id: number) => {
    const res = await fetch(`/api/competency/bulletins/${id}/dispatch`, { method: "POST", credentials: "include" });
    if (res.ok) { toast({ title: "Diffusion lancée" }); fetchAll(); }
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-rose-600" /> Informations régulières
              </h1>
              <p className="text-sm text-slate-500 mt-1">PRO 06 §5.6 — forums d'harmonisation, mises à jour normes EA/ILAC/IAF</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" />Actualiser</Button>
              <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouveau bulletin</Button>
            </div>
          </div>

          {loading ? <p>Chargement…</p> : items.length === 0 ? (
            <Card><CardContent className="py-8 text-center text-slate-500">Aucun bulletin</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {items.map((b) => (
                <Card key={b.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{b.title}</CardTitle>
                        <p className="text-xs text-slate-500 mt-1">Publié le {b.publishedDate} {b.forumDate && `· Forum le ${b.forumDate}`}</p>
                      </div>
                      <Badge className={TYPE_COLORS[b.type]}>{b.type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-700 whitespace-pre-line line-clamp-4">{b.content}</p>
                    {b.externalLink && (
                      <a href={b.externalLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 mt-2 inline-block">
                        Lien externe ↗
                      </a>
                    )}
                    <div className="flex items-center justify-between mt-4 text-xs">
                      <span className="text-slate-500">Audience: {b.audience}</span>
                      {b.emailDispatched ? (
                        <span className="text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" />Diffusé</span>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => dispatch(b.id)}>
                          <Send className="h-3 w-3 mr-1" />Diffuser
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Nouveau bulletin d'information</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Titre</Label><Input value={form.title || ""} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPES.map((t) => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience</Label>
                <Select value={form.audience} onValueChange={(v) => setForm({ ...form, audience: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous</SelectItem>
                    <SelectItem value="EVALUATORS">Évaluateurs</SelectItem>
                    <SelectItem value="EXPERTS">Experts</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date forum (si applicable)</Label><Input type="date" value={form.forumDate || ""} onChange={(e) => setForm({ ...form, forumDate: e.target.value })} /></div>
              <div><Label>Lien externe</Label><Input value={form.externalLink || ""} onChange={(e) => setForm({ ...form, externalLink: e.target.value })} /></div>
            </div>
            <div><Label>Références (EA/ILAC/IAF)</Label><Input value={form.referencesJson || ""} onChange={(e) => setForm({ ...form, referencesJson: e.target.value })} placeholder="ex: ILAC P15:05/2020" /></div>
            <div><Label>Contenu</Label><Textarea rows={6} value={form.content || ""} onChange={(e) => setForm({ ...form, content: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Annuler</Button>
            <Button onClick={create}>Publier</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
