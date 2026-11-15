import test from "node:test";
import assert from "node:assert/strict";
import { config, example, analyze } from "../src/domain.mjs";
import { validateState } from "../src/lib.mjs";
test("Documented sample results match independently specified expectations", () => {
  const report = analyze(example.records, example.settings, config.asOf);
  for (const [label, value] of [
    ["Leads evaluated", 2],
    ["Qualified leads", 1],
    ["Contact restricted", 1],
  ])
    assert.equal(
      report.metrics.find((m) => m.label === label).value,
      value,
      label,
    );
});
test("Business edge cases", () => {
  (function edge(records, s, analyze) {
    const r = { ...records[0], consent: false };
    assert.equal(analyze([r], s).rows[0].Priority, "Do not contact");
    assert.equal(analyze([r], s).rows[0]["Score (%)"], 100);
  })(example.records, example.settings, analyze, validateState);
});
