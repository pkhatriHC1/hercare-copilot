import { useEffect, useState } from "react";
import { Toast } from "@hc1com/design-system";
import { AssistantPanel } from "@hc1com/design-system/patterns";
import { ClinicalShell } from "./shell/ClinicalShell";
import { PatientWorklist } from "./worklist/PatientWorklist";
import { PatientWorkspace } from "./workspace/PatientWorkspace";
import { MhrDialog } from "./workspace/MhrDialog";
import { CancelVisitDialog } from "./visits/CancelVisitDialog";
import { VISITS, getEpisode } from "./mock/episodes";

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

  const openPatient = (p, zone = "overview", epId = null) => {
    setPatient(p); setEpisodeId(epId); setDefaultZone(zone); setScreen("workspace");
  };
  const episode = episodeId ? getEpisode(episodeId) : null;

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
    <ClinicalShell screen={screen} onNavigate={setScreen} onOpenAssistant={() => setAssistantOpen(true)}>
      {/* The worklist stays mounted so its filters are kept when you come back from a patient. */}
      <div hidden={screen !== "worklist"}>
        <PatientWorklist onOpen={openPatient} onOpenMhr={setMhrPatient} onCancelVisit={setCancelTarget} />
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
