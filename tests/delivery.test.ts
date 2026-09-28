import { describe, expect, it, vi } from "vitest";
import {
  runTrackedDelivery,
  type DeliveryRecord,
  type DeliveryStore,
} from "../lib/delivery";

function memoryStore() {
  const records = new Map<string, DeliveryRecord>();
  const key = (
    record: Pick<DeliveryRecord, "kind" | "recordType" | "reference">,
  ) => `${record.kind}:${record.recordType}:${record.reference}`;
  const store: DeliveryStore = {
    async get(kind, recordType, reference) {
      return records.get(key({ kind, recordType, reference })) ?? null;
    },
    async save(record) {
      records.set(key(record), { ...record });
    },
  };
  return { records, store };
}

describe("tracked external delivery", () => {
  it("retains a failure without changing the financial record", async () => {
    const { records, store } = memoryStore();
    const deliver = vi
      .fn()
      .mockRejectedValue(new Error("provider unavailable"));
    const identity = {
      kind: "SHEETS" as const,
      recordType: "sale" as const,
      reference: "X01",
    };

    await expect(runTrackedDelivery(store, identity, deliver)).rejects.toThrow(
      "provider unavailable",
    );
    expect(records.get("SHEETS:sale:X01")).toEqual({
      ...identity,
      status: "FAILED",
      attempts: 1,
      lastError: "provider unavailable",
    });
  });

  it("retries the same identity and marks it sent without duplicating it", async () => {
    const { records, store } = memoryStore();
    const identity = {
      kind: "TELEGRAM" as const,
      recordType: "expense" as const,
      reference: "E99",
    };
    await expect(
      runTrackedDelivery(store, identity, async () => {
        throw new Error("first failure");
      }),
    ).rejects.toThrow();
    await runTrackedDelivery(store, identity, async () => undefined);

    expect(records.size).toBe(1);
    expect(records.get("TELEGRAM:expense:E99")).toEqual({
      ...identity,
      status: "SENT",
      attempts: 2,
      lastError: null,
    });
  });
});
