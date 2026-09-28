import { NextResponse } from "next/server";
import {
  decideExpense,
  decideSale,
  linkTelegram,
  retryDelivery,
  submitExpense,
  submitSale,
} from "@/lib/server";
import type { Allocation, EmployeeKey, Split } from "@/lib/domain";
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const actor = body.actor as EmployeeKey;
    let result;
    if (body.action === "sale")
      result = await submitSale(actor, body.input, { channel: "web" });
    else if (body.action === "expense")
      result = await submitExpense(actor, body.input, { channel: "web" });
    else if (body.action === "approve-sale")
      result = await decideSale(actor, body.reference, body.split as Split);
    else if (body.action === "allocate-expense")
      result = await decideExpense(
        actor,
        body.reference,
        body.allocation as Allocation,
      );
    else if (body.action === "link-telegram")
      result = await linkTelegram(
        actor,
        String(body.telegramUserId),
        String(body.chatId),
        body.employeeKey as EmployeeKey,
      );
    else if (body.action === "retry-delivery")
      result = await retryDelivery(
        actor,
        body.kind,
        body.recordType,
        String(body.reference),
      );
    else throw new Error("Unknown action.");
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 },
    );
  }
}
