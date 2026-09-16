/**
 * sentences.ts
 * 언어 감지 및 문장 분리 함수 모음
 *
 * 주요 함수:
 *   splitSentences()                    – 원문 텍스트를 문장 단위로 분리
 *   detectLanguageLineType()            – 줄의 언어 유형 판별
 *   extractSourceSentencesFromMixedText() – 혼합 텍스트에서 원문 문장만 추출
 */

export type SourceLanguage = "de" | "en" | "ja" | "auto";

// ────────────────────────────────────────────────────────────
// 문자 집합 카운터
// ────────────────────────────────────────────────────────────

function countHangul(text: string): number {
  return (text.match(/[\uAC00-\uD7A3\u1100-\u11FF\u3130-\u318F]/g) ?? [])
    .length;
}

function countLatin(text: string): number {
  return (text.match(/[a-zA-ZäöüßÄÖÜàáâãèéêëìíîïòóôõùúûüýÿ]/g) ?? []).length;
}

function countHiraganaKatakana(text: string): number {
  return (text.match(/[\u3040-\u309F\u30A0-\u30FF]/g) ?? []).length;
}

function countCJK(text: string): number {
  // 한자(CJK Unified Ideographs) – 한국어·중국어·일본어 공통
  return (text.match(/[\u4E00-\u9FFF\u3400-\u4DBF]/g) ?? []).length;
}

// ────────────────────────────────────────────────────────────
// 언어 유형 판별
// ────────────────────────────────────────────────────────────

export type LineLanguage = "ko" | "source" | "mixed" | "empty" | "skip";

/**
 * 한 줄의 언어 유형을 반환한다.
 *
 * 판별 기준:
 *   - 빈 줄          → "empty"
 *   - 한글 비율 높음  → "ko"  (한국어 번역문 → 무시 대상)
 *   - 원문 언어 비율 충분 → "source"
 *   - 그 외           → "mixed" or "skip"
 */
export function detectLanguageLineType(
  line: string,
  sourceLanguage: SourceLanguage
): LineLanguage {
  const t = line.trim();
  if (!t) return "empty";

  const total = t.length;
  const hangul = countHangul(t);
  const hangulRatio = hangul / total;

  // ─ 한국어 판정 ─────────────────────────────────────────
  // 한글이 전체 문자의 15% 이상이면 한국어 줄로 간주
  if (hangulRatio >= 0.15) return "ko";

  // ─ 원문 언어 판정 ──────────────────────────────────────
  switch (sourceLanguage) {
    case "de":
    case "en": {
      const latin = countLatin(t);
      const latinRatio = latin / total;
      // 라틴 문자 비율이 25% 이상이면 원문 후보
      return latinRatio >= 0.25 ? "source" : "skip";
    }
    case "ja": {
      const kana = countHiraganaKatakana(t);
      const kanaRatio = kana / total;
      // 히라가나·가타카나 비율이 10% 이상이면 일본어 원문
      if (kanaRatio >= 0.1) return "source";
      // 한자만 있는 경우(중국어 혼동 가능성) – 한자 비율로 보조 판단
      const cjk = countCJK(t);
      const cjkRatio = cjk / total;
      return cjkRatio >= 0.2 ? "source" : "skip";
    }
    case "auto":
    default: {
      // 자동: 한글이 아니고 의미 있는 문자가 충분하면 원문으로 간주
      const alphaNum =
        (t.match(/[a-zA-Z0-9\u3040-\u30FF\u4E00-\u9FFF]/g) ?? []).length;
      return alphaNum / total >= 0.2 ? "source" : "skip";
    }
  }
}

// ────────────────────────────────────────────────────────────
// 문장 경계 분리 (독일어·영어)
// ────────────────────────────────────────────────────────────

function splitLatinSentences(text: string): string[] {
  try {
    // ". " 또는 "! " 또는 "? " 뒤에 대문자가 오는 경우 분리
    // lookbehind: 모던 브라우저 지원
    const parts = text.split(/(?<=[.!?])\s+(?=[A-ZÄÖÜ"„])/);
    return parts.map((p) => p.trim()).filter((p) => p.length > 1);
  } catch {
    return [text];
  }
}

function splitJapaneseSentences(text: string): string[] {
  const parts = text.split(/(?<=[。！？])/);
  return parts.map((p) => p.trim()).filter((p) => p.length > 1);
}

// ────────────────────────────────────────────────────────────
// 공개 API
// ────────────────────────────────────────────────────────────

/**
 * 원문 텍스트를 문장 목록으로 분리한다.
 * - 줄바꿈으로 1차 분리
 * - 각 줄 내에서 문장 경계를 추가 분리 (독일어·영어·일본어)
 */
export function splitSentences(
  text: string,
  sourceLanguage: SourceLanguage
): string[] {
  const sentences: string[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (sourceLanguage === "ja") {
      sentences.push(...splitJapaneseSentences(trimmed));
    } else {
      // de / en / auto: 라틴 문장 경계 분리
      sentences.push(...splitLatinSentences(trimmed));
    }
  }

  return sentences.filter((s) => s.length > 1);
}

/**
 * 원문+한국어 번역이 혼합된 텍스트에서 원문 언어 문장만 추출한다.
 * - 줄 단위로 언어 판정
 * - 원문으로 판정된 줄만 수집 후 추가 문장 분리
 */
export function extractSourceSentencesFromMixedText(
  text: string,
  sourceLanguage: SourceLanguage
): string[] {
  const sentences: string[] = [];

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const type = detectLanguageLineType(trimmed, sourceLanguage);
    if (type !== "source") continue;

    // 원문 줄을 문장 단위로 추가 분리
    if (sourceLanguage === "ja") {
      sentences.push(...splitJapaneseSentences(trimmed));
    } else {
      sentences.push(...splitLatinSentences(trimmed));
    }
  }

  return sentences.filter((s) => s.length > 1);
}
