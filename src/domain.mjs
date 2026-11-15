import { round, sum, ratio, days, money, metric, notice } from "./lib.mjs";
export const config = {
  slug: "lead-qualification-engine",
  title: "Lead Qualification Engine",
  description:
    "Prioritize leads with explainable, adjustable qualification scores.",
  scope:
    "A local planning workspace. Review suggestions before acting; no automatic messages or financial transactions.",
  method:
    "Score = matched rule weights / all weights × 100. Permission to contact is a separate mandatory gate. Scores describe your rules, not purchase probability.",
  port: 4412,
  asOf: "2026-11-15",
  fields: [
    {
      key: "name",
      label: "Customer / business name",
      type: "text",
    },
    {
      key: "email",
      label: "Customer email",
      type: "email",
    },
    {
      key: "budget",
      label: "Available budget",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "daysToBuy",
      label: "Days until purchase",
      type: "number",
      min: 0,
      max: 3650,
      integer: true,
    },
    {
      key: "decisionMaker",
      label: "Decision maker involved",
      type: "boolean",
    },
    {
      key: "fit",
      label: "Requirements fit",
      type: "boolean",
    },
    {
      key: "consent",
      label: "Permission to contact",
      type: "boolean",
    },
  ],
  settings: [
    {
      key: "currency",
      label: "Currency code (one currency per workspace)",
      type: "text",
      maxLength: 3,
    },
    {
      key: "minimumBudget",
      label: "Minimum suitable budget",
      type: "number",
      min: 0,
      max: 100000000,
    },
    {
      key: "urgentDays",
      label: "Urgent purchase window (days)",
      type: "number",
      min: 0,
      max: 3650,
      integer: true,
    },
    {
      key: "budgetWeight",
      label: "Budget points",
      type: "number",
      min: 0,
      max: 100,
    },
    {
      key: "timingWeight",
      label: "Timing points",
      type: "number",
      min: 0,
      max: 100,
    },
    {
      key: "authorityWeight",
      label: "Decision maker points",
      type: "number",
      min: 0,
      max: 100,
    },
    {
      key: "fitWeight",
      label: "Fit points",
      type: "number",
      min: 0,
      max: 100,
    },
    {
      key: "qualifiedScore",
      label: "Qualified threshold (%)",
      type: "number",
      min: 0,
      max: 100,
    },
  ],
  actions: [],
  document: false,
};
config.validate = function validate(records, s) {
  if (s.budgetWeight + s.timingWeight + s.authorityWeight + s.fitWeight === 0)
    throw new Error("At least one scoring weight must be positive");
};
export const example = {
  schemaVersion: 1,
  project: "lead-qualification-engine",
  settings: {
    currency: "USD",
    minimumBudget: 2000,
    urgentDays: 30,
    budgetWeight: 30,
    timingWeight: 20,
    authorityWeight: 20,
    fitWeight: 30,
    qualifiedScore: 70,
  },
  records: [
    {
      id: "lead-1",
      name: "Maple Studio",
      email: "buyer@example.com",
      budget: 4000,
      daysToBuy: 14,
      decisionMaker: true,
      fit: true,
      consent: true,
    },
    {
      id: "lead-2",
      name: "River Foods",
      email: "team@example.com",
      budget: 1000,
      daysToBuy: 90,
      decisionMaker: false,
      fit: true,
      consent: false,
    },
  ],
};
export function analyze(records, s) {
  const rows = records
    .map((r) => {
      const rules = [
        [r.budget >= s.minimumBudget, s.budgetWeight, "Budget"],
        [r.daysToBuy <= s.urgentDays, s.timingWeight, "Timing"],
        [r.decisionMaker, s.authorityWeight, "Authority"],
        [r.fit, s.fitWeight, "Fit"],
      ];
      const score = ratio(
        sum(rules.filter((x) => x[0]).map((x) => x[1])),
        s.budgetWeight + s.timingWeight + s.authorityWeight + s.fitWeight,
      );
      return {
        id: r.id,
        Customer: r.name,
        "Score (%)": score,
        Priority: !r.consent
          ? "Do not contact"
          : score >= s.qualifiedScore
            ? "Qualified"
            : "Nurture",
        "Matched rules":
          rules
            .filter((x) => x[0])
            .map((x) => x[2])
            .join(", ") || "None",
      };
    })
    .sort((a, b) => b["Score (%)"] - a["Score (%)"]);
  return {
    metrics: [
      metric("Leads evaluated", rows.length),
      metric(
        "Qualified leads",
        rows.filter((r) => r.Priority === "Qualified").length,
      ),
      metric("Contact restricted", records.filter((r) => !r.consent).length),
    ],
    notices: [],
    columns: ["Customer", "Score (%)", "Priority", "Matched rules"],
    rows,
  };
}
