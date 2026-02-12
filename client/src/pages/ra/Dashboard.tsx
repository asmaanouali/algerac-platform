import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { LayoutDashboard, Inbox, Calendar, Search, Users, FileText, Settings, LogOut, CheckCircle2, Clock, MoreVertical, FileDown, Send } from "lucide-react";
import { Link } from "wouter";

export default function RADashboard() {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
            <h1 className="text-lg font-semibold">Gestion des Dossiers</h1>
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-bold leading-none">Amine Belkacemi</p>
                <p className="text-xs text-muted-foreground">Responsable d’accréditation</p>
              </div>
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">AB</div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 max-w-md">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <input className="w-full h-9 rounded-md border border-input bg-background px-9 text-sm" placeholder="Rechercher (Ref, OEC, ...)" />
                </div>
                <Button variant="outline" size="sm">Filtres</Button>
              </div>
              <Button size="sm" className="gap-2">
                <FileText className="w-4 h-4" /> Nouveau Dossier
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Référence</TableHead>
                      <TableHead>OEC / Organisme</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Avancement</TableHead>
                      <TableHead>Date Limite</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { ref: 'D-2024-001', oec: "Laboratoire Central d'Analyses", type: "Initiale", status: "Recevabilité", sub: "Pièces manquantes (FOR 55)", progress: 15, date: "2025-06-01" },
                      { ref: 'D-2024-045', oec: "Certif-Tech Algérie", type: "Surveillance", status: "Planification", progress: 45, date: "2025-05-15" },
                      { ref: 'D-2023-120', oec: "BioQualité Std", type: "Renouvellement", status: "Évaluation", sub: "Ordre de mission à valider", progress: 70, date: "2025-04-01" },
                    ].map((row) => (
                      <TableRow key={row.ref}>
                        <TableCell className="font-bold text-primary">{row.ref}</TableCell>
                        <TableCell>
                          <p className="font-semibold">{row.oec}</p>
                          {row.sub && <p className="text-[10px] text-red-500 font-medium">{row.sub}</p>}
                        </TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            row.status === 'Évaluation' ? 'bg-blue-100 text-blue-700' :
                            row.status === 'Planification' ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {row.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${row.progress}%` }} />
                            </div>
                            <span className="text-[10px] font-bold">{row.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">{row.date}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle className="text-base">Établissement Convention (DOC 02)</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold">Devis (FOR 48)</Button>
                    <Button variant="primary" size="sm" className="h-8 text-[10px] uppercase font-bold">Convention</Button>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Signataire OEC</p>
                      <p className="text-sm font-semibold">M. Mohamed...</p>
                      <p className="text-[10px] text-muted-foreground">Directeur Général...</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Portée & Durée</p>
                      <p className="text-sm font-semibold">3 ans (Initiale)</p>
                      <p className="text-[10px] text-muted-foreground">Modalités: 50% avant / 50% après</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1 gap-2 h-10">
                      <FileDown className="w-4 h-4" /> Générer PDF
                    </Button>
                    <Button className="flex-1 gap-2 h-10">
                      <Send className="w-4 h-4" /> Envoyer Pack
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                  <CardTitle className="text-base">Gestion Documentaire</CardTitle>
                  <Button variant="outline" size="sm" className="h-8 text-[10px] uppercase font-bold">Voir Tout</Button>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableBody>
                      {[
                        { doc: 'FOR 55 - Recevabilité', ref: 'D-2024-001', status: 'Complété' },
                        { doc: 'FOR 56 - Revue Doc', ref: 'D-2023-120', status: 'En cours' },
                        { doc: 'Ordre de Mission', ref: 'D-2024-012', status: 'Signé' },
                      ].map((d, i) => (
                        <TableRow key={i}>
                          <TableCell className="text-xs font-semibold">{d.doc}</TableCell>
                          <TableCell className="text-[10px] font-bold text-muted-foreground">{d.ref}</TableCell>
                          <TableCell className="text-right">
                            <span className="text-[10px] font-bold text-green-600">{d.status}</span>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
  );
}
