import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatCard } from "@/components/stat-card";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import {
  Loader2, Clock, BadgeDollarSign, DollarSign, CheckCircle, Receipt,
  ArrowRight, Building2, FileText,
} from "lucide-react";

interface Quotation {
  id: number;
  quotationNumber: string;
  status: string;
  sentToDagDate: string;
  preparedByRaName: string;
  request: { referenceNumber: string; domain: string; oec: { organizationName: string } };
}

interface OECApp {
  id: number;
  status: string;
  nomOrganisme: string;
  createdAt: string;
}

export default function DAGDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [apps, setApps] = useState<OECApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [qRes, appsRes] = await Promise.all([
          apiRequest("GET", "/api/quotations/pending-approval").catch(() => null),
          apiRequest("GET", "/api/oec-applications/dag/all").catch(() => null),
        ]);
        if (qRes) setQuotations(await qRes.json());
        if (appsRes) {
          const data = await appsRes.json();
          setApps(Array.isArray(data) ? data : []);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const feeToSet = apps.filter(a => a.status === "AWAITING_DAG_FEE");
  const awaitingPayment = apps.filter(a => a.status === "FEE_SET_AWAITING_PAYMENT");
  const verified = apps.filter(a => a.status === "PAYMENT_VERIFIED" || a.status === "ACCOUNT_CREATED");

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64">
        <Navbar />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold">{t('dag_page.dashboardTitle', { defaultValue: "Tableau de bord DAG" })}</h1>
              <p className="text-muted-foreground mt-1">
                {user?.fullName ? `${user.fullName} — ` : ""}Suivi des frais d'enregistrement, devis et paiements.
              </p>
            </div>

            {loading ? (
              <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <StatCard
                    title="Devis à établir"
                    value={quotations.length}
                    icon={Clock}
                    description="Demandes RA en attente"
                    className={quotations.length > 0 ? "border-l-amber-500" : ""}
                  />
                  <StatCard
                    title="Frais à définir"
                    value={feeToSet.length}
                    icon={BadgeDollarSign}
                    description="Inscription OEC"
                    className={feeToSet.length > 0 ? "border-l-blue-500" : ""}
                  />
                  <StatCard
                    title="Paiements en cours"
                    value={awaitingPayment.length}
                    icon={DollarSign}
                    description="En attente de virement"
                  />
                  <StatCard
                    title="Paiements vérifiés"
                    value={verified.length}
                    icon={CheckCircle}
                    description="Traitement terminé"
                    className="border-l-emerald-500"
                  />
                </div>

                {quotations.length > 0 && (
                  <Card className="border-amber-200 bg-amber-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-amber-800 flex items-center gap-2">
                        <Receipt className="h-5 w-5" /> {quotations.length} devis à établir
                      </CardTitle>
                      <CardDescription className="text-amber-700">
                        Vérifiez la composition d'équipe et fixez le montant de chaque devis.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {quotations.slice(0, 5).map(q => (
                        <div key={q.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-amber-100">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">
                              {q.quotationNumber} — {q.request?.referenceNumber || "—"}
                            </p>
                            <p className="text-xs text-amber-700 truncate">
                              {q.request?.oec?.organizationName} · {q.request?.domain} · RA: {q.preparedByRaName}
                            </p>
                          </div>
                          <Link href="/dag/fixation-devis">
                            <Button size="sm" variant="outline" className="text-amber-700 border-amber-300 ml-2">
                              Établir <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                {feeToSet.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base text-blue-800 flex items-center gap-2">
                        <Building2 className="h-5 w-5" /> {feeToSet.length} candidature(s) OEC en attente de frais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {feeToSet.slice(0, 5).map(a => (
                        <div key={a.id} className="flex items-center justify-between p-2 bg-white rounded-lg border border-blue-100">
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-sm truncate">{a.nomOrganisme}</p>
                            <p className="text-xs text-blue-700">
                              Soumise le {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                            </p>
                          </div>
                          <Link href="/dag/frais-enregistrement">
                            <Button size="sm" variant="outline" className="text-blue-700 border-blue-300 ml-2">
                              Définir frais <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                )}

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <Link href="/dag/fixation-devis">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-6 text-center">
                        <Receipt className="w-10 h-10 mx-auto mb-3 text-primary" />
                        <h3 className="font-semibold">Fixation des devis</h3>
                        <p className="text-xs text-muted-foreground mt-1">Sur demandes RA</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/dag/frais-enregistrement">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-6 text-center">
                        <BadgeDollarSign className="w-10 h-10 mx-auto mb-3 text-blue-600" />
                        <h3 className="font-semibold">Frais d'enregistrement</h3>
                        <p className="text-xs text-muted-foreground mt-1">Candidatures OEC</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/dag/paiements">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-6 text-center">
                        <DollarSign className="w-10 h-10 mx-auto mb-3 text-emerald-600" />
                        <h3 className="font-semibold">Suivi des paiements</h3>
                        <p className="text-xs text-muted-foreground mt-1">Vérification virements</p>
                      </CardContent>
                    </Card>
                  </Link>
                  <Link href="/dag/tarifs">
                    <Card className="cursor-pointer hover:shadow-lg transition-shadow h-full">
                      <CardContent className="p-6 text-center">
                        <FileText className="w-10 h-10 mx-auto mb-3 text-purple-600" />
                        <h3 className="font-semibold">Grille tarifaire</h3>
                        <p className="text-xs text-muted-foreground mt-1">Référentiel des tarifs</p>
                      </CardContent>
                    </Card>
                  </Link>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
