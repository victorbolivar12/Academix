const projects = [
  { name: "Proyecto 1", status: "Pendiente", deliveries: 0 },
  { name: "Proyecto 2", status: "Pendiente", deliveries: 0 },
  { name: "Proyecto 3", status: "Pendiente", deliveries: 0 },
];

export default function AcademixPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <span className="rounded-full bg-accent/20 px-4 py-1 text-sm font-bold text-primary">
            Módulo 2
          </span>
          <h1 className="mt-4 text-3xl font-bold text-primary">Academix</h1>
          <p className="mt-2 text-base font-normal text-muted">
            Gestión de proyectos y entregas de Academix.
          </p>
        </div>
        <button
          type="button"
          className="w-full rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:w-auto"
        >
          Nuevo proyecto
        </button>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Proyectos activos", value: "0" },
          { label: "Entregas completadas", value: "0" },
          { label: "Pendientes", value: "0" },
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

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-bold text-primary">Proyectos recientes</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <article
              key={project.name}
              className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-primary">{project.name}</h3>
                <span className="rounded-full bg-accent/20 px-3 py-1 text-xs font-bold text-primary">
                  {project.status}
                </span>
              </div>
              <p className="mt-2 text-sm font-normal text-muted">
                {project.deliveries} entregas registradas
              </p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
