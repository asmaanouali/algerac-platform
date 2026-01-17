import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Users, Shield, Server, Bell, Database, FileArchive, Activity, Terminal, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function AdminDashboard() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-900 text-slate-100">
        <Sidebar className="border-r border-slate-800 bg-slate-950">
          <SidebarHeader className="p-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">A</div>
              <div>
                <p className="text-sm font-bold text-blue-400 leading-none">ALGERAC</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-tighter">Administration</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive className="bg-slate-800 text-white hover:bg-slate-800">
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Tableau de Bord</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <Users className="w-4 h-4" />
                      <span>Utilisateurs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <Shield className="w-4 h-4" />
                      <span>Rôles & Permissions</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <Server className="w-4 h-4" />
                      <span>Système</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <Bell className="w-4 h-4" />
                      <span>Notifications</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton className="text-slate-400 hover:text-white hover:bg-slate-800">
                      <Database className="w-4 h-4" />
                      <span>Base de Données</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t border-slate-800">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-400 hover:text-white hover:bg-slate-800" asChild>
              <Link href="/"><LogOut className="w-4 h-4" /> Déconnexion</Link>
            </Button>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
            <h1 className="text-lg font-semibold">Vue d'ensemble du système</h1>
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-bold leading-none">Salah Nacef</p>
                <p className="text-xs text-slate-500">Administrateur</p>
              </div>
              <div className="w-9 h-9 bg-blue-900/50 border border-blue-500/50 rounded-full flex items-center justify-center font-bold text-blue-400 text-sm">SN</div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                { label: 'Utilisateurs Actifs', val: '1,248', sub: '+12% ce mois', color: 'text-blue-400' },
                { label: 'Santé Système', val: '99.9%', sub: 'Opérationnel', color: 'text-green-400' },
                { label: 'Alertes Sécurité', val: '3', sub: 'Tentatives échouées', color: 'text-red-400' },
                { label: 'Documents', val: '842', sub: '842 nouveaux', color: 'text-purple-400' },
              ].map((s) => (
                <Card key={s.label} className="bg-slate-900 border-slate-800">
                  <CardContent className="p-4">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{s.label}</p>
                    <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
                    <p className="text-[10px] text-slate-600">{s.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" /> Logs Système Récents</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { msg: "Backup automatique effectué", time: "2 min" },
                    { msg: "Nouvel utilisateur créé: m.dupont@example.com", time: "15 min" },
                    { msg: "Échec connexion IP 192.168.1.45", time: "1h" },
                    { msg: "Mise à jour module 'Accréditation'", time: "2h" },
                  ].map((l, i) => (
                    <div key={i} className="flex gap-3 text-xs border-b border-slate-800 pb-2 last:border-0">
                      <span className="text-slate-500 shrink-0 w-12">{l.time}</span>
                      <span className="text-slate-300">{l.msg}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2"><Server className="w-4 h-4" /> Services & Statuts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { name: 'Base de Données (PostgreSQL)', status: '99.99%', health: 'bg-green-500' },
                    { name: 'Serveur API', status: '99.95%', health: 'bg-green-500' },
                    { name: 'Stockage Fichiers (S3)', status: '98.50%', health: 'bg-yellow-500' },
                    { name: 'Service Authentification', status: '99.99%', health: 'bg-green-500' },
                  ].map((s) => (
                    <div key={s.name} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${s.health}`} />
                        <span className="text-slate-300">{s.name}</span>
                      </div>
                      <span className="text-slate-500">{s.status}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
