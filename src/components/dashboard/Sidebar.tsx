"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const modules = [
  {
    label: "Ganancias",
    href: "/dashboard/ganancias",
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
  },
  {
    label: "Academix",
    href: "/dashboard/academix",
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
  },
  {
    label: "Sidor",
    href: "/dashboard/sidor",
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
  },
];

interface SidebarProps {
  open: boolean;
  collapsed: boolean;
  onNavigate: () => void;
  onCollapse: () => void;
}

export default function Sidebar({
  open,
  collapsed,
  onNavigate,
  onCollapse,
}: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-black/5 bg-primary text-white transition-transform duration-200 lg:static lg:z-auto ${
        collapsed ? "lg:hidden" : "lg:translate-x-0"
      } ${open ? "translate-x-0" : "-translate-x-full"}`}
    >
      <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
        <Link
          href="/dashboard"
          onClick={onNavigate}
          className="text-xl font-bold text-white"
        >
          Acadexia<span className="text-secondary">.</span>
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onCollapse}
            aria-label="Ocultar menú"
            className="hidden h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/5 hover:text-white lg:flex"
          >
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
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Cerrar menú"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white/70 transition-colors hover:bg-white/5 hover:text-white lg:hidden"
          >
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
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 py-6">
        <p className="px-3 pb-3 text-xs font-bold uppercase tracking-wider text-white/40">
          Módulos
        </p>
        <ul className="space-y-1">
          {modules.map((module) => {
            const isActive =
              pathname === module.href || pathname.startsWith(`${module.href}/`);
            return (
              <li key={module.href}>
                <Link
                  href={module.href}
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-secondary/15 text-secondary"
                      : "text-white/70 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  {module.icon}
                  {module.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/20 text-sm font-bold text-secondary">
            A
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">Administrador</p>
            <p className="truncate text-xs font-normal text-white/50">Sesión activa</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
