"use client";

import { useEffect, useRef, useState } from "react";
import { useToast } from "@/components/ui/Toast";

export type DashboardNotification = {
  id: string;
  type: "pay" | "rem" | "alert" | "team";
  title: string;
  body: string;
  read: boolean;
  created_at: string;
};

export function NotificationBell({ notifications: initialNotifications }: { notifications: DashboardNotification[] }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(initialNotifications);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const showToast = useToast();

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node | null;
      if (panelRef.current && target && !panelRef.current.contains(target)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  const unread = notifications.filter((notification) => !notification.read).length;

  function markAllRead() {
    setNotifications((current) => current.map((notification) => ({ ...notification, read: true })));
    showToast("All notifications marked as read");
  }

  function markOneRead(id: string) {
    setNotifications((current) => current.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
  }

  return (
    <div className="notif-wrap" ref={panelRef}>
      <button type="button" className="notif-bell" aria-label="Notifications" onClick={() => setOpen((value) => !value)}>
        🔔
        <span className={`notif-dot${unread ? " show" : ""}`} aria-hidden="true" />
      </button>
      <div className={`notif-panel${open ? " open" : ""}`}>
        <div className="notif-head">
          <h4>Notifications</h4>
          <button type="button" className="notif-mark" onClick={markAllRead} disabled={unread === 0}>Mark all read</button>
        </div>
        {notifications.length === 0 ? (
          <div className="notif-empty">No notifications yet.</div>
        ) : (
          notifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              className={`notif-item${notification.read ? "" : " unread"}`}
              onClick={() => {
                if (!notification.read) {
                  markOneRead(notification.id);
                  showToast(notification.title);
                }
              }}
            >
              <div className={`notif-ic ${notification.type}`}>{notification.type === "pay" ? "₹" : notification.type === "rem" ? "⏰" : notification.type === "alert" ? "!" : "◎"}</div>
              <div className="notif-body">
                <div className="notif-title">{notification.title}</div>
                <div className="notif-desc">{notification.body}</div>
                <div className="notif-time">{new Date(notification.created_at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Karachi" })}</div>
              </div>
            </button>
          ))
        )}
        <div className="notif-foot">
          <button
            type="button"
            className="notif-view-all"
            onClick={() => {
              setOpen(false);
              showToast("Notification center is up to date.");
            }}
          >
            View all notifications
          </button>
        </div>
      </div>
    </div>
  );
}
