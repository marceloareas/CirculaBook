export function Header() {
  return (
    <header className="bg-[#2563eb] text-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/15">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
          </span>
          <span className="text-sm font-semibold tracking-tight">
            Círcula Book
          </span>
        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium md:flex">
          <span>Buscar Livros</span>
          <span>Meus Empréstimos</span>
          <span>Minhas Reservas</span>
          <span>Meu Histórico</span>
        </nav>

        <div className="flex items-center gap-2 text-sm">
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <span>Ana Souza - Usuário da Comunidade</span>
        </div>
      </div>
    </header>
  );
}
