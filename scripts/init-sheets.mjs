import fs from "node:fs";
import { google } from "googleapis";

const handoff = Object.fromEntries(
  fs
    .readFileSync(process.argv[2], "utf8")
    .split(/\r?\n/)
    .filter((line) => /^[A-Za-z_][A-Za-z0-9_]*=/.test(line))
    .map((line) => {
      const i = line.indexOf("=");
      return [
        line.slice(0, i),
        line
          .slice(i + 1)
          .trim()
          .replace(/^['\"]|['\"]$/g, ""),
      ];
    }),
);
const credentials = JSON.parse(
  fs.readFileSync(handoff.GOOGLE_SERVICE_ACCOUNT_JSON_PATH, "utf8"),
);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});
const sheets = google.sheets({ version: "v4", auth });
const spreadsheetId = handoff.GOOGLE_SHEET_ID;
const metadata = await sheets.spreadsheets.get({
  spreadsheetId,
  fields: "sheets.properties",
});
const wanted = {
  Sales: [
    "Reference",
    "Submission time (UTC)",
    "Salesperson",
    "Customer",
    "Project",
    "Description",
    "Amount EUR",
    "Proposed Richard %",
    "Proposed Anastasia %",
    "Proposed Jean-Claude %",
    "Final Richard %",
    "Final Anastasia %",
    "Final Jean-Claude %",
    "Richard commission EUR",
    "Anastasia commission EUR",
    "Jean-Claude commission EUR",
    "Status",
  ],
  Expenses: [
    "Reference",
    "Submission time (UTC)",
    "Reporter",
    "Description",
    "Category",
    "Amount EUR",
    "Proposed allocation",
    "Final allocation",
    "Status",
  ],
};
const existing = new Map(
  metadata.data.sheets.map((s) => [s.properties.title, s.properties]),
);
for (const title of Object.keys(wanted))
  if (!existing.has(title)) throw new Error(`Required tab missing: ${title}`);
const ranges = await sheets.spreadsheets.values.batchGet({
  spreadsheetId,
  ranges: ["Sales!A1:Q100", "Expenses!A1:I100"],
});
for (const vr of ranges.data.valueRanges ?? []) {
  const rows = vr.values ?? [];
  if (rows.slice(1).some((row) => row.some((cell) => String(cell).trim())))
    throw new Error(
      `Refusing to modify ${vr.range}: transaction rows are not empty.`,
    );
}
await sheets.spreadsheets.values.batchUpdate({
  spreadsheetId,
  requestBody: {
    valueInputOption: "RAW",
    data: [
      { range: "Sales!A1:Q1", values: [wanted.Sales] },
      { range: "Expenses!A1:I1", values: [wanted.Expenses] },
    ],
  },
});
const requests = [];
for (const [title, headers] of Object.entries(wanted)) {
  const p = existing.get(title);
  requests.push(
    {
      repeatCell: {
        range: {
          sheetId: p.sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: headers.length,
        },
        cell: {
          userEnteredFormat: {
            backgroundColorStyle: {
              rgbColor: { red: 0.91, green: 0.87, blue: 0.87 },
            },
            textFormat: {
              bold: true,
              foregroundColorStyle: {
                rgbColor: { red: 0.25, green: 0.08, blue: 0.12 },
              },
            },
            wrapStrategy: "WRAP",
          },
        },
        fields:
          "userEnteredFormat(backgroundColorStyle,textFormat,wrapStrategy)",
      },
    },
    {
      updateSheetProperties: {
        properties: {
          sheetId: p.sheetId,
          gridProperties: { frozenRowCount: 1 },
        },
        fields: "gridProperties.frozenRowCount",
      },
    },
  );
  headers.forEach((header, index) =>
    requests.push({
      updateDimensionProperties: {
        range: {
          sheetId: p.sheetId,
          dimension: "COLUMNS",
          startIndex: index,
          endIndex: index + 1,
        },
        properties: {
          pixelSize: header.includes("Description")
            ? 280
            : header.includes("Submission")
              ? 160
              : header.includes("Customer")
                ? 160
                : header.includes("Reference")
                  ? 105
                  : header.includes("Amount")
                    ? 110
                    : 145,
        },
        fields: "pixelSize",
      },
    }),
  );
}
await sheets.spreadsheets.batchUpdate({
  spreadsheetId,
  requestBody: { requests },
});
console.log(
  JSON.stringify({
    tabs: [...existing.keys()],
    salesDataRows: 0,
    expenseDataRows: 0,
    headersInitialized: true,
  }),
);
