import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { LayoutDashboard, FilePlus, Files, AlertCircle, Calendar, Users, FileText, Receipt, ShieldCheck, LogOut, ArrowRight, Download, Eye, MoreHorizontal, Loader2 } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface AccreditationRequest {
  ref: string;
  type: string;
  domain: string;
  date: string;
  status: string;
  next: string;
}

export default function OECDashboard() {
  const { toast } = useToast();
  const { user, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [requests, setRequests] = useState<AccreditationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && !authLoading) {
      fetchRequests();
    }
  }, [user, authLoading]);

  // Rediriger vers login si non authentifié
  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch("http://localhost:8082/api/requests", {
        credentials: "include"
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      } else {
        toast({
          title: "Erreur",
          description: "Impossible de charger les demandes",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Erreur:", error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-slate-50">
      <Sidebar />
      
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
          
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
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="text-[10px] font-bold uppercase"
                  onClick={() => setLocation("/oec/new-request")}
                >
                  Nouvelle Demande
                </Button>
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
  {loading ? (
    <TableRow key="loading-row">
      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
        Chargement...
      </TableCell>
    </TableRow>
  ) : requests.length === 0 ? (
    <TableRow key="empty-row">
      <TableCell colSpan={7} className="text-center py-8 text-slate-400">
        Aucune demande trouvée
      </TableCell>
    </TableRow>
  ) : (
    requests.map((row, index) => (
      <TableRow key={`${row.ref}-${index}`} className="text-xs">
        <TableCell className="font-bold text-primary">{row.ref}</TableCell>
        <TableCell>{row.type}</TableCell>
        <TableCell>{row.domain}</TableCell>
        <TableCell>{row.date}</TableCell>
        <TableCell>
          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold uppercase">
            {row.status}
          </span>
        </TableCell>
        <TableCell className="font-medium">{row.next}</TableCell>
        <TableCell className="text-right">
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <Eye className="h-3 w-3" />
          </Button>
        </TableCell>
      </TableRow>
    ))
  )}
</TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="border-b pb-4"><CardTitle className="text-base">Mes Certificats</CardTitle></CardHeader>
                <CardContent className="p-4">
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Les certificats seront affichés ici</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="border-b pb-4"><CardTitle className="text-base">Documents Récents</CardTitle></CardHeader>
                <CardContent className="p-4">
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">Les documents récents seront affichés ici</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
  );
}
