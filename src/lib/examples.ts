export const sampleSource = `Heute Morgen bin ich früher als gewöhnlich aufgestanden.
Nach dem Frühstück bin ich mit dem Fahrrad zur Arbeit gefahren.
Auf dem Weg habe ich einen alten Freund getroffen.
Wir haben uns kurz unterhalten und Telefonnummern ausgetauscht.
Am Nachmittag musste ich an einer wichtigen Besprechung teilnehmen.
Die Besprechung dauerte länger, als ich erwartet hatte.
Danach kaufte ich in einem kleinen Supermarkt Lebensmittel ein.
Zum Abendessen kochte ich eine Gemüsesuppe mit frischem Brot.
Später las ich ein interessantes Buch über die deutsche Geschichte.
Bevor ich schlafen ging, plante ich meine Aufgaben für den nächsten Tag.`;

export const sampleTranslations = [
  "오늘 아침 나는 평소보다 일찍 일어났다.",
  "아침 식사 후 자전거를 타고 직장에 갔다.",
  "가는 길에 오랜 친구를 만났다.",
  "우리는 잠시 이야기를 나누고 전화번호를 교환했다.",
  "오후에는 중요한 회의에 참석해야 했다.",
  "회의는 내가 예상했던 것보다 오래 계속되었다.",
  "그 후 작은 슈퍼마켓에서 식료품을 샀다.",
  "저녁 식사로 신선한 빵을 곁들인 채소 수프를 만들었다.",
  "나중에는 독일 역사에 관한 흥미로운 책을 읽었다.",
  "잠자리에 들기 전에 다음 날 할 일을 계획했다.",
];

export function example(kind: string) {
  const lines = [...sampleTranslations];
  if (kind === "missing") lines.splice(3, 1);
  if (kind === "merged") lines.splice(2, 2, "가는 길에 오랜 친구를 만나 잠시 이야기를 나누고 전화번호를 교환했다.");
  if (kind === "split") lines.splice(3, 1, "우리는 잠시 이야기를 나누었다.", "그리고 전화번호를 교환했다.");
  return { source: sampleSource, target: lines.join("\n") };
}
