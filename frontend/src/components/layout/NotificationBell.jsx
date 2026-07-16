import React, { useState, useEffect, useCallback, useRef } from "react";
import { Bell, AlertTriangle, MessageSquareHeart, RefreshCw, Inbox } from "lucide-react";
import {
  getCitizenNotifications,
  getAdminNotifications,
  markNotificationRead,
} from "../../services/complaintService";
import useAuth from "../../hooks/useAuth";

const POLL_MS = 30000;

const typeIcon = (type) => {
  if (type === "escalation") return AlertTriangle;
  if (type === "feedback") return MessageSquareHeart;
  return Bell;
};

const typeChip = (type) => {
  if (type === "escalation") return "bg-status-error-bg text-status-error-accent";
  if (type === "feedback") return "bg-status-success-bg text-status-success-accent";
  return "bg-primary-light text-primary";
};

const timeAgo = (iso) => {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
};

/**
 * Navbar notification bell. Citizens see alerts for their own phone number;
 * admins see system alerts (scoped to their department when applicable).
 */
export function NotificationBell() {
  const { userRole, userData } = useAuth();
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const fetchItems = useCallback(async () => {
    try {
      if (userRole === "admin") {
        const scope =
          userData?.adminRole === "department_admin"
            ? { role: "department_admin", department: userData?.department }
            : {};
        setItems(await getAdminNotifications(scope));
      } else if (userRole === "citizen" && userData?.mobile) {
        setItems(await getCitizenNotifications(userData.mobile));
      }
    } catch {
      /* silent — bell is non-critical */
    }
  }, [userRole, userData?.mobile, userData?.adminRole, userData?.department]);

  // Initial fetch + polling
  useEffect(() => {
    fetchItems();
    const t = setInterval(fetchItems, POLL_MS);
    return () => clearInterval(t);
  }, [fetchItems]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((n) => !n.is_read).length;

  const handleItemClick = async (n) => {
    if (!n.is_read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, is_read: true } : x)));
      await markNotificationRead(n.id);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    await fetchItems();
    setLoading(false);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        title="Notifications"
        data-tour="notifications"
        aria-label={`Notifications${unread ? ` (${unread} unread)` : ""}`}
        className="relative p-2 rounded-md text-muted transition-colors hover:text-primary hover:bg-primary-light"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-status-error-accent text-white text-[9px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-80 max-w-[90vw] bg-surface border border-border rounded-card shadow-lift z-50 animate-pop overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-surfaceSoft">
            <span className="text-xs font-bold uppercase tracking-wider text-text">
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && <span className="badge-error !text-[10px]">{unread} new</span>}
              <button
                onClick={handleRefresh}
                aria-label="Refresh notifications"
                className="p-1 rounded text-muted hover:text-primary transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-muted">
                <Inbox className="w-6 h-6" />
                <p className="text-xs">No notifications yet</p>
              </div>
            ) : (
              items.map((n) => {
                const Icon = typeIcon(n.type);
                return (
                  <button
                    key={n.id}
                    onClick={() => handleItemClick(n)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border last:border-0 transition-colors hover:bg-surfaceSoft ${
                      n.is_read ? "opacity-60" : ""
                    }`}
                  >
                    <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${typeChip(n.type)}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-xs text-text leading-snug">{n.message}</span>
                      <span className="block text-[10px] text-muted mt-1">
                        Ticket #{n.complaint_id} · {timeAgo(n.created_at)}
                        {!n.is_read && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary ml-1.5 align-middle" />
                        )}
                      </span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
