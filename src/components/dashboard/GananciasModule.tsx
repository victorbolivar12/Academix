"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";
import {
  emptySubscribe,
  formatCurrency,
  getCurrentMonthName,
  getEmptyValue,
} from "@/lib/format";
import type { GananciasMonth, GananciasResponse } from "@/lib/types";

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

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const monthOptions = Array.from(
    new Set([currentMonth, ...data.months].filter(Boolean)),
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
    </div>
  );
}
