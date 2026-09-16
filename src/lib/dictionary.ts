/**
 * dictionary.ts
 * 독일어 Mock 사전
 *
 * 구조: 단어 → { meaning, pos, baseForm?, note? }
 *
 * 확장 포인트:
 *   - 외부 API(DWDS, Wiktionary 등) 연동 시 lookupWord() 함수만 교체
 *   - 형태소 복원(lemmatization) 라이브러리 추가 시 normalizeWordForLookup() 확장
 */

export interface DictionaryEntry {
  meaning: string;
  pos: string;
  baseForm?: string; // 기본형/원형
  note?: string;     // 추가 설명
}

// ────────────────────────────────────────────────────────────
// Mock 사전 데이터
// ────────────────────────────────────────────────────────────

const DICTIONARY: Record<string, DictionaryEntry> = {
  // ── 대명사 ──────────────────────────────────────────────
  Er: { meaning: "그는, 그가", pos: "대명사" },
  er: { meaning: "그는, 그가", pos: "대명사" },
  Sie: { meaning: "그녀는 / 그들은 / 당신은", pos: "대명사" },
  sie: { meaning: "그녀는 / 그들은", pos: "대명사" },
  es: { meaning: "그것은", pos: "대명사" },
  ich: { meaning: "나는", pos: "대명사" },
  du: { meaning: "너는", pos: "대명사" },
  wir: { meaning: "우리는", pos: "대명사" },
  ihr: { meaning: "너희는 / 그녀의", pos: "대명사" },

  // ── 관사 ────────────────────────────────────────────────
  der: { meaning: "그 (남성 1격 / 여성 2,3격 관사)", pos: "관사" },
  die: { meaning: "그 (여성·복수 1,4격 관사)", pos: "관사" },
  das: { meaning: "그 (중성 1,4격 관사) / 그것", pos: "관사/대명사" },
  den: { meaning: "그 (남성 4격 / 복수 3격)", pos: "관사" },
  dem: { meaning: "그 (남성·중성 3격)", pos: "관사" },
  des: { meaning: "그 (남성·중성 2격)", pos: "관사" },
  ein: { meaning: "하나의, 어떤 (남성·중성 부정관사)", pos: "부정관사" },
  eine: { meaning: "하나의, 어떤 (여성 부정관사)", pos: "부정관사" },
  eines: { meaning: "하나의 (중성·남성 2격)", pos: "부정관사" },
  einem: { meaning: "하나의 (남성·중성 3격)", pos: "부정관사" },
  einen: { meaning: "하나의 (남성 4격)", pos: "부정관사" },
  keine: { meaning: "어떠한 ~도 없는, ~이 없는", pos: "부정관사/부정어", baseForm: "kein" },
  kein: { meaning: "어떠한 ~도 없는", pos: "부정관사/부정어" },

  // ── 동사 ────────────────────────────────────────────────
  wollte: { meaning: "원했다, 하려 했다", pos: "동사 (과거형)", baseForm: "wollen" },
  wollen: { meaning: "원하다, ~하려 하다", pos: "조동사" },
  weine: {
    meaning: "울다 / (여기서) ~을 아쉬워하지 않다 (Träne nachweinen 표현의 일부)",
    pos: "동사",
    baseForm: "weinen",
    note: "jemandem keine Träne nachweinen = ~의 죽음·떠남을 전혀 슬퍼하지 않다",
  },
  weinen: { meaning: "울다, 눈물 흘리다", pos: "동사" },
  belehren: { meaning: "가르치다, 훈계하다", pos: "동사" },
  tat: { meaning: "했다, 행했다", pos: "동사 (과거형)", baseForm: "tun" },
  tun: { meaning: "하다, 행하다", pos: "동사" },
  ist: { meaning: "이다, 있다 (현재 3인칭 단수)", pos: "동사", baseForm: "sein" },
  sein: { meaning: "이다, 있다", pos: "동사/부정사" },
  sind: { meaning: "이다, 있다 (복수/2인칭 현재)", pos: "동사", baseForm: "sein" },
  war: { meaning: "이었다, 있었다 (과거)", pos: "동사", baseForm: "sein" },
  haben: { meaning: "가지다, 있다", pos: "동사" },
  hat: { meaning: "가지다 (3인칭 단수 현재)", pos: "동사", baseForm: "haben" },
  hatte: { meaning: "가졌다 (과거)", pos: "동사", baseForm: "haben" },
  macht: { meaning: "만들다, 하다 (3인칭 단수)", pos: "동사", baseForm: "machen" },
  machen: { meaning: "하다, 만들다", pos: "동사" },
  geht: { meaning: "가다 (3인칭 단수)", pos: "동사", baseForm: "gehen" },
  gehen: { meaning: "가다", pos: "동사" },
  kommt: { meaning: "오다 (3인칭 단수)", pos: "동사", baseForm: "kommen" },
  kommen: { meaning: "오다", pos: "동사" },
  sagte: { meaning: "말했다", pos: "동사", baseForm: "sagen" },
  sagen: { meaning: "말하다", pos: "동사" },
  lobte: { meaning: "칭찬했다", pos: "동사", baseForm: "loben" },
  loben: { meaning: "칭찬하다", pos: "동사" },
  betonte: { meaning: "강조했다", pos: "동사", baseForm: "betonen" },
  betonen: { meaning: "강조하다", pos: "동사" },
  einigten: { meaning: "합의했다", pos: "동사", baseForm: "einigen" },
  einigen: { meaning: "합의하다, 통합하다", pos: "동사" },

  // ── 명사 ────────────────────────────────────────────────
  Träne: { meaning: "눈물", pos: "명사 (여성, die)" },
  Führung: { meaning: "지도부, 지휘부, 리더십", pos: "명사 (여성, die)" },
  Bundeskanzler: { meaning: "독일 연방총리", pos: "명사 (남성, der)" },
  Völkerrecht: { meaning: "국제법", pos: "명사 (중성, das)" },
  Haus: { meaning: "집, 건물", pos: "명사 (중성, das)" },
  Besuchs: { meaning: "방문의 (2격)", pos: "명사", baseForm: "Besuch" },
  Besuch: { meaning: "방문, 방문객", pos: "명사 (남성, der)" },
  Teil: { meaning: "부분, 일부", pos: "명사 (남성, der)" },
  Waffenstillstand: { meaning: "휴전", pos: "명사 (남성, der)" },
  Partnerschaft: { meaning: "파트너십, 협력 관계", pos: "명사 (여성, die)" },
  Zusammenarbeit: { meaning: "협력, 협업", pos: "명사 (여성, die)" },
  Leben: { meaning: "삶, 생명, 생활", pos: "명사 (중성, das)" },
  Reise: { meaning: "여행", pos: "명사 (여성, die)" },
  Welt: { meaning: "세계, 세상", pos: "명사 (여성, die)" },
  Zeit: { meaning: "시간, 때", pos: "명사 (여성, die)" },
  Mensch: { meaning: "사람, 인간", pos: "명사 (남성, der)" },
  Land: { meaning: "나라, 땅, 시골", pos: "명사 (중성, das)" },
  Jahr: { meaning: "해, 년", pos: "명사 (중성, das)" },
  Tag: { meaning: "날, 하루", pos: "명사 (남성, der)" },
  Nacht: { meaning: "밤", pos: "명사 (여성, die)" },
  Stadt: { meaning: "도시", pos: "명사 (여성, die)" },
  Frage: { meaning: "질문, 문제", pos: "명사 (여성, die)" },
  Antwort: { meaning: "대답", pos: "명사 (여성, die)" },
  Weg: { meaning: "길, 방법", pos: "명사 (남성, der)" },
  Wort: { meaning: "단어, 말", pos: "명사 (중성, das)" },

  // ── 고유명사 ────────────────────────────────────────────
  Teheran: { meaning: "테헤란 (이란의 수도)", pos: "고유명사" },
  Merz: { meaning: "메르츠 (독일 연방총리 Friedrich Merz)", pos: "고유명사" },
  Friedrich: { meaning: "프리드리히 (인명)", pos: "고유명사" },
  Trump: { meaning: "트럼프 (Donald Trump)", pos: "고유명사" },
  Donald: { meaning: "도널드 (인명)", pos: "고유명사" },
  Washington: { meaning: "워싱턴 (미국 수도)", pos: "고유명사" },
  Gaza: { meaning: "가자 (중동 지역)", pos: "고유명사" },
  Deutschland: { meaning: "독일", pos: "고유명사" },
  Berlin: { meaning: "베를린 (독일 수도)", pos: "고유명사" },

  // ── 전치사 ──────────────────────────────────────────────
  nach: {
    meaning: "~에 따라 / ~를 향해 / ~후에 / ~을 두고 아쉬워하다(nachweinen)",
    pos: "전치사/부사",
    note: "nach + 3격. nachweinen(복합동사)의 일부로 쓰일 때는 분리 전철",
  },
  über: { meaning: "~에 대해, ~위에, ~을 통해", pos: "전치사" },
  in: { meaning: "~안에, ~에 (위치/방향)", pos: "전치사" },
  im: { meaning: "in dem의 축약형", pos: "전치사+관사", baseForm: "in dem" },
  an: { meaning: "~에, ~옆에, ~에 붙어", pos: "전치사" },
  am: { meaning: "an dem의 축약형", pos: "전치사+관사", baseForm: "an dem" },
  auf: { meaning: "~위에, ~에 대해", pos: "전치사" },
  aus: { meaning: "~로부터, ~에서", pos: "전치사" },
  mit: { meaning: "~와 함께, ~로", pos: "전치사" },
  von: { meaning: "~의, ~로부터", pos: "전치사" },
  vom: { meaning: "von dem의 축약형", pos: "전치사+관사", baseForm: "von dem" },
  zu: { meaning: "~에게, ~으로, ~하기 위해", pos: "전치사/부정사 표지" },
  zum: { meaning: "zu dem의 축약형", pos: "전치사+관사", baseForm: "zu dem" },
  zur: { meaning: "zu der의 축약형", pos: "전치사+관사", baseForm: "zu der" },
  für: { meaning: "~를 위해, ~동안", pos: "전치사" },
  zwischen: { meaning: "~사이에", pos: "전치사" },
  durch: { meaning: "~를 통해, ~때문에", pos: "전치사" },
  bei: { meaning: "~에서, ~옆에, ~할 때", pos: "전치사" },
  beim: { meaning: "bei dem의 축약형", pos: "전치사+관사", baseForm: "bei dem" },

  // ── 부사/접속사 ─────────────────────────────────────────
  nicht: { meaning: "~않다, ~아니다 (부정)", pos: "부사/부정어" },
  auch: { meaning: "또한, 역시, ~도", pos: "부사" },
  jedenfalls: { meaning: "어쨌든, 적어도, 하여간", pos: "부사" },
  aber: { meaning: "그러나, 하지만", pos: "접속사/부사" },
  und: { meaning: "그리고, ~와", pos: "접속사" },
  Und: { meaning: "그리고, ~와", pos: "접속사" },
  oder: { meaning: "또는, 아니면", pos: "접속사" },
  dass: { meaning: "~라는 것 (접속사)", pos: "접속사" },
  wenn: { meaning: "~할 때, 만약 ~라면", pos: "접속사" },
  weil: { meaning: "왜냐하면, ~이기 때문에", pos: "접속사" },
  wie: { meaning: "어떻게, ~처럼", pos: "부사/접속사" },
  so: { meaning: "그렇게, 따라서, 매우", pos: "부사/접속사" },
  sehr: { meaning: "매우, 몹시", pos: "부사" },
  schon: { meaning: "이미, 벌써", pos: "부사" },
  noch: { meaning: "아직, 여전히, 더", pos: "부사" },
  nur: { meaning: "단지, 오직, ~만", pos: "부사" },
  bereits: { meaning: "이미, 벌써", pos: "부사" },
  wieder: { meaning: "다시, 또", pos: "부사" },
  jetzt: { meaning: "지금, 현재", pos: "부사" },
  dann: { meaning: "그때, 그러면", pos: "부사" },
  hier: { meaning: "여기에", pos: "부사" },
  dort: { meaning: "거기에, 저기에", pos: "부사" },
  einmal: { meaning: "한 번, 언젠가", pos: "부사" },
  man: { meaning: "사람들은, 누군가는 (비인칭 주어)", pos: "부정대명사" },

  // ── 형용사 ──────────────────────────────────────────────
  öffentlichen: { meaning: "공개적인, 공공의 (변화형)", pos: "형용사", baseForm: "öffentlich" },
  öffentlich: { meaning: "공개적인, 공공의", pos: "형용사" },
  enge: { meaning: "긴밀한, 좁은 (변화형)", pos: "형용사", baseForm: "eng" },
  eng: { meaning: "긴밀한, 좁은", pos: "형용사" },
  transatlantische: {
    meaning: "대서양 횡단의 (변화형)",
    pos: "형용사",
    baseForm: "transatlantisch",
  },
  Weißen: { meaning: "흰, 백색의 (변화형) / 여기서는 백악관(Weißes Haus)의 일부", pos: "형용사", baseForm: "weiß" },
  weiß: { meaning: "희다, 하얗다", pos: "형용사" },
  neue: { meaning: "새로운 (변화형)", pos: "형용사", baseForm: "neu" },
  neu: { meaning: "새로운", pos: "형용사" },
  erste: { meaning: "첫 번째의 (변화형)", pos: "형용사", baseForm: "erst" },
};

// ────────────────────────────────────────────────────────────
// 공개 API
// ────────────────────────────────────────────────────────────

/**
 * 사전 검색용 단어 정규화
 * - 앞뒤 문장부호 제거
 */
export function normalizeWordForLookup(word: string): string {
  return word
    .replace(/^[^a-zA-ZäöüßÄÖÜ\u00C0-\u024F]+/, "")
    .replace(/[^a-zA-ZäöüßÄÖÜ\u00C0-\u024F]+$/, "");
}

/**
 * 단어 사전 검색
 * 우선순위: 완전 일치 → 소문자 → 첫 글자 대문자
 */
export function lookupWord(word: string): DictionaryEntry | null {
  if (!word) return null;
  const clean = normalizeWordForLookup(word);
  if (!clean) return null;

  // 1) 완전 일치
  if (DICTIONARY[clean]) return DICTIONARY[clean];

  // 2) 소문자 비교
  const lower = clean.toLowerCase();
  if (DICTIONARY[lower]) return DICTIONARY[lower];

  // 3) 첫 글자만 대문자 (독일어 명사)
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase();
  if (DICTIONARY[capitalized]) return DICTIONARY[capitalized];

  return null;
}

export { DICTIONARY };
