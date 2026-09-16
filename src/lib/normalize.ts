/**
 * normalize.ts
 * 문장 정규화 함수 모음
 * 비교 전에 공백·따옴표·특수 공백 등을 통일하여 불필요한 불일치를 제거한다.
 */

export function normalizeSentence(s: string): string {
  return s
    .trim()
    // 마크다운 기호 제거 (## 제목, ** 강조)
    .replace(/##\s*/g, "")
    .replace(/\*\*/g, "")
    // 특수 공백(NBSP, 얇은 공백, 전각 공백 등) → 일반 공백
    .replace(/[\u00A0\u202F\u2009\u3000\uFEFF]/g, " ")
    // 스마트 따옴표 → 일반 따옴표
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F\u00AB\u00BB\u2039\u203A]/g, '"')
    // 독일어 Anführungszeichen „..." → 일반 따옴표
    .replace(/[„"]/g, '"')
    // 줄바꿈 → 공백
    .replace(/[\r\n\t]/g, " ")
    // 연속 공백 → 단일 공백
    .replace(/\s{2,}/g, " ")
    .trim();
}

/** 대소문자·따옴표·마침표까지 무시한 강한 정규화 (폴백용) */
export function normalizeStrict(s: string): string {
  return normalizeSentence(s)
    .toLowerCase()
    .replace(/[.!?,;:'"]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
