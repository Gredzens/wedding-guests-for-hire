import "server-only";
import { createClient } from "@supabase/supabase-js";
import { google } from "googleapis";
import {
  calculateCommission,
  expenseInputSchema,
  requireCapability,
  saleInputSchema,
  splitSchema,
  type Allocation,
  type EmployeeKey,
  type Split,
} from "./domain";
import {
  runTrackedDelivery,
  type DeliveryKind,
  type DeliveryRecord,
  type DeliveryStore,
  type RecordType,
} from "./delivery";
import { notificationRecipient, sheetUpsertRange } from "./integration";

export function db() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key)
    throw new Error("Server database configuration is incomplete.");
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
export async function state(actor: EmployeeKey) {
  const client = db();
  const salesQ = client
    .from("sales")
    .select("*")
    .order("submitted_at", { ascending: false });
  const expensesQ = client
    .from("expenses")
    .select("*")
    .order("submitted_at", { ascending: false });
  if (actor !== "svetlana") {
    salesQ.eq("submitter", actor);
    expensesQ.eq("reporter", actor);
  }
  const [sales, expenses, links, deliveries] = await Promise.all([
    salesQ,
    expensesQ,
    actor === "svetlana"
      ? client.from("telegram_links").select("*")
      : Promise.resolve({ data: [] }),
    actor === "svetlana"
      ? client.from("integration_deliveries").select("*").neq("status", "SENT")
      : Promise.resolve({ data: [] }),
  ]);
  if (sales.error || expenses.error) throw sales.error ?? expenses.error;
  return {
    sales: sales.data ?? [],
    expenses: expenses.data ?? [],
    links: links.data ?? [],
    deliveries: deliveries.data ?? [],
  };
}
async function unique(reference: string) {
  const c = db();
  const [s, e] = await Promise.all([
    c
      .from("sales")
      .select("reference")
      .eq("reference", reference)
      .maybeSingle(),
    c
      .from("expenses")
      .select("reference")
      .eq("reference", reference)
      .maybeSingle(),
  ]);
  if (s.data || e.data) throw new Error("That reference already exists.");
}
export async function submitSale(
  actor: EmployeeKey,
  input: unknown,
  origin: { channel: "web" | "telegram"; chatId?: string },
) {
  requireCapability(actor, "submit-sale");
  const v = saleInputSchema.parse(input);
  await unique(v.reference);
  const row = {
    reference: v.reference,
    submitter: actor,
    customer: v.customer,
    project: v.project,
    description: v.description,
    amount_cents: v.amountCents,
    proposed_split: v.proposedSplit,
    status: "PENDING",
    origin_channel: origin.channel,
    origin_chat_id: origin.chatId ?? null,
  };
  const { error } = await db().from("sales").insert(row);
  if (error) throw error;
  await deliverSheets("sale", v.reference).catch(() => undefined);
  return row;
}
export async function submitExpense(
  actor: EmployeeKey,
  input: unknown,
  origin: { channel: "web" | "telegram"; chatId?: string },
) {
  requireCapability(actor, "submit-expense");
  const v = expenseInputSchema.parse(input);
  await unique(v.reference);
  const automatic = v.proposedAllocation === "OVERHEAD";
  const row = {
    reference: v.reference,
    reporter: actor,
    description: v.description,
    category: v.category,
    amount_cents: v.amountCents,
    proposed_allocation: v.proposedAllocation,
    final_allocation: automatic ? "OVERHEAD" : null,
    status: automatic ? "ALLOCATED" : "AWAITING_ALLOCATION",
    origin_channel: origin.channel,
    origin_chat_id: origin.chatId ?? null,
  };
  const { error } = await db().from("expenses").insert(row);
  if (error) throw error;
  await deliverSheets("expense", v.reference).catch(() => undefined);
  return row;
}

