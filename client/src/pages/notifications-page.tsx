import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout-sidebar";
import { Navbar } from "@/components/navbar";
import {
  useNotifications,
  useMarkAsRead,
  useMarkAllAsRead,
  type Notification,
} from "@/hooks/use-notifications";

// ── helpers ─────────────────────────────────────────────────────────────────

function typeIcon(type: Notification["type"]) {
  switch (type) {
    case "success":
      return <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />;
    case "error":
      return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
    default:
      return <Info className="h-5 w-5 text-blue-500 shrink-0" />;
  }
}

function typeBadge(type: Notification["type"], t: (key: string) => string) {
  switch (type) {
    case "success":
      return <Badge className="bg-green-100 text-green-700 border-0 text-xs">{t('notifications_page.typeSuccess')}</Badge>;
    case "warning":
      return <Badge className="bg-amber-100 text-amber-700 border-0 text-xs">{t('notifications_page.typeWarning')}</Badge>;
    case "error":
      return <Badge className="bg-red-100 text-red-700 border-0 text-xs">{t('notifications_page.typeError')}</Badge>;
    default:
      return <Badge className="bg-blue-100 text-blue-700 border-0 text-xs">{t('notifications_page.typeInfo')}</Badge>;
  }
}

function formatDate(iso: string, t: (key: string, opts?: any) => string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return t('notifications_page.justNow');
  if (diffMins < 60) return t('notifications_page.minutesAgo', { count: diffMins });
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return t('notifications_page.hoursAgo', { count: diffH });
  return d.toLocaleDateString(undefined, {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unread = notifications.filter((n) => !n.read);
  const unreadCount = unread.length;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-64 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 p-6">
          {/* Page header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">{t('notifications_page.title')}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                {isLoading
                  ? t('common.loading')
                  : notifications.length === 0
                  ? t('notifications_page.noNotifications')
                  : `${notifications.length} notification${notifications.length > 1 ? "s" : ""}`}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <CheckCheck className="h-4 w-4 mr-2" />
                )}
                {t('notifications_page.markAllRead')}
              </Button>
            )}
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Bell className="h-12 w-12 text-muted-foreground/30 mb-3" />
                <p className="text-base font-medium text-muted-foreground">
                  {t('notifications_page.noNotifications')}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('notifications_page.noNotificationsDesc')}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader className="pb-0 pt-4 px-6">
                <CardTitle className="text-base font-semibold sr-only">
                  Liste des notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="divide-y">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        "flex gap-4 px-6 py-4 hover:bg-slate-50 transition-colors group",
                        !n.read && "bg-blue-50/50 hover:bg-blue-50"
                      )}
                    >
                      {/* Icon */}
                      <div className="mt-0.5 shrink-0">{typeIcon(n.type)}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-0.5">
                          <p
                            className={cn(
                              "text-sm",
                              !n.read ? "font-semibold" : "font-medium"
                            )}
                          >
                            {n.title}
                          </p>
                          {typeBadge(n.type, t)}
                          {!n.read && (
                            <span className="inline-block h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{n.message}</p>
                        <p className="text-xs text-muted-foreground mt-1.5">
                          {formatDate(n.createdAt, t)}
                        </p>
                      </div>

                      {/* Mark as read */}
                      {!n.read && (
                        <div className="shrink-0 flex items-start pt-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-slate-800"
                            title={t('notifications.markRead')}
                            onClick={() => markAsRead.mutate(n.id)}
                            disabled={markAsRead.isPending}
                          >
                            <Check className="h-4 w-4 mr-1" />
                            <span className="text-xs">{t('notifications.markRead')}</span>
                          </Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </main>
      </div>
    </div>
  );
}
