import { NextResponse } from "next/server";
import { state } from "@/lib/server";
import { employeeKeys } from "@/lib/domain";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = new URL(request.url).searchParams.get(
      "actor",
    ) as (typeof employeeKeys)[number];
    if (!employeeKeys.includes(actor)) throw new Error("Choose a valid role.");
    return NextResponse.json(await state(actor));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 400 },
    );
  }
}
