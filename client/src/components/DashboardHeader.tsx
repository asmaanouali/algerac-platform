import { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  refreshLabel?: string;
}

export function DashboardHeader({
  title,
  subtitle,
  onRefresh,
  refreshing = false,
  refreshLabel,
}: DashboardHeaderProps) {
  const { t } = useTranslation();
  const label = refreshLabel ?? t("common.refresh");
  return (
    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <div className="text-2xl font-bold">{title}</div>
        {subtitle ? <p className="text-muted-foreground mt-1">{subtitle}</p> : null}
      </div>
      {onRefresh ? (
        <Button size="sm" variant="outline" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? "animate-spin" : ""}`} />
          {label}
        </Button>
      ) : null}
    </div>
  );
}
