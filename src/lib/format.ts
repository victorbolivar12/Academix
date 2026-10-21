import { SPANISH_MONTHS } from "@/lib/months";

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(value: number): string {
  return `$${currencyFormatter.format(value)}`;
}

export function formatMonth(mes: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!match) return mes;
  const monthName = SPANISH_MONTHS[Number(match[2]) - 1];
  return monthName ? `${monthName} ${match[1]}` : mes;
}

export function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export function getTodayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getCurrentMonthName(): string {
  const now = new Date();
  return SPANISH_MONTHS[now.getMonth()] ?? "";
}

export function emptySubscribe(): () => void {
  return () => {};
}

export function getEmptyValue(): string {
  return "";
}

export function formatStatus(value: string | null): {
  label: string;
  className: string;
} {
  if (!value) {
    return { label: "—", className: "bg-surface text-muted" };
  }
  const normalized = value.toLowerCase();
  const label = value.charAt(0).toUpperCase() + value.slice(1);
  if (normalized === "listo") {
    return { label, className: "bg-secondary/10 text-secondary" };
  }
  if (normalized === "pendiente") {
    return { label, className: "bg-accent/20 text-primary" };
  }
  return { label, className: "bg-primary/10 text-primary" };
}

const SPANISH_WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function getWeekdayName(year: number, month: number, day: number): string {
  const adjustedMonth = month < 3 ? month + 12 : month;
  const adjustedYear = month < 3 ? year - 1 : year;
  const century = Math.floor(adjustedYear / 100);
  const yearOfCentury = adjustedYear % 100;
  const h =
    (day +
      Math.floor((13 * (adjustedMonth + 1)) / 5) +
      yearOfCentury +
      Math.floor(yearOfCentury / 4) +
      Math.floor(century / 4) +
      5 * century) %
    7;
  const index = (h + 6) % 7;
  return SPANISH_WEEKDAYS[index];
}

export function formatDeliveryDate(value: string | null): string {
  if (!value) return "—";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!match) return value;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const weekday = getWeekdayName(year, month, day);
  return `${match[3]}/${match[2]}/${match[1]} · ${weekday}`;
}
