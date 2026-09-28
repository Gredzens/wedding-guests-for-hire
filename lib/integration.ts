export function sheetUpsertRange(
  tab: "Sales" | "Expenses",
  firstColumn: unknown[][],
  reference: string,
) {
  const index = firstColumn.findIndex((row) => row[0] === reference);
  return index >= 1
    ? { mode: "update" as const, range: `${tab}!A${index + 1}` }
    : { mode: "append" as const, range: `${tab}!A:A` };
}

export function notificationRecipient(
  originalChatId: string | null | undefined,
  currentlyLinkedChatId: string | null | undefined,
) {
  return originalChatId || currentlyLinkedChatId || undefined;
}
