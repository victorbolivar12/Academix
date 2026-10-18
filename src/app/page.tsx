import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <span className="text-xl font-bold text-primary">
            Acadexia<span className="text-secondary">.</span>
          </span>
          <nav className="flex gap-6 text-sm font-normal text-muted">
            <a href="#" className="transition-colors hover:text-primary">
              Inicio
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Funciones
            </a>
            <a href="#" className="transition-colors hover:text-primary">
              Contacto
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6 py-16 text-center sm:py-24">
        <span className="mb-4 rounded-full bg-accent/20 px-4 py-1 text-sm font-bold text-primary">
          Control de ganancias mensuales
        </span>
        <h1 className="max-w-2xl text-4xl font-bold leading-tight text-primary sm:text-5xl">
          Tu aliado en cada entrega
        </h1>
        <p className="mt-4 max-w-xl text-lg font-normal leading-8 text-muted">
          Acadexia simplifica la gestión administrativa de tu negocio con un
          registro claro de tus ganancias mes a mes.
        </p>
        <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-full bg-secondary px-6 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
          >
            Comenzar
          </Link>
          <a
            href="#"
            className="rounded-full border border-primary/15 px-6 py-3 text-sm font-bold text-primary transition-colors hover:bg-white"
          >
            Saber más
          </a>
        </div>
      </main>

      <footer className="border-t border-black/5 bg-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-4 text-center text-sm font-normal text-muted">
          © Acadexia — Tu aliado en cada entrega.
        </div>
      </footer>
    </div>
  );
}
