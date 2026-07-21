import { useState } from "react";
import { useTranslation } from "react-i18next";
import { DashboardHeader } from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Receipt, Send, CheckCircle2 } from "lucide-react";

/**
 * Tableau de bord du service Consolidation.
 *
 * Le rôle CONSOLIDATION est responsable de :
 *  - Recevoir le rapport d'évaluation validé (REE → RA → CD → Consolidation).
 *  - Émettre la facture finale et la transmettre à l'OEC avec le rapport.
 *  - Recevoir le certificat + annexe (validé DT → ADMIN → Consolidation),
 *    établir la facture associée et informer l'OEC qu'il doit payer pour
 *    récupérer son certificat d'accréditation.
 */
export default function ConsolidationDashboard() {
  const { t } = useTranslation();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    window.location.reload();
  };

  const tiles = [
    {
      title: "Rapports à facturer",
      description: "Rapports d'évaluation validés par le CD, en attente d'émission de facture et d'envoi à l'OEC.",
      icon: FileText,
      badge: "À traiter",
      href: "/consolidation/reports",
    },
    {
      title: "Factures rapport",
      description: "Suivi des factures émises pour les rapports d'évaluation envoyés aux OEC.",
      icon: Receipt,
      badge: "En cours",
      href: "/consolidation/invoices",
    },
    {
      title: "Certificats à délivrer",
      description: "Certificats + annexes validés par le DT et reçus de l'admin. Émettre la facture et notifier l'OEC.",
      icon: Send,
      badge: "À émettre",
      href: "/consolidation/certificates",
    },
    {
      title: "Paiements certificat",
      description: "Suivi des paiements OEC pour la délivrance du certificat d'accréditation.",
      icon: CheckCircle2,
      badge: "À vérifier",
      href: "/consolidation/payments",
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <DashboardHeader
        title={t("roles.CONSOLIDATION", "Service Consolidation")}
        subtitle="Facturation et délivrance finale des rapports d'évaluation et des certificats d'accréditation."
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.title} className="hover:shadow-md transition">
            <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t.title}</CardTitle>
              <t.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-2">{t.badge}</Badge>
              <CardDescription className="text-xs">{t.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
