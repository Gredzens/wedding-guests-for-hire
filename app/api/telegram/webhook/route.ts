import { NextResponse } from "next/server";
import { db, submitExpense, submitSale } from "@/lib/server";
import type { EmployeeKey } from "@/lib/domain";

type Update = {
  update_id: number;
  message?: { text?: string; chat: { id: number }; from?: { id: number } };
  callback_query?: {
    data?: string;
    from: { id: number };
    message?: { chat: { id: number } };
  };
};
async function send(chat: number | string, text: string, buttons?: string[][]) {
  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text,
        reply_markup: buttons
          ? {
              inline_keyboard: buttons.map((row) =>
                row.map((label) => ({ text: label, callback_data: label })),
              ),
            }
          : { remove_keyboard: true },
      }),
    },
  );
  if (!response.ok)
    throw new Error(`Telegram response failed (${response.status}).`);
}
export async function POST(request: Request) {
  try {
    if (
      request.headers.get("x-telegram-bot-api-secret-token") !==
      process.env.TELEGRAM_WEBHOOK_SECRET
    )
      return NextResponse.json({ ok: false }, { status: 401 });
    const update = (await request.json()) as Update;
    const c = db();
    const claimed = await c
      .from("processed_telegram_updates")
      .insert({ update_id: update.update_id });
    if (claimed.error?.code === "23505") return NextResponse.json({ ok: true });
    if (claimed.error) throw claimed.error;
    const user = String(
      update.message?.from?.id ?? update.callback_query?.from.id,
    );
    const chat = String(
      update.message?.chat.id ?? update.callback_query?.message?.chat.id,
    );
    const text =
      update.callback_query?.data ?? update.message?.text?.trim() ?? "";
    const link = await c
      .from("telegram_links")
      .select("employee_key")
      .eq("telegram_user_id", user)
      .maybeSingle();
    if (!link.data) {
      await send(
        chat,
        "Your Telegram account is not linked. Ask Svetlana to link your Telegram user ID in the manager area.",
      );
      return NextResponse.json({ ok: true });
    }
    const actor = link.data.employee_key as EmployeeKey;
    let session = (
      await c
        .from("telegram_sessions")
        .select("*")
        .eq("telegram_user_id", user)
        .maybeSingle()
    ).data as any;
    if (text === "/start" || text === "Cancel") {
      await c.from("telegram_sessions").delete().eq("telegram_user_id", user);
      const action =
        actor === "kevin"
          ? "Expense"
          : actor === "svetlana"
            ? "Manager actions are available on the website."
            : "Sale";
      await send(
        chat,
        `Welcome, ${actor}. Choose an allowed action.`,
        actor === "svetlana" ? undefined : [[action]],
      );
      return NextResponse.json({ ok: true });
    }
    if (!session) {
      if (
        text === "Sale" &&
        ["richard", "anastasia", "jean-claude"].includes(actor)
      ) {
        session = { state: "sale.reference", payload: {} };
      } else if (text === "Expense" && actor === "kevin") {
        session = { state: "expense.reference", payload: {} };
      } else {
        await send(chat, "Send /start to begin.");
        return NextResponse.json({ ok: true });
      }
      await c
        .from("telegram_sessions")
        .upsert({ telegram_user_id: user, chat_id: chat, ...session });
      await send(chat, "Enter the unique reference.");
      return NextResponse.json({ ok: true });
    }
    const p = session.payload ?? {};
    const next: Record<string, [string, string]> = {
      "sale.reference": ["customer", "Enter the customer name."],
      "sale.customer": ["project", "Choose a project."],
      "sale.project": ["description", "Enter the sale description."],
      "sale.description": ["amount", "Enter the amount in euros."],
      "sale.amount": ["richard", "Enter Richard's commission percentage."],
      "sale.richard": ["anastasia", "Enter Anastasia's commission percentage."],
      "sale.anastasia": ["jean", "Enter Jean-Claude's commission percentage."],
      "expense.reference": ["description", "Enter the expense description."],
      "expense.description": ["amount", "Enter the amount in euros."],
      "expense.amount": ["category", "Choose a category."],
      "expense.category": ["allocation", "Choose the proposed allocation."],
    };
    const [kind, field] = session.state.split(".");
    p[field] = text;
    if (
      (kind === "sale" && field === "jean") ||
      (kind === "expense" && field === "allocation")
    ) {
      try {
        if (kind === "sale")
          await submitSale(
            actor,
            {
              reference: p.reference,
              customer: p.customer,
              project: p.project,
              description: p.description,
              amountCents: Math.round(Number(p.amount.replace(",", ".")) * 100),
              proposedSplit: {
                richard: Number(p.richard),
                anastasia: Number(p.anastasia),
                "jean-claude": Number(p.jean),
              },
            },
            { channel: "telegram", chatId: chat },
          );
        else
          await submitExpense(
            actor,
            {
              reference: p.reference,
              description: p.description,
              amountCents: Math.round(Number(p.amount.replace(",", ".")) * 100),
              category: p.category,
              proposedAllocation: p.allocation,
            },
            { channel: "telegram", chatId: chat },
          );
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "The entry is invalid.";
        await send(
          chat,
          `I could not save this record: ${message} Please correct the current answer or send Cancel to restart.`,
        );
        return NextResponse.json({ ok: true });
      }
      await c.from("telegram_sessions").delete().eq("telegram_user_id", user);
      await send(
        chat,
        `${kind === "sale" ? "Sale" : "Expense"} ${p.reference} recorded successfully. Amount €${Number(p.amount.replace(",", ".")).toFixed(2)}. Status: ${kind === "sale" ? "Pending approval" : p.allocation === "OVERHEAD" ? "Allocated to company overhead" : "Awaiting allocation"}.`,
      );
      return NextResponse.json({ ok: true });
    }
    const n = next[session.state];
    session.state = `${kind}.${n[0]}`;
    await c.from("telegram_sessions").upsert({
      telegram_user_id: user,
      chat_id: chat,
      state: session.state,
      payload: p,
    });
    const buttons =
      n[0] === "project"
        ? [["A", "B"]]
        : n[0] === "category"
          ? [["Materials", "Travel", "Other"]]
          : n[0] === "allocation"
            ? [["A", "B", "OVERHEAD"]]
            : undefined;
    await send(chat, n[1], buttons);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Webhook error",
      },
      { status: 200 },
    );
  }
}
