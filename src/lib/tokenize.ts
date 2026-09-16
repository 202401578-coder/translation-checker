/**
 * tokenize.ts
 * 독일어 문장을 클릭 가능한 토큰 목록으로 분리
 *
 * 전략:
 *   - 공백 기준으로 분리 (space-split)
 *   - 각 토큰의 display는 원본 그대로 유지
 *   - clean은 앞뒤 문장부호를 제거한 순수 단어 (사전 검색에 사용)
 *   - isWord: clean이 비어 있지 않은 경우만 클릭 대상
 */

import { normalizeWordForLookup } from "./dictionary";

export interface Token {
  id: number;
  display: string;   // 화면에 보여줄 원본 텍스트
  clean: string;     // 사전 검색용 정규화 단어
  isWord: boolean;   // true → 클릭 가능
}

/**
 * 텍스트를 토큰 배열로 변환한다.
 * 여러 문장(줄바꿈 포함)도 하나의 흐름으로 처리한다.
 */
export function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  let id = 0;

  // 줄바꿈을 공백으로 치환 후 분리
  const words = text.replace(/\n/g, " ").split(/\s+/).filter(Boolean);

  for (const raw of words) {
    const clean = normalizeWordForLookup(raw);
    tokens.push({
      id: id++,
      display: raw,
      clean,
      isWord: clean.length > 0,
    });
  }

  return tokens;
}
