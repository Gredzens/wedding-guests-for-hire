export type DeliveryKind = "SHEETS" | "TELEGRAM";
export type RecordType = "sale" | "expense";
export type DeliveryStatus = "PENDING" | "FAILED" | "SENT";

export interface DeliveryRecord {
  kind: DeliveryKind;
  recordType: RecordType;
  reference: string;
  status: DeliveryStatus;
  attempts: number;
  lastError: string | null;
}

export interface DeliveryStore {
  get(
    kind: DeliveryKind,
    recordType: RecordType,
    reference: string,
  ): Promise<DeliveryRecord | null>;
  save(record: DeliveryRecord): Promise<void>;
}

function safeError(error: unknown) {
  return error instanceof Error
    ? error.message.slice(0, 240)
    : "Integration delivery failed";
}

export async function runTrackedDelivery(
  store: DeliveryStore,
  identity: Pick<DeliveryRecord, "kind" | "recordType" | "reference">,
  deliver: () => Promise<void>,
) {
  const existing = await store.get(
    identity.kind,
    identity.recordType,
    identity.reference,
  );
  const attempts = (existing?.attempts ?? 0) + 1;
  await store.save({
    ...identity,
    status: "PENDING",
    attempts,
    lastError: null,
  });
  try {
    await deliver();
    const sent: DeliveryRecord = {
      ...identity,
      status: "SENT",
      attempts,
      lastError: null,
    };
    await store.save(sent);
    return sent;
  } catch (error) {
    const failed: DeliveryRecord = {
      ...identity,
      status: "FAILED",
      attempts,
      lastError: safeError(error),
    };
    await store.save(failed);
    throw error;
  }
}
