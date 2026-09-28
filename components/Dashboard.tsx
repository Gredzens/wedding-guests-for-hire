"use client";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import {
  employees,
  employeeKeys,
  euro,
  results,
  type EmployeeKey,
  type Expense,
  type Sale,
} from "@/lib/domain";

type ApiState = {
  sales: any[];
  expenses: any[];
  links: any[];
  deliveries: any[];
};
const empty: ApiState = { sales: [], expenses: [], links: [], deliveries: [] };
const normalizeSale = (s: any): Sale => ({
  reference: s.reference,
  submitter: s.submitter,
  customer: s.customer,
  project: s.project,
  description: s.description,
  amountCents: s.amount_cents,
  proposedSplit: s.proposed_split,
  status: s.status,
  finalSplit: s.final_split,
  commissionPoolCents: s.commission_pool_cents,
  commissions:
    s.status === "APPROVED"
      ? {
          richard: s.commission_richard_cents,
          anastasia: s.commission_anastasia_cents,
          "jean-claude": s.commission_jean_claude_cents,
        }
      : undefined,
});
const normalizeExpense = (e: any): Expense => ({
  reference: e.reference,
  reporter: e.reporter,
  description: e.description,
  category: e.category,
  amountCents: e.amount_cents,
  proposedAllocation: e.proposed_allocation,
  status: e.status,
  finalAllocation: e.final_allocation,
});
export default function Dashboard() {
  const [actor, setActor] = useState<EmployeeKey>("svetlana");
  const [data, setData] = useState<ApiState>(empty);
  const [notice, setNotice] = useState("Loading records…");
  const load = useCallback(async () => {
    try {
      const r = await fetch(`/api/state?actor=${actor}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setData(j);
      setNotice("");
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Unable to load records.");
    }
  }, [actor]);
  useEffect(() => {
    void load();
  }, [load]);
  const finance = useMemo(
    () =>
      results(
        data.sales.map(normalizeSale),
        data.expenses.map(normalizeExpense),
      ),
    [data],
  );
  async function act(body: any) {
    setNotice("Saving…");
    const r = await fetch("/api/actions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ actor, ...body }),
    });
    const j = await r.json();
    if (!r.ok) {
      setNotice(j.error);
      return;
    }
    setNotice("Saved successfully.");
    await load();
  }
  function saleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void act({
      action: "sale",
      input: {
        reference: f.get("reference"),
        customer: f.get("customer"),
        project: f.get("project"),
        description: f.get("description"),
        amountCents: Math.round(Number(f.get("amount")) * 100),
        proposedSplit: {
          richard: Number(f.get("richard")),
          anastasia: Number(f.get("anastasia")),
          "jean-claude": Number(f.get("jean")),
        },
      },
    });
  }
  function expenseSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void act({
      action: "expense",
      input: {
        reference: f.get("reference"),
        description: f.get("description"),
        category: f.get("category"),
        amountCents: Math.round(Number(f.get("amount")) * 100),
        proposedAllocation: f.get("allocation"),
      },
    });
  }
  function linkSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    void act({
      action: "link-telegram",
      telegramUserId: f.get("telegramUserId"),
      chatId: f.get("chatId"),
      employeeKey: f.get("employeeKey"),
    });
  }
  return (
    <main>
      <header>
        <p className="eyebrow">Friends Included Ltd</p>
        <h1>Wedding Guests for Hire</h1>
        <p>Financial workflow by Patriks Gredzens · pg25032</p>
        <nav>
          <a href="https://t.me/WeddingFinance222bot">Telegram bot</a>
          <a href="https://docs.google.com/spreadsheets/d/1ke50QgIIbhbRLYceM1CWJAyRBA0rwUquu4OY2fGUqFU/edit">
            Google Sheet
          </a>
          <a href="https://github.com/PatriksGredzens/wedding-guests-for-hire">
            GitHub
          </a>
        </nav>
      </header>
      <section className="intro">
        <div>
          <h2>Demonstration role</h2>
          <p>
            Select a fictional employee. Permissions are enforced again on the
            server.
          </p>
        </div>
        <select
          aria-label="Demonstration role"
          value={actor}
          onChange={(e) => setActor(e.target.value as EmployeeKey)}
        >
          {employeeKeys.map((k) => (
            <option key={k} value={k}>
              {employees[k].name}
            </option>
          ))}
        </select>
      </section>
      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}
      <section>
        <h2>Financial dashboard</h2>
        <div className="cards">
          <Card
            label="Project A result"
            value={euro(finance.project.A.result)}
          />
          <Card
            label="Project B result"
            value={euro(finance.project.B.result)}
          />
          <Card label="Company result" value={euro(finance.companyResult)} />
          <Card label="Awaiting allocation" value={euro(finance.awaiting)} />
        </div>
        <div className="cards compact">
          <Card label="Richard earned" value={euro(finance.earned.richard)} />
          <Card
            label="Anastasia earned"
            value={euro(finance.earned.anastasia)}
          />
          <Card
            label="Jean-Claude earned"
            value={euro(finance.earned["jean-claude"])}
          />
          <Card label="Company overhead" value={euro(finance.overhead)} />
        </div>
      </section>
      {employees[actor].role === "sales" && (
        <section>
          <h2>Submit a sale</h2>
          <form onSubmit={saleSubmit}>
            <Input name="reference" label="Unique reference" />
            <Input name="customer" label="Customer" />
            <label>
              Project
              <select name="project">
                <option>A</option>
                <option>B</option>
              </select>
            </label>
            <Input name="description" label="Description" />
            <Input name="amount" label="Amount EUR" type="number" />
            <div className="triple">
              <Input name="richard" label="Richard %" type="number" />
              <Input name="anastasia" label="Anastasia %" type="number" />
              <Input name="jean" label="Jean-Claude %" type="number" />
            </div>
            <button>Save pending sale</button>
          </form>
        </section>
      )}
      {employees[actor].role === "expense" && (
        <section>
          <h2>Submit an expense</h2>
          <form onSubmit={expenseSubmit}>
            <Input name="reference" label="Unique reference" />
            <Input name="description" label="Description" />
            <label>
              Category
              <select name="category">
                <option>Materials</option>
                <option>Travel</option>
                <option>Other</option>
              </select>
            </label>
            <Input name="amount" label="Amount EUR" type="number" />
            <label>
              Proposed allocation
              <select name="allocation">
                <option value="A">Project A</option>
                <option value="B">Project B</option>
                <option value="OVERHEAD">Company overhead</option>
              </select>
            </label>
            <button>Save expense</button>
          </form>
        </section>
      )}
      <section>
        <h2>{actor === "svetlana" ? "All records" : "My submissions"}</h2>
        <div className="tablewrap">
          <table>
            <thead>
              <tr>
                <th>Reference</th>
                <th>Type</th>
                <th>Owner</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Decision</th>
              </tr>
            </thead>
            <tbody>
              {data.sales.map((s) => (
                <tr key={s.reference}>
                  <td>{s.reference}</td>
                  <td>Sale · Project {s.project}</td>
                  <td>{employees[s.submitter as EmployeeKey]?.name}</td>
                  <td>{euro(s.amount_cents)}</td>
                  <td>
                    <span className="badge">{s.status}</span>
                  </td>
                  <td>
                    {actor === "svetlana" && s.status === "PENDING" ? (
                      <form
                        className="decision-form"
                        onSubmit={(event) => {
                          event.preventDefault();
                          const form = new FormData(event.currentTarget);
                          void act({
                            action: "approve-sale",
                            reference: s.reference,
                            split: {
                              richard: Number(form.get("richard")),
                              anastasia: Number(form.get("anastasia")),
                              "jean-claude": Number(form.get("jean")),
                            },
                          });
                        }}
                      >
                        <span>Final split (R / A / J-C)</span>
                        <div className="split-edit">
                          <input
                            aria-label={`${s.reference} Richard final percentage`}
                            name="richard"
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={s.proposed_split.richard}
                            required
                          />
                          <input
                            aria-label={`${s.reference} Anastasia final percentage`}
                            name="anastasia"
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={s.proposed_split.anastasia}
                            required
                          />
                          <input
                            aria-label={`${s.reference} Jean-Claude final percentage`}
                            name="jean"
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={s.proposed_split["jean-claude"]}
                            required
                          />
                        </div>
                        <button>Approve final split</button>
                      </form>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
              {data.expenses.map((e) => (
                <tr key={e.reference}>
                  <td>{e.reference}</td>
                  <td>Expense · {e.category}</td>
                  <td>{employees[e.reporter as EmployeeKey]?.name}</td>
                  <td>{euro(e.amount_cents)}</td>
                  <td>
                    <span className="badge">{e.status}</span>
                  </td>
                  <td>
                    {actor === "svetlana" &&
                    e.status === "AWAITING_ALLOCATION" ? (
                      <span className="actions">
                        {["A", "B", "OVERHEAD"].map((a) => (
                          <button
                            key={a}
                            onClick={() =>
                              void act({
                                action: "allocate-expense",
                                reference: e.reference,
                                allocation: a,
                              })
                            }
                          >
                            {a}
                          </button>
                        ))}
                      </span>
                    ) : (
                      (e.final_allocation ?? "—")
                    )}
                  </td>
                </tr>
              ))}
              {!data.sales.length && !data.expenses.length && (
                <tr>
                  <td colSpan={6}>
                    No transactions yet. The system is ready for Test 1.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
      {actor === "svetlana" && (
        <section>
          <h2>Telegram employee links</h2>
          <p>
            Only Svetlana can map a Telegram user and chat to a fictional
            employee. Relinking never changes existing submission ownership.
          </p>
          <form onSubmit={linkSubmit}>
            <Input name="telegramUserId" label="Telegram user ID" />
            <Input name="chatId" label="Telegram chat ID" />
            <label>
              Employee
              <select name="employeeKey">
                {employeeKeys.map((key) => (
                  <option key={key} value={key}>
                    {employees[key].name}
                  </option>
                ))}
              </select>
            </label>
            <button>Save Telegram link</button>
          </form>
          {data.links.length > 0 && (
            <ul>
              {data.links.map((link: any) => (
                <li key={link.telegram_user_id}>
                  {link.telegram_user_id} →{" "}
                  {employees[link.employee_key as EmployeeKey].name}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
      {actor === "svetlana" && (
        <section>
          <h2>Integration attention</h2>
          {data.deliveries.length ? (
            <ul>
              {data.deliveries.map((d: any) => (
                <li key={`${d.kind}-${d.reference}`}>
                  <span>
                    {d.kind} · {d.reference} · {d.status} · attempt {d.attempts}
                    {d.last_error ? `: ${d.last_error}` : ""}
                  </span>{" "}
                  <button
                    onClick={() =>
                      void act({
                        action: "retry-delivery",
                        kind: d.kind,
                        recordType: d.record_type,
                        reference: d.reference,
                      })
                    }
                  >
                    Retry
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No delivery failures.</p>
          )}
        </section>
      )}
      <footer>
        <p>
          Amounts are in euros. Pending sales are excluded from results; every
          recorded expense reduces company result immediately.
        </p>
      </footer>
    </main>
  );
}
function Card({ label, value }: { label: string; value: string }) {
  return (
    <article className="card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
function Input({
  name,
  label,
  type = "text",
}: {
  name: string;
  label: string;
  type?: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required
        min={type === "number" ? "0.01" : undefined}
        step={type === "number" ? "0.01" : undefined}
      />
    </label>
  );
}
