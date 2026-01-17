import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, Inbox, Calendar, Search, Users, FileText, Settings, LogOut, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { Link } from "wouter";

export default function RADashboard() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50">
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold">A</div>
              <div>
                <p className="text-sm font-bold text-primary leading-none">ALGERAC</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Responsable Accréditation</p>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton isActive>
                      <LayoutDashboard className="w-4 h-4" />
                      <span>Tableau de Bord</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Inbox className="w-4 h-4" />
                      <span>Nouvelles Demandes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Recevabilité</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <FileText className="w-4 h-4" />
                      <span>Conventions & Devis</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Clock className="w-4 h-4" />
                      <span>Dossiers</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Calendar className="w-4 h-4" />
                      <span>Planning</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Users className="w-4 h-4" />
                      <span>Évaluateurs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <div className="mt-auto p-4 border-t">
            <Button variant="ghost" className="w-full justify-start gap-2 text-slate-500" asChild>
              <Link href="/"><LogOut className="w-4 h-4" /> Déconnexion</Link>
            </Button>
          </div>
        </Sidebar>

        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
            <h1 className="text-lg font-semibold">Tableau de Bord</h1>
            <div className="flex items-center gap-4">
              <div className="text-right mr-2">
                <p className="text-sm font-bold leading-none">Amine Belkacemi</p>
                <p className="text-xs text-muted-foreground">Responsable d’accréditation</p>
              </div>
              <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center font-bold text-primary text-sm">AB</div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Dossiers en cours</p>
                  <p className="text-2xl font-bold">12</p>
                  <p className="text-[10px] text-muted-foreground">Dont 8 en phase active</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Alertes Critiques</p>
                  <p className="text-2xl font-bold text-red-600">2</p>
                  <p className="text-[10px] text-muted-foreground">Délais dépassés</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Attente Validation</p>
                  <p className="text-2xl font-bold text-blue-600">4</p>
                  <p className="text-[10px] text-muted-foreground">Documents & Ordres de mission</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Clôturés ce mois</p>
                  <p className="text-2xl font-bold">3</p>
                  <p className="text-[10px] text-muted-foreground">+12% par rapport au mois dernier</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-base">Suivi des Dossiers Prioritaires</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   {[
                    { ref: 'D-2024-001', oec: "Laboratoire Central d'An...", stage: "Recevabilité", prog: 15 },
                    { ref: 'D-2024-045', oec: "Certif-Tech Algérie", stage: "Planification", prog: 45 },
                    { ref: 'D-2023-120', oec: "BioQualité Std", stage: "Évaluation", prog: 70 },
                  ].map((d) => (
                    <div key={d.ref} className="space-y-2 p-3 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-muted-foreground">{d.ref} • {d.stage}</p>
                          <p className="text-sm font-semibold">{d.oec}</p>
                        </div>
                        <span className="text-xs font-bold">{d.prog}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-full transition-all" style={{ width: `${d.prog}%` }} />
                      </div>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full text-xs">Voir tous les dossiers</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Notifications & Alertes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
                    <p className="text-xs font-bold text-red-700">Retard critique: Dossier D-2023-120</p>
                    <p className="text-[10px] text-red-600">(BioQualité) - Réponse aux écarts dépassée de 3 jours.</p>
                  </div>
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-1">
                    <p className="text-xs font-bold text-blue-700">Validation requise: Ordre de mission</p>
                    <p className="text-[10px] text-blue-600">Pour l'évaluation de Certif-Tech.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg space-y-1">
                    <p className="text-xs font-bold text-slate-700">Nouveau dossier attribué: D-2024-050</p>
                    <p className="text-[10px] text-slate-600">(EcoTest).</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
