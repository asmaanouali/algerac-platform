import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { Bell, Check, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
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
      return <CheckCircle className="h-4 w-4 text-green-500 shrink-0" />;
    case "warning":
      return <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />;
    case "error":
      return <XCircle className="h-4 w-4 text-red-500 shrink-0" />;
    default:
      return <Info className="h-4 w-4 text-blue-500 shrink-0" />;
  }
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60_000);
  if (diffMins < 1) return "À l'instant";
  if (diffMins < 60) return `Il y a ${diffMins} min`;
  const diffH = Math.floor(diffMins / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

// ── component ────────────────────────────────────────────────────────────────

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [, navigate] = useLocation();

  const { data: notifications = [], isLoading } = useNotifications();
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  const unread = notifications.filter((n) => !n.read);
  const unreadCount = unread.length;

  // Close panel on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative">
      {/* Bell button */}
      <Button
        ref={buttonRef}
        variant="ghost"
        size="icon"
        className="relative"
        onClick={() => setOpen((o) => !o)}
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown panel */}
      {open && (
        <div
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-xl border bg-white shadow-xl z-50 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-xs px-1.5 py-0 h-5">
                  {unreadCount} non lue{unreadCount > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-7 text-blue-600 hover:text-blue-700"
                onClick={() => markAllAsRead.mutate()}
                disabled={markAllAsRead.isPending}
              >
                {markAllAsRead.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <CheckCheck className="h-3 w-3 mr-1" />
                )}
                Tout marquer lu
              </Button>
            )}
          </div>

          {/* Body */}
          <ScrollArea className="h-[20rem]">
            {isLoading ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">Aucune notification</p>
              </div>
            ) : (
              <ul>
                {notifications.map((n) => (
                  <li
                    key={n.id}
                    className={cn(
                      "flex gap-3 px-4 py-3 border-b last:border-0 hover:bg-slate-50 transition-colors group",
                      !n.read && "bg-blue-50/60 hover:bg-blue-50"
                    )}
                  >
                    <div className="mt-0.5">{typeIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium text-slate-900 leading-tight", !n.read && "font-semibold")}>
                        {n.title}
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5 leading-snug line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-1">
                        {formatDate(n.createdAt)}
                      </p>
                    </div>
                    {!n.read && (
                      <button
                        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5 text-slate-400 hover:text-slate-700"
                        title="Marquer comme lu"
                        onClick={() => markAsRead.mutate(n.id)}
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>

          {/* Footer */}
          <div className="border-t px-4 py-2.5">
            <button
              className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline transition-colors"
              onClick={() => { setOpen(false); navigate("/notifications"); }}
            >
              Voir toutes les notifications
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
