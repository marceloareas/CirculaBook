/**
 * Barra azul do topo, presente em todas as telas.
 * O menu muda conforme o perfil do usuário logado e o item da página atual
 * fica em destaque. Em telas largas os links ficam em linha; em telas estreitas
 * viram um menu recolhível ("Menu").
 * A identificação encolhe (com reticências) para nunca cobrir o menu.
 */
import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import type { Perfil } from "../types";
import { NOME_PERFIL, TELA_INICIAL, useAuth, useUsuarioLogado } from "../auth/contexto";

interface ItemMenu {
  rotulo: string;
  to: string;
  /** Prefixos de URL que também devem marcar este item como ativo. */
  tambem?: string[];
}

const MENUS: Record<Perfil, ItemMenu[]> = {
  COMUM: [
    { rotulo: "Buscar livros", to: "/", tambem: ["/resultados", "/livro"] },
    { rotulo: "Minhas reservas", to: "/minhas-reservas" },
  ],
  BIBLIOTECARIO: [
    { rotulo: "Empréstimo", to: "/biblioteca/emprestimo" },
    { rotulo: "Devolução", to: "/biblioteca/devolucao" },
  ],
};

/** A partir de que largura o menu cabe em linha (classes fixas para o Tailwind achar). */
const EM_LINHA = { nav: "hidden md:flex", botao: "md:hidden" };

const ICONE: Record<Perfil, string> = {
  COMUM: "👤",
  BIBLIOTECARIO: "🧑‍💼",
};

export default function Header() {
  const { pathname } = useLocation();
  const { sair } = useAuth();
  const usuario = useUsuarioLogado();
  const perfil = usuario.perfil;
  const [menuAberto, setMenuAberto] = useState(false);

  // Trocou de tela: fecha o menu recolhível
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMenuAberto(false);
  }, [pathname]);

  const identificacao = `${usuario.nome} · ${NOME_PERFIL[perfil]}${usuario.bibliotecaNome ? ` — ${usuario.bibliotecaNome}` : ""}`;

  const link = (item: ItemMenu, vertical: boolean) => {
    const ativoExtra = item.tambem?.some((p) => pathname.startsWith(p));
    return (
      <NavLink
        key={item.to}
        to={item.to}
        end
        className={({ isActive }) => {
          const ativo = isActive || ativoExtra;
          return vertical
            ? `block rounded-[8px] px-3 py-2 text-[14px] ${ativo ? "bg-white/20 font-semibold" : "hover:bg-white/10"}`
            : `text-[13px] whitespace-nowrap pb-1 border-b-2 ${
                ativo ? "font-semibold border-white" : "font-normal opacity-90 border-transparent hover:opacity-100"
              }`;
        }}
      >
        {item.rotulo}
      </NavLink>
    );
  };

  return (
    <header className="bg-[#1976d2] text-white relative">
      <div className="h-[68px] px-4 sm:px-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6 shrink-0">
          <Link to={TELA_INICIAL[perfil]} className="text-[19px] font-bold shrink-0">
            📚 Circula Book
          </Link>

          <nav aria-label="Menu principal" className={`${EM_LINHA.nav} items-center gap-4`}>
            {MENUS[perfil].map((item) => link(item, false))}
          </nav>
        </div>

        <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0 flex-1">
          <span
            className="hidden lg:block min-w-0 truncate text-[13px] font-medium"
            title={identificacao}
          >
            {ICONE[perfil]} {identificacao}
          </span>

          <button
            type="button"
            onClick={() => setMenuAberto(!menuAberto)}
            aria-expanded={menuAberto}
            aria-controls="menu-recolhivel"
            className={`${EM_LINHA.botao} shrink-0 bg-white/15 border border-white/40 rounded-[8px] px-3 py-[6px] text-[13px] hover:bg-white/25`}
          >
            ☰ Menu
          </button>

          <button
            type="button"
            onClick={sair}
            className="shrink-0 bg-white/15 border border-white/40 rounded-[8px] px-3 py-[6px]
                       text-[13px] text-white hover:bg-white/25"
          >
            Sair
          </button>
        </div>
      </div>

      {menuAberto && (
        <nav
          id="menu-recolhivel"
          aria-label="Menu"
          className={`${EM_LINHA.botao} absolute left-0 right-0 top-full z-40 bg-[#1565c0] px-4 pb-4 pt-2 shadow-lg`}
        >
          <p className="px-3 pb-2 text-[12px] opacity-80 truncate">
            {ICONE[perfil]} {identificacao}
          </p>
          {MENUS[perfil].map((item) => link(item, true))}
        </nav>
      )}
    </header>
  );
}
