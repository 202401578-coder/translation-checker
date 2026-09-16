export type AlignmentStatus = "paired" | "review" | "missing" | "merged" | "split" | "extra";
export type AlignmentRow = { source: number[]; target: number[]; score: number; status: AlignmentStatus };
export type SplitMode = "sentence" | "line";

export function segment(text: string, language: string, mode: SplitMode): string[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").map(s => s.trim().replace(/^\d+[.)]\s+/, "")).filter(Boolean);
  if (mode === "line") return lines;
  const splitter = new Intl.Segmenter(language, { granularity: "sentence" });
  return lines.flatMap(line => Array.from(splitter.segment(line), s => s.segment.trim()).filter(Boolean));
}

export function cosine(a: number[], b: number[]): number {
  let dot = 0, aa = 0, bb = 0;
  for (let i = 0; i < a.length; i++) { dot += a[i] * b[i]; aa += a[i] ** 2; bb += b[i] ** 2; }
  return aa && bb ? dot / Math.sqrt(aa * bb) : 0;
}

// Global sequence alignment. Gaps let subsequent sentences realign after an omission.
// Adjacent 2:1 and 1:2 candidates use embeddings of the actual joined text.
export function align(source: number[][], target: number[][], sourcePairs: number[][], targetPairs: number[][]): AlignmentRow[] {
  const n = source.length, m = target.length;
  const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(-Infinity));
  const back: (AlignmentRow | undefined)[][] = Array.from({ length: n + 1 }, () => Array(m + 1));
  dp[0][0] = 0;
  const offer = (i: number, j: number, di: number, dj: number, score: number, value: number, status: AlignmentStatus) => {
    if (dp[i][j] + value <= dp[i + di][j + dj]) return;
    dp[i + di][j + dj] = dp[i][j] + value;
    back[i + di][j + dj] = { source: Array.from({ length: di }, (_, k) => i + k), target: Array.from({ length: dj }, (_, k) => j + k), score, status };
  };
  for (let i = 0; i <= n; i++) for (let j = 0; j <= m; j++) {
    if (i < n) offer(i, j, 1, 0, 0, -.22, "missing");
    if (j < m) offer(i, j, 0, 1, 0, -.22, "extra");
    if (i < n && j < m) {
      const s = cosine(source[i], target[j]);
      offer(i, j, 1, 1, s, s - .5, s >= .68 ? "paired" : "review");
      if (i + 1 < n) {
        const joined = cosine(sourcePairs[i], target[j]);
        const weakest = Math.min(s, cosine(source[i + 1], target[j]));
        const strongest = Math.max(s, cosine(source[i + 1], target[j]));
        if (joined >= .60 && weakest >= .35 && joined >= strongest + .035) offer(i, j, 2, 1, joined, (joined - .5) * 1.5 - .14, "merged");
      }
      if (j + 1 < m) {
        const joined = cosine(source[i], targetPairs[j]);
        const weakest = Math.min(s, cosine(source[i], target[j + 1]));
        const strongest = Math.max(s, cosine(source[i], target[j + 1]));
        if (joined >= .60 && weakest >= .35 && joined >= strongest + .035) offer(i, j, 1, 2, joined, (joined - .5) * 1.5 - .14, "split");
      }
    }
  }
  const rows: AlignmentRow[] = [];
  let i = n, j = m;
  while (i || j) { const r = back[i][j]!; rows.push(r); i -= r.source.length; j -= r.target.length; }
  return rows.reverse();
}
