import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { LayoutDashboard, Users, Shield, Server, Bell, Database, LogOut, Search, Filter, MoreHorizontal, UserPlus, Download } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 ml-64 flex flex-col overflow-hidden">
          <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
            <h1 className="text-lg font-semibold">Gestion des Utilisateurs</h1>
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-bold leading-none">Salah Nacef</p>
                <p className="text-xs text-slate-500">Administrateur</p>
              </div>
              <div className="w-9 h-9 bg-blue-900/50 border border-blue-500/50 rounded-full flex items-center justify-center font-bold text-blue-400 text-sm">SN</div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input className="w-full h-9 rounded-md border border-slate-800 bg-slate-900 px-9 text-sm text-slate-200 placeholder:text-slate-600" placeholder="Rechercher par nom ou email..." />
                </div>
                <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300">
                  <Filter className="w-3 h-3 mr-2" /> Filtres
                </Button>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" size="sm" className="bg-slate-900 border-slate-800 text-slate-300">
                  <Download className="w-3 h-3 mr-2" /> Exporter
                </Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-3 h-3 mr-2" /> Nouvel Utilisateur
                </Button>
              </div>
            </div>

            <Card className="bg-slate-900 border-slate-800 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-950 border-b border-slate-800">
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Utilisateur</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Rôle</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Département</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Statut</TableHead>
                    <TableHead className="text-slate-400 font-bold uppercase text-[10px]">Dernière Connexion</TableHead>
                    <TableHead className="text-right text-slate-400 font-bold uppercase text-[10px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { name: 'Jean Dupont', email: 'j.dupont@sga.com', role: 'Direction Générale (DG)', dept: 'Administration', status: 'Actif', last: 'Il y a 2 heures', init: 'JD' },
                    { name: 'Marie Martin', email: 'm.martin@sga.com', role: 'Responsable Qualité (RQ)', dept: 'Qualité', status: 'Actif', last: 'Il y a 5 min', init: 'MM' },
                    { name: 'Pierre Durand', email: 'p.durand@sga.com', role: 'Évaluateur Technique (ET)', dept: 'Technique', status: 'Inactif', last: 'Il y a 2 jours', init: 'PD' },
                    { name: 'Sophie Bernard', email: 's.bernard@sga.com', role: 'Chef de Département (CD)', dept: 'Laboratoire', status: 'Actif', last: 'Hier', init: 'SB' },
                  ].map((user) => (
                    <TableRow key={user.email} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-300 border border-slate-700">{user.init}</div>
                          <div>
                            <p className="font-semibold text-sm">{user.name}</p>
                            <p className="text-[10px] text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-slate-300">{user.role}</TableCell>
                      <TableCell className="text-xs text-slate-500">{user.dept}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          user.status === 'Actif' ? 'bg-green-900/30 text-green-400 border border-green-900/50' : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}>
                          {user.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-[10px] text-slate-500">{user.last}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-900/30 border border-green-500/30 flex items-center justify-center text-green-400 font-bold">MM</div>
                    <div>
                      <CardTitle className="text-base">Détail Utilisateur: Marie Martin</CardTitle>
                      <p className="text-[10px] text-slate-500">Chef du Département Qualité • Actif</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="flex border-b border-slate-800 pb-3 gap-6 text-[10px] font-bold uppercase tracking-wider">
                    <button className="text-blue-400 border-b border-blue-400 pb-3 -mb-3.5">Permissions</button>
                    <button className="text-slate-500 hover:text-slate-300 transition-colors">Sessions</button>
                    <button className="text-slate-500 hover:text-slate-300 transition-colors">Historique</button>
                  </div>
                  <div className="space-y-4">
                    {[
                      { res: 'Dossiers Accréditation', perm: 'Lecture & Modification' },
                      { res: 'Rapports Évaluation', perm: 'Lecture seule' },
                      { res: 'Configuration Modules', perm: 'Aucun accès' },
                    ].map((p) => (
                      <div key={p.res} className="flex justify-between items-center text-xs">
                        <span className="text-slate-400">{p.res}</span>
                        <span className="text-slate-200 font-semibold">{p.perm}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full bg-slate-800 border-slate-700 text-xs h-8">Modifier les permissions</Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="border-b border-slate-800 pb-4">
                  <CardTitle className="text-base flex items-center gap-2"><Bell className="w-4 h-4" /> Activité Récente</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="p-4 space-y-4">
                    <div className="flex gap-3 text-[10px]">
                      <div className="w-1 bg-blue-500 rounded-full shrink-0" />
                      <div>
                        <p className="font-bold text-slate-300">Connexion réussie</p>
                        <p className="text-slate-500 italic">Chrome sur Windows • IP: 192.168.1.45 • Paris</p>
                        <p className="text-slate-600 mt-1">Il y a 5 min</p>
                      </div>
                    </div>
                    <div className="flex gap-3 text-[10px]">
                      <div className="w-1 bg-slate-700 rounded-full shrink-0" />
                      <div>
                        <p className="font-bold text-slate-300">Action: Modification de dossier</p>
                        <p className="text-slate-500 italic">Dossier D-2024-001 • Étape mise à jour</p>
                        <p className="text-slate-600 mt-1">Il y a 2 heures</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
  );
}
