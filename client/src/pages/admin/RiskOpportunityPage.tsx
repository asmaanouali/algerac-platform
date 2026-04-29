import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

/**
 * Placeholder page for "Risques & Opportunités".
 * Module to be implemented (registry of risks/opportunities, treatment actions, follow-up).
 */
export default function RiskOpportunityPage() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="md:ml-64">
        <Navbar />
        <main className="p-4 md:p-8 space-y-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <ShieldAlert className="h-7 w-7 text-amber-600" />
              {t("nav.riskOpportunities", "Risques & Opportunités")}
            </h1>
            <p className="text-muted-foreground mt-2">
              Identification, évaluation et traitement des risques et opportunités du SMQ.
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Module en cours de développement</CardTitle>
              <CardDescription>
                Cette section regroupera le registre des risques et opportunités, les plans
                d'actions associés et leur suivi conformément aux exigences ISO/IEC 17011.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-dashed bg-white p-8 text-center text-muted-foreground">
                Aucune donnée disponible pour le moment.
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
