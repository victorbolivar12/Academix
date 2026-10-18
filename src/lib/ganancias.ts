import { SPANISH_MONTHS } from "@/lib/months";

export function normalizeMonthKey(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const iso = /^(\d{4})-(\d{2})$/.exec(trimmed);
  if (iso) {
    return SPANISH_MONTHS[Number(iso[2]) - 1] ?? null;
  }

  const word = /^[A-Za-zÁÉÍÓÚáéíóúÑñ]+/.exec(trimmed);
  if (!word) return null;

  const name = SPANISH_MONTHS.find(
    (month) => month.toLowerCase() === word[0].toLowerCase(),
  );
  return name ?? null;
}