export async function linkTelegram(
  actor: EmployeeKey,
  telegramUserId: string,
  chatId: string,
  employeeKey: EmployeeKey,
) {
  requireCapability(actor, "decide");
  if (!/^\d+$/.test(telegramUserId) || !/^-?\d+$/.test(chatId))
    throw new Error("Telegram user ID and chat ID must be numeric.");
  const { data, error } = await db()
    .from("telegram_links")
    .upsert({
      telegram_user_id: telegramUserId,
      chat_id: chatId,
      employee_key: employeeKey,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function decideSale(
  actor: EmployeeKey,
  reference: string,
  split: Split,
) {
  requireCapability(actor, "decide");
  splitSchema.parse(split);
  const c = db();
  const current = await c
    .from("sales")
    .select("*")
    .eq("reference", reference)
    .single();
  if (current.error) throw current.error;
  if (current.data.status === "APPROVED") return current.data;
  const calc = calculateCommission(current.data.amount_cents, split);
  const { data, error } = await c
    .from("sales")
    .update({
      status: "APPROVED",
      final_split: split,
      commission_pool_cents: calc.poolCents,
      commission_richard_cents: calc.commissions.richard,
      commission_anastasia_cents: calc.commissions.anastasia,
      commission_jean_claude_cents: calc.commissions["jean-claude"],
      decided_at: new Date().toISOString(),
      decided_by: actor,
    })
    .eq("reference", reference)
    .eq("status", "PENDING")
    .select()
    .single();
  if (error) throw error;
  if (!data) {
    const decided = await c
      .from("sales")
      .select("*")
      .eq("reference", reference)
      .single();
    if (decided.error) throw decided.error;
    return decided.data;
  }
  await Promise.allSettled([
    deliverSheets("sale", reference),
    deliverTelegram("sale", reference),
  ]);
  return data;
}
export async function decideExpense(
  actor: EmployeeKey,
  reference: string,
  allocation: Allocation,
) {
  requireCapability(actor, "decide");
  const c = db();
  const current = await c
    .from("expenses")
    .select("*")
    .eq("reference", reference)
    .single();
  if (current.error) throw current.error;
  if (current.data.status === "ALLOCATED") return current.data;
  const { data, error } = await c
    .from("expenses")
    .update({
      status: "ALLOCATED",
      final_allocation: allocation,
      decided_at: new Date().toISOString(),
      decided_by: actor,
    })
    .eq("reference", reference)
    .eq("status", "AWAITING_ALLOCATION")
    .select()
    .single();
  if (error) throw error;
  if (!data) {
    const decided = await c
      .from("expenses")
      .select("*")
      .eq("reference", reference)
      .single();
    if (decided.error) throw decided.error;
    return decided.data;
  }
  await Promise.allSettled([
    deliverSheets("expense", reference),
    deliverTelegram("expense", reference),
  ]);
  return data;
}
function sheetAuth() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) throw new Error("Google Sheets credentials are not configured.");
  const credentials = JSON.parse(raw);
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}
async function syncSheetsRow(kind: "sale" | "expense", reference: string) {
  const c = db();
  const table = kind === "sale" ? "sales" : "expenses";
  const tab = kind === "sale" ? "Sales" : "Expenses";
  const { data, error } = await c
    .from(table)
    .select("*")
    .eq("reference", reference)
    .single();
  if (error) throw error;
  const row =
    kind === "sale"
      ? [
          data.reference,
          data.submitted_at,
          data.submitter,
          data.customer,
          data.project,
          data.description,
          data.amount_cents / 100,
          data.proposed_split?.richard,
          data.proposed_split?.anastasia,
          data.proposed_split?.["jean-claude"],
          data.final_split?.richard ?? "",
          data.final_split?.anastasia ?? "",
          data.final_split?.["jean-claude"] ?? "",
          (data.commission_richard_cents ?? 0) / 100,
          (data.commission_anastasia_cents ?? 0) / 100,
          (data.commission_jean_claude_cents ?? 0) / 100,
          data.status,
        ]
      : [
          data.reference,
          data.submitted_at,
          data.reporter,
          data.description,
          data.category,
          data.amount_cents / 100,
          data.proposed_allocation,
          data.final_allocation ?? "",
          data.status,
        ];
  const sheets = google.sheets({ version: "v4", auth: sheetAuth() });
  const id = process.env.GOOGLE_SHEET_ID;
  if (!id) throw new Error("Google Sheet is not configured.");
  const existing = await sheets.spreadsheets.values.get({
    spreadsheetId: id,
    range: `${tab}!A:A`,
  });
  const target = sheetUpsertRange(tab, existing.data.values ?? [], reference);
  if (target.mode === "update")
    await sheets.spreadsheets.values.update({
      spreadsheetId: id,
      range: target.range,
      valueInputOption: "RAW",
      requestBody: { values: [row] },
    });
  else
    await sheets.spreadsheets.values.append({
      spreadsheetId: id,
      range: target.range,
      valueInputOption: "RAW",
      insertDataOption: "INSERT_ROWS",
      requestBody: { values: [row] },
    });
}

function deliveryStore(): DeliveryStore {
  return {
    async get(kind, recordType, reference) {
      const { data, error } = await db()
        .from("integration_deliveries")
        .select("*")
        .eq("kind", kind)
        .eq("record_type", recordType)
        .eq("reference", reference)
        .maybeSingle();
      if (error) throw error;
      return data
        ? {
            kind: data.kind as DeliveryKind,
            recordType: data.record_type as RecordType,
            reference: data.reference,
            status: data.status,
            attempts: data.attempts,
            lastError: data.last_error,
          }
        : null;
    },
    async save(record: DeliveryRecord) {
      const { error } = await db().from("integration_deliveries").upsert(
        {
          kind: record.kind,
          record_type: record.recordType,
          reference: record.reference,
          status: record.status,
          attempts: record.attempts,
          last_error: record.lastError,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "kind,record_type,reference" },
      );
      if (error) throw error;
    },
  };
}

async function deliverSheets(kind: RecordType, reference: string) {
  return runTrackedDelivery(
    deliveryStore(),
    { kind: "SHEETS", recordType: kind, reference },
    () => syncSheetsRow(kind, reference),
  );
}

async function deliverTelegram(kind: RecordType, reference: string) {
  return runTrackedDelivery(
    deliveryStore(),
    { kind: "TELEGRAM", recordType: kind, reference },
    async () => {
      const { data, error } = await db()
        .from(kind === "sale" ? "sales" : "expenses")
        .select("*")
        .eq("reference", reference)
        .single();
      if (error) throw error;
      if (kind === "sale") await notifySale(data);
      else await notifyExpense(data);
    },
  );
}

export async function retryDelivery(
  actor: EmployeeKey,
  kind: DeliveryKind,
  recordType: RecordType,
  reference: string,
) {
  requireCapability(actor, "decide");
  if (kind === "SHEETS") return deliverSheets(recordType, reference);
  return deliverTelegram(recordType, reference);
}
async function send(chatId: string, text: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("Telegram is not configured.");
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        reply_markup: { remove_keyboard: true },
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Telegram delivery failed (${response.status}).`);
}
async function notificationChat(row: {
  origin_chat_id?: string;
  submitter?: string;
  reporter?: string;
}) {
  if (row.origin_chat_id)
    return notificationRecipient(row.origin_chat_id, undefined);
  const employee = row.submitter ?? row.reporter;
  const { data } = await db()
    .from("telegram_links")
    .select("chat_id")
    .eq("employee_key", employee)
    .maybeSingle();
  return notificationRecipient(
    row.origin_chat_id,
    data?.chat_id as string | undefined,
  );
}
async function notifySale(row: any) {
  const chat = await notificationChat(row);
  if (!chat) throw new Error("No Telegram recipient linked");
  const changed =
    JSON.stringify(row.proposed_split) !== JSON.stringify(row.final_split);
  await send(
    chat,
    `Sale ${row.reference} approved${changed ? " — commission split changed" : ""}. Sale €${(row.amount_cents / 100).toFixed(2)}; total commission €${(row.commission_pool_cents / 100).toFixed(2)}. Richard: ${row.final_split.richard}% (€${(row.commission_richard_cents / 100).toFixed(2)}). Anastasia: ${row.final_split.anastasia}% (€${(row.commission_anastasia_cents / 100).toFixed(2)}). Jean-Claude: ${row.final_split["jean-claude"]}% (€${(row.commission_jean_claude_cents / 100).toFixed(2)}).`,
  );
}
async function notifyExpense(row: any) {
  const chat = await notificationChat(row);
  if (!chat) throw new Error("No Telegram recipient linked");
  await send(
    chat,
    `Expense ${row.reference} allocated. €${(row.amount_cents / 100).toFixed(2)}: ${row.description}. Proposed: ${row.proposed_allocation}. Approved: ${row.final_allocation}.${row.proposed_allocation !== row.final_allocation ? " Allocation changed." : ""}`,
  );
}
