import { describe, expect, it } from "vitest";
import {
  allocateExpense,
  approveSale,
  calculateCommission,
  expenseInputSchema,
  results,
  saleInputSchema,
  requireCapability,
  type Expense,
  type Sale,
  type Split,
} from "../lib/domain";

const split = (richard: number, anastasia: number, jean: number): Split => ({
  richard,
  anastasia,
  "jean-claude": jean,
});
const sale = (
  reference: string,
  amountCents: number,
  project: "A" | "B",
  proposedSplit: Split,
  submitter: "richard" | "anastasia" | "jean-claude" = "richard",
): Sale => ({
  reference,
  amountCents,
  project,
  proposedSplit,
  submitter,
  customer: "Customer",
  description: "Service",
  status: "PENDING",
});
const expense = (
  reference: string,
  amountCents: number,
  proposedAllocation: "A" | "B" | "OVERHEAD",
): Expense => ({
  reference,
  amountCents,
  proposedAllocation,
  reporter: "kevin",
  description: "Expense",
  category: "Other",
  status:
    proposedAllocation === "OVERHEAD" ? "ALLOCATED" : "AWAITING_ALLOCATION",
  finalAllocation: proposedAllocation === "OVERHEAD" ? "OVERHEAD" : undefined,
});

describe("finance rules", () => {
  it("matches Test 1", () => {
    const sales = [
      approveSale(
        sale("S01", 100000, "A", split(50, 30, 20)),
        "svetlana",
        split(50, 30, 20),
      ),
      approveSale(
        sale("S02", 200000, "B", split(0, 50, 50), "anastasia"),
        "svetlana",
        split(20, 40, 40),
      ),
    ];
    const expenses = [
      allocateExpense(expense("E01", 12000, "A"), "svetlana", "A"),
      allocateExpense(expense("E02", 8000, "B"), "svetlana", "A"),
      expense("E03", 10000, "OVERHEAD"),
    ];
    const r = results(sales, expenses);
    expect([r.project.A.result, r.project.B.result, r.companyResult]).toEqual([
      70000, 180000, 240000,
    ]);
    expect(r.earned).toEqual({
      richard: 9000,
      anastasia: 11000,
      "jean-claude": 10000,
    });
  });
  it("matches cumulative Test 2 with pending records", () => {
    const sales = [
      approveSale(
        sale("S01", 100000, "A", split(50, 30, 20)),
        "svetlana",
        split(50, 30, 20),
      ),
      approveSale(
        sale("S02", 200000, "B", split(0, 50, 50), "anastasia"),
        "svetlana",
        split(20, 40, 40),
      ),
      approveSale(
        sale("S03", 150000, "A", split(40, 40, 20), "jean-claude"),
        "svetlana",
        split(20, 30, 50),
      ),
      approveSale(
        sale("S04", 80000, "B", split(25, 25, 50)),
        "svetlana",
        split(25, 25, 50),
      ),
      sale("S05", 60000, "B", split(100, 0, 0)),
    ];
    const expenses = [
      allocateExpense(expense("E01", 12000, "A"), "svetlana", "A"),
      allocateExpense(expense("E02", 8000, "B"), "svetlana", "A"),
      expense("E03", 10000, "OVERHEAD"),
      allocateExpense(expense("E04", 25000, "B"), "svetlana", "B"),
      allocateExpense(expense("E05", 9000, "A"), "svetlana", "B"),
      expense("E06", 6000, "OVERHEAD"),
      expense("E07", 14000, "A"),
    ];
    const r = results(sales, expenses);
    expect([
      r.project.A.result,
      r.project.B.result,
      r.companyResult,
      r.awaiting,
    ]).toEqual([205000, 218000, 393000, 14000]);
    expect(r.earned).toEqual({
      richard: 14000,
      anastasia: 17500,
      "jean-claude": 21500,
    });
  });
  it("uses largest share and tie order for rounding", () => {
    expect(calculateCommission(101, split(34, 33, 33)).commissions).toEqual({
      richard: 4,
      anastasia: 3,
      "jean-claude": 3,
    });
    expect(calculateCommission(105, split(50, 50, 0)).commissions).toEqual({
      richard: 5,
      anastasia: 6,
      "jean-claude": 0,
    });
  });
  it("rejects invalid inputs and permissions", () => {
    expect(() =>
      saleInputSchema.parse({
        reference: "X",
        customer: "C",
        project: "A",
        description: "D",
        amountCents: 0,
        proposedSplit: split(60, 30, 20),
      }),
    ).toThrow();
    expect(() =>
      expenseInputSchema.parse({
        reference: "E",
        description: "D",
        category: "Other",
        amountCents: -1,
        proposedAllocation: "A",
      }),
    ).toThrow();
    expect(() =>
      approveSale(
        sale("X", 100, "A", split(100, 0, 0)),
        "richard",
        split(100, 0, 0),
      ),
    ).toThrow();
  });
  it("keeps repeated decisions idempotent", () => {
    const once = approveSale(
      sale("X", 10000, "A", split(100, 0, 0)),
      "svetlana",
      split(100, 0, 0),
    );
    expect(approveSale(once, "svetlana", split(0, 100, 0))).toEqual(once);
  });

  it("denies Kevin sale submission and Richard manager decisions", () => {
    expect(() => requireCapability("kevin", "submit-sale")).toThrow();
    expect(() => requireCapability("richard", "decide")).toThrow();
  });
});
