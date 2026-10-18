const monthlyRecords = [
  { month: "Enero", income: 0, expenses: 0, profit: 0 },
  { month: "Febrero", income: 0, expenses: 0, profit: 0 },
  { month: "Marzo", income: 0, expenses: 0, profit: 0 },
  { month: "Abril", income: 0, expenses: 0, profit: 0 },
  { month: "Mayo", income: 0, expenses: 0, profit: 0 },
  { month: "Junio", income: 0, expenses: 0, profit: 0 },
];

export default function GananciasPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-secondary/10 px-4 py-1 text-sm font-bold text-secondary">
            Módulo 1
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Ganancias</h1>
          <p className="mt-2 text-base font-normal text-muted">
            Control de ganancias mensuales de tu negocio.
          </p>
        </div>
        <button
          type="button"
          className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Nuevo registro
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Ingresos del mes", value: "$0.00" },
          { label: "Gastos del mes", value: "$0.00" },
          { label: "Ganancia neta", value: "$0.00" },
        ].map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
          >
            <p className="text-sm font-normal text-muted">{stat.label}</p>
            <p className="mt-3 text-2xl font-bold text-primary">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
        <div className="border-b border-black/5 px-6 py-4">
          <h2 className="text-base font-bold text-primary">Resumen anual</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm font-normal">
            <thead>
              <tr className="border-b border-black/5 text-muted">
                <th className="px-6 py-3 font-bold">Mes</th>
                <th className="px-6 py-3 font-bold">Ingresos</th>
                <th className="px-6 py-3 font-bold">Gastos</th>
                <th className="px-6 py-3 font-bold">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {monthlyRecords.map((record) => (
                <tr key={record.month} className="border-b border-black/5 last:border-0">
                  <td className="px-6 py-4 font-bold text-primary">{record.month}</td>
                  <td className="px-6 py-4 text-muted">${record.income.toFixed(2)}</td>
                  <td className="px-6 py-4 text-muted">${record.expenses.toFixed(2)}</td>
                  <td className="px-6 py-4 font-bold text-secondary">
                    ${record.profit.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
