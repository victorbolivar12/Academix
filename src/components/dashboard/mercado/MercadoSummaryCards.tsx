import { formatCurrency, formatDate } from "@/lib/format";
import { cardClass, inputClass } from "./mercado-ui";

interface MercadoSummaryCardsProps {
  presupuesto: number | null;
  total: number;
  pagado: number;
  diferencia: number | null;
  saldo: number;
  fechaVencimiento?: string | null;
  budgetValue?: string;
  onBudgetChange?: (value: string) => void;
}

export default function MercadoSummaryCards({
  presupuesto,
  total,
  pagado,
  diferencia,
  saldo,
  fechaVencimiento,
  budgetValue,
  onBudgetChange,
}: MercadoSummaryCardsProps) {
  const difference =
    diferencia === null ? "—" : formatCurrency(diferencia);
  const differenceClass =
    diferencia !== null && diferencia < 0
      ? "text-red-600"
      : "text-secondary";
  const differenceHint =
    diferencia === null
      ? "Define un presupuesto"
      : diferencia < 0
        ? `Faltan ${formatCurrency(Math.abs(diferencia))}`
        : "Disponible";

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <article className={cardClass}>
        <p className="text-sm font-normal text-muted">Presupuesto</p>
        {onBudgetChange ? (
          <div className="mt-3 flex items-center gap-1">
            <span className="text-2xl font-bold text-primary">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={budgetValue ?? ""}
              onChange={(event) => onBudgetChange(event.target.value)}
              placeholder="0.00"
              aria-label="Presupuesto de la compra"
              className={`${inputClass} border-0 px-0 py-0 text-2xl font-bold focus:ring-0`}
            />
          </div>
        ) : (
          <p className="mt-3 text-2xl font-bold text-primary">
            {presupuesto === null ? "—" : formatCurrency(presupuesto)}
          </p>
        )}
        <p className="mt-1 text-xs font-normal text-muted">
          Monto asignado para esta compra
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-sm font-normal text-muted">Total de la compra</p>
        <p className="mt-3 text-2xl font-bold text-primary">
          {formatCurrency(total)}
        </p>
        <p className="mt-1 text-xs font-normal text-muted">
          Suma de los productos seleccionados
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-sm font-normal text-muted">Pagado</p>
        <p className="mt-3 text-2xl font-bold text-primary">
          {formatCurrency(pagado)}
        </p>
        <p className="mt-1 text-xs font-normal text-muted">
          {pagado > 0 ? "Pago registrado" : "Aún sin registrar pago"}
        </p>
      </article>

      <article className={cardClass}>
        <p className="text-sm font-normal text-muted">Diferencia</p>
        <p className={`mt-3 text-2xl font-bold ${differenceClass}`}>
          {difference}
        </p>
        <p className="mt-1 text-xs font-normal text-muted">{differenceHint}</p>
      </article>

      <article className={cardClass}>
        <p className="text-sm font-normal text-muted">Saldo pendiente</p>
        <p className="mt-3 text-2xl font-bold text-primary">
          {formatCurrency(saldo)}
        </p>
        <p className="mt-1 text-xs font-normal text-muted">
          {saldo > 0
            ? fechaVencimiento
              ? `Vence el ${formatDate(fechaVencimiento)}`
              : "Pendiente de pago"
            : "Sin saldo pendiente"}
        </p>
      </article>
    </section>
  );
}
