import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { LayoutDashboard, FilePlus, Files, AlertCircle, Calendar, Users, FileText, Receipt, ShieldCheck, LogOut, ArrowRight, Download, Eye, MoreHorizontal } from "lucide-react";
import { Link } from "wouter";

export default function OECDashboard() {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <h1 className="text-lg font-semibold">Tableau de bord</h1>
          <div className="flex items-center gap-4">
            <div className="text-right mr-2">
              <p className="text-sm font-bold leading-none">Laboratoire BioTest</p>
              <p className="text-xs text-muted-foreground">OEC #12345</p>
              </div>
              <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-600 text-sm">LB</div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card><CardContent className="p-4"><p className="text-[10px] font-bold text-muted-foreground uppercase">Statut Accréditation</p><p className="text-2xl font-bold text-green-600">Active</p><p className="text-[10px] text-muted-foreground">Expire le 15/12/2026</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-[10px] font-bold text-muted-foreground uppercase">Prochaine Évaluation</p><p className="text-2xl font-bold">14 Mars 2026</p><p className="text-[10px] text-muted-foreground">Type: Surveillance 1</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-[10px] font-bold text-muted-foreground uppercase">Écarts Ouverts</p><p className="text-2xl font-bold text-red-600">3</p><p className="text-[10px] text-muted-foreground">Dont 1 critique</p></CardContent></Card>
              <Card><CardContent className="p-4"><p className="text-[10px] font-bold text-muted-foreground uppercase">Taux de Résolution</p><p className="text-2xl font-bold">85%</p><div className="w-full bg-slate-100 h-1 rounded-full mt-2"><div className="bg-primary h-full rounded-full" style={{ width: '85%' }} /></div></CardContent></Card>
            </div>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between border-b pb-4">
                <CardTitle className="text-base">Mes Demandes d'Accréditation</CardTitle>
                <Button size="sm" variant="outline" className="text-[10px] font-bold uppercase">Nouvelle Demande</Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-[10px] font-bold uppercase">N° Dossier</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Type</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Domaine</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Date Dépôt</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Statut</TableHead>
                      <TableHead className="text-[10px] font-bold uppercase">Prochaine Action</TableHead>
                      <TableHead className="text-right text-[10px] font-bold uppercase">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { ref: 'D-2025-042', type: 'Extension', domain: 'Laboratoire Essais', date: '01/12/2025', status: 'En analyse', next: 'Revue documentaire' },
                      { ref: 'D-2025-038', type: 'Renouvellement', domain: 'Biologie Médicale', date: '28/11/2025', status: 'Planifiée', next: 'Audit sur site (15/12)' },
                      { ref: 'D-2025-015', type: 'Initiale', domain: 'Inspection', date: '15/11/2025', status: 'Accordée', next: 'Surveillance N+1' },
                    ].map((row) => (
                      <TableRow key={row.ref} className="text-xs">
                        <TableCell className="font-bold text-primary">{row.ref}</TableCell>
                        <TableCell>{row.type}</TableCell>
                        <TableCell>{row.domain}</TableCell>
                        <TableCell>{row.date}</TableCell>
                        <TableCell><span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold uppercase">{row.status}</span></TableCell>
                        <TableCell className="font-medium">{row.next}</TableCell>
                        <TableCell className="text-right"><Button variant="ghost" size="icon" className="h-7 w-7"><Eye className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="border-b pb-4"><CardTitle className="text-base">Mes Certificats</CardTitle></CardHeader>
                <CardContent className="p-4 space-y-4">
                  {[
                    { id: 'AL-1234', title: 'Laboratoire Essais', std: 'ISO/IEC 17025:2017', status: 'Valide' },
                    { id: 'AL-5678', title: 'Inspection', std: 'ISO/IEC 17020:2012', status: 'Expire bientôt' },
                  ].map((c) => (
                    <div key={c.id} className="p-3 border rounded-lg flex items-center justify-between bg-slate-50">
                      <div>
                        <p className="text-xs font-bold text-primary">{c.id} • {c.title}</p>
                        <p className="text-[10px] text-muted-foreground">{c.std}</p>
                        <p className={`text-[9px] font-bold uppercase mt-1 ${c.status === 'Valide' ? 'text-green-600' : 'text-orange-600'}`}>{c.status}</p>
                      </div>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] font-bold"><Download className="w-3 h-3 mr-1" /> PDF</Button>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b pb-4"><CardTitle className="text-base">Documents Récents</CardTitle></CardHeader>
                <CardContent className="p-0">
                   <div className="divide-y">
                    {[
                      { name: 'Manuel Qualité v2.4.pdf', date: "Aujourd'hui, 10:30", type: 'Manuel' },
                      { name: 'Rapport Audit Interne 2024.docx', date: 'Hier, 15:45', type: 'Audit' },
                      { name: 'Procédure Étalonnage P-05.pdf', date: '14 Déc, 09:15', type: 'Technique' },
                    ].map((doc, i) => (
                      <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50">
                        <div className="flex items-center gap-3">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <div>
                            <p className="text-xs font-semibold">{doc.name}</p>
                            <p className="text-[10px] text-muted-foreground">{doc.type} • {doc.date}</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t">
                    <Button variant="ghost" className="w-full text-xs h-7">Voir tous les documents</Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
  );
}
