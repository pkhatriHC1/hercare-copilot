import { useEffect, useState } from "react";
import { Toast } from "@hc1com/design-system";
import { AssistantPanel } from "@hc1com/design-system/patterns";
import { ClinicalShell } from "./shell/ClinicalShell";
import { PatientWorklist } from "./worklist/PatientWorklist";
import { PatientWorkspace } from "./workspace/PatientWorkspace";
import { MhrDialog } from "./workspace/MhrDialog";
import { CancelVisitDialog } from "./visits/CancelVisitDialog";
import { VISITS, getEpisode } from "./mock/episodes";
import { PATIENTS } from "./lib/clinical";
import { expirePostpartumWindow, markEpisodeRead, markRead, startDemoFeed, unreadCount } from "./lib/postpartum";
import { NotificationsDrawer } from "./postpartum/NotificationsDrawer";

const time = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function App() {
  const [screen, setScreen] = useState("worklist");
  const [patient, setPatient] = useState(null);
  const [episodeId, setEpisodeId] = useState(null);
  const [defaultZone, setDefaultZone] = useState("overview");
  const [mhrPatient, setMhrPatient] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [toast, setToast] = useState("");
  const [, setVersion] = useState(0);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [messages, setMessages] = useState([]);

  /* Re-render when the postpartum rules move or discharge a patient; close episodes past the window on load. */
  const [notesOpen, setNotesOpen] = useState(false);
  const [listRequest, setListRequest] = useState(null);
  useEffect(() => {
    expirePostpartumWindow();
    /* DEMO ONLY: Epic records "arrive" a few seconds after the page opens and are processed in the background. */
    startDemoFeed(results => {
      const moved = results.filter(r => r.result === "moved").length;
      if (moved > 0) setToast(`${moved} patient${moved === 1 ? "" : "s"} moved to Postpartum from Epic records.`);
    });
    const bump = () => setVersion(v => v + 1);
    window.addEventListener("postpartum-updated", bump);
    return () => window.removeEventListener("postpartum-updated", bump);
  }, []);

  const openPatient = (p, zone = "overview", epId = null) => {
    if (epId) markEpisodeRead(epId);
    setPatient(p); setEpisodeId(epId); setDefaultZone(zone); setScreen("workspace");
  };
  const episode = episodeId ? getEpisode(episodeId) : null;

  /* A notification opens the patient; a confirmation request opens the Active worklist, where it is resolved. */
  const openNotification = n => {
    markRead(n.id);
    setNotesOpen(false);
    if (n.kind === "confirm") { setScreen("worklist"); setListRequest({ list: "active", at: Date.now() }); return; }
    const p = PATIENTS.find(x => x.id === n.patientId);
    if (p) openPatient(p, n.kind === "moved" || n.kind === "updated" ? "visits" : "overview", n.episodeId);
  };

  /* Cancelling marks the visit cancelled in the shared demo data, as in the original prototype. */
  const cancelVisit = reason => {
    const i = VISITS.findIndex(v => v.id === cancelTarget.visit.id);
    if (i >= 0) VISITS[i] = { ...VISITS[i], status: "cancelled", cancellationReason: reason, cancelledBy: "Clinical IQ User", cancelledAt: new Date().toISOString() };
    setCancelTarget(null);
    setVersion(v => v + 1);
    setToast("The follow-up visit was cancelled.");
  };
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  /* IQ Assistant: demo replies about the open patient, as in the original prototype. */
  const ap = screen === "workspace" ? patient : null;
  useEffect(() => {
    setMessages([{
      id: "greeting", role: "assistant", time: time(),
      content: ap
        ? `IQ Assistant ready for ${ap.name} (${ap.parity}, ${ap.gestAge}). Ask about ACOG guidelines, IV iron therapy, or delivery planning.`
        : "IQ Assistant ready. Open a patient to ask about ACOG guidelines, IV iron therapy, or delivery planning.",
    }]);
  }, [ap?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const ask = text => {
    const q = text.trim();
    if (!q) return;
    setMessages(m => [...m, { id: `u${m.length}`, role: "user", content: q, time: time() }]);
    const reply = ap
      ? `Based on ACOG PB #233 and ${ap.name}'s profile — recommended: ${ap.order}. ${ap.severity === "Critical" ? "Immediate IV iron intervention warranted." : "Optimization window remains open — act within 14 days."}`
      : "Open a patient from the worklist and I can answer with their labs, risk score and recommendations in view.";
    setTimeout(() => setMessages(m => [...m, { id: `a${m.length}`, role: "assistant", content: reply, time: time() }]), 500);
  };

  return (
    <ClinicalShell screen={screen} onNavigate={setScreen} onOpenAssistant={() => setAssistantOpen(true)} notifications={{ count: unreadCount(), onClick: () => setNotesOpen(true) }}>
      {/* The worklist stays mounted so its filters are kept when you come back from a patient. */}
      <div hidden={screen !== "worklist"}>
        <PatientWorklist onOpen={openPatient} onOpenMhr={setMhrPatient} onCancelVisit={setCancelTarget} onToast={setToast} listRequest={listRequest} />
      </div>
      {screen === "workspace" && patient && (
        <PatientWorkspace
          patient={patient}
          episode={episode}
          defaultZone={defaultZone}
          onBack={() => setScreen("worklist")}
          onOpenMhr={setMhrPatient}
          onCancelVisit={setCancelTarget}
        />
      )}

      <NotificationsDrawer open={notesOpen} onOpenChange={setNotesOpen} onSelect={openNotification} />
      {mhrPatient && <MhrDialog p={mhrPatient} onClose={() => setMhrPatient(null)} />}
      {cancelTarget?.visit && (
        <CancelVisitDialog
          visit={cancelTarget.visit}
          patient={cancelTarget.patient}
          episode={cancelTarget.episode}
          onKeep={() => setCancelTarget(null)}
          onCancel={cancelVisit}
        />
      )}
      <AssistantPanel
        open={assistantOpen}
        onOpenChange={setAssistantOpen}
        title="IQ Assistant"
        subtitle={ap ? `HerCare Co-Pilot · ${ap.name}` : "HerCare Co-Pilot"}
        messages={messages}
        onSend={ask}
        placeholder={ap ? "Ask about this patient…" : "Ask a question…"}
        footnote="Recommendations follow ACOG PB #233. A clinician reviews every action."
      />
      {toast && (
        <div className="fixed right-24 bottom-24 z-[var(--hc-z-toast)]">
          <Toast variant="success" onDismiss={() => setToast("")}>
            <Toast.Title>{toast}</Toast.Title>
          </Toast>
        </div>
      )}
    </ClinicalShell>
  );
}
