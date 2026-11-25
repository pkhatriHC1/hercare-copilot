import { ClipboardList, LogOut, RotateCcw } from "lucide-react";
import { AppShell, Sidebar } from "@hc1com/design-system";

/* Sign out in the prototype reloads the app, which resets the demo data. */
const USER = {
  name: "Clinical IQ User",
  role: "HerCare Co-Pilot",
  menu: [
    /* DEMO ONLY: reloading replays the mock Epic records a few seconds after the page opens. */
    { label: "Replay Epic events (demo)", icon: <RotateCcw />, onSelect: () => window.location.reload() },
    { label: "Sign out", icon: <LogOut />, destructive: true, separatorBefore: true, onSelect: () => window.location.reload() },
  ],
};

/**
 * ClinicalIQ app frame for HerCare: the hc1 top bar and sidebar, the same as Anemia, SourceIQ and PBM.
 * `screen` is the current screen; `onNavigate(screen)` switches it.
 */
export function ClinicalShell({ screen, onNavigate, onOpenAssistant, notifications, children }) {
  return (
    <AppShell>
      <AppShell.TopBar
        product={{ name: "ClinicalIQ" }}
        context="HerCare Co-Pilot"
        assistant={onOpenAssistant ? { onClick: onOpenAssistant } : undefined}
        notifications={notifications}
        user={USER}
      />
      <Sidebar ariaLabel="ClinicalIQ navigation" persistKey="hc1-clinicaliq-hercare-sidebar">
        <Sidebar.Header brand="ClinicalIQ" />
        <Sidebar.Section title="HerCare">
          <Sidebar.Item
            icon={<ClipboardList />}
            label="Patient worklist"
            active={screen === "worklist" || screen === "workspace"}
            onClick={() => onNavigate("worklist")}
          />
        </Sidebar.Section>
      </Sidebar>
      <AppShell.Main maxWidth={null} className="w-full">{children}</AppShell.Main>
    </AppShell>
  );
}
