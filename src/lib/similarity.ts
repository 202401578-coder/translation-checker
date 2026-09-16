/**
 * similarity.ts
 * 문자열 유사도 계산 함수 모음
 *
 * - levenshteinDistance: 편집 거리
 * - charSimilarity: 편집 거리 기반 0–1 유사도
 * - tokenSimilarity: Jaccard 계수(단어 단위)
 * - combinedSimilarity: 두 방식 가중 평균 (기본 사용)
 */

export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // 롤링 배열로 메모리 절약
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  let curr = new Array<number>(b.length + 1);

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[b.length];
}

/** 문자 수준 유사도 (0–1) */
export function charSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/** 단어(토큰) Jaccard 유사도 (0–1) */
export function tokenSimilarity(a: string, b: string): number {
  const setA = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const setB = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  if (setA.size === 0 && setB.size === 0) return 1;

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 1 : intersection / union;
}

/**
 * 최종 유사도 (0–1)
 * 단어 유사도로 먼저 필터링 후, 문자 유사도를 가중 평균.
 * 긴 문장에서 Levenshtein 비용을 줄이기 위해 pre-check 활용.
 */
export function combinedSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  const tokSim = tokenSimilarity(a, b);

  // 단어 유사도가 매우 낮으면 문자 계산 생략
  if (tokSim < 0.15) return tokSim * 0.4;

  // 문자열이 길면 단어 유사도만 사용 (성능 상한)
  if (a.length > 200 || b.length > 200) return tokSim;

  const charSim = charSimilarity(a, b);
  return 0.6 * charSim + 0.4 * tokSim;
}
