"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import { RecordDetailModal } from "@/components/dashboard/RecordDetailModal";
import {
  emptySubscribe,
  formatCurrency,
  formatDeliveryDate,
  formatStatus,
  getCurrentMonthName,
  getEmptyValue,
  getTodayIso,
} from "@/lib/format";
import {
  getNextReminderDelay,
  getLastNotificationDate,
  getNotificationState,
  isReminderTimePassed,
  requestNotificationPermission,
  setLastNotificationDate,
  showWorkNotification,
  type NotificationState,
} from "@/lib/notifications";
import type {
  AcademixListResponse,
  AcademixRecord,
  GananciasMonth,
  GananciasResponse,
} from "@/lib/types";

const inputClass =
  "w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-sm font-normal text-primary placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-secondary/40";

const labelClass = "mb-1.5 block text-sm font-bold text-primary";

const emptyResponse: GananciasResponse = {
  months: [],
  series: [],
  selected: { mes: "", academix: 0, sidor: 0, total: 0 },
};

function formatPercentage(value: number, total: number): string {
  if (total <= 0) return "0%";
  return `${Math.round((value / total) * 100)}%`;
}

function BarChart({ series }: { series: GananciasMonth[] }) {
  if (series.length === 0) {
    return (
      <p className="py-12 text-center text-sm font-normal text-muted">
        Sin datos para mostrar
      </p>
    );
  }

  const chartHeight = 180;
  const slot = 100 / series.length;
  const barWidth = slot * 0.36;
  const groupPad = slot * 0.12;
  const maxValue = Math.max(
    ...series.flatMap((item) => [item.academix, item.sidor]),
    1,
  );

  return (
    <svg
      width="100%"
      height={chartHeight + 24}
      role="img"
      aria-label="Gráfico de barras de ingresos por mes"
      className="block"
    >
      {series.map((item, index) => {
        const academixHeight = (item.academix / maxValue) * chartHeight;
        const sidorHeight = (item.sidor / maxValue) * chartHeight;
        const academixX = index * slot + groupPad;
        const sidorX = index * slot + slot - groupPad - barWidth;
        const centerX = index * slot + slot / 2;
        return (
          <g key={item.mes}>
            <rect
              x={`${academixX}%`}
              y={chartHeight - academixHeight}
              width={`${barWidth}%`}
              height={academixHeight}
              rx={4}
              className="text-primary"
              fill="currentColor"
            >
              <title>{`${item.mes} · Academix: ${formatCurrency(item.academix)}`}</title>
            </rect>
            <rect
              x={`${sidorX}%`}
              y={chartHeight - sidorHeight}
              width={`${barWidth}%`}
              height={sidorHeight}
              rx={4}
              className="text-secondary"
              fill="currentColor"
            >
              <title>{`${item.mes} · Sidor: ${formatCurrency(item.sidor)}`}</title>
            </rect>
            <text
              x={`${centerX}%`}
              y={chartHeight + 16}
              textAnchor="middle"
              fontSize={11}
              className="text-muted"
              fill="currentColor"
            >
              {item.mes.slice(0, 3)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function PieChart({
  academix,
  sidor,
  mes,
}: {
  academix: number;
  sidor: number;
  mes: string;
}) {
  const total = academix + sidor;

  if (total <= 0) {
    return (
      <p className="py-12 text-center text-sm font-normal text-muted">
        Sin datos para mostrar
      </p>
    );
  }

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const academixLength = circumference * (academix / total);
  const sidorLength = circumference - academixLength;

  return (
    <div className="flex flex-col items-center gap-6">
      <svg
        viewBox="0 0 100 100"
        role="img"
        aria-label="Gráfico circular de Academix contra Sidor"
        className="mx-auto h-auto w-full max-w-[190px]"
      >
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          strokeWidth={20}
          className="text-secondary"
          stroke="currentColor"
          strokeDasharray={`${sidorLength} ${circumference}`}
          strokeDashoffset={-academixLength}
          transform="rotate(-90 50 50)"
        >
          <title>{`Sidor: ${formatCurrency(sidor)} (${formatPercentage(sidor, total)})`}</title>
        </circle>
        <circle
          cx={50}
          cy={50}
          r={radius}
          fill="none"
          strokeWidth={20}
          className="text-primary"
          stroke="currentColor"
          strokeDasharray={`${academixLength} ${circumference}`}
          transform="rotate(-90 50 50)"
        >
          <title>{`Academix: ${formatCurrency(academix)} (${formatPercentage(academix, total)})`}</title>
        </circle>
        <text
          x={50}
          y={46}
          textAnchor="middle"
          fontSize={9}
          className="text-muted"
          fill="currentColor"
        >
          {mes || "Total"}
        </text>
        <text
          x={50}
          y={59}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          className="text-primary"
          fill="currentColor"
        >
          {formatCurrency(total)}
        </text>
      </svg>

      <dl className="grid w-full gap-2 sm:grid-cols-2">
        <div className="rounded-xl bg-surface px-4 py-3">
          <dt className="flex items-center gap-2 text-xs font-normal text-muted">
            <span className="h-3 w-3 rounded-full bg-primary" />
            Academix
          </dt>
          <dd className="mt-1 text-sm font-bold text-primary">
            {formatCurrency(academix)} · {formatPercentage(academix, total)}
          </dd>
        </div>
        <div className="rounded-xl bg-surface px-4 py-3">
          <dt className="flex items-center gap-2 text-xs font-normal text-muted">
            <span className="h-3 w-3 rounded-full bg-secondary" />
            Sidor
          </dt>
          <dd className="mt-1 text-sm font-bold text-primary">
            {formatCurrency(sidor)} · {formatPercentage(sidor, total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export default function GananciasModule() {
  const [data, setData] = useState<GananciasResponse>(emptyResponse);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = useSyncExternalStore(
    emptySubscribe,
    getCurrentMonthName,
    getEmptyValue,
  );
  const [mesFilter, setMesFilter] = useState<string | undefined>(undefined);
  const mes = mesFilter ?? currentMonth;

  const [detailRecord, setDetailRecord] = useState<AcademixRecord | null>(null);

  const [summaryFecha, setSummaryFecha] = useState<string | undefined>(undefined);
  const todayIso = useSyncExternalStore(emptySubscribe, getTodayIso, getEmptyValue);
  const summaryDate = summaryFecha ?? todayIso;
  const [summaryRecords, setSummaryRecords] = useState<AcademixRecord[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  const [notificationMessage, setNotificationMessage] = useState<string | null>(
    null,
  );

  const notificationState = useSyncExternalStore(
    emptySubscribe,
    getNotificationState,
    (): NotificationState => "default",
  );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const query = mes ? `?mes=${encodeURIComponent(mes)}` : "";
      const res = await fetch(`/api/ganancias${query}`);
      if (!res.ok) throw new Error();
      const result: GananciasResponse = await res.json();
      setData(result);
      setError(null);
    } catch {
      setError("Error al cargar el resumen de ganancias");
    } finally {
      setLoading(false);
    }
  }, [mes]);

  const fetchSummary = useCallback(async () => {
    if (!summaryDate) {
      setSummaryRecords([]);
      return;
    }
    try {
      setSummaryLoading(true);
      const res = await fetch(`/api/academix?fecha=${summaryDate}`);
      if (!res.ok) throw new Error();
      const data: AcademixListResponse = await res.json();
      setSummaryRecords(data.records);
      setSummaryError(null);
    } catch {
      setSummaryRecords([]);
      setSummaryError("Error al cargar los trabajos del día");
    } finally {
      setSummaryLoading(false);
    }
  }, [summaryDate]);

  const notifyIfThereAreWorks = useCallback(async () => {
    const today = getTodayIso();
    if (getLastNotificationDate() === today) return false;
    try {
      const res = await fetch(`/api/academix?fecha=${today}`);
      if (!res.ok) return false;
      const data: AcademixListResponse = await res.json();
      if (data.records.length === 0) return false;
      const notified = showWorkNotification("hoy", data.records);
      if (notified) setLastNotificationDate(today);
      return notified;
    } catch {
      return false;
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchSummary();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchSummary]);

  useEffect(() => {
    if (notificationState !== "granted") return;

    let timer: number | undefined;
    const schedule = () => {
      timer = window.setTimeout(() => {
        void notifyIfThereAreWorks();
        schedule();
      }, getNextReminderDelay());
    };

    if (isReminderTimePassed()) {
      void notifyIfThereAreWorks();
    }
    schedule();

    const handleVisibility = () => {
      if (document.visibilityState === "visible" && isReminderTimePassed()) {
        void notifyIfThereAreWorks();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [notificationState, notifyIfThereAreWorks]);

  async function handleEnableNotifications() {
    setNotificationMessage(null);
    const state = await requestNotificationPermission();
    if (state === "granted") {
      setNotificationMessage("Recordatorio activado");
      void notifyIfThereAreWorks();
    } else if (state === "denied") {
      setNotificationMessage(
        "Permite las notificaciones en los ajustes del navegador",
      );
    } else if (state === "unsupported") {
      setNotificationMessage(
        "Las notificaciones no están disponibles en este navegador",
      );
    }
  }

  function closeDetail() {
    setDetailRecord(null);
  }

  const monthOptions = Array.from(
    new Set([currentMonth, ...data.months].filter(Boolean)),
  );

  const summaryPorcentajeTotal = summaryRecords.reduce(
    (total, record) => total + Number(record.porcentaje ?? 0),
    0,
  );
  const summaryPriceTotal = summaryRecords.reduce(
    (total, record) => total + Number(record.precio ?? 0),
    0,
  );

  const cards = [
    {
      label: "Ingresos del mes",
      value: formatCurrency(data.selected.total),
      description: "Academix más Sidor",
    },
    {
      label: "Ingresos de Academix",
      value: formatCurrency(data.selected.academix),
      description: "Total de Ganancia entregado y pagado",
    },
    {
      label: "Ingresos de Sidor",
      value: formatCurrency(data.selected.sidor),
      description: "Pagos registrados en el mes",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-secondary/10 px-4 py-1 text-sm font-bold text-secondary">
            Módulo 1
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Ganancias</h1>
          <p className="mt-2 text-base font-normal text-muted">
            Resumen mensual de ingresos de Academix y Sidor.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <label htmlFor="filter-mes" className={labelClass}>
            Mes
          </label>
          <select
            id="filter-mes"
            value={mes}
            onChange={(event) => setMesFilter(event.target.value)}
            className={inputClass}
          >
            <option value="">Todos los meses</option>
            {monthOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      </header>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-normal text-red-700">
          {error}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.label}
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-normal text-muted">{card.label}</p>
            <p className="mt-3 text-2xl font-bold text-primary">{card.value}</p>
            <p className="mt-1 text-xs font-normal text-muted">
              {card.description}
            </p>
          </article>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-primary">Resumen del día</h2>
            <p className="mt-1 text-xs font-normal text-muted">
              Trabajos con fecha de entrega en el día seleccionado.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2">
            <div className="w-full sm:w-48">
              <label htmlFor="summary-fecha" className={labelClass}>
                Fecha
              </label>
              <input
                id="summary-fecha"
                type="date"
                value={summaryDate}
                onChange={(event) =>
                  setSummaryFecha(event.target.value || undefined)
                }
                className={inputClass}
              />
            </div>
            <button
              type="button"
              onClick={() => setSummaryFecha(undefined)}
              className="w-full rounded-xl border border-primary/15 px-4 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-surface sm:w-auto"
            >
              Hoy
            </button>
          </div>
        </div>

        <ul
          className={`mt-4 divide-y divide-black/5 ${
            summaryLoading ? "opacity-50" : ""
          }`}
        >
          {summaryError ? (
            <li className="px-2 py-4 text-center text-sm font-normal text-red-600">
              {summaryError}
            </li>
          ) : summaryRecords.length === 0 && !summaryLoading ? (
            <li className="px-2 py-4 text-center text-sm font-normal text-muted">
              No hay trabajos para este día
            </li>
          ) : (
            summaryRecords.map((record) => {
              const estado = formatStatus(record.estado);
              return (
                <li key={record.id}>
                  <button
                    type="button"
                    onClick={() => setDetailRecord(record)}
                    className="flex w-full flex-wrap items-center justify-between gap-3 rounded-xl px-2 py-3 text-left transition-colors hover:bg-surface/60"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-primary">
                        {record.hora && (
                          <span className="mr-1.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                            {record.hora}
                          </span>
                        )}
                        {record.titulo}
                      </p>
                      <p className="mt-0.5 truncate text-xs font-normal text-muted">
                        {record.codigo || "Sin código"} ·{" "}
                        {formatDeliveryDate(record.fecha_entrega_real)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-primary">
                          {formatCurrency(Number(record.precio ?? 0))}
                        </p>
                        <p className="text-xs font-normal text-muted">
                          {formatCurrency(Number(record.porcentaje ?? 0))}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${estado.className}`}
                      >
                        {estado.label}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-black/5 pt-3">
          <p className="text-sm font-normal text-muted">
            {summaryRecords.length}{" "}
            {summaryRecords.length === 1 ? "trabajo" : "trabajos"} · Precio{" "}
            <span className="font-bold text-primary">
              {formatCurrency(summaryPriceTotal)}
            </span>{" "}
            · Porcentaje{" "}
            <span className="font-bold text-secondary">
              {formatCurrency(summaryPorcentajeTotal)}
            </span>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            {notificationMessage && (
              <p className="text-xs font-normal text-muted">
                {notificationMessage}
              </p>
            )}
            {notificationState === "granted" ? (
              <span className="rounded-full bg-secondary/10 px-4 py-2 text-xs font-bold text-secondary">
                Aviso diario activado · 8:00 AM
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void handleEnableNotifications()}
                disabled={notificationState === "unsupported"}
                className="rounded-full bg-primary px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Activar aviso a las 8:00 AM
              </button>
            )}
          </div>
        </div>
      </section>

      <section
        className={`mt-8 grid gap-4 transition-opacity lg:grid-cols-2 ${
          loading ? "opacity-50" : ""
        }`}
      >
        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-bold text-primary">
              Ingresos por mes
            </h2>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2 text-xs font-normal text-muted">
                <span className="h-3 w-3 rounded-full bg-primary" />
                Academix
              </span>
              <span className="flex items-center gap-2 text-xs font-normal text-muted">
                <span className="h-3 w-3 rounded-full bg-secondary" />
                Sidor
              </span>
            </div>
          </div>
          <BarChart series={data.series} />
        </article>

        <article className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-base font-bold text-primary">
            Academix contra Sidor
          </h2>
          <PieChart
            academix={data.selected.academix}
            sidor={data.selected.sidor}
            mes={mes}
          />
        </article>
      </section>

      <RecordDetailModal record={detailRecord} onClose={closeDetail} />
    </div>
  );
}
