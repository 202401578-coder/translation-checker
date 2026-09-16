/**
 * compare.ts
 * 원문 문장 목록과 추출된 문장 목록을 비교하여
 * 누락·순서 불일치·부분 불일치·추가 문장을 검출한다.
 */

import { normalizeSentence } from "./normalize";
import { combinedSimilarity } from "./similarity";

// ────────────────────────────────────────────────────────────
// 타입
// ────────────────────────────────────────────────────────────

export type MatchStatus = "match" | "similar" | "missing";

export interface SentenceResult {
  /** 원문 문장 인덱스 (0-based) */
  sourceIndex: number;
  sourceSentence: string;
  /** 가장 유사한 추출 문장 (누락이면 undefined) */
  matchedSentence?: string;
  /** 추출 문장 인덱스 (누락이면 undefined) */
  extractedIndex?: number;
  /** 유사도 0–1 */
  similarity: number;
  status: MatchStatus;
  /** 순서가 앞 매칭보다 이전인 경우 true */
  orderIssue: boolean;
}

export interface ExtraSentence {
  extractedIndex: number;
  sentence: string;
}

export interface ComparisonReport {
  results: SentenceResult[];
  extras: ExtraSentence[];
  totalSource: number;
  totalExtracted: number;
  matchCount: number;
  similarCount: number;
  missingCount: number;
  extraCount: number;
  orderIssueCount: number;
}

export interface CompareOptions {
  /** 정확 일치 임계값 (기본 0.92) */
  exactThreshold?: number;
  /** 유사 일치 임계값 (기본 0.65) */
  similarThreshold?: number;
}

// ────────────────────────────────────────────────────────────
// 핵심 비교 함수
// ────────────────────────────────────────────────────────────

/**
 * 원문 문장 목록과 추출된 문장 목록을 비교한다.
 *
 * 알고리즘:
 *   1. 각 원문 문장에 대해 사용되지 않은 추출 문장 중
 *      가장 유사한 것을 greedy 매칭
 *   2. 유사도 >= exactThreshold → "match"
 *      유사도 >= similarThreshold → "similar"
 *      그 이하 → "missing"
 *   3. 매칭된 추출 인덱스가 앞 매칭보다 작으면 "순서 이상"
 *   4. 사용되지 않은 추출 문장 → extras
 */
export function compareSentenceLists(
  source: string[],
  extracted: string[],
  options: CompareOptions = {}
): ComparisonReport {
  const exactThreshold = options.exactThreshold ?? 0.92;
  const similarThreshold = options.similarThreshold ?? 0.65;

  const normSource = source.map(normalizeSentence);
  const normExtracted = extracted.map(normalizeSentence);

  const used = new Set<number>();
  const results: SentenceResult[] = [];

  for (let i = 0; i < source.length; i++) {
    let bestSim = -1;
    let bestJ = -1;

    for (let j = 0; j < extracted.length; j++) {
      if (used.has(j)) continue;
      const sim = combinedSimilarity(normSource[i], normExtracted[j]);
      if (sim > bestSim) {
        bestSim = sim;
        bestJ = j;
      }
    }

    if (bestSim >= exactThreshold) {
      used.add(bestJ);
      results.push({
        sourceIndex: i,
        sourceSentence: source[i],
        matchedSentence: extracted[bestJ],
        extractedIndex: bestJ,
        similarity: bestSim,
        status: "match",
        orderIssue: false,
      });
    } else if (bestSim >= similarThreshold) {
      used.add(bestJ);
      results.push({
        sourceIndex: i,
        sourceSentence: source[i],
        matchedSentence: extracted[bestJ],
        extractedIndex: bestJ,
        similarity: bestSim,
        status: "similar",
        orderIssue: false,
      });
    } else {
      results.push({
        sourceIndex: i,
        sourceSentence: source[i],
        matchedSentence: bestJ >= 0 ? extracted[bestJ] : undefined,
        extractedIndex: bestJ >= 0 ? bestJ : undefined,
        similarity: Math.max(bestSim, 0),
        status: "missing",
        orderIssue: false,
      });
    }
  }

  // 순서 이상 체크: 매칭된 extractedIndex 가 단조 증가인지 확인
  let lastExtIdx = -1;
  let orderIssueCount = 0;
  for (const r of results) {
    if (r.extractedIndex !== undefined) {
      if (r.extractedIndex < lastExtIdx) {
        r.orderIssue = true;
        orderIssueCount++;
      }
      lastExtIdx = r.extractedIndex;
    }
  }

  // 사용되지 않은 추출 문장 → 추가 문장
  const extras: ExtraSentence[] = [];
  for (let j = 0; j < extracted.length; j++) {
    if (!used.has(j)) {
      extras.push({ extractedIndex: j, sentence: extracted[j] });
    }
  }

  const matchCount = results.filter((r) => r.status === "match").length;
  const similarCount = results.filter((r) => r.status === "similar").length;
  const missingCount = results.filter((r) => r.status === "missing").length;

  return {
    results,
    extras,
    totalSource: source.length,
    totalExtracted: extracted.length,
    matchCount,
    similarCount,
    missingCount,
    extraCount: extras.length,
    orderIssueCount,
  };
}
