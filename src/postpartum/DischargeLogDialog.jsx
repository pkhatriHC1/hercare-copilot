import { History } from "lucide-react";
import { Dialog, EmptyState, Table } from "@hc1com/design-system";
import { getDischargeLog } from "../lib/postpartum";
import { formatDate } from "../mock/episodes";

/** AC10: patients who left the Postpartum worklist, with the reason and date. */
export function DischargeLogDialog({ onClose }) {
  const log = getDischargeLog();
  return (
    <Dialog open onOpenChange={o => { if (!o) onClose(); }}>
      <Dialog.Content size="lg">
        <Dialog.Header>
          <Dialog.Title>Postpartum discharge log</Dialog.Title>
          <Dialog.Description>Patients removed from the Postpartum worklist</Dialog.Description>
        </Dialog.Header>
        <Dialog.Body className="[&>*]:shrink-0">
          {log.length === 0 ? (
            <EmptyState variant="default" layout="centered">
              <EmptyState.Icon><History /></EmptyState.Icon>
              <EmptyState.Title>No discharges yet</EmptyState.Title>
              <EmptyState.Description>Discharges and patients who reach the end of the 365-day window appear here.</EmptyState.Description>
            </EmptyState>
          ) : (
            <Table density="comfortable">
              <Table.Content>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Patient</Table.Head>
                    <Table.Head>Reason</Table.Head>
                    <Table.Head width={128}>Date</Table.Head>
                    <Table.Head width={152}>By</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {log.map((l, i) => (
                    <Table.Row key={`${l.episodeId}-${i}`}>
                      <Table.Cell truncate={false} className="font-medium">{l.patientName}</Table.Cell>
                      <Table.Cell truncate={false}>{l.reason}</Table.Cell>
                      <Table.Cell className="tabular-nums">{formatDate(l.date)}</Table.Cell>
                      <Table.Cell>{l.by}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table>
          )}
        </Dialog.Body>
      </Dialog.Content>
    </Dialog>
  );
}
