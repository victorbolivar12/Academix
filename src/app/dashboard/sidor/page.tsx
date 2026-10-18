const records = [
  { id: "SR-0001", concept: "Concepto pendiente", date: "—", amount: 0 },
  { id: "SR-0002", concept: "Concepto pendiente", date: "—", amount: 0 },
  { id: "SR-0003", concept: "Concepto pendiente", date: "—", amount: 0 },
];

export default function SidorPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-primary/10 px-4 py-1 text-sm font-bold text-primary">
            Módulo 3
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Sidor</h1>
          <p className="mt-2 text-base font-normal text-muted">
            Administración de registros de Sidor.
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
          { label: "Registros totales", value: "0" },
          { label: "Este mes", value: "0" },
          { label: "Monto total", value: "$0.00" },
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
          <h2 className="text-base font-bold text-primary">Últimos registros</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm font-normal">
            <thead>
              <tr className="border-b border-black/5 text-muted">
                <th className="px-6 py-3 font-bold">Folio</th>
                <th className="px-6 py-3 font-bold">Concepto</th>
                <th className="px-6 py-3 font-bold">Fecha</th>
                <th className="px-6 py-3 font-bold">Monto</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} className="border-b border-black/5 last:border-0">
                  <td className="px-6 py-4 font-bold text-primary">{record.id}</td>
                  <td className="px-6 py-4 text-muted">{record.concept}</td>
                  <td className="px-6 py-4 text-muted">{record.date}</td>
                  <td className="px-6 py-4 font-bold text-secondary">
                    ${record.amount.toFixed(2)}
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
