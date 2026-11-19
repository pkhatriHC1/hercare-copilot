import { ArrowRightLeft, BedDouble, Bell, CircleHelp, RefreshCw } from "lucide-react";
import { Button, Drawer, EmptyState } from "@hc1com/design-system";
import { getNotifications, markAllRead } from "../lib/postpartum";
import { formatDate } from "../mock/episodes";

const KIND = {
  moved: { Icon: ArrowRightLeft, tone: "text-[color:var(--hc-color-action-primary)]" },
  updated: { Icon: RefreshCw, tone: "text-[color:var(--hc-color-status-info-fg)]" },
  confirm: { Icon: CircleHelp, tone: "text-[color:var(--hc-color-status-warning-fg)]" },
  readmission: { Icon: BedDouble, tone: "text-[color:var(--hc-color-status-error-fg)]" },
};

/** What HerCare did with records received from Epic. Selecting one opens the patient, or the confirmation. */
export function NotificationsDrawer({ open, onOpenChange, onSelect }) {
  const items = getNotifications();
  const unread = items.filter(n => !n.read).length;
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <Drawer.Content placement="right" size="md">
        <Drawer.Header>
          <Drawer.Title>Notifications</Drawer.Title>
          <Drawer.Description>{unread > 0 ? `${unread} new from Epic` : "You're up to date"}</Drawer.Description>
        </Drawer.Header>
        <Drawer.Body>
          {items.length === 0 ? (
            <EmptyState variant="default" layout="centered">
              <EmptyState.Icon><Bell /></EmptyState.Icon>
              <EmptyState.Title>No notifications</EmptyState.Title>
              <EmptyState.Description>When Epic sends an end-of-pregnancy record, the patients HerCare moves show up here.</EmptyState.Description>
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-8">
              {items.map(n => {
                const { Icon, tone } = KIND[n.kind] ?? KIND.moved;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(n)}
                      className={`flex w-full items-start gap-12 rounded-[var(--hc-radius-12)] border px-16 py-12 text-left hover:bg-[color:var(--hc-color-bg-subtle)] focus-visible:outline-2 focus-visible:outline-[color:var(--hc-color-border-focus)] ${
                        n.read ? "border-[color:var(--hc-color-border-subtle)]" : "border-[color:var(--hc-color-action-primary)] bg-[color:var(--hc-color-brand-50)]"
                      }`}
                    >
                      <Icon className={`mt-4 size-16 shrink-0 ${tone}`} aria-hidden />
                      <span className="flex min-w-0 flex-1 flex-col gap-4">
                        <span className="text-14 font-semibold text-[color:var(--hc-color-text-primary)]">{n.title}</span>
                        <span className="text-12 text-[color:var(--hc-color-text-secondary)]">{n.detail}</span>
                        <span className="text-12 text-[color:var(--hc-color-text-supporting)]">{formatDate(n.date)} · from Epic</span>
                      </span>
                      {!n.read && <span className="mt-4 size-8 shrink-0 rounded-full bg-[color:var(--hc-color-action-primary)]" aria-label="Unread" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Drawer.Body>
        {unread > 0 && (
          <Drawer.Footer>
            <Drawer.Actions>
              <Button variant="outline" size="sm" onClick={markAllRead}>Mark all as read</Button>
            </Drawer.Actions>
          </Drawer.Footer>
        )}
      </Drawer.Content>
    </Drawer>
  );
}
