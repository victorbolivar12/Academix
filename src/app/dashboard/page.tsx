import Link from "next/link";

const stats = [
  {
    label: "Ganancia del mes",
    value: "$0.00",
    trend: "Sin datos aún",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M3 3v16a2 2 0 0 0 2 2h16" />
        <path d="m7 14 4-4 4 3 5-6" />
      </svg>
    ),
    iconClass: "bg-secondary/10 text-secondary",
  },
  {
    label: "Proyectos Academix",
    value: "0",
    trend: "Sin datos aún",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
        <path d="M6 12v5c3 3 9 3 12 0v-5" />
      </svg>
    ),
    iconClass: "bg-accent/20 text-primary",
  },
  {
    label: "Registros Sidor",
    value: "0",
    trend: "Sin datos aún",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-5 w-5"
        aria-hidden="true"
      >
        <rect x="2" y="7" width="20" height="14" rx="2" />
        <path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
      </svg>
    ),
    iconClass: "bg-primary/10 text-primary",
  },
];

const moduleCards = [
  {
    title: "Ganancias",
    href: "/dashboard/ganancias",
    description:
      "Controla tus ganancias mes a mes con registros claros y accesibles.",
    accent: "bg-secondary",
  },
  {
    title: "Academix",
    href: "/dashboard/academix",
    description:
      "Gestiona los proyectos y entregas de Academix desde un solo lugar.",
    accent: "bg-accent",
  },
  {
    title: "Sidor",
    href: "/dashboard/sidor",
    description:
      "Administra los registros de Sidor y mantén todo organizado.",
    accent: "bg-primary",
  },
  {
    title: "Mercado",
    href: "/dashboard/mercado",
    description:
      "Arma tu lista, compara precios por tienda y controla tu presupuesto.",
    accent: "bg-secondary",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto w-full max-w-5xl">
      <header className="mb-8">
        <span className="rounded-full bg-accent/20 px-4 py-1 text-sm font-bold text-primary">
          Panel de administración
        </span>
        <h1 className="mt-4 text-3xl font-bold text-primary">Resumen general</h1>
        <p className="mt-2 text-base font-normal text-muted">
          Bienvenido a Acadexia. Accede a cada módulo desde el menú lateral.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-normal text-muted">{stat.label}</p>
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.iconClass}`}
              >
                {stat.icon}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-primary">{stat.value}</p>
            <p className="mt-1 text-xs font-normal text-muted">{stat.trend}</p>
          </article>
        ))}
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-bold text-primary">Módulos</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {moduleCards.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className="group rounded-2xl border border-black/5 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className={`mb-4 block h-1.5 w-12 rounded-full ${module.accent}`} />
              <h3 className="text-base font-bold text-primary">{module.title}</h3>
              <p className="mt-2 text-sm font-normal leading-6 text-muted">
                {module.description}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-bold text-secondary">
                Abrir
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
