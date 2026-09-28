import { describe, expect, it } from "vitest";
import { notificationRecipient, sheetUpsertRange } from "../lib/integration";

describe("integration invariants", () => {
  it("updates the existing Sheets row for a repeated reference", () => {
    const rows = [["Reference"], ["S01"], ["S02"]];
    expect(sheetUpsertRange("Sales", rows, "S02")).toEqual({
      mode: "update",
      range: "Sales!A3",
    });
    expect(sheetUpsertRange("Sales", rows, "S03")).toEqual({
      mode: "append",
      range: "Sales!A:A",
    });
  });

  it("preserves the original Telegram chat after relinking", () => {
    expect(notificationRecipient("original-chat", "new-chat")).toBe(
      "original-chat",
    );
    expect(notificationRecipient(null, "linked-chat")).toBe("linked-chat");
    expect(notificationRecipient(null, null)).toBeUndefined();
  });
});
