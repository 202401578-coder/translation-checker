// Run with Node 22.18+. Browser WASM integration is checked in the UI separately.
import assert from "node:assert/strict";
import { example, sampleSource, sampleTranslations } from "../src/lib/examples.ts";
import { embed } from "../src/lib/embedding.ts";
import { align, segment } from "../src/lib/alignment.ts";

async function analyze(data) {
  const source = segment(data.source, "de", "sentence"), target = segment(data.target, "ko", "sentence");
  const pairs = x => x.slice(0, -1).map((s, i) => s + " " + x[i + 1]);
  const a = pairs(source), b = pairs(target);
  const vectors = await embed([...source, ...target, ...a, ...b]);
  const n = source.length, m = target.length;
  const report = { source, target, rows: align(vectors.slice(0, n), vectors.slice(n, n + m), vectors.slice(n + m, n + m + a.length), vectors.slice(n + m + a.length)) };
  // Every input sentence must appear exactly once in the report.
  for (const side of ["source", "target"]) {
    assert.deepEqual(report.rows.flatMap(r => r[side]), report[side].map((_, i) => i));
  }
  return report;
}

const complete = await analyze(example("complete"));
assert.equal(complete.rows.length, 10);
assert.ok(complete.rows.every((r, i) => r.status === "paired" && r.source[0] === i && r.target[0] === i));
console.log("PASS: complete translation, ten 1:1 candidates");

const missing = await analyze(example("missing"));
assert.deepEqual(missing.rows.filter(r => r.status === "missing").map(r => r.source), [[3]]);
assert.ok(missing.rows.some(r => r.source[0] === 4 && r.target[0] === 3 && r.status === "paired"));
console.log("PASS: omitted fourth sentence, later sentences realigned");

const merged = await analyze(example("merged"));
assert.deepEqual(merged.rows.filter(r => r.status === "merged").map(r => [r.source, r.target]), [[[2, 3], [2]]]);
console.log("PASS: two source sentences merged into one translation");

const split = await analyze(example("split"));
assert.deepEqual(split.rows.filter(r => r.status === "split").map(r => [r.source, r.target]), [[[3], [3, 4]]]);
console.log("PASS: one source sentence split into two translations");

const equalCountLines = [...sampleTranslations];
equalCountLines.splice(3, 1);
equalCountLines.splice(6, 1, "저녁 식사로 채소 수프를 만들었다.", "수프에는 신선한 빵을 곁들였다.");
const equalCount = await analyze({ source: sampleSource, target: equalCountLines.join("\n") });
assert.equal(equalCount.source.length, equalCount.target.length);
assert.ok(equalCount.rows.some(r => r.status === "missing" && r.source[0] === 3));
assert.ok(equalCount.rows.some(r => r.status === "split" && r.source[0] === 7));
console.log("PASS: same sentence count still detects omission and split");

const unrelated = await analyze({ source: "Die Katze schläft auf dem Sofa.", target: "우주선은 내년에 화성으로 발사될 예정이다." });
assert.ok(unrelated.rows.every(r => r.status !== "paired"));
console.log("PASS: unrelated texts are not marked as paired");

assert.deepEqual(segment("  \n ", "de", "sentence"), []);
console.log("PASS: blank input has no sentences");
