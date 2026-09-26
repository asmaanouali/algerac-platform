import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { Activity, Loader2, Cpu, Gauge, Wifi, Server, AlertTriangle, RefreshCw } from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

interface Metrics {
  cpuUsage?: number;
  cpu?: number;
  ramUsedGb?: number;
  ramTotalGb?: number;
  ram?: number;
  networkMbps?: number;
  network?: number;
  apiLatencyMs?: number;
  apiLatency?: number;
  uptimeSeconds?: number;
}

interface HttpPoint {
  hour?: string;
  time?: string;
  count?: number;
  value?: number;
  requests?: number;
  errors?: number;
}

interface AlertItem {
  id: number;
  severity?: string;
  level?: string;
  title?: string;
  label?: string;
  message?: string;
  detail?: string;
  timestamp?: string;
}

const SEVERITY_BADGE: Record<string, string> = {
  ERROR: "bg-red-100 text-red-800",
  CRITICAL: "bg-red-100 text-red-800",
  WARNING: "bg-orange-100 text-orange-800",
  INFO: "bg-blue-100 text-blue-800",
  SUCCESS: "bg-green-100 text-green-800",
};

export default function MonitoringPage() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState<Metrics>({});
  const [httpData, setHttpData] = useState<HttpPoint[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [metricsRes, httpRes, alertsRes] = await Promise.allSettled([
        apiRequest("GET", "/api/admin/monitoring/metrics"),
        apiRequest("GET", "/api/admin/monitoring/http-requests"),
        apiRequest("GET", "/api/admin/monitoring/alerts"),
      ]);
      if (metricsRes.status === "fulfilled") {
        const json = await metricsRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        if (data) setMetrics(data);
      }
      if (httpRes.status === "fulfilled") {
        const json = await httpRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        setHttpData(Array.isArray(data) ? data : []);
      }
      if (alertsRes.status === "fulfilled") {
        const json = await alertsRes.value.json();
        const data = json?.data !== undefined ? json.data : json;
        setAlerts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      // ignore, show empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const cpuUsage = metrics.cpuUsage ?? metrics.cpu;
  const ramUsedGb = metrics.ramUsedGb;
  const ramTotalGb = metrics.ramTotalGb;
  const networkMbps = metrics.networkMbps ?? metrics.network;
  const apiLatencyMs = metrics.apiLatencyMs ?? metrics.apiLatency;

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col w-full md:ml-64 overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                <Activity className="w-6 h-6 text-primary" />
                Monitoring
              </h1>
              <p className="text-muted-foreground">Surveillez la santé et les performances de la plateforme en temps réel</p>
            </div>
            <Button variant="outline" onClick={() => fetchAll(true)} disabled={refreshing}>
              {refreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {t("common.refresh")}
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">CPU</p>
                      <p className="text-2xl font-bold">{cpuUsage != null ? `${cpuUsage}%` : "—"}</p>
                    </div>
                    <Cpu className="w-10 h-10 text-primary" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">RAM</p>
                      <p className="text-2xl font-bold">
                        {ramUsedGb != null && ramTotalGb != null ? `${ramUsedGb} / ${ramTotalGb} Go` : "—"}
                      </p>
                    </div>
                    <Gauge className="w-10 h-10 text-blue-500" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Réseau</p>
                      <p className="text-2xl font-bold">{networkMbps != null ? `${networkMbps} Mbps` : "N/A"}</p>
                    </div>
                    <Wifi className="w-10 h-10 text-purple-500" />
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Latence API</p>
                      <p className="text-2xl font-bold text-green-600">{apiLatencyMs != null ? `${apiLatencyMs} ms` : "N/A"}</p>
                    </div>
                    <Server className="w-10 h-10 text-green-500" />
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-3">
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Requêtes HTTP (24h)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {httpData.length === 0 ? (
                      <p className="text-center py-12 text-muted-foreground">Aucune donnée disponible</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={httpData}>
                          <defs>
                            <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="hour" tick={{ fontSize: 12 }} />
                          <YAxis tick={{ fontSize: 12 }} />
                          <Tooltip />
                          <Area type="monotone" dataKey="count" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRequests)" />
                          <Area type="monotone" dataKey="errors" stroke="#EF4444" fillOpacity={0.1} fill="#EF4444" />
                        </AreaChart>
                      </ResponsiveContainer>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-amber-500" /> Alertes actives</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {alerts.length === 0 ? (
                      <p className="text-center py-8 text-muted-foreground text-sm">Aucune alerte active</p>
                    ) : (
                      alerts.map((a) => {
                        const severity = a.severity || a.level || "INFO";
                        return (
                          <div key={a.id} className="p-3 border rounded-lg space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <Badge className={SEVERITY_BADGE[severity] || "bg-gray-100 text-gray-800"}>{severity}</Badge>
                              {a.timestamp && <span className="text-xs text-muted-foreground">{new Date(a.timestamp).toLocaleTimeString("fr-FR")}</span>}
                            </div>
                            <p className="text-sm">{a.message || a.detail}</p>
                          </div>
                        );
                      })
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
