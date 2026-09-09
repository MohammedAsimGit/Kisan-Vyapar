"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, X } from "lucide-react";
import { useSessionUser } from "@/lib/client/use-session-user";
import {
  fetchNotifications,
  fetchUnreadCount,
} from "@/lib/client/api-queries";
import { kvKeys } from "@/lib/client/query-keys";
import { postJson } from "@/lib/client/fetch-json";
import { cn } from "@/lib/utils/cn";
import {
  NOTIFICATION_META,
  getNotificationDestination,
} from "@/constants/notification-types";
import type { NotificationType } from "@/constants/notification-types";

/* -------------------------------------------------------------------------- */
/* Types                                                                       */
/* -------------------------------------------------------------------------- */

interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  entityType?: string;
  entityId?: string;
  isRead: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

/* -------------------------------------------------------------------------- */
/* Panel                                                                       */
/* -------------------------------------------------------------------------- */

export function NotificationBell() {
  const session = useSessionUser();
  const userId = session.data?.id;
  const role = session.data?.role;
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const unreadQuery = useQuery({
    queryKey: kvKeys.unreadCount(userId ?? ""),
    queryFn: fetchUnreadCount,
    enabled: Boolean(userId),
    refetchInterval: 30000,
  });

  const unreadCount = unreadQuery.data?.count ?? 0;

  const listQuery = useQuery({
    queryKey: kvKeys.notifications(userId ?? ""),
    queryFn: () => fetchNotifications(1),
    enabled: Boolean(userId) && open,
  });

  const markAllMutation = useMutation({
    mutationFn: () => postJson("/api/notifications/read-all", {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: kvKeys.unreadCount(userId ?? ""),
      });
      void queryClient.invalidateQueries({
        queryKey: kvKeys.notifications(userId ?? ""),
      });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) =>
      postJson(`/api/notifications/${id}/read`, {}),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: kvKeys.unreadCount(userId ?? ""),
      });
    },
  });

  // Close on outside click
  useEffect(() => {
    if (!open) return;
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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleNotificationClick = useCallback(
    (n: NotificationItem) => {
      if (!n.isRead) {
        markReadMutation.mutate(n.id);
      }
      setOpen(false);
    },
    [markReadMutation],
  );

  if (!userId || !role) return null;

  const notifications = (listQuery.data?.notifications ?? []) as NotificationItem[];
  const grouped = groupNotifications(notifications);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-label="Notifications"
        className="relative inline-flex size-10 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="size-[18px]" strokeWidth={1.8} />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            className="fixed left-4 right-4 top-16 z-50 mx-auto max-w-sm overflow-hidden rounded-2xl border border-border bg-surface shadow-raised sm:left-auto sm:right-0 sm:top-auto sm:mt-2 sm:absolute sm:top-full sm:mx-0 sm:w-[calc(100vw-2rem)]"
            role="dialog"
            aria-label="Notifications"
          >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">
              Notifications
            </h2>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllMutation.mutate()}
                  disabled={markAllMutation.isPending}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/10"
                >
                  <CheckCheck className="size-3.5" />
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close notifications"
                className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {listQuery.isPending && (
              <div className="space-y-3 p-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="animate-pulse space-y-2">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-4 w-48 rounded bg-muted" />
                    <div className="h-3 w-36 rounded bg-muted" />
                  </div>
                ))}
              </div>
            )}

            {!listQuery.isPending && notifications.length === 0 && (
              <div className="px-4 py-10 text-center">
                <Bell className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm font-medium text-muted-foreground">
                  No notifications yet
                </p>
                <p className="mt-1 text-xs text-muted-foreground/70">
                  {role === "farmer"
                    ? "New crop matches, offers, and order updates will appear here."
                    : "New farmer matches, offers, and order updates will appear here."}
                </p>
              </div>
            )}

            {!listQuery.isPending &&
              grouped.map(([label, items]) => (
                <div key={label}>
                  <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                  </p>
                  {items.map((n) => {
                    const meta = NOTIFICATION_META[n.type] ?? {
                      label: n.type,
                      icon: "📌",
                    };
                    const href =
                      n.entityType && n.entityId
                        ? getNotificationDestination(n.entityType, n.entityId, role as "farmer" | "vendor")
                        : undefined;

                    const content = (
                      <div
                        className={cn(
                          "flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50",
                          !n.isRead && "bg-primary/[0.03]",
                        )}
                      >
                        <span className="mt-0.5 text-lg leading-none">
                          {meta.icon}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              !n.isRead
                                ? "font-semibold text-foreground"
                                : "font-medium text-foreground/80",
                            )}
                          >
                            {n.title}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                            {n.message}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/60">
                              {timeAgo(n.createdAt)}
                            </span>
                            {href && (
                              <span className="text-[10px] font-medium text-primary">
                                View →
                              </span>
                            )}
                          </div>
                        </div>
                        {!n.isRead && (
                          <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                        )}
                      </div>
                    );

                    return href ? (
                      <Link
                        key={n.id}
                        href={href}
                        onClick={() => handleNotificationClick(n)}
                        className="block"
                      >
                        {content}
                      </Link>
                    ) : (
                      <div key={n.id}>{content}</div>
                    );
                  })}
                </div>
              ))}
          </div>
        </div>
        </>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Grouping helper                                                             */
/* -------------------------------------------------------------------------- */

function groupNotifications(
  items: NotificationItem[],
): [string, NotificationItem[]][] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  const groups: [string, NotificationItem[]][] = [];
  let current: NotificationItem[] = [];
  let currentLabel = "";

  for (const item of items) {
    const d = new Date(item.createdAt);
    let label: string;
    if (d >= todayStart) {
      label = "Today";
    } else if (d >= yesterdayStart) {
      label = "Yesterday";
    } else {
      label = "Earlier";
    }
    if (label !== currentLabel) {
      if (current.length > 0) groups.push([currentLabel, current]);
      current = [];
      currentLabel = label;
    }
    current.push(item);
  }
  if (current.length > 0) groups.push([currentLabel, current]);
  return groups;
}
