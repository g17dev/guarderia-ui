import { belongingCatalog, type EntryBelonging, type PersonalCategory } from "./belongings.ts";

export const normalizePersonalText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es-MX").trim().replace(/\s+/g, " ");
const categories: { category: PersonalCategory; label: string; aliases: string[]; returnable: boolean }[] = [
  ...belongingCatalog.map(item => ({ category: item.kind, label: item.label, aliases: [item.label], returnable: item.returnable })),
  { category: "cap", label: "Gorra", aliases: ["gorra", "cachucha"], returnable: true },
  { category: "hat", label: "Sombrero", aliases: ["sombrero"], returnable: true },
  { category: "plush", label: "Peluche", aliases: ["peluche", "oso de peluche", "osito de peluche"], returnable: true },
  { category: "thermos", label: "Termo", aliases: ["termo"], returnable: true },
  { category: "diapers", label: "Pañales", aliases: ["pañal", "panales"], returnable: false },
  { category: "bottle", label: "Biberón", aliases: ["mamila"], returnable: true },
  { category: "blanket", label: "Cobija", aliases: ["manta", "mantita"], returnable: true },
];
const aliases = categories.flatMap(category => category.aliases.map(alias => ({ ...category, words: normalizePersonalText(alias).split(" ") })))
  .sort((a, b) => b.words.length - a.words.length);

export function interpretPersonalBelonging(description: string) {
  const text = description.trim();
  const words = [...text.matchAll(/[\p{L}\p{M}\p{N}]+/gu)];
  const match = words[0]?.index === 0 ? aliases.find(alias => alias.words.every((word, index) =>
    words[index] && normalizePersonalText(words[index][0]) === word)) : undefined;
  if (!match) return { label: text, details: "", category: "generic" as PersonalCategory, returnable: true, recognized: false, originalText: description };
  const last = words[match.words.length - 1];
  const details = text.slice(last.index! + last[0].length).trim().replace(/^[,:;-]+\s*/, "");
  return { label: match.label, details, category: match.category, returnable: match.returnable, recognized: true, originalText: description };
}

export function createPersonalBelonging(description: string, id: string, correction?: { label: string; details: string }): EntryBelonging {
  const interpretation = interpretPersonalBelonging(correction?.label ?? description);
  return { kind: "custom", label: correction ? correction.label.trim() : interpretation.label,
    details: correction ? correction.details.trim() : interpretation.details, quantity: 1, returnable: interpretation.returnable,
    custom: { id, originalText: description, category: interpretation.category } };
}

export function samePersonalBelonging(a: EntryBelonging, b: EntryBelonging) {
  return normalizePersonalText(a.label) === normalizePersonalText(b.label)
    && normalizePersonalText(a.details) === normalizePersonalText(b.details) && a.returnable === b.returnable;
}
