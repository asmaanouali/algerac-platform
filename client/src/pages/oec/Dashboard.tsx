import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/ui/sidebar";
import { LayoutDashboard, FilePlus, Files, AlertCircle, Calendar, Users, FileText, Receipt, ShieldCheck, HelpCircle, LogOut } from "lucide-react";
import { Link } from "wouter";

export default function OECDashboard() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-slate-50">
        <Sidebar className="border-r bg-white">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded flex items-center justify-center text-white font-bold">A</div>
              <div>
                <p className="text-sm font-bold text-primary leading-none">ALGERAC</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Accréditation</p>
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
                      <span>Tableau de bord</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <FilePlus className="w-4 h-4" />
                      <span>Nouvelle Demande</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Files className="w-4 h-4" />
                      <span>Mes Demandes</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <FileText className="w-4 h-4" />
                      <span>Mes Documents</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <AlertCircle className="w-4 h-4" />
                      <span>Écarts & Actions</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <Receipt className="w-4 h-4" />
                      <span>Facturation</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Mes Certificats</span>
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
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Statut Accréditation</p>
                  <p className="text-2xl font-bold text-green-600">Active</p>
                  <p className="text-[10px] text-muted-foreground">Expire le 15/12/2026</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Prochaine Évaluation</p>
                  <p className="text-2xl font-bold">14 Mars 2026</p>
                  <p className="text-[10px] text-muted-foreground">Type: Surveillance 1</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Écarts Ouverts</p>
                  <p className="text-2xl font-bold text-red-600">3</p>
                  <p className="text-[10px] text-muted-foreground">Dont 1 critique</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <p className="text-xs font-medium text-muted-foreground uppercase">Taux de Résolution</p>
                  <p className="text-2xl font-bold">85%</p>
                  <div className="w-full bg-slate-100 h-1 rounded-full mt-2">
                    <div className="bg-primary h-full rounded-full" style={{ width: '85%' }} />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Certificat d'Accréditation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4 p-4 border rounded-lg bg-slate-50">
                    <div className="p-3 bg-white rounded border">
                      <FileText className="w-8 h-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-bold">Certificat N° 1-0042</p>
                      <p className="text-sm text-muted-foreground">ISO/IEC 17025 pour les essais physico-chimiques</p>
                      <p className="text-xs mt-1 text-slate-500">Délivré le 15/12/2023</p>
                    </div>
                    <Button variant="outline" size="sm">Télécharger</Button>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase mb-2">Portée technique</p>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-2 py-1 bg-slate-100 rounded text-xs">Chimie des eaux</div>
                      <div className="px-2 py-1 bg-slate-100 rounded text-xs">Microbiologie alimentaire</div>
                      <div className="px-2 py-1 bg-slate-100 rounded text-xs">Matériaux de construction</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Actions Requises</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500" />
                      <div>
                        <p className="text-sm font-semibold">Répondre aux écarts de l'audit interne</p>
                        <p className="text-xs text-red-500">Échéance: Il y a 2 jours</p>
                      </div>
                    </div>
                    <Button size="sm">Traiter</Button>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <div>
                        <p className="text-sm font-semibold">Paiement redevance annuelle</p>
                        <p className="text-xs text-muted-foreground">Échéance: Dans 15 jours</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm">Facture</Button>
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
