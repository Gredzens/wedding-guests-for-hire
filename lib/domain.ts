import { z } from "zod";

export const employeeKeys = [
  "svetlana",
  "richard",
  "anastasia",
  "jean-claude",
  "kevin",
] as const;
export type EmployeeKey = (typeof employeeKeys)[number];
export type Salesperson = "richard" | "anastasia" | "jean-claude";
export type Project = "A" | "B";
export type Allocation = Project | "OVERHEAD";

export const employees = {
  svetlana: { name: "Svetlana de Monte Carlo", role: "manager" },
  richard: { name: "Richard Darling", role: "sales" },
  anastasia: { name: "Anastasia Ferrari", role: "sales" },
  "jean-claude": { name: "Jean-Claude Bērziņš", role: "sales" },
  kevin: { name: "Kevin von Whatever", role: "expense" },
} as const;

export const splitSchema = z
  .object({
    richard: z.number().int().min(0).max(100),
    anastasia: z.number().int().min(0).max(100),
    "jean-claude": z.number().int().min(0).max(100),
  })
  .refine(
    (s) => s.richard + s.anastasia + s["jean-claude"] === 100,
    "Commission shares must total 100%.",
  );
export type Split = z.infer<typeof splitSchema>;

const reference = z
  .string()
  .trim()
  .min(1)
  .max(40)
  .regex(/^[A-Za-z0-9_-]+$/, "Use letters, numbers, hyphens, or underscores.");
export const saleInputSchema = z.object({
  reference,
  customer: z.string().trim().min(1).max(120),
  project: z.enum(["A", "B"]),
  description: z.string().trim().min(1).max(500),
  amountCents: z.number().int().positive(),
  proposedSplit: splitSchema,
});
export const expenseInputSchema = z.object({
  reference,
  description: z.string().trim().min(1).max(500),
  category: z.enum(["Materials", "Travel", "Other"]),
  amountCents: z.number().int().positive(),
  proposedAllocation: z.enum(["A", "B", "OVERHEAD"]),
});
export type SaleInput = z.infer<typeof saleInputSchema>;
export type ExpenseInput = z.infer<typeof expenseInputSchema>;

export interface Sale extends SaleInput {
  submitter: Salesperson;
  status: "PENDING" | "APPROVED";
  finalSplit?: Split;
  commissionPoolCents?: number;
  commissions?: Record<Salesperson, number>;
}
export interface Expense extends ExpenseInput {
  reporter: "kevin";
  status: "AWAITING_ALLOCATION" | "ALLOCATED";
  finalAllocation?: Allocation;
}

export function requireCapability(
  actor: EmployeeKey,
  capability: "submit-sale" | "submit-expense" | "decide",
): void {
  const role = employees[actor].role;
  if (
    (capability === "submit-sale" && role !== "sales") ||
    (capability === "submit-expense" && role !== "expense") ||
    (capability === "decide" && role !== "manager")
  )
    throw new Error(
      "This demonstration role is not allowed to perform that action.",
    );
}

const order: Salesperson[] = ["richard", "anastasia", "jean-claude"];
export function calculateCommission(amountCents: number, split: Split) {
  splitSchema.parse(split);
  if (!Number.isInteger(amountCents) || amountCents <= 0)
    throw new Error("Amount must be greater than zero.");
  const pool = Math.round(amountCents * 0.1);
  const values = Object.fromEntries(
    order.map((person) => [person, Math.round((pool * split[person]) / 100)]),
  ) as Record<Salesperson, number>;
  const delta = pool - order.reduce((sum, person) => sum + values[person], 0);
  if (delta) {
    const winner = order.reduce(
      (best, person) => (split[person] > split[best] ? person : best),
      "richard",
    );
    values[winner] += delta;
  }
  return { poolCents: pool, commissions: values };
}

export function approveSale(
  sale: Sale,
  actor: EmployeeKey,
  finalSplit: Split,
): Sale {
  requireCapability(actor, "decide");
  if (sale.status === "APPROVED") return sale;
  const result = calculateCommission(sale.amountCents, finalSplit);
  return {
    ...sale,
    status: "APPROVED",
    finalSplit: splitSchema.parse(finalSplit),
    commissionPoolCents: result.poolCents,
    commissions: result.commissions,
  };
}

export function allocateExpense(
  expense: Expense,
  actor: EmployeeKey,
  allocation: Allocation,
): Expense {
  requireCapability(actor, "decide");
  if (expense.status === "ALLOCATED") return expense;
  return { ...expense, status: "ALLOCATED", finalAllocation: allocation };
}

export function results(sales: Sale[], expenses: Expense[]) {
  const project = {
    A: { income: 0, commissions: 0, expenses: 0, result: 0 },
    B: { income: 0, commissions: 0, expenses: 0, result: 0 },
  };
  const earned: Record<Salesperson, number> = {
    richard: 0,
    anastasia: 0,
    "jean-claude": 0,
  };
  for (const sale of sales.filter((s) => s.status === "APPROVED")) {
    project[sale.project].income += sale.amountCents;
    project[sale.project].commissions += sale.commissionPoolCents ?? 0;
    for (const person of order)
      earned[person] += sale.commissions?.[person] ?? 0;
  }
  let overhead = 0,
    awaiting = 0,
    expenseTotal = 0;
  for (const expense of expenses) {
    expenseTotal += expense.amountCents;
    if (expense.status === "AWAITING_ALLOCATION")
      awaiting += expense.amountCents;
    else if (expense.finalAllocation === "OVERHEAD")
      overhead += expense.amountCents;
    else if (expense.finalAllocation)
      project[expense.finalAllocation].expenses += expense.amountCents;
  }
  for (const key of ["A", "B"] as const)
    project[key].result =
      project[key].income - project[key].commissions - project[key].expenses;
  const approved = project.A.income + project.B.income;
  const commissions = project.A.commissions + project.B.commissions;
  return {
    project,
    overhead,
    awaiting,
    companyResult: approved - commissions - expenseTotal,
    earned,
  };
}

export function euro(cents: number) {
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}
